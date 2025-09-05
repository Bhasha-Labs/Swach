#!/usr/bin/env python3
"""
Streamlit App for Garbage Detection
Perfect for hackathon demonstrations
"""

import streamlit as st
import cv2
import numpy as np
from PIL import Image
import tempfile
import os
from pathlib import Path
import time
from ultralytics import YOLO

# Page configuration
st.set_page_config(
    page_title="🗑️ SWACH - Smart Garbage Detection",
    page_icon="🗑️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        color: #2E7D32;
        text-align: center;
        margin-bottom: 2rem;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #424242;
        text-align: center;
        margin-bottom: 1rem;
    }
    .detection-box {
        border: 2px solid #4CAF50;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
        background-color: #F1F8E9;
    }
    .no-detection-box {
        border: 2px solid #FF9800;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
        background-color: #FFF3E0;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def load_model(model_path):
    """Load YOLO model with caching"""
    try:
        model = YOLO(model_path)
        return model
    except Exception as e:
        st.error(f"Error loading model: {e}")
        return None

def detect_garbage(model, image, confidence_threshold=0.25, filter_low_confidence_garbage=True, min_object_size=0.1):
    """Run garbage detection on an image with smart filtering"""
    if model is None:
        return None, []
    
    try:
        results = model(image, conf=confidence_threshold, verbose=False)
        result = results[0]
        
        # Get detection info with bounding boxes and smart filtering
        detections = []
        if len(result.boxes) > 0:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = model.names[class_id]
                
                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # SMART FILTERING: Apply stricter thresholds for ambiguous classes
                should_include = True
                
                # Filter low-confidence "garbage" detections (often false positives)
                if filter_low_confidence_garbage and class_name.lower() in ['garbage'] and confidence < 0.4:
                    should_include = False
                
                # Filter very small objects that are likely noise
                object_area = (x2 - x1) * (y2 - y1)
                image_area = image.size[0] * image.size[1] if hasattr(image, 'size') else 640*640
                area_ratio = (object_area / image_area) * 100  # Convert to percentage
                
                if area_ratio < min_object_size:  # Objects smaller than threshold
                    should_include = False
                
                # Filter objects with very low confidence across all classes
                if confidence < 0.3:
                    should_include = False
                
                if should_include:
                    detections.append({
                        'class': class_name,
                        'confidence': confidence,
                        'bbox': [x1, y1, x2, y2]
                    })
        
        # Get annotated image
        annotated_img = result.plot()
        annotated_img = cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB)
        
        return annotated_img, detections
    except Exception as e:
        st.error(f"Error during detection: {e}")
        return None, []

def display_results(annotated_img, detections, original_name="", image_shape=None):
    """Display detection results with Swacchta Index"""
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📸 Original Image")
        if original_name:
            st.caption(f"File: {original_name}")
    
    with col2:
        st.subheader("🔍 Detection Results")
    
    # Calculate image area for Swacchta Index
    if image_shape:
        image_area = image_shape[0] * image_shape[1]  # height * width
    else:
        image_area = 640 * 640  # Default assumption
    
    # Calculate Swacchta Index
    swacchta_index = calculate_swacchta_index(detections, image_area)
    
    if detections:
        with st.container():
            st.markdown('<div class="detection-box">', unsafe_allow_html=True)
            st.success(f"🗑️ **GARBAGE DETECTED!** Found {len(detections)} objects")
            
            for i, det in enumerate(detections, 1):
                st.write(f"**{i}.** {det['class']} - Confidence: {det['confidence']:.2%}")
            st.markdown('</div>', unsafe_allow_html=True)
        
        col2.image(annotated_img, caption="Detected Objects", use_column_width=True)
        
        # Display Swacchta Index
        st.markdown("---")
        display_swacchta_index(swacchta_index, len(detections))
        
    else:
        with st.container():
            st.markdown('<div class="no-detection-box">', unsafe_allow_html=True)
            st.warning("✅ **NO GARBAGE DETECTED** - Area appears clean!")
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Display perfect Swacchta Index
        st.markdown("---")
        display_swacchta_index(swacchta_index, 0)

def calculate_swacchta_index(detections, image_area, frame_history=None):
    """
    Calculate Swacchta Index (Cleanliness Index) for street/road areas
    
    ENHANCED Algorithm - Now properly considers bounding box areas:
    1. Actual garbage coverage area from bounding boxes
    2. Size-weighted severity penalties
    3. Exponential scaling for large garbage areas
    4. More realistic visual pollution assessment
    
    Returns: Swacchta Index (0-100, where 100 = perfectly clean)
    """
    if not detections:
        return 100  # Perfect cleanliness
    
    # Define severity weights for different garbage types
    severity_weights = {
        'garbage': 1.5,        # General garbage
        'trash': 1.8,          # Visible trash items
        'sampah-detection': 1.6, # Detected waste
        'plastic': 2.0,        # Plastic pollution
        'bottle': 1.4,         # Bottles
        'can': 1.3,           # Cans
        'paper': 1.2,         # Paper litter
        'organic': 1.0,       # Organic waste
        'hazardous': 3.0,     # Hazardous waste
        'medical': 2.8,       # Medical waste
        'electronic': 2.2,    # E-waste
        '0': 1.5,             # Class 0 (unknown garbage)
    }
    
    total_impact = 0
    total_coverage_area = 0
    large_object_penalty = 0
    
    for detection in detections:
        garbage_type = detection['class'].lower()
        confidence = detection['confidence']
        
        # Get severity weight
        severity = severity_weights.get(garbage_type, 1.5)
        
        # Calculate base impact (confidence-weighted)
        base_impact = confidence * severity
        
        # ENHANCED: Proper bounding box area consideration
        if 'bbox' in detection:
            bbox = detection['bbox']
            object_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            total_coverage_area += object_area
            
            # Calculate area ratio (what % of image this object covers)
            area_ratio = object_area / image_area
            
            # Area-based penalty scaling
            if area_ratio > 0.1:  # Large objects (>10% of image)
                area_penalty = area_ratio * 150  # Heavy penalty for large garbage
                large_object_penalty += area_penalty * severity
            elif area_ratio > 0.05:  # Medium objects (5-10% of image)
                area_penalty = area_ratio * 100
                large_object_penalty += area_penalty * severity
            else:  # Small objects (<5% of image)
                area_penalty = area_ratio * 75
            
            # Size-weighted impact (larger objects have exponentially more impact)
            size_multiplier = 1 + (area_ratio * 10)  # Linear to exponential scaling
            object_impact = base_impact * size_multiplier
            
        else:
            # Fallback: Estimate area impact based on type
            estimated_areas = {
                'garbage': 0.05, 'trash': 0.06, 'plastic': 0.04,
                'bottle': 0.025, 'can': 0.02, 'paper': 0.03
            }
            estimated_ratio = estimated_areas.get(garbage_type, 0.05)
            total_coverage_area += estimated_ratio * image_area
            
            size_multiplier = 1 + (estimated_ratio * 8)
            object_impact = base_impact * size_multiplier
        
        total_impact += object_impact
    
    # ENHANCED: Coverage-based penalties
    coverage_ratio = min(total_coverage_area / image_area, 1.0)
    
    # Exponential coverage penalty - gets much worse as more area is covered
    if coverage_ratio > 0.5:  # More than 50% covered
        coverage_penalty = 80 + (coverage_ratio - 0.5) * 200  # Up to 180 points
    elif coverage_ratio > 0.25:  # 25-50% covered
        coverage_penalty = 40 + (coverage_ratio - 0.25) * 160  # 40-80 points
    elif coverage_ratio > 0.1:  # 10-25% covered
        coverage_penalty = 15 + (coverage_ratio - 0.1) * 166  # 15-40 points
    else:  # Less than 10% covered
        coverage_penalty = coverage_ratio * 150  # 0-15 points
    
    # Object count penalty (still important for scatter pollution)
    object_count = len(detections)
    if object_count <= 5:
        density_penalty = object_count * 8
    elif object_count <= 15:
        density_penalty = 40 + (object_count - 5) * 12
    else:
        density_penalty = 160 + (object_count - 15) * 18
    
    # Visual pollution density (objects per visual area)
    visual_density = object_count / max(coverage_ratio, 0.01)  # Prevent division by zero
    if visual_density > 50:  # Very dense garbage
        pollution_penalty = (visual_density - 50) * 2
    else:
        pollution_penalty = 0
    
    # Multiple garbage type penalty
    unique_types = len(set(det['class'] for det in detections))
    variety_penalty = max(0, (unique_types - 2) * 8)
    
    # Calculate final garbage impact score
    garbage_impact_score = (
        total_impact + 
        coverage_penalty + 
        density_penalty + 
        large_object_penalty + 
        pollution_penalty + 
        variety_penalty
    )
    
    # Apply persistence penalty if frame history provided
    if frame_history and len(frame_history) > 1:
        persistence_frames = len([f for f in frame_history if f > 0])
        persistence_penalty = (persistence_frames - 1) * 10
        garbage_impact_score += persistence_penalty
    
    # Cap the impact score
    garbage_impact_score = min(garbage_impact_score, 100)
    
    # Calculate final Swacchta Index
    swacchta_index = max(0, 100 - garbage_impact_score)
    
    return round(swacchta_index, 1)

def get_swacchta_grade(index):
    """Convert Swacchta Index to letter grade and description - MUCH STRICTER"""
    if index >= 95:
        return "A+", "🌟 Excellent - Pristine", "#4CAF50"
    elif index >= 85:
        return "A", "✨ Very Good - Clean", "#8BC34A"
    elif index >= 75:
        return "B+", "👍 Good - Mostly Clean", "#9CCC65"
    elif index >= 65:
        return "B", "⚠️ Fair - Some Issues", "#CDDC39"
    elif index >= 55:
        return "C+", "🔶 Moderate - Noticeable Litter", "#FFC107"
    elif index >= 45:
        return "C", "⚠️ Poor - Significant Garbage", "#FF9800"
    elif index >= 35:
        return "D+", "🚨 Bad - Heavy Pollution", "#FF7043"
    elif index >= 25:
        return "D", "💀 Very Bad - Severe Issues", "#F44336"
    elif index >= 15:
        return "F+", "🔴 Critical - Environmental Hazard", "#D32F2F"
    else:
        return "F", "☠️ Catastrophic - Immediate Action Required", "#B71C1C"

def display_swacchta_index(index, detections_count=0):
    """Display Swacchta Index with proper formatting"""
    grade, description, color = get_swacchta_grade(index)
    
    # Create the display card with improved responsive design
    st.markdown(f"""
    <div style="
        border: 3px solid {color};
        border-radius: 15px;
        padding: 15px;
        margin: 10px 0;
        background: linear-gradient(135deg, {color}15, {color}08);
        text-align: center;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    ">
        <h3 style="color: {color}; margin: 0; font-size: 1.2rem;">🏛️ SWACCHTA INDEX</h3>
        <h1 style="color: {color}; font-size: 2.5rem; margin: 5px 0; font-weight: bold;">{index}</h1>
        <h4 style="color: {color}; margin: 0;">Grade: {grade}</h4>
        <p style="color: {color}; font-size: 1rem; margin: 5px 0;">{description}</p>
        <p style="color: #666; font-size: 0.8rem; margin: 0;">Based on {detections_count} object(s) detected</p>
    </div>
    """, unsafe_allow_html=True)
    
    return grade, description

def main():
    # Header
    st.markdown('<h1 class="main-header">🗑️ SWACH - Smart Garbage Detection</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">AI-Powered Environmental Monitoring System</p>', unsafe_allow_html=True)
    
    # Sidebar for model configuration
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        # Model selection
        model_files = [f for f in os.listdir('.') if f.endswith('.pt')]
        if not model_files:
            st.error("No .pt model files found!")
            st.stop()
        
        selected_model = st.selectbox("Select Model", model_files, index=0)
        
        # Confidence threshold
        confidence_threshold = st.slider(
            "Confidence Threshold", 
            min_value=0.1, 
            max_value=1.0, 
            value=0.25, 
            step=0.05,
            help="Higher values reduce false positives but might miss real garbage"
        )
        
        # Advanced filtering options
        st.markdown("---")
        st.markdown("### 🎯 False Positive Filters")
        
        filter_low_confidence_garbage = st.checkbox(
            "Filter Low-Confidence 'Garbage'", 
            value=True,
            help="Removes 'garbage' detections below 40% confidence (reduces plant pot false positives)"
        )
        
        min_object_size = st.slider(
            "Minimum Object Size (%)",
            min_value=0.0,
            max_value=2.0,
            value=0.1,
            step=0.1,
            help="Filter out objects smaller than this % of image area"
        )
        
        st.markdown("---")
        st.markdown("### 📊 Model Info")
        st.info(f"**Model:** {selected_model}")
        st.info(f"**Confidence:** {confidence_threshold:.0%}")
        if filter_low_confidence_garbage:
            st.info("🎯 **Smart Filtering:** ON")
        else:
            st.warning("⚠️ **Smart Filtering:** OFF")
    
    # Load model
    model = load_model(selected_model)
    if model is None:
        st.error("Failed to load model. Please check the model file.")
        st.stop()
    
    # Input method selection
    st.header("📥 Choose Input Method")
    input_method = st.radio(
        "How would you like to provide images?",
        ["📷 Camera Capture", "📁 Upload Files", "🎥 Upload Video", "📂 Bulk Directory Processing"],
        horizontal=True
    )
    
    st.markdown("---")
    
    # Camera input
    if input_method == "📷 Camera Capture":
        st.subheader("📷 Camera Capture")
        
        camera_image = st.camera_input("Take a picture of the area to check for garbage")
        
        if camera_image is not None:
            # Convert to PIL Image
            image = Image.open(camera_image)
            
            # Display original
            st.image(image, caption="Captured Image", width=400)
            
            # Run detection
            with st.spinner("🔍 Analyzing image for garbage..."):
                annotated_img, detections = detect_garbage(model, image, confidence_threshold, filter_low_confidence_garbage, min_object_size)
            
            if annotated_img is not None:
                display_results(annotated_img, detections, image_shape=image.size[::-1])  # PIL returns (width, height), we need (height, width)
    
    # File upload
    elif input_method == "📁 Upload Files":
        st.subheader("📁 Upload Images")
        
        uploaded_files = st.file_uploader(
            "Choose image files",
            type=['png', 'jpg', 'jpeg'],
            accept_multiple_files=True
        )
        
        if uploaded_files:
            for uploaded_file in uploaded_files:
                st.markdown(f"### Processing: {uploaded_file.name}")
                
                # Load image
                image = Image.open(uploaded_file)
                
                # Run detection
                with st.spinner(f"🔍 Analyzing {uploaded_file.name}..."):
                    annotated_img, detections = detect_garbage(model, image, confidence_threshold, filter_low_confidence_garbage, min_object_size)
                
                if annotated_img is not None:
                    col1, col2 = st.columns(2)
                    with col1:
                        st.image(image, caption="Original", use_column_width=True)
                    with col2:
                        st.image(annotated_img, caption="Detection Results", use_column_width=True)
                    
                    # Calculate and display Swacchta Index
                    image_area = image.size[0] * image.size[1]  # width * height
                    swacchta_index = calculate_swacchta_index(detections, image_area)
                    
                    # Show detection summary
                    if detections:
                        st.success(f"🗑️ Found {len(detections)} garbage objects in {uploaded_file.name}")
                        for det in detections:
                            st.write(f"• {det['class']} ({det['confidence']:.1%})")
                    else:
                        st.info(f"✅ No garbage detected in {uploaded_file.name}")
                    
                    # Display Swacchta Index
                    display_swacchta_index(swacchta_index, len(detections))
                
                st.markdown("---")
    
    # Video upload
    elif input_method == "🎥 Upload Video":
        st.subheader("🎥 Video Analysis")
        
        st.info("📁 **Upload Limit**: Up to 5GB video files supported")
        
        uploaded_video = st.file_uploader(
            "Choose a video file",
            type=['mp4', 'avi', 'mov', 'mkv'],
            help="Supported formats: MP4, AVI, MOV, MKV. Maximum file size: 5GB"
        )
        
        if uploaded_video is not None:
            # Save uploaded video to temp file
            tfile = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            tfile.write(uploaded_video.read())
            tfile.close()
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**📹 Original Video:**")
                st.video(uploaded_video)
            
            # Speed settings
            st.write("**⚡ Processing Speed Options:**")
            speed_option = st.radio(
                "Choose processing speed:",
                ["🚀 Fast (every 15th frame)", "⚡ Medium (every 10th frame)", "🐌 Full (every frame - slow)"],
                index=0,
                horizontal=True
            )
            
            # Set frame skip based on speed option
            if "Fast" in speed_option:
                frame_skip = 15
            elif "Medium" in speed_option:
                frame_skip = 10
            else:
                frame_skip = 1
            
            if st.button("🔍 Analyze Video"):
                with col2:
                    st.write("**🔍 Processing...**")
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                
                # Create output video file with proper encoding
                output_video_path = tempfile.NamedTemporaryFile(delete=False, suffix='_detected.mp4').name
                
                cap = cv2.VideoCapture(tfile.name)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                fps = cap.get(cv2.CAP_PROP_FPS) / frame_skip  # Adjust FPS for frame skipping
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                
                # Use H.264 codec for better compatibility
                fourcc = cv2.VideoWriter_fourcc(*'H264')
                out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
                
                frame_detections = []
                frame_count = 0
                processed_frames = 0
                swacchta_scores = []  # Track Swacchta Index for each frame
                
                start_time = time.time()
                
                # Process with frame skipping for speed
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # Skip frames for faster processing
                    if frame_count % frame_skip == 0:
                        # Convert BGR to RGB for YOLO
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        frame_pil = Image.fromarray(frame_rgb)
                        
                        # Run detection
                        results = model(frame_pil, conf=confidence_threshold, verbose=False)
                        result = results[0]
                        
                        # Get detections for this frame with smart filtering
                        frame_dets = []
                        if len(result.boxes) > 0:
                            for box in result.boxes:
                                class_id = int(box.cls[0])
                                confidence = float(box.conf[0])
                                class_name = model.names[class_id]
                                
                                # Get bounding box coordinates
                                x1, y1, x2, y2 = box.xyxy[0].tolist()
                                
                                # Apply same smart filtering as image detection
                                should_include = True
                                
                                # Filter low-confidence "garbage" detections
                                if filter_low_confidence_garbage and class_name.lower() in ['garbage'] and confidence < 0.4:
                                    should_include = False
                                
                                # Filter very small objects
                                object_area = (x2 - x1) * (y2 - y1)
                                frame_area = width * height
                                area_ratio = (object_area / frame_area) * 100
                                
                                if area_ratio < min_object_size:
                                    should_include = False
                                
                                # Filter very low confidence
                                if confidence < 0.3:
                                    should_include = False
                                
                                if should_include:
                                    frame_dets.append({
                                        'class': class_name,
                                        'confidence': confidence,
                                        'bbox': [x1, y1, x2, y2]
                                    })
                        
                        frame_detections.extend(frame_dets)
                        
                        # Calculate Swacchta Index for this frame
                        frame_area = width * height
                        frame_swacchta = calculate_swacchta_index(frame_dets, frame_area)
                        swacchta_scores.append(frame_swacchta)
                        
                        # Get annotated frame
                        annotated_frame = result.plot()
                        
                        # Write frame to output video
                        out.write(annotated_frame)
                        processed_frames += 1
                        
                        # Show processing speed
                        elapsed_time = time.time() - start_time
                        if elapsed_time > 0:
                            fps_processing = processed_frames / elapsed_time
                            status_text.text(f"Processing frame {frame_count}/{total_frames} | Speed: {fps_processing:.1f} FPS")
                    
                    # Update progress
                    frame_count += 1
                    progress = frame_count / total_frames
                    progress_bar.progress(progress)
                
                cap.release()
                out.release()
                
                # Calculate overall video Swacchta Index
                if swacchta_scores:
                    avg_swacchta = sum(swacchta_scores) / len(swacchta_scores)
                    min_swacchta = min(swacchta_scores)
                    max_swacchta = max(swacchta_scores)
                else:
                    avg_swacchta = min_swacchta = max_swacchta = 100
                
                # Display results
                with col2:
                    st.write("**🎯 Analysis Results:**")
                    
                    if frame_detections:
                        st.success(f"🗑️ **Analysis Complete!** Found {len(frame_detections)} detections in {processed_frames} processed frames")
                        
                        # Count detections by class
                        class_counts = {}
                        for det in frame_detections:
                            class_name = det['class']
                            class_counts[class_name] = class_counts.get(class_name, 0) + 1
                        
                        st.write("**Detection Summary:**")
                        for class_name, count in class_counts.items():
                            st.write(f"• {class_name}: {count} detections")
                        
                # Display video Swacchta Index (full width, outside columns)
                st.markdown("---")
                st.subheader("🏛️ Video Swacchta Analysis")
                
                if frame_detections:
                    col_left, col_center, col_right = st.columns([1, 2, 1])
                    
                    with col_center:
                        display_swacchta_index(avg_swacchta, len(frame_detections))
                        st.caption("Average Cleanliness Across Video")
                    
                    # Statistics in a separate row
                    st.markdown("**📊 Frame Analysis Statistics:**")
                    stat_col1, stat_col2, stat_col3 = st.columns(3)
                    
                    with stat_col1:
                        st.metric("Best Frame Score", f"{max_swacchta:.1f}")
                    with stat_col2:
                        st.metric("Worst Frame Score", f"{min_swacchta:.1f}")
                    with stat_col3:
                        st.metric("Score Variation", f"{max_swacchta - min_swacchta:.1f}")
                    
                else:
                    # Display perfect Swacchta Index for clean video
                    col_clean = st.columns([1, 2, 1])[1]
                    with col_clean:
                        display_swacchta_index(100, 0)
                        st.caption("Clean Video - No Garbage Detected")
                
                # Create tabs for video results
                st.markdown("---")
                tab1, tab2 = st.tabs(["📊 Analysis Results", "🎬 Annotated Video"])
                
                with tab1:
                    st.subheader("📋 Detailed Analysis Results")
                    
                    if frame_detections:
                        # Count detections by class
                        class_counts = {}
                        for det in frame_detections:
                            class_name = det['class']
                            class_counts[class_name] = class_counts.get(class_name, 0) + 1
                        
                        col_summary, col_stats = st.columns(2)
                        
                        with col_summary:
                            st.write("**🗑️ Detection Summary:**")
                            for class_name, count in class_counts.items():
                                st.write(f"• {class_name}: {count} detections")
                            
                            st.write(f"\n**📊 Total Objects:** {len(frame_detections)}")
                            st.write(f"**🎬 Frames Processed:** {processed_frames}/{total_frames}")
                        
                        with col_stats:
                            st.write("**⏱️ Processing Statistics:**")
                            total_time = time.time() - start_time
                            st.metric("Processing Time", f"{total_time:.1f}s")
                            st.metric("Processing Speed", f"{processed_frames/total_time:.1f} FPS")
                            st.metric("Frame Skip Rate", f"1:{frame_skip}")
                    
                    else:
                        st.info("✅ **Clean Video** - No garbage detected in any processed frames")
                        total_time = time.time() - start_time
                        st.write(f"**⏱️ Processing completed in {total_time:.1f} seconds**")
                        st.write(f"**📊 Processed {processed_frames} frames out of {total_frames} total frames**")
                
                with tab2:
                    st.subheader("🎬 Annotated Video Player")
                    
                    # Wait a moment for file to be fully written
                    time.sleep(1)
                    
                    try:
                        # Display video using file path (better for Streamlit)
                        st.video(output_video_path)
                        
                        # Provide download option
                        with open(output_video_path, 'rb') as video_file:
                            video_bytes = video_file.read()
                            st.download_button(
                                label="💾 Download Annotated Video",
                                data=video_bytes,
                                file_name=f"garbage_detection_result_{uploaded_video.name}",
                                mime="video/mp4",
                                use_container_width=True
                            )
                        
                        if frame_detections:
                            st.success(f"✅ Video processed successfully with {len(frame_detections)} total detections")
                        else:
                            st.info("ℹ️ Video processed - no garbage detected")
                            
                    except Exception as e:
                        st.error(f"❌ Error displaying video: {e}")
                        st.info("Video was processed but couldn't be displayed. Try the download button.")
                
                # Clean up input video file
                try:
                    os.unlink(tfile.name)
                except:
                    pass
    
    # Directory processing
    elif input_method == "📂 Bulk Directory Processing":
        st.subheader("📂 Bulk Directory Processing")
        st.info("This feature processes all images in the 'v2_test_img' directory")
        
        test_dir = "v2_test_img"
        if not os.path.exists(test_dir):
            st.error(f"Directory '{test_dir}' not found!")
        else:
            if st.button("🚀 Process All Images in Directory"):
                image_files = list(Path(test_dir).glob("*.jpg")) + list(Path(test_dir).glob("*.png")) + list(Path(test_dir).glob("*.jpeg"))
                
                if not image_files:
                    st.warning("No image files found in the directory")
                else:
                    progress_bar = st.progress(0)
                    results_container = st.container()
                    
                    total_detections = 0
                    images_with_garbage = 0
                    swacchta_scores = []
                    
                    for i, img_file in enumerate(image_files):
                        # Update progress
                        progress_bar.progress((i + 1) / len(image_files))
                        
                        # Load and process image
                        image = Image.open(img_file)
                        annotated_img, detections = detect_garbage(model, image, confidence_threshold, filter_low_confidence_garbage, min_object_size)
                        
                        if detections:
                            total_detections += len(detections)
                            images_with_garbage += 1
                            
                        # Calculate Swacchta Index for this image
                        image_area = image.size[0] * image.size[1]
                        swacchta_index = calculate_swacchta_index(detections, image_area)
                        swacchta_scores.append(swacchta_index)
                        
                        # Display result
                        with results_container.expander(f"📸 {img_file.name} - {'🗑️ GARBAGE FOUND' if detections else '✅ CLEAN'} - SI: {swacchta_index}"):
                            if annotated_img is not None:
                                col1, col2, col3 = st.columns([2, 2, 1])
                                with col1:
                                    st.image(image, caption="Original", use_column_width=True)
                                with col2:
                                    st.image(annotated_img, caption="Detection Results", use_column_width=True)
                                with col3:
                                    # Display Swacchta Index
                                    st.metric("Swacchta Index", f"{swacchta_index}", f"Grade: {get_swacchta_grade(swacchta_index)[0]}")
                                
                                if detections:
                                    st.write("**Detected Objects:**")
                                    for det in detections:
                                        st.write(f"• {det['class']} ({det['confidence']:.1%})")
                    
                    # Calculate overall area statistics
                    overall_swacchta = sum(swacchta_scores) / len(swacchta_scores)
                    best_swacchta_score = max(swacchta_scores)
                    worst_swacchta_score = min(swacchta_scores)
                    
                    # Summary
                    st.markdown("---")
                    st.header("📊 Area Processing Summary")
                    
                    # Top metrics
                    col1, col2, col3, col4 = st.columns(4)
                    with col1:
                        st.metric("Total Images", len(image_files))
                    with col2:
                        st.metric("Images with Garbage", images_with_garbage)
                    with col3:
                        st.metric("Total Objects Detected", total_detections)
                    with col4:
                        st.metric("Clean Images", len(image_files) - images_with_garbage)
                    
                    # Overall Swacchta Index Assessment
                    st.markdown("---")
                    st.subheader("🏛️ Overall Area Swacchta Assessment")
                    
                    col_main, col_stats = st.columns([2, 1])
                    
                    with col_main:
                        display_swacchta_index(overall_swacchta, total_detections)
                        st.caption("Average cleanliness across all surveyed locations")
                    
                    with col_stats:
                        st.write("**📈 Area Statistics:**")
                        st.metric("Best Location", f"{best_swacchta_score:.1f}")
                        st.metric("Worst Location", f"{worst_swacchta_score:.1f}")
                        st.metric("Cleanliness Variation", f"{best_swacchta_score - worst_swacchta_score:.1f}")
                        
                        # Calculate percentage
                        garbage_percentage = (images_with_garbage / len(image_files)) * 100
                        st.metric("Locations with Issues", f"{garbage_percentage:.1f}%")
                    
                    # Area assessment based on Swacchta Index
                    if overall_swacchta >= 80:
                        st.success("🌟 **EXCELLENT AREA** - High cleanliness standards maintained!")
                    elif overall_swacchta >= 60:
                        st.warning("⚠️ **NEEDS ATTENTION** - Area requires cleaning intervention.")
                    else:
                        st.error("🚨 **CRITICAL AREA** - Immediate cleaning and maintenance required!")
                    
                    # Recommendations
                    st.markdown("---")
                    st.subheader("💡 Recommendations")
                    
                    if garbage_percentage > 50:
                        st.write("🔧 **Immediate Actions Needed:**")
                        st.write("• Deploy cleaning teams to high-garbage areas")
                        st.write("• Install additional waste bins")
                        st.write("• Consider awareness campaigns")
                    elif garbage_percentage > 20:
                        st.write("🔧 **Preventive Measures:**")
                        st.write("• Regular monitoring of identified problem areas")
                        st.write("• Increase cleaning frequency")
                        st.write("• Community engagement programs")
                    else:
                        st.write("✅ **Maintenance Mode:**")
                        st.write("• Continue current cleaning schedule")
                        st.write("• Monitor for seasonal changes")
                        st.write("• Maintain community awareness")

if __name__ == "__main__":
    main() 