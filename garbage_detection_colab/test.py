#!/usr/bin/env python3
"""
Garbage Detection Inference Script
"""
import argparse
import cv2
from pathlib import Path
from ultralytics import YOLO

def test_model(model_path, images_dir, output_dir="output", confidence_threshold=0.56):
    """
    Run inference on a directory of images using a trained YOLO model.

    Args:
        model_path (str): Path to the trained .pt model file.
        images_dir (str): Path to the directory containing test images.
        output_dir (str): Path to the directory to save annotated images.
        confidence_threshold (float): Confidence threshold for detections.
    """
    print(" Starting inference...")
    print(f" Model: {model_path}")
    print(f" Images directory: {images_dir}")
    print(f" Output directory: {output_dir}")
    print(f" Confidence threshold: {confidence_threshold}")

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Load the model
    try:
        model = YOLO(model_path)
        print(" Model loaded successfully.")
    except Exception as e:
        print(f" Error loading model: {e}")
        return

    # Find images
    images_path = Path(images_dir)
    image_files = list(images_path.glob("*.jpg")) + list(images_path.glob("*.png")) + list(images_path.glob("*.jpeg"))

    if not image_files:
        print(f" No images found in '{images_dir}'")
        return

    print(f"\nFound {len(image_files)} images to test.")
    print("-" * 30)

    total_detections = 0
    images_with_garbage = 0

    for img_file in image_files:
        print(f" Testing '{img_file.name}'...")
        
        # Run inference
        results = model(str(img_file), conf=confidence_threshold, verbose=False)
        
        # The result object contains the detections
        result = results[0]
        
        if len(result.boxes) > 0:
            total_detections += len(result.boxes)
            images_with_garbage += 1
            print(f"Detected {len(result.boxes)} objects. GARBAGE DETECTED. \n")
            
            # Save annotated image
            annotated_img = result.plot()
            save_path = output_path / f"detected_{img_file.name}"
            cv2.imwrite(str(save_path), annotated_img)
            print(f"[DETECTED] Annotated image saved to '{save_path}'")
        else:
            print(" [OK NO GARBAGE] No garbage detected. \n")

    # Print summary
    print("\n" + "=" * 30)
    print("INFERENCE SUMMARY")
    print("=" * 30)
    print(f"Total images tested: {len(image_files)}")
    print(f"Images with garbage: {images_with_garbage}")
    print(f"Images clean: {len(image_files) - images_with_garbage}")
    print(f"Total objects detected: {total_detections}")
    print(f"\nAnnotated images are saved in the '{output_dir}' directory.")


def main():
    parser = argparse.ArgumentParser(description='Garbage Detection Inference')
    parser.add_argument('--model', type=str, required=True,
                        help='Path to the trained model file (e.g., bestyolov8s.pt)')
    parser.add_argument('--images-dir', type=str, required=True,
                        help='Directory containing images to test.')
    parser.add_argument('--output-dir', type=str, default='inference_results',
                        help='Directory to save annotated images.')
    parser.add_argument('--confidence', type=float, default=0.63,
                        help='Confidence threshold for detection (0.0 to 1.0).')
    
    args = parser.parse_args()

    test_model(args.model, args.images_dir, args.output_dir, args.confidence)

if __name__ == "__main__":
    main() 