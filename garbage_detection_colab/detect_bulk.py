#!/usr/bin/env python3
"""
Bulk directory garbage detection script for API integration
Processes all images in a directory and returns comprehensive JSON output
"""

import argparse
import json
import sys
import os
from pathlib import Path
from PIL import Image

try:
    from ultralytics import YOLO
except ImportError as e:
    print(json.dumps({"error": f"Missing dependencies: {e}"}))
    sys.exit(1)

def apply_smart_filtering(detections, filter_low_confidence, min_object_size, image_area):
    """Apply smart filtering to reduce false positives"""
    filtered_detections = []
    
    for detection in detections:
        class_name = detection['class'].lower()
        confidence = detection['confidence']
        bbox = detection['bbox']
        
        # Calculate object area
        object_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        area_ratio = (object_area / image_area) * 100
        
        should_include = True
        
        # Filter low-confidence "garbage" detections
        if filter_low_confidence and class_name in ['garbage'] and confidence < 0.4:
            should_include = False
        
        # Filter very small objects
        if area_ratio < min_object_size:
            should_include = False
        
        # Filter very low confidence overall
        if confidence < 0.3:
            should_include = False
        
        if should_include:
            filtered_detections.append(detection)
    
    return filtered_detections

def calculate_swachta_index(detections, image_area):
    """Calculate Swachta Index (same algorithm as Streamlit)"""
    if not detections:
        return 100
    
    # Severity weights
    severity_weights = {
        'garbage': 1.5, 'trash': 1.8, 'sampah-detection': 1.6,
        'plastic': 2.0, 'bottle': 1.4, 'can': 1.3, 'paper': 1.2,
        'organic': 1.0, 'hazardous': 3.0, 'medical': 2.8,
        'electronic': 2.2, '0': 1.5
    }
    
    total_impact = 0
    total_coverage_area = 0
    large_object_penalty = 0
    
    for detection in detections:
        garbage_type = detection['class'].lower()
        confidence = detection['confidence']
        bbox = detection['bbox']
        
        # Get severity weight
        severity = severity_weights.get(garbage_type, 1.5)
        
        # Calculate base impact
        base_impact = confidence * severity
        
        # Calculate object area
        object_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        total_coverage_area += object_area
        
        # Area ratio penalties
        area_ratio = object_area / image_area
        
        if area_ratio > 0.1:
            area_penalty = area_ratio * 150
            large_object_penalty += area_penalty * severity
        elif area_ratio > 0.05:
            area_penalty = area_ratio * 100
            large_object_penalty += area_penalty * severity
        else:
            area_penalty = area_ratio * 75
        
        # Size-weighted impact
        size_multiplier = 1 + (area_ratio * 10)
        object_impact = base_impact * size_multiplier
        total_impact += object_impact
    
    # Coverage penalties
    coverage_ratio = min(total_coverage_area / image_area, 1.0)
    
    if coverage_ratio > 0.5:
        coverage_penalty = 80 + (coverage_ratio - 0.5) * 200
    elif coverage_ratio > 0.25:
        coverage_penalty = 40 + (coverage_ratio - 0.25) * 160
    elif coverage_ratio > 0.1:
        coverage_penalty = 15 + (coverage_ratio - 0.1) * 166
    else:
        coverage_penalty = coverage_ratio * 150
    
    # Object count penalty
    object_count = len(detections)
    if object_count <= 5:
        density_penalty = object_count * 8
    elif object_count <= 15:
        density_penalty = 40 + (object_count - 5) * 12
    else:
        density_penalty = 160 + (object_count - 15) * 18
    
    # Visual pollution density
    visual_density = object_count / max(coverage_ratio, 0.01)
    pollution_penalty = max(0, (visual_density - 50) * 2) if visual_density > 50 else 0
    
    # Multiple garbage type penalty
    unique_types = len(set(det['class'] for det in detections))
    variety_penalty = max(0, (unique_types - 2) * 8)
    
    # Calculate final score
    garbage_impact_score = (
        total_impact + coverage_penalty + density_penalty + 
        large_object_penalty + pollution_penalty + variety_penalty
    )
    
    garbage_impact_score = min(garbage_impact_score, 100)
    swachta_index = max(0, 100 - garbage_impact_score)
    
    return round(swachta_index, 1)

def get_swachta_grade(index):
    """Convert Swachta Index to letter grade"""
    if index >= 95:
        return "A+"
    elif index >= 85:
        return "A"
    elif index >= 75:
        return "B+"
    elif index >= 65:
        return "B"
    elif index >= 55:
        return "C+"
    elif index >= 45:
        return "C"
    elif index >= 35:
        return "D+"
    elif index >= 25:
        return "D"
    elif index >= 15:
        return "F+"
    else:
        return "F"

def detect_bulk(model_path, directory_path, confidence_threshold=0.25, 
                filter_low_confidence=True, min_object_size=0.1):
    """Detect garbage in all images in directory and return structured results"""
    try:
        # Load model
        model = YOLO(model_path)
        
        # Find all image files
        directory = Path(directory_path)
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = [f for f in directory.iterdir() 
                      if f.suffix.lower() in image_extensions and f.is_file()]
        
        if not image_files:
            return {
                "success": False,
                "error": "No image files found in directory",
                "directory": str(directory_path)
            }
        
        results = []
        total_detections = 0
        images_with_garbage = 0
        swachta_scores = []
        all_detections = []
        
        for img_file in image_files:
            # Load and process image
            try:
                image = Image.open(img_file)
                image_area = image.size[0] * image.size[1]
                
                # Run detection
                detection_results = model(image, conf=confidence_threshold, verbose=False)
                result = detection_results[0]
                
                # Extract detections
                detections = []
                if len(result.boxes) > 0:
                    for box in result.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = model.names[class_id]
                        
                        detections.append({
                            'class': class_name,
                            'confidence': confidence,
                            'bbox': [float(x1), float(y1), float(x2), float(y2)]
                        })
                
                # Apply smart filtering
                detections = apply_smart_filtering(detections, filter_low_confidence, 
                                                 min_object_size, image_area)
                
                # Calculate Swachta Index
                swachta_index = calculate_swachta_index(detections, image_area)
                grade = get_swachta_grade(swachta_index)
                
                # Count statistics
                if detections:
                    total_detections += len(detections)
                    images_with_garbage += 1
                    all_detections.extend(detections)
                
                swachta_scores.append(swachta_index)
                
                # Store result for this image
                image_result = {
                    "filename": img_file.name,
                    "path": str(img_file),
                    "detections": detections,
                    "detection_count": len(detections),
                    "swachta_index": swachta_index,
                    "grade": grade,
                    "has_garbage": len(detections) > 0,
                    "image_size": list(image.size)
                }
                results.append(image_result)
                
            except Exception as e:
                # Handle individual image errors
                results.append({
                    "filename": img_file.name,
                    "path": str(img_file),
                    "error": str(e),
                    "has_garbage": False,
                    "swachta_index": 100,
                    "grade": "A+",
                    "detection_count": 0
                })
        
        # Calculate overall statistics
        overall_swachta = sum(swachta_scores) / len(swachta_scores) if swachta_scores else 100
        best_swachta = max(swachta_scores) if swachta_scores else 100
        worst_swachta = min(swachta_scores) if swachta_scores else 100
        
        # Count detections by class
        class_counts = {}
        for det in all_detections:
            class_name = det['class']
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        # Generate recommendations
        garbage_percentage = (images_with_garbage / len(image_files)) * 100
        
        if garbage_percentage > 50:
            recommendation_level = "immediate"
            recommendations = [
                "Deploy cleaning teams to high-garbage areas",
                "Install additional waste bins",
                "Consider awareness campaigns"
            ]
        elif garbage_percentage > 20:
            recommendation_level = "preventive"
            recommendations = [
                "Regular monitoring of identified problem areas",
                "Increase cleaning frequency",
                "Community engagement programs"
            ]
        else:
            recommendation_level = "maintenance"
            recommendations = [
                "Continue current cleaning schedule",
                "Monitor for seasonal changes",
                "Maintain community awareness"
            ]
        
        return {
            "success": True,
            "directory": str(directory_path),
            "summary": {
                "total_images": len(image_files),
                "images_with_garbage": images_with_garbage,
                "clean_images": len(image_files) - images_with_garbage,
                "total_detections": total_detections,
                "garbage_percentage": round(garbage_percentage, 1)
            },
            "swachta_analysis": {
                "overall_swachta": round(overall_swachta, 1),
                "overall_grade": get_swachta_grade(overall_swachta),
                "best_score": round(best_swachta, 1),
                "worst_score": round(worst_swachta, 1),
                "score_variation": round(best_swachta - worst_swachta, 1)
            },
            "class_counts": class_counts,
            "recommendations": {
                "level": recommendation_level,
                "actions": recommendations
            },
            "individual_results": results,
            "model_info": {
                "model_path": str(model_path),
                "confidence_threshold": confidence_threshold,
                "filter_low_confidence": filter_low_confidence,
                "min_object_size": min_object_size
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "directory": str(directory_path)
        }

def main():
    parser = argparse.ArgumentParser(description='Bulk detect garbage in directory')
    parser.add_argument('--model', required=True, help='Path to YOLO model file')
    parser.add_argument('--directory', required=True, help='Path to directory containing images')
    parser.add_argument('--confidence', type=float, default=0.25, help='Confidence threshold')
    parser.add_argument('--filter-low-confidence', type=bool, default=True, help='Filter low confidence garbage')
    parser.add_argument('--min-object-size', type=float, default=0.1, help='Minimum object size percentage')
    
    args = parser.parse_args()
    
    # Validate inputs
    model_path = Path(args.model)
    directory_path = Path(args.directory)
    
    if not model_path.exists():
        result = {"success": False, "error": f"Model file not found: {model_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    if not directory_path.exists():
        result = {"success": False, "error": f"Directory not found: {directory_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    if not directory_path.is_dir():
        result = {"success": False, "error": f"Path is not a directory: {directory_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    # Run bulk detection
    result = detect_bulk(
        model_path, directory_path, args.confidence, 
        args.filter_low_confidence, args.min_object_size
    )
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 