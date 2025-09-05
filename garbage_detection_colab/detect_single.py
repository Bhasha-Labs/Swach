#!/usr/bin/env python3
"""
Single image garbage detection script for API integration
Returns JSON output for web dashboard consumption
"""

import argparse
import json
import sys
from pathlib import Path
import numpy as np

try:
    from ultralytics import YOLO
    import cv2
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

def detect_garbage(model_path, image_path, confidence_threshold=0.25, 
                  filter_low_confidence=True, min_object_size=0.1):
    """
    Detect garbage in a single image and return structured results
    """
    try:
        # Load model
        model = YOLO(model_path)
        
        # Run detection
        results = model(image_path, conf=confidence_threshold, verbose=False)
        
        detections = []
        
        # Get image dimensions for area calculations
        import cv2
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        image_area = img.shape[0] * img.shape[1]  # height * width
        
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for box in boxes:
                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # Get confidence and class
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = model.names[class_id]
                    
                    detection = {
                        "bbox": [float(x1), float(y1), float(x2), float(y2)],
                        "confidence": confidence,
                        "class": class_name,
                        "class_id": class_id
                    }
                    detections.append(detection)
        
        # Apply smart filtering
        detections = apply_smart_filtering(detections, filter_low_confidence, min_object_size, image_area)
        
        return {
            "success": True,
            "image_path": str(image_path),
            "detections": detections,
            "image_area": image_area,
            "model_info": {
                "model_path": str(model_path),
                "confidence_threshold": confidence_threshold,
                "filter_low_confidence": filter_low_confidence,
                "min_object_size": min_object_size,
                "total_detections": len(detections)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "image_path": str(image_path)
        }

def main():
    parser = argparse.ArgumentParser(description='Detect garbage in a single image')
    parser.add_argument('--model', required=True, help='Path to YOLO model file')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--confidence', type=float, default=0.25, help='Confidence threshold')
    parser.add_argument('--filter-low-confidence', action='store_true', default=False, help='Filter low confidence garbage detections')
    parser.add_argument('--min-object-size', type=float, default=0.1, help='Minimum object size percentage')
    
    args = parser.parse_args()
    
    # Validate inputs
    model_path = Path(args.model)
    image_path = Path(args.image)
    
    if not model_path.exists():
        result = {"success": False, "error": f"Model file not found: {model_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    if not image_path.exists():
        result = {"success": False, "error": f"Image file not found: {image_path}"}
        print(json.dumps(result))
        sys.exit(1)
    
    # Run detection
    result = detect_garbage(
        model_path, image_path, args.confidence, 
        args.filter_low_confidence, 
        args.min_object_size
    )
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 