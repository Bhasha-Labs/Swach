#!/usr/bin/env python3
"""
Production-Ready Garbage Detection Model Training Script
"""
import argparse
from ultralytics import YOLO

def train_model(data_yaml, model_name='yolov8s.pt', epochs=100, imgsz=640, project_name='garbage_detection_prod', device=None, copy_paste=0.0, cls_weight=0.5):
    """
    Train a production-ready YOLO model on the garbage dataset with advanced options.

    Args:
        data_yaml (str): Path to the data.yaml file.
        model_name (str): Base model to use for training (e.g., 'yolov8s.pt').
        epochs (int): Number of training epochs.
        imgsz (int): Image size for training.
        project_name (str): Name for the training project directory.
        device (str, optional): Device to run on, e.g., 'cpu', 'cuda', '0', 'tpu'. Defaults to auto-detection.
        copy_paste (float): Probability of copy-paste augmentation.
        cls_weight (float): Weight for the classification loss.
    """
    print("🚀 Starting PRODUCTION model training...")
    print(f"📘 Data YAML: {data_yaml}")
    print(f"🧠 Model: {model_name}")
    print(f"🔄 Epochs: {epochs}")
    print(f"🖼️  Image size: {imgsz}")
    print(f"💻 Device: {'Auto-detect' if device is None else device}")
    print("\n💡 Advanced Training Options:")
    print(f"   - Copy-Paste Augmentation: {copy_paste}")
    print(f"   - Classification Loss Weight: {cls_weight}")
    
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
            exist_ok=True,  # Allow overwriting existing project
            # --- Advanced Hyperparameters ---
            copy_paste=copy_paste,
            cls=cls_weight
        )
        
        print("\n✅ Training complete!")
        print(f"📊 Results saved to: {results.save_dir}")

    except Exception as e:
        print(f"❌ An error occurred during training: {e}")
        import traceback
        traceback.print_exc()

def main():
    parser = argparse.ArgumentParser(description='YOLO Garbage Detection PROD Training')
    
    # --- Core Arguments ---
    parser.add_argument('--data', type=str, required=True,
                        help='Path to the data configuration file (data.yaml)')
    parser.add_argument('--model', type=str, default='yolov8s.pt', 
                        help='Base model name (e.g., yolov8s.pt, yolov8m.pt)')
    parser.add_argument('--epochs', type=int, default=100, 
                        help='Number of training epochs')
    parser.add_argument('--imgsz', type=int, default=640, 
                        help='Image size for training')
    parser.add_argument('--project', type=str, default='garbage_detection_prod_training',
                        help='Name for the training project folder')
    parser.add_argument('--device', type=str, default=None,
                        help="Device to run on, e.g., 'cpu', 'cuda', '0'. Leave blank for auto-detection.")

    # --- Advanced Tuning Arguments for SOTA Performance ---
    parser.add_argument('--copy_paste', type=float, default=0.0,
                        help='Augmentation: Probability of applying copy-paste (e.g., 0.1 for 10%%). Helps with rare classes.')
    parser.add_argument('--cls_weight', type=float, default=0.5,
                        help='Tuning: Weight of the classification loss. Increase to prioritize correct class identification (e.g., 1.0).')

    args = parser.parse_args()

    train_model(args.data, args.model, args.epochs, args.imgsz, args.project, args.device, args.copy_paste, args.cls_weight)

if __name__ == "__main__":
    main()