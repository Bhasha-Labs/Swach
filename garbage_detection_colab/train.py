#!/usr/bin/env python3
"""
Garbage Detection Model Training Script
"""
import argparse
from ultralytics import YOLO

def train_model(data_yaml, model_name='yolov8s.pt', epochs=50, imgsz=640, project_name='garbage_detection', device=None):
    """
    Train a YOLO model on the garbage dataset.

    Args:
        data_yaml (str): Path to the data.yaml file.
        model_name (str): Base model to use for training (e.g., 'yolov8s.pt').
        epochs (int): Number of training epochs.
        imgsz (int): Image size for training.
        project_name (str): Name for the training project directory.
        device (str, optional): Device to run on, e.g., 'cpu', 'cuda', '0', 'tpu'. Defaults to auto-detection.
    """
    print("🚀 Starting model training...")
    print(f"📘 Data YAML: {data_yaml}")
    print(f"🧠 Model: {model_name}")
    print(f"🔄 Epochs: {epochs}")
    print(f"🖼️  Image size: {imgsz}")
    print(f"💻 Device: {'Auto-detect' if device is None else device}")
    
    try:
        # Load a pre-trained model
        model = YOLO(model_name)
        
        # Train the model
        results = model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            project=project_name,
            device=device,
            exist_ok=True  # Allow overwriting existing project
        )
        
        print("\n✅ Training complete!")
        print(f"📊 Results saved to: {results.save_dir}")
        
        # You can access validation results like this:
        # val_results = model.val() 
        # print("📈 Validation results:")
        # print(val_results.box.map50)

    except Exception as e:
        print(f"❌ An error occurred during training: {e}")
        import traceback
        traceback.print_exc()

def main():
    parser = argparse.ArgumentParser(description='YOLO Garbage Detection Training')
    parser.add_argument('--data', type=str, required=True,
                        help='Path to the data configuration file (data.yaml)')
    parser.add_argument('--model', type=str, default='yolov8s.pt', 
                        help='Base model name (e.g., yolov8s.pt, yolov8m.pt)')
    parser.add_argument('--epochs', type=int, default=1, 
                        help='Number of training epochs')
    parser.add_argument('--imgsz', type=int, default=640, 
                        help='Image size for training')
    parser.add_argument('--project', type=str, default='garbage_detection_training',
                        help='Name for the training project folder')
    parser.add_argument('--device', type=str, default=None,
                        help="Device to run on, e.g., 'cpu', 'cuda', '0', 'tpu'. Leave blank for auto-detection.")

    args = parser.parse_args()

    train_model(args.data, args.model, args.epochs, args.imgsz, args.project, args.device)

if __name__ == "__main__":
    main()