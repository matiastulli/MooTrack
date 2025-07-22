import os
import cv2
import numpy as np
from ultralytics import YOLO
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_grid_analysis(image, grid_size=4):
    """
    Create a grid analysis of the image to better detect cows in different sections.
    """
    height, width = image.shape[:2]
    grid_height = height // grid_size
    grid_width = width // grid_size
    
    grid_results = []
    
    for i in range(grid_size):
        for j in range(grid_size):
            # Extract grid section
            y_start = i * grid_height
            y_end = (i + 1) * grid_height if i < grid_size - 1 else height
            x_start = j * grid_width
            x_end = (j + 1) * grid_width if j < grid_size - 1 else width
            
            grid_section = image[y_start:y_end, x_start:x_end]
            grid_results.append({
                'section': grid_section,
                'coordinates': (x_start, y_start, x_end, y_end),
                'grid_pos': (i, j)
            })
    
    return grid_results

def enhanced_cow_detection(image_path, output_dir="output"):
    """
    Enhanced cow detection with multiple models and techniques.
    """
    # Create output directory
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print("Loading enhanced YOLO models...")
    
    # Try multiple models for better detection
    models_to_try = [
        ('yolov8m.pt', 'YOLOv8 Medium'),
        ('yolov8s.pt', 'YOLOv8 Small'), 
        ('yolov8n.pt', 'YOLOv8 Nano')
    ]
    
    # Load image
    print(f"Processing image: {image_path}")
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image {image_path}")
        return 0
    
    original_image = image.copy()
    height, width = image.shape[:2]
    
    # Create visualization
    fig, axes = plt.subplots(2, 3, figsize=(20, 12))
    fig.suptitle('Enhanced Cow Detection Analysis', fontsize=16)
    
    all_detections = []
    best_count = 0
    best_model = None
    best_detections = []
    
    # Try different confidence thresholds
    confidence_thresholds = [0.1, 0.15, 0.2, 0.25]
    
    for model_file, model_name in models_to_try:
        print(f"\nTrying {model_name}...")
        try:
            model = YOLO(model_file)
            
            for conf_thresh in confidence_thresholds:
                print(f"  - Confidence threshold: {conf_thresh}")
                
                # Run inference on full image
                results = model(image, conf=conf_thresh, verbose=False)
                
                cow_detections = []
                for r in results:
                    if r.boxes is not None:
                        for box in r.boxes:
                            class_id = int(box.cls[0])
                            confidence = float(box.conf[0])
                            
                            # Check for cow (21) or other livestock
                            livestock_classes = [21, 19, 18]  # cow, horse, sheep
                            if class_id in livestock_classes:
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                cow_detections.append({
                                    'bbox': (int(x1), int(y1), int(x2), int(y2)),
                                    'confidence': confidence,
                                    'class_id': class_id,
                                    'model': model_name,
                                    'conf_thresh': conf_thresh
                                })
                
                # Also try grid-based detection for this model
                grid_sections = create_grid_analysis(image, grid_size=3)
                for grid_info in grid_sections:
                    grid_results = model(grid_info['section'], conf=conf_thresh, verbose=False)
                    
                    for r in grid_results:
                        if r.boxes is not None:
                            for box in r.boxes:
                                class_id = int(box.cls[0])
                                if class_id in [21, 19, 18]:  # livestock
                                    confidence = float(box.conf[0])
                                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                    
                                    # Adjust coordinates to full image
                                    grid_x_start, grid_y_start = grid_info['coordinates'][:2]
                                    adj_x1 = int(x1 + grid_x_start)
                                    adj_y1 = int(y1 + grid_y_start)
                                    adj_x2 = int(x2 + grid_x_start)
                                    adj_y2 = int(y2 + grid_y_start)
                                    
                                    cow_detections.append({
                                        'bbox': (adj_x1, adj_y1, adj_x2, adj_y2),
                                        'confidence': confidence,
                                        'class_id': class_id,
                                        'model': f"{model_name} (Grid)",
                                        'conf_thresh': conf_thresh
                                    })
                
                print(f"    Found {len(cow_detections)} potential cows")
                
                if len(cow_detections) > best_count:
                    best_count = len(cow_detections)
                    best_model = f"{model_name} (conf={conf_thresh})"
                    best_detections = cow_detections.copy()
                
                all_detections.extend(cow_detections)
        
        except Exception as e:
            print(f"Error with {model_name}: {e}")
            continue
    
    # Remove duplicate detections (IoU filtering)
    final_detections = remove_duplicate_detections(all_detections)
    
    # Create visualizations
    create_detection_visualizations(original_image, final_detections, output_dir, fig, axes)
    
    # Save results
    save_detection_results(image_path, final_detections, best_model, output_dir)
    
    return len(final_detections), final_detections

def remove_duplicate_detections(detections, iou_threshold=0.3):
    """
    Remove duplicate detections using IoU (Intersection over Union).
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

def create_detection_visualizations(image, detections, output_dir, fig, axes):
    """
    Create comprehensive visualizations of the detection results.
    """
    # Original image
    axes[0, 0].imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    axes[0, 0].set_title('Original Image')
    axes[0, 0].axis('off')
    
    # Image with all detections
    result_image = image.copy()
    colors = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255)]
    
    for i, detection in enumerate(detections):
        x1, y1, x2, y2 = detection['bbox']
        confidence = detection['confidence']
        color = colors[i % len(colors)]
        
        # Draw bounding box
        cv2.rectangle(result_image, (x1, y1), (x2, y2), color, 3)
        
        # Draw label
        label = f"Cow {i+1}: {confidence:.2f}"
        cv2.putText(result_image, label, (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    # Add total count
    count_text = f"Total Cows Detected: {len(detections)}"
    cv2.putText(result_image, count_text, (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
    
    axes[0, 1].imshow(cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB))
    axes[0, 1].set_title(f'Detections: {len(detections)} Cows')
    axes[0, 1].axis('off')
    
    # Zoomed sections showing individual cows
    for i in range(min(4, len(detections))):
        row = i // 2 + 0 if i < 2 else 1
        col = i % 2 + 1 if i < 2 else i - 2
        
        if row < 2 and col < 3:
            detection = detections[i]
            x1, y1, x2, y2 = detection['bbox']
            
            # Add padding around detection
            padding = 50
            zoom_x1 = max(0, x1 - padding)
            zoom_y1 = max(0, y1 - padding)
            zoom_x2 = min(image.shape[1], x2 + padding)
            zoom_y2 = min(image.shape[0], y2 + padding)
            
            zoomed_section = image[zoom_y1:zoom_y2, zoom_x1:zoom_x2]
            if zoomed_section.size > 0:
                axes[row, col].imshow(cv2.cvtColor(zoomed_section, cv2.COLOR_BGR2RGB))
                axes[row, col].set_title(f'Cow {i+1} (Conf: {detection["confidence"]:.2f})')
                axes[row, col].axis('off')
                
                # Draw detection box in zoomed view
                rel_x1 = x1 - zoom_x1
                rel_y1 = y1 - zoom_y1
                rel_x2 = x2 - zoom_x1
                rel_y2 = y2 - zoom_y1
                
                rect = patches.Rectangle((rel_x1, rel_y1), rel_x2-rel_x1, rel_y2-rel_y1,
                                       linewidth=2, edgecolor='red', facecolor='none')
                axes[row, col].add_patch(rect)
    
    # Fill remaining subplots
    for i in range(2):
        for j in range(3):
            if i == 0 and j < 2:
                continue
            if i == 1 and j < min(4, len(detections)):
                continue
            axes[i, j].axis('off')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'detection_analysis.png'), dpi=300, bbox_inches='tight')
    plt.close()
    
    # Save annotated result image
    cv2.imwrite(os.path.join(output_dir, 'annotated_result.jpg'), result_image)

def save_detection_results(image_path, detections, best_model, output_dir):
    """
    Save detailed detection results to text file.
    """
    summary_file = os.path.join(output_dir, 'enhanced_detection_summary.txt')
    
    with open(summary_file, 'w') as f:
        f.write("Enhanced Cow Detection Results\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Image processed: {os.path.basename(image_path)}\n")
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
            f.write(f"  Box size: {x2-x1} x {y2-y1} pixels\n\n")

