import os
import cv2
import numpy as np
from ultralytics import YOLO
import matplotlib.pyplot as plt
import json
import base64
from datetime import datetime
from typing import List, Dict, Any, Optional, Union


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
                results_enhanced = model(
                    enhanced, conf=conf, iou=0.3, verbose=False)

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

    save_detection_results(
        image_path, final_detections, "ultra_aggressive_cow_detection", output_dir)

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
    contours, _ = cv2.findContours(
        combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

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


def filter_detections(detections, iou_threshold=0.2):
    """
    Filter and clean up detections.
    """
    if not detections:
        return []

    # Sort by confidence
    detections.sort(key=lambda x: x['confidence'], reverse=True)

    final_detections = []

    for detection in detections:
        bbox1 = detection['bbox']
        is_duplicate = False

        for final_detection in final_detections:
            bbox2 = final_detection['bbox']
            iou = calculate_iou(bbox1, bbox2)

            if iou > iou_threshold:
                is_duplicate = True
                break

        if not is_duplicate:
            final_detections.append(detection)

    return final_detections


def calculate_iou(box1, box2):
    """
    Calculate Intersection over Union (IoU) of two bounding boxes.
    """
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

    # Calculate union
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0


def visualize_results(image, detections, output_dir):
    """Create comprehensive visualization."""

    # Create multiple views
    fig, axes = plt.subplots(2, 2, figsize=(20, 16))
    fig.suptitle(
        f'Comprehensive Cow Detection Results - {len(detections)} Found', fontsize=16)

    # Original image
    axes[0, 0].imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    axes[0, 0].set_title('Original Image')
    axes[0, 0].axis('off')

    # Annotated image
    result_image = image.copy()
    colors = [(0, 255, 0), (255, 0, 0), (0, 0, 255),
              (255, 255, 0), (255, 0, 255), (0, 255, 255)]

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
        axes[1, 0].text(0.5, 0.5, 'No detections found', ha='center',
                        va='center', transform=axes[1, 0].transAxes)
        axes[1, 0].set_title('No Detections')

    # Detection size distribution
    if detections:
        sizes = [d['size'] for d in detections]
        axes[1, 1].hist(sizes, bins=20, alpha=0.7, color='green')
        axes[1, 1].set_title('Detection Size Distribution')
        axes[1, 1].set_xlabel('Size (pixels²)')
        axes[1, 1].set_ylabel('Count')
    else:
        axes[1, 1].text(0.5, 0.5, 'No size data', ha='center',
                        va='center', transform=axes[1, 1].transAxes)
        axes[1, 1].set_title('No Size Data')

    plt.tight_layout()
    plt.savefig(os.path.join(
        output_dir, 'comprehensive_analysis_ultra.png'), dpi=300, bbox_inches='tight')
    plt.close()

    # Save the annotated image
    cv2.imwrite(os.path.join(
        output_dir, 'final_result_ultra.jpg'), result_image)


def save_detection_results(image_path: str, detections: List[Dict[str, Any]], best_model: str, output_dir: str = "output") -> str:
    """
    Save detailed detection results to both text and JSON files.

    Args:
        image_path (str): Path to the input image
        detections (List[Dict[str, Any]]): List of detection dictionaries
        best_model (str): Name of the best performing model
        output_dir (str, optional): Directory to save outputs. Defaults to "output"

    Returns:
        str: Path to the saved JSON file
    """
    image = cv2.imread(image_path)
    image_height, image_width = image.shape[:2] if image is not None else (
        0, 0)

    # Prepare JSON structure compatible with API schema
    json_results: Dict[str, Any] = {
        "metadata": {
            "image_path": image_path,
            "image_filename": os.path.basename(image_path),
            "image_width": image_width,
            "image_height": image_height,
            "total_detections": len(detections),
            "best_performing_model": best_model,
            "processed_at": datetime.now().isoformat(),
            "detection_algorithm": "ultra_aggressive_cow_detection"
        },
        "analysis_response": {
            "total_cows": len(detections),
            "image_path": image_path,
            "analysis_complete": True,
            "message": f"Ultra-aggressive detection found {len(detections)} cows",
            "method": "ultra"
        },
        "detections": []
    }

    # Add detection data in both detailed and API-compatible formats
    for i, detection in enumerate(detections):
        x1, y1, x2, y2 = detection['bbox']
        confidence = detection['confidence']
        model = detection.get('model', 'Unknown')
        class_id = detection.get('class_id', 21)  # Default to cow class

        # Detailed detection data for evaluation
        detection_data: Dict[str, Any] = {
            "id": i + 1,
            "bbox": {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "width": int(x2 - x1),
                "height": int(y2 - y1),
                "center_x": int((x1 + x2) / 2),
                "center_y": int((y1 + y2) / 2)
            },
            "confidence": float(confidence),
            "class_id": int(class_id),
            "class_name": detection['class_name'],
            "detected_by_model": model,
            "confidence_threshold": detection.get('conf_thresh', 0.0),
            # API format
            "bbox_array": [float(x1), float(y1), float(x2), float(y2)],
            "normalized_bbox": {
                "x1_norm": float(x1 / image_width) if image_width > 0 else 0.0,
                "y1_norm": float(y1 / image_height) if image_height > 0 else 0.0,
                "x2_norm": float(x2 / image_width) if image_width > 0 else 0.0,
                "y2_norm": float(y2 / image_height) if image_height > 0 else 0.0
            },
            "area_pixels": int((x2 - x1) * (y2 - y1)),
            "area_percentage": float(((x2 - x1) * (y2 - y1)) / (image_width * image_height * 100)) if image_width > 0 and image_height > 0 else 0.0
        }
        json_results["detections"].append(detection_data)

    # Save main JSON file with all detection data
    json_file = os.path.join(output_dir, 'detection_results_ultra.json')
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_results, f, indent=2)

    # Also save a simplified API-compatible JSON for direct use
    api_format: Dict[str, Any] = {
        "total_cows": len(detections),
        "detections": [
            {
                "confidence": det["confidence"],
                "bbox": det["bbox_array"],
                "class_name": det["class_name"],
                "class_id": det["class_id"],
                "model": det["detected_by_model"],
                "size": det["area_pixels"]
            }
            for det in json_results["detections"]
        ],
        "image_path": image_path,
        "analysis_complete": True,
        "message": f"Ultra-aggressive detection found {len(detections)} cows",
        "method": "ultra"
    }

    api_json_file = os.path.join(
        output_dir, 'api_detection_results_ultra.json')
    with open(api_json_file, 'w', encoding='utf-8') as f:
        json.dump(api_format, f, indent=2)

    # Save text summary file
    summary_file = os.path.join(output_dir, 'detection_summary_ultra.txt')

    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("Ultra-Aggressive Cow Detection Results\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Image processed: {os.path.basename(image_path)}\n")
        f.write(f"Image dimensions: {image_width}x{image_height} pixels\n")
        f.write(f"Total cows detected: {len(detections)}\n")
        f.write(f"Best performing model: {best_model}\n\n")

        f.write("Detection Details:\n")
        f.write("-" * 30 + "\n")

        for i, detection in enumerate(detections):
            x1, y1, x2, y2 = detection['bbox']
            confidence = detection['confidence']
            model = detection.get('model', 'Unknown')

            f.write(f"Cow {i+1}:\n")
            f.write(f"  Position: ({x1}, {y1}) to ({x2}, {y2})\n")
            f.write(f"  Confidence: {confidence:.3f}\n")
            f.write(f"  Detected by: {model}\n")
            f.write(f"  Box size: {x2-x1} x {y2-y1} pixels\n")
            f.write(
                f"  Center point: ({int((x1+x2)/2)}, {int((y1+y2)/2)})\n\n")

        f.write("\nFiles generated:\n")
        f.write("- detection_results_ultra.json (detailed evaluation format)\n")
        f.write("- api_detection_results_ultra.json (API-compatible format)\n")
        f.write("- detection_summary_ultra.txt (human-readable summary)\n")
        f.write("- final_result_ultra.jpg (visual result)\n")
        f.write("- comprehensive_analysis_ultra.png (analysis visualization)\n")

    return json_file
