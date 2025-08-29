from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
import io
import os
import cv2
import numpy as np
import mediapipe as mp
from PIL import Image, ImageDraw
from rembg import remove
import uvicorn

app = FastAPI(title="PureFrame API", description="Background removal service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.netlify.app",
        "https://pureframe.netlify.app"  # Replace with your actual Netlify domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.get("/")
async def root():
    return {"message": "PureFrame Background Removal API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def detect_face_and_crop_headshot(image: Image.Image) -> Image.Image:
    """Detect face and crop image for headshot with 1:1 aspect ratio"""
    # Convert PIL image to OpenCV format
    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    height, width = cv_image.shape[:2]
    
    # Initialize MediaPipe Face Detection
    mp_face_detection = mp.solutions.face_detection
    mp_drawing = mp.solutions.drawing_utils
    
    with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_image)
        
        if results.detections:
            # Get the first (most confident) face detection
            detection = results.detections[0]
            bboxC = detection.location_data.relative_bounding_box
            
            # Convert relative coordinates to absolute coordinates
            bbox_x = int(bboxC.xmin * width)
            bbox_y = int(bboxC.ymin * height)
            bbox_width = int(bboxC.width * width)
            bbox_height = int(bboxC.height * height)
            
            # Calculate face center
            face_center_x = bbox_x + bbox_width // 2
            face_center_y = bbox_y + bbox_height // 2
            
            # Determine crop size for head and shoulders
            # Use face height as reference and multiply by factor to include shoulders
            crop_size = max(bbox_height * 3, bbox_width * 2.5)  # Include head and shoulders
            crop_size = int(crop_size)
            
            # Make crop_size fit within image bounds and ensure it's square
            max_crop_size = min(width, height)
            crop_size = min(crop_size, max_crop_size)
            
            # Calculate crop boundaries centered on face
            half_crop = crop_size // 2
            
            # Adjust center point if crop would go outside image bounds
            crop_center_x = max(half_crop, min(face_center_x, width - half_crop))
            crop_center_y = max(half_crop, min(face_center_y, height - half_crop))
            
            # Calculate final crop coordinates
            left = crop_center_x - half_crop
            top = crop_center_y - half_crop
            right = left + crop_size
            bottom = top + crop_size
            
            # Ensure we don't go outside image bounds
            left = max(0, left)
            top = max(0, top)
            right = min(width, right)
            bottom = min(height, bottom)
            
            # Crop the image
            cropped_image = image.crop((left, top, right, bottom))
            
            # Ensure 1:1 aspect ratio by creating square image
            crop_width = right - left
            crop_height = bottom - top
            
            if crop_width != crop_height:
                # Create square image with the smaller dimension
                square_size = min(crop_width, crop_height)
                
                # Calculate center crop coordinates
                if crop_width > crop_height:
                    # Crop width
                    crop_left = (crop_width - square_size) // 2
                    cropped_image = cropped_image.crop((crop_left, 0, crop_left + square_size, crop_height))
                else:
                    # Crop height  
                    crop_top = (crop_height - square_size) // 2
                    cropped_image = cropped_image.crop((0, crop_top, crop_width, crop_top + square_size))
            
            return cropped_image
        else:
            # No face detected, crop from center with 1:1 aspect ratio
            size = min(width, height)
            left = (width - size) // 2
            top = (height - size) // 2
            return image.crop((left, top, left + size, top + size))

@app.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    crop_headshot: bool = Form(False)
):
    # Validate file type
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload PNG, JPG, or JPEG files only."
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )
    
    try:
        # Open image
        input_image = Image.open(io.BytesIO(content))
        
        # Convert to RGB if necessary
        if input_image.mode != 'RGB':
            input_image = input_image.convert('RGB')
        
        # Crop for headshot if requested
        if crop_headshot:
            input_image = detect_face_and_crop_headshot(input_image)
        
        # Remove background
        output_image = remove(input_image)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Return processed image
        return StreamingResponse(
            io.BytesIO(img_byte_arr.read()),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=removed_bg.png"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@app.post("/replace-background")
async def replace_background(
    file: UploadFile = File(...),
    background_type: str = Form(...),  # "color" or "image"
    background_color: Optional[str] = Form(None),  # hex color for solid background
    background_image: Optional[UploadFile] = File(None),  # background image file
    crop_headshot: bool = Form(False)  # crop for headshot
):
    # Validate main file type
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload PNG, JPG, or JPEG files only."
        )
    
    # Read main file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )
    
    try:
        # Open and process main image
        input_image = Image.open(io.BytesIO(content))
        if input_image.mode != 'RGB':
            input_image = input_image.convert('RGB')
        
        # Crop for headshot if requested
        if crop_headshot:
            input_image = detect_face_and_crop_headshot(input_image)
        
        # Remove background to get subject with transparency
        subject_image = remove(input_image)
        
        # Create new background based on type
        if background_type == "color":
            if not background_color:
                background_color = "#FFFFFF"  # Default to white
            
            # Create solid color background
            bg_color = hex_to_rgb(background_color)
            new_background = Image.new('RGB', input_image.size, bg_color)
            
        elif background_type == "image" and background_image:
            # Validate background image
            if not allowed_file(background_image.filename):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid background image type. Please upload PNG, JPG, or JPEG files only."
                )
            
            # Read background image
            bg_content = await background_image.read()
            if len(bg_content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail="Background image too large. Maximum size is 10MB."
                )
            
            # Process background image
            bg_image = Image.open(io.BytesIO(bg_content))
            if bg_image.mode != 'RGB':
                bg_image = bg_image.convert('RGB')
            
            # Resize background to match main image
            new_background = bg_image.resize(input_image.size, Image.Resampling.LANCZOS)
            
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid background type or missing background image."
            )
        
        # Composite the subject onto the new background
        if subject_image.mode == 'RGBA':
            # Use the alpha channel for proper compositing
            final_image = Image.new('RGB', input_image.size)
            final_image.paste(new_background, (0, 0))
            final_image.paste(subject_image, (0, 0), subject_image)
        else:
            # Fallback if no alpha channel
            final_image = new_background
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        final_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Return processed image
        return StreamingResponse(
            io.BytesIO(img_byte_arr.read()),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=replaced_bg.png"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)