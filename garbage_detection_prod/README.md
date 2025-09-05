# Production-Ready Garbage Detection Model

This directory contains the necessary scripts and a step-by-step guide to train a state-of-the-art (SOTA), production-ready garbage detection model.

The workflow is designed to address the key performance issues identified in the SWACH_V1 report, focusing on a **data-centric approach** before hyperparameter tuning.

---

## Quick Start Guide

### Prerequisites
```bash
# Install required packages
pip install -r requirements.txt
```

### 1. Download Dataset
```bash
# Get your API key from: https://app.roboflow.com/settings/api
python download_dataset.py --api_key YOUR_API_KEY --version 1
```

### 2. Train Model
```bash
# Basic training
python train.py --data FINAL-GARBAGE-DETECTION-1/data.yaml --device cuda

# Advanced training (recommended for best performance)
python train.py \
  --data FINAL-GARBAGE-DETECTION-1/data.yaml \
  --device cuda \
  --epochs 100 \
  --copy_paste 0.1 \
  --cls_weight 1.0
```

### 3. Test Model
```bash
# Test on a folder of images
python test.py \
  --model garbage_detection_prod_training/train/weights/best.pt \
  --images-dir path/to/your/test/images \
  --confidence 0.25
```

---

## The Path to a High-Performance Model

Achieving top-notch performance requires more than just running a training script. The quality of your data is the single most important factor. Follow these steps in order for the best results.

### Step 1: Fix Your Dataset (Highest Impact)

The primary issue with the V1 model was data-related, specifically class ambiguity and imbalance.

1.  **Analyze and Merge Similar Classes:**
    - **Problem:** The classes `garbage`, `sampah-detection`, and `trash` were likely confusing the model, leading to poor precision.
    - **Action:** Go to your Roboflow project. Visually inspect these classes. If they are not clearly distinct, **merge them**. Create a single, robust class (e.g., `trash`). This will provide a clearer signal for the model to learn.

2.  **Fix the "Unknown" Class:**
    - **Problem:** A class named "Unknown" is too ambiguous for a model to learn effectively.
    - **Action:** In Roboflow, define what `Class 0` represents. Is it "plastic-bag"? "Cardboard"? **Rename the class** to be specific and ensure all its instances are correctly labeled.

3.  **Add Negative Examples:**
    - **Problem:** The model was incorrectly identifying non-garbage objects (false positives).
    - **Action:** Collect images of things that the model gets wrong (e.g., clean roads, shadows, leaves). Upload them to your dataset as **background images** (un-annotated). This teaches the model what *not* to detect.

### Step 2: Generate a New Dataset Version

After cleaning your labels and adding new images in Roboflow, **generate a new version** of your dataset. This will lock in your improvements. Make a note of the new version number.

### Step 3: Download the Clean Dataset

Now, use the included script to download your newly curated dataset. You will need your Roboflow API key and the new version number.

```bash
# First, install the required packages
pip install -r requirements.txt

# Download your new dataset version (replace YOUR_API_KEY and VERSION)
python download_dataset.py --api_key YOUR_API_KEY --version <NEW_DATASET_VERSION>
```

This will create a new folder named after your project (e.g., `final-garbage-detection-hb7fn-2`).

### Step 4: Train with Advanced Options

This is where you use the enhanced training script. The goal is to correct the remaining class imbalance and fine-tune the model.

1.  **Run an Enhanced Training:**
    - Use the `--copy_paste` argument to artificially increase the number of examples for your rarest classes.
    - Use the `--cls_weight` argument to make the model focus more on getting the classification right.

    ```bash
    # Example training command
    python train.py \
      --data final-garbage-detection-hb7fn-2/data.yaml \
      --device 0 \
      --epochs 100 \
      --copy_paste 0.1 \
      --cls_weight 1.0
    ```

    - **`--data`**: **Crucially**, point this to the `data.yaml` file inside your newly downloaded dataset folder.
    - **`--copy_paste 0.1`**: Applies copy-paste augmentation to 10% of the images. This is a good starting point for datasets with rare objects.
    - **`--cls_weight 1.0`**: Doubles the weight of the classification loss, forcing the model to work harder on reducing class confusion.

### Step 5: Test and Iterate

Once training is complete, the best model will be saved in the `garbage_detection_prod_training` directory. Use the `test.py` script to evaluate its performance on a test set of images.

```bash
python test.py \
  --model garbage_detection_prod_training/train/weights/best.pt \
  --images-dir <path_to_your_test_images>
```

If the performance is still not satisfactory, revisit Step 1. The path to SOTA performance is an iterative loop of improving data and then re-training.

---

## Script Reference

### download_dataset.py
Downloads your dataset from Roboflow.

**Required Arguments:**
- `--api_key`: Your Roboflow API key
- `--version`: Dataset version number

**Optional Arguments:**
- `--workspace`: Workspace ID (default: visheshyadav)
- `--project`: Project ID (default: final-garbage-detection-hb7fn)

**Example:**
```bash
python download_dataset.py --api_key abc123 --version 2
```

### train.py
Trains the YOLO model with advanced options.

**Required Arguments:**
- `--data`: Path to data.yaml file

**Core Arguments:**
- `--model`: Model size (default: yolov8s.pt)
- `--epochs`: Training epochs (default: 100)
- `--device`: Training device (default: auto-detect)
- `--imgsz`: Image size (default: 640)

**Advanced Arguments:**
- `--copy_paste`: Copy-paste augmentation probability (default: 0.0)
- `--cls_weight`: Classification loss weight (default: 0.5)

**Example:**
```bash
python train.py --data dataset/data.yaml --device cuda --epochs 150 --copy_paste 0.15 --cls_weight 1.2
```

### test.py
Tests the trained model on images.

**Required Arguments:**
- `--model`: Path to trained model (.pt file)
- `--images-dir`: Directory containing test images

**Optional Arguments:**
- `--output-dir`: Output directory for results (default: inference_results)
- `--confidence`: Detection confidence threshold (default: 0.25)

**Example:**
```bash
python test.py --model best.pt --images-dir test_images --confidence 0.3 --output-dir results
```

---

## Expected Results

Following this workflow should significantly improve upon the SWACH_V1 results:
- **Target mAP50:** 0.5+ (vs 0.324 in V1)
- **Reduced class confusion**
- **Better precision/recall balance**
- **Production-ready performance** 