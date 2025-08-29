#!/usr/bin/env python3
"""
Simple test script to verify the headshot cropping functionality
"""

import sys
from PIL import Image
import numpy as np
from app import detect_face_and_crop_headshot

def test_cropping():
    """Test the cropping function with a sample image"""
    try:
        # Create a test image (you can replace this with a real image path)
        # For now, let's just test that the function can be imported and called
        print("Testing headshot cropping functionality...")
        
        # Create a dummy image for testing
        test_image = Image.new('RGB', (800, 600), color='white')
        
        # Test the function
        result = detect_face_and_crop_headshot(test_image)
        
        print("Function executed successfully")
        print(f"Original image size: {test_image.size}")
        print(f"Cropped image size: {result.size}")
        print(f"Is square (1:1 ratio): {result.size[0] == result.size[1]}")
        
        return True
        
    except Exception as e:
        print(f"Error testing cropping function: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_cropping()
    sys.exit(0 if success else 1)