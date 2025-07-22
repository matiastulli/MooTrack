import os
import json
import base64
from cow_counter import enhanced_cow_detection

def save_detection_results_json(image_path, detections, output_dir="output"):
    """
    Save detection results as JSON for web interface.
    """
    # Convert image to base64 for web display
    with open(image_path, "rb") as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
    
    # Get actual image dimensions
    import cv2
    image = cv2.imread(image_path)
    original_height, original_width = image.shape[:2]
    
    # Prepare data for JSON
    results_data = {
        "image_name": os.path.basename(image_path),
        "image_base64": f"data:image/jpeg;base64,{img_base64}",
        "image_width": original_width,
        "image_height": original_height,
        "total_detections": len(detections),
        "detections": []
    }
    
    for i, detection in enumerate(detections):
        x1, y1, x2, y2 = detection['bbox']
        results_data["detections"].append({
            "id": i,
            "bbox": {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "width": int(x2 - x1),
                "height": int(y2 - y1)
            },
            "confidence": float(detection['confidence']),
            "class_name": detection.get('class_name', 'cow'),
            "model": detection.get('model', 'yolo'),
            "size": (x2 - x1) * (y2 - y1),
            "is_cow": True,  # Default to true, user can unselect in web interface
            "verified": False  # User hasn't verified yet
        })
    
    # Save JSON file
    json_file = os.path.join(output_dir, "detection_results.json")
    with open(json_file, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    print(f"💾 Detection results saved to {json_file}")
    return json_file

def create_sample_results():
    """Create detection results using actual cow detection instead of hardcoded data."""
    
    image_path = "images/DJI_20250510112351_0160_D.JPG"
    
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return
    
    print("🐄 Running enhanced cow detection...")
    
    try:
        # Run the enhanced cow detection (returns count and detections)
        count, detections = enhanced_cow_detection(image_path)
        
        # Save detection results as JSON (this will create the JSON file with actual detections)
        json_file = save_detection_results_json(image_path, detections)
        
        print("✅ Real detection results saved successfully!")
        print(f"📊 Detected {count} cows using enhanced AI models")
        print(f"💾 Results saved to: {json_file}")
        
        if count == 0:
            print("⚠️  No cows detected. You may want to check:")
            print("   - Image quality and resolution")
            print("   - Confidence thresholds in the detection models")
            print("   - Whether cows are clearly visible in the image")
        
        return json_file
        
    except Exception as e:
        print(f"❌ Error during detection: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    create_sample_results()
