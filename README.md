# SWACH - Smart Garbage Detection App

## Public Code Repository
**GitHub Repository:** https://github.com/Bhasha-Labs/swch.git

## One-Page Summary of Prototype

SWACH is an intelligent garbage detection system that uses computer vision and machine learning to assess environmental cleanliness through a quantifiable **Swacchta Index (SI)**. The application provides real-time analysis of images and videos to detect various types of garbage and generate standardized cleanliness scores from 0-100.

### Key Features and Functionalities

- **Real-time Garbage Detection**: Camera-based live detection with instant analysis
- **Multi-format Support**: Image upload, video processing, and bulk image analysis
- **Swacchta Index Calculation**: Mathematical algorithm converting detection data into standardized cleanliness scores
- **Interactive Dashboard**: Modern web interface with location tracking and session management
- **Advanced Configuration**: Customizable confidence thresholds, object size filters, and processing options
- **Geographic Integration**: Location-based data collection with coordinate tracking
- **Session Management**: Save and manage detection sessions for different areas
- **Professional Reporting**: Clean interface suitable for municipal and environmental monitoring

### Core Problem Being Addressed

Urban areas worldwide struggle with garbage management and environmental monitoring. Traditional methods rely on manual inspection, which is:
- Time-consuming and labor-intensive
- Inconsistent in assessment criteria
- Difficult to scale across large areas
- Lacks standardized measurement systems

SWACH addresses these challenges by providing:
- Automated, consistent garbage detection
- Standardized cleanliness scoring system
- Scalable analysis for municipal areas
- Data-driven environmental monitoring

### Clear Overview of Prototype/Idea

SWACH combines YOLO-based object detection with a sophisticated mathematical algorithm to create the Swacchta Index. The system processes visual data to identify garbage objects, calculates their impact based on type, size, confidence, and density, then generates a standardized score.

**Core Algorithm:**
```
Swacchta Index (SI) = max(0, 100 - Total_Impact_Score)
```

The Total_Impact_Score considers:
- Base impact from detected objects (confidence × severity × size)
- Coverage penalty based on area covered by garbage
- Density penalty for object concentration
- Large object penalties for significant visual pollution
- Additional penalties for pollution variety and visual density

**Grading Scale:**
- 95-100: A+ (Excellent - Pristine)
- 85-94: A (Very Good - Clean)
- 75-84: B+ (Good - Mostly Clean)
- 65-74: B (Fair - Some Issues)
- 55-64: C+ (Moderate - Noticeable Litter)
- 45-54: C (Poor - Significant Garbage)
- 35-44: D+ (Bad - Heavy Pollution)
- 25-34: D (Very Bad - Severe Issues)
- 15-24: F+ (Critical - Environmental Hazard)
- 0-14: F (Catastrophic - Immediate Action Required)

## How to Run the Application

1. Clone the repository:
```bash
git clone https://github.com/visheshyadav/swch-test.git
cd swch-test
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Navigate to the application directory:
```bash
cd garbage_detection_colab
```

4. Run the Streamlit application:
```bash
streamlit run streamlit_app.py
```

The application will be available at `http://localhost:8501` in your web browser.

## Technical Implementation

The prototype uses:
- **Frontend**: Next.js with TypeScript for the web dashboard
- **Backend**: Python with Streamlit for the core application
- **Computer Vision**: YOLO v8 for object detection
- **Data Processing**: Custom algorithms for Swacchta Index calculation
- **Geographic Data**: Location tracking and coordinate management

This system provides municipalities, environmental agencies, and urban planners with a standardized tool for assessing and monitoring environmental cleanliness across different areas.
