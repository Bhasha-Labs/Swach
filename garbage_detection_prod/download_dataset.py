#!/usr/bin/env python3
"""
Script to download the full dataset from Roboflow.
"""
import argparse
from roboflow import Roboflow
import os

def download_roboflow_dataset(api_key, workspace, project_name, version, download_path="."):
    """
    Downloads a dataset from Roboflow.

    To get your API key:
    1. Go to your Roboflow account settings: https://app.roboflow.com/settings/api
    2. Copy your private API key.

    Args:
        api_key (str): Your Roboflow private API key.
        workspace (str): The ID of your Roboflow workspace.
        project_name (str): The ID of your Roboflow project.
        version (int): The version number of the dataset.
        download_path (str): The local path to download the dataset to.
    """
    print("🚀 Attempting to download dataset from Roboflow...")
    
    try:
        rf = Roboflow(api_key=api_key)
        project = rf.workspace(workspace).project(project_name)
        dataset = project.version(version).download("yolov8")
        
        print(f"\n✅ Dataset downloaded successfully!")
        print(f"   Location: {dataset.location}")

        # The data.yaml needs to be adjusted for the new location
        data_yaml_path = os.path.join(dataset.location, "data.yaml")
        if os.path.exists(data_yaml_path):
            print("🔧 Adjusting paths in data.yaml...")
            with open(data_yaml_path, 'r') as f:
                content = f.read()
            
            # Make paths relative to the dataset location
            content = content.replace('train: ../train/images', 'train: train/images')
            content = content.replace('val: ../valid/images', 'val: valid/images')
            content = content.replace('test: ../test/images', 'test: test/images')

            with open(data_yaml_path, 'w') as f:
                f.write(content)
            print("   ✅ data.yaml updated.")
        else:
            print(f"⚠️  Warning: Could not find data.yaml at {data_yaml_path}")

    except Exception as e:
        print(f"❌ An error occurred during download: {e}")
        print("   Please check your API key, workspace ID, project ID, and version number.")
        import traceback
        traceback.print_exc()

def main():
    parser = argparse.ArgumentParser(description='Download dataset from Roboflow')
    
    # Use environment variable for API key if available, otherwise require it
    default_api_key = os.environ.get("ROBOFLOW_API_KEY")
    
    parser.add_argument('--api_key', type=str, default=default_api_key, 
                        required=default_api_key is None,
                        help='Your Roboflow API key. Can also be set as ROBOFLOW_API_KEY environment variable.')
    
    parser.add_argument('--workspace', type=str, default="visheshyadav",
                        help='Roboflow workspace ID.')
    parser.add_argument('--project', type=str, default="final-garbage-detection-hb7fn",
                        help='Roboflow project ID.')
    parser.add_argument('--version', type=int, required=True,
                        help='Dataset version number to download.')
    
    args = parser.parse_args()

    # The old grabage_data directory is now obsolete
    download_path = "." 
    download_roboflow_dataset(args.api_key, args.workspace, args.project, args.version, download_path)

if __name__ == "__main__":
    main() 