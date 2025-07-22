import os
import cv2
import numpy as np
from ultralytics import YOLO
import matplotlib.pyplot as plt
import json
import base64

def detect_cows_aggressive(image_path, output_dir="output"):
    """
    Ultra-aggressive cow detection with very low thresholds and multiple techniques.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print("🔍 Ultra-Aggressive Cow Detection Starting...")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image {image_path}")
        return 0
    
    height, width = image.shape[:2]
    print(f"Image dimensions: {width}x{height}")
    
    # Try multiple YOLO models with ultra-low confidence
    models = ['yolov8n.pt', 'yolov8s.pt', 'yolov8m.pt']
    all_detections = []
    
    for model_name in models:
        print(f"\n🤖 Testing {model_name}...")
        try:
            model = YOLO(model_name)
            
            # Ultra-low confidence thresholds
            for conf in [0.01, 0.05, 0.1, 0.15]:
                print(f"  Confidence: {conf}")
                
                # Regular detection
                results = model(image, conf=conf, iou=0.3, verbose=False)
                
                for r in results:
                    if r.boxes is not None:
                        for box in r.boxes:
                            class_id = int(box.cls[0])
                            confidence = float(box.conf[0])
                            
                            # Look for ANY animal classes that might be cows
                            animal_classes = [
                                16,  # bird
                                17,  # cat  
                                18,  # dog
                                19,  # horse
                                20,  # sheep
                                21,  # cow
                                22,  # elephant
                                23,  # bear
                                24,  # zebra
                                25   # giraffe
                            ]
                            
                            if class_id in animal_classes:
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                w, h = x2 - x1, y2 - y1
                                
                                all_detections.append({
                                    'bbox': (int(x1), int(y1), int(x2), int(y2)),
                                    'confidence': confidence,
                                    'class_id': class_id,
                                    'class_name': model.names[class_id],
                                    'size': w * h,
                                    'model': model_name,
                                    'conf_thresh': conf
                                })
                
                # Also try with different image processing
                # Enhance contrast
                enhanced = cv2.convertScaleAbs(image, alpha=1.5, beta=30)
                results_enhanced = model(enhanced, conf=conf, iou=0.3, verbose=False)
                
                for r in results_enhanced:
                    if r.boxes is not None:
                        for box in r.boxes:
                            class_id = int(box.cls[0])
                            confidence = float(box.conf[0])
                            
                            if class_id in animal_classes:
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                w, h = x2 - x1, y2 - y1
                                
                                all_detections.append({
                                    'bbox': (int(x1), int(y1), int(x2), int(y2)),
                                    'confidence': confidence,
                                    'class_id': class_id,
                                    'class_name': model.names[class_id] + "_enhanced",
                                    'size': w * h,
                                    'model': model_name,
                                    'conf_thresh': conf
                                })
        
        except Exception as e:
            print(f"Error with {model_name}: {e}")
    
    print(f"\n📊 Total raw detections: {len(all_detections)}")
    
    if len(all_detections) == 0:
        print("❌ Still no detections found!")
        print("\n🔧 Let's try alternative detection methods...")
        
        # Alternative method: Look for brown/dark spots that could be cows
        alternative_detections = detect_brown_spots(image)
        all_detections.extend(alternative_detections)
    
    # Remove duplicates and filter
    final_detections = filter_detections(all_detections)
    
    # Create visualization
    visualize_results(image, final_detections, output_dir)
    
    # Save comprehensive report
    save_comprehensive_report(image_path, all_detections, final_detections, output_dir)
    
    return len(final_detections), final_detections

def detect_brown_spots(image):
    """
    Alternative detection method: Look for brown/dark circular spots that could be cows.
    """
    print("🟤 Trying brown spot detection...")
    
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Define range for brown colors (cows)
    lower_brown1 = np.array([10, 50, 20])
    upper_brown1 = np.array([20, 255, 200])
    
    lower_brown2 = np.array([0, 50, 20])
    upper_brown2 = np.array([10, 255, 200])
    
    # Create masks
    mask1 = cv2.inRange(hsv, lower_brown1, upper_brown1)
    mask2 = cv2.inRange(hsv, lower_brown2, upper_brown2)
    brown_mask = mask1 + mask2
    
    # Also look for dark spots (black cows)
    lower_dark = np.array([0, 0, 0])
    upper_dark = np.array([180, 255, 80])
    dark_mask = cv2.inRange(hsv, lower_dark, upper_dark)
    
    combined_mask = brown_mask + dark_mask
    
    # Find contours
    contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    detections = []
    for contour in contours:
        area = cv2.contourArea(contour)
        
        # Filter by size (cows should be certain size in aerial view)
        if 100 < area < 5000:  # Adjust these values based on cow size in image
            x, y, w, h = cv2.boundingRect(contour)
            
            # Check aspect ratio (cows should be roughly circular/oval)
            aspect_ratio = w / h if h > 0 else 0
            if 0.5 < aspect_ratio < 2.0:
                detections.append({
                    'bbox': (x, y, x + w, y + h),
                    'confidence': 0.5,  # Default confidence for color-based detection
                    'class_id': 21,
                    'class_name': 'cow_color_detected',
                    'size': area,
                    'model': 'color_detection',
                    'conf_thresh': 0.5
                })
    
    print(f"🟤 Found {len(detections)} brown/dark spots")
    return detections

def filter_detections(detections):
    """
    Filter and clean up detections.
    """
    if not detections:
        return []
    
    # Sort by confidence
    detections.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Remove duplicates based on overlap
    filtered = []
    for detection in detections:
        bbox1 = detection['bbox']
        is_duplicate = False
        
        for existing in filtered:
            bbox2 = existing['bbox']
            overlap = calculate_overlap(bbox1, bbox2)
            
            if overlap > 0.3:  # 30% overlap threshold
                is_duplicate = True
                break
        
        if not is_duplicate:
            filtered.append(detection)
    
    return filtered

def calculate_overlap(box1, box2):
    """Calculate overlap ratio between two boxes."""
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    # Calculate intersection
    x1_i = max(x1_1, x1_2)
    y1_i = max(y1_1, y1_2)
    x2_i = min(x2_1, x2_2)
    y2_i = min(y2_1, y2_2)
    
    if x2_i <= x1_i or y2_i <= y1_i:
        return 0.0
    
    intersection = (x2_i - x1_i) * (y2_i - y1_i)
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    
    return intersection / min(area1, area2) if min(area1, area2) > 0 else 0.0

def visualize_results(image, detections, output_dir):
    """Create comprehensive visualization."""
    
    # Create multiple views
    fig, axes = plt.subplots(2, 2, figsize=(20, 16))
    fig.suptitle(f'Comprehensive Cow Detection Results - {len(detections)} Found', fontsize=16)
    
    # Original image
    axes[0, 0].imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    axes[0, 0].set_title('Original Image')
    axes[0, 0].axis('off')
    
    # Annotated image
    result_image = image.copy()
    colors = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255)]
    
    for i, detection in enumerate(detections):
        x1, y1, x2, y2 = detection['bbox']
        confidence = detection['confidence']
        class_name = detection['class_name']
        color = colors[i % len(colors)]
        
        # Draw bounding box
        cv2.rectangle(result_image, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label = f"{class_name} {confidence:.2f}"
        cv2.putText(result_image, label, (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Add total count
    count_text = f"Total Detections: {len(detections)}"
    cv2.putText(result_image, count_text, (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
    
    axes[0, 1].imshow(cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB))
    axes[0, 1].set_title(f'All Detections: {len(detections)}')
    axes[0, 1].axis('off')
    
    # Detection confidence histogram
    if detections:
        confidences = [d['confidence'] for d in detections]
        axes[1, 0].hist(confidences, bins=20, alpha=0.7, color='blue')
        axes[1, 0].set_title('Detection Confidence Distribution')
        axes[1, 0].set_xlabel('Confidence')
        axes[1, 0].set_ylabel('Count')
    else:
        axes[1, 0].text(0.5, 0.5, 'No detections found', ha='center', va='center', transform=axes[1, 0].transAxes)
        axes[1, 0].set_title('No Detections')
    
    # Detection size distribution
    if detections:
        sizes = [d['size'] for d in detections]
        axes[1, 1].hist(sizes, bins=20, alpha=0.7, color='green')
        axes[1, 1].set_title('Detection Size Distribution')
        axes[1, 1].set_xlabel('Size (pixels²)')
        axes[1, 1].set_ylabel('Count')
    else:
        axes[1, 1].text(0.5, 0.5, 'No size data', ha='center', va='center', transform=axes[1, 1].transAxes)
        axes[1, 1].set_title('No Size Data')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'comprehensive_analysis.png'), dpi=300, bbox_inches='tight')
    plt.close()
    
    # Save the annotated image
    cv2.imwrite(os.path.join(output_dir, 'final_result.jpg'), result_image)

def save_comprehensive_report(image_path, all_detections, final_detections, output_dir):
    """Save a comprehensive report."""
    
    report_file = os.path.join(output_dir, 'comprehensive_report.txt')
    
    with open(report_file, 'w') as f:
        f.write("🐄 COMPREHENSIVE COW DETECTION REPORT 🐄\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"Image: {os.path.basename(image_path)}\n")
        f.write(f"Total raw detections: {len(all_detections)}\n")
        f.write(f"Final filtered detections: {len(final_detections)}\n\n")
        
        if all_detections:
            f.write("RAW DETECTION BREAKDOWN:\n")
            f.write("-" * 30 + "\n")
            
            # Group by class
            class_counts = {}
            for det in all_detections:
                class_name = det['class_name']
                class_counts[class_name] = class_counts.get(class_name, 0) + 1
            
            for class_name, count in class_counts.items():
                f.write(f"{class_name}: {count} detections\n")
            
            f.write(f"\nConfidence range: {min(d['confidence'] for d in all_detections):.3f} - {max(d['confidence'] for d in all_detections):.3f}\n")
        
        if final_detections:
            f.write(f"\nFINAL DETECTIONS:\n")
            f.write("-" * 20 + "\n")
            
            for i, det in enumerate(final_detections):
                x1, y1, x2, y2 = det['bbox']
                f.write(f"Detection {i+1}:\n")
                f.write(f"  Class: {det['class_name']}\n")
                f.write(f"  Confidence: {det['confidence']:.3f}\n")
                f.write(f"  Position: ({x1}, {y1}) to ({x2}, {y2})\n")
                f.write(f"  Size: {det['size']:.0f} pixels²\n")
                f.write(f"  Model: {det['model']}\n\n")
        else:
            f.write(f"\n❌ NO FINAL DETECTIONS\n")
            f.write("This could mean:\n")
            f.write("- The cows are too small for general YOLO models\n")
            f.write("- The aerial perspective is challenging\n")
            f.write("- Need custom training data for this specific scenario\n")
            f.write("- Manual annotation might be required\n")

def save_detection_results(image_path, detections, output_dir="output"):
    """
    Save detection results as JSON for web interface.
    """
    # Convert image to base64 for web display
    with open(image_path, "rb") as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
    
    # Prepare data for JSON
    results_data = {
        "image_name": os.path.basename(image_path),
        "image_base64": f"data:image/jpeg;base64,{img_base64}",
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
            "class_name": detection['class_name'],
            "model": detection['model'],
            "size": detection.get('size', 0),
            "is_cow": True,  # Default to true, user can unselect in web interface
            "verified": False  # User hasn't verified yet
        })
    
    # Save JSON file
    json_file = os.path.join(output_dir, "detection_results.json")
    with open(json_file, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    print(f"💾 Detection results saved to {json_file}")
    return json_file
