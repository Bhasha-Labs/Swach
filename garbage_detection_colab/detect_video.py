#!/usr/bin/env python3
"""
Video garbage detection script for API integration
Processes video files frame by frame and returns JSON output
"""

import argparse
import json
import sys
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
import tempfile
import time

try:
    from ultralytics import YOLO
except ImportError as e:
    print(json.dumps({"error": f"Missing dependencies: {e}"}))
    sys.exit(1)

def apply_smart_filtering(detections, filter_low_confidence, min_object_size, frame_area):
    """Apply smart filtering to reduce false positives"""
    filtered_detections = []
    
    for detection in detections:
        class_name = detection['class'].lower()
        confidence = detection['confidence']
        bbox = detection['bbox']
        
        # Calculate object area
        object_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        area_ratio = (object_area / frame_area) * 100
        
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

def calculate_swachta_index(detections, frame_area):
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
        area_ratio = object_area / frame_area
        
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
    coverage_ratio = min(total_coverage_area / frame_area, 1.0)
    
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

def detect_video(model_path, video_path, output_path, confidence_threshold=0.25, 
                frame_skip=15, filter_low_confidence=True, min_object_size=0.1):
    """Detect garbage in video and return structured results"""
    try:
        # Load model
        model = YOLO(model_path)
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) / frame_skip
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_area = width * height
        
        # Setup video writer
        fourcc = cv2.VideoWriter_fourcc(*'H264')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_detections = []
        swachta_scores = []
        frame_count = 0
        processed_frames = 0
        
        start_time = time.time()
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every nth frame based on frame_skip
            if frame_count % frame_skip == 0:
                # Convert to PIL Image for YOLO
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_pil = Image.fromarray(frame_rgb)
                
                # Run detection
                results = model(frame_pil, conf=confidence_threshold, verbose=False)
                result = results[0]
                
                # Extract detections
                frame_dets = []
                if len(result.boxes) > 0:
                    for box in result.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = model.names[class_id]
                        
                        frame_dets.append({
                            'class': class_name,
                            'confidence': confidence,
                            'bbox': [float(x1), float(y1), float(x2), float(y2)]
                        })
                
                # Apply smart filtering
                frame_dets = apply_smart_filtering(frame_dets, filter_low_confidence, 
                                                 min_object_size, frame_area)
                
                frame_detections.extend(frame_dets)
                
                # Calculate Swachta Index for this frame
                frame_swachta = calculate_swachta_index(frame_dets, frame_area)
                swachta_scores.append(frame_swachta)
                
                # Get annotated frame
                annotated_frame = result.plot()
                out.write(annotated_frame)
                processed_frames += 1
            
            frame_count += 1
        
        cap.release()
        out.release()
        
        # Calculate overall statistics
        if swachta_scores:
            avg_swachta = sum(swachta_scores) / len(swachta_scores)
            min_swachta = min(swachta_scores)
            max_swachta = max(swachta_scores)
        else:
            avg_swachta = min_swachta = max_swachta = 100
        
        processing_time = time.time() - start_time
        
        # Count detections by class
        class_counts = {}
        for det in frame_detections:
            class_name = det['class']
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        return {
            "success": True,
            "video_path": str(video_path),
            "output_video_path": str(output_path),
            "frameDetections": frame_detections,
            "swachtaScores": swachta_scores,
            "avgSwachta": round(avg_swachta, 1),
            "minSwachta": round(min_swachta, 1),
            "maxSwachta": round(max_swachta, 1),
            "processedFrames": processed_frames,
            "totalFrames": total_frames,
            "processingTime": round(processing_time, 1),
            "classCounts": class_counts,
            "model_info": {
                "model_path": str(model_path),
                "confidence_threshold": confidence_threshold,
                "frame_skip": frame_skip,
                "total_detections": len(frame_detections)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "video_path": str(video_path)
        }

def main():
    parser = argparse.ArgumentParser(description='Detect garbage in video')
    parser.add_argument('--model', required=True, help='Path to YOLO model file')
    parser.add_argument('--video', required=True, help='Path to input video')
    parser.add_argument('--output', required=True, help='Path to output video')
    parser.add_argument('--confidence', type=float, default=0.25, help='Confidence threshold')
    parser.add_argument('--frame-skip', type=int, default=15, help='Frame skip rate for processing')
    parser.add_argument('--filter-low-confidence', type=bool, default=True, help='Filter low confidence garbage')
    parser.add_argument('--min-object-size', type=float, default=0.1, help='Minimum object size percentage')
    
    args = parser.parse_args()
    
    # Validate inputs
    model_path = Path(args.model)
    video_path = Path(args.video)
    
    if not model_path.exists():
        result = {"success": False, "error": f"Model file not found: {model_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    if not video_path.exists():
        result = {"success": False, "error": f"Video file not found: {video_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    # Run detection
    result = detect_video(
        model_path, video_path, args.output, args.confidence, 
        args.frame_skip, args.filter_low_confidence, args.min_object_size
    )
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 