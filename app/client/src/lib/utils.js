import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to combine class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Get confidence level class name
 */
export function getConfidenceLevel(confidence) {
  if (confidence > 0.7) return 'high'
  if (confidence > 0.4) return 'medium'
  return 'low'
}

/**
 * Format confidence percentage
 */
export function formatConfidence(confidence) {
  return `${(confidence * 100).toFixed(1)}%`
}

/**
 * Calculate bounding box scaling for display
 */
export function scaleBoundingBox(bbox, originalSize, displaySize) {
  const scaleX = displaySize.width / originalSize.width
  const scaleY = displaySize.height / originalSize.height
  
  return {
    x: bbox.x1 * scaleX,
    y: bbox.y1 * scaleY,
    width: bbox.width * scaleX,
    height: bbox.height * scaleY,
  }
}

/**
 * Export detection results as JSON
 */
export function exportDetectionResults(detectionData) {
  const confirmedCows = detectionData.detections.filter(d => d.is_cow && d.verified);
  const rejectedDetections = detectionData.detections.filter(d => !d.is_cow && d.verified);
  
  const results = {
    image_name: detectionData.image_name,
    detection_summary: {
      total_detections: detectionData.total_detections,
      confirmed_cows: confirmedCows.length,
      rejected_detections: rejectedDetections.length,
      pending_verification: detectionData.detections.filter(d => !d.verified).length
    },
    method_used: detectionData.method_used,
    confidence_threshold: detectionData.confidence_threshold,
    confirmed_cow_detections: confirmedCows.map((detection, index) => ({
      cow_id: index + 1,
      confidence: detection.confidence,
      bounding_box: detection.bbox,
      model_source: detection.model || 'unknown',
      user_notes: detection.user_notes || ''
    })),
    rejected_detections: rejectedDetections.map(detection => ({
      confidence: detection.confidence,
      bounding_box: detection.bbox,
      reason: 'user_rejected',
      user_notes: detection.user_notes || ''
    })),
    verification_complete: detectionData.verification_complete,
    export_timestamp: new Date().toISOString(),
    final_cow_count: confirmedCows.length
  };

  const dataStr = JSON.stringify(results, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `cow_count_${detectionData.image_name.split('.')[0]}_${new Date().toISOString().split('T')[0]}.json`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * Calculate detection statistics
 */
export function calculateDetectionStats(detections) {
  const total = detections.length;
  const high = detections.filter(d => d.confidence > 0.7).length;
  const medium = detections.filter(d => d.confidence > 0.4 && d.confidence <= 0.7).length;
  const low = detections.filter(d => d.confidence <= 0.4).length;
  const confirmed = detections.filter(d => d.is_cow && d.verified).length;
  const rejected = detections.filter(d => !d.is_cow && d.verified).length;
  const pending = detections.filter(d => !d.verified).length;

  return {
    total,
    confidence: { high, medium, low },
    verification: { confirmed, rejected, pending },
    averageConfidence: total > 0 ? detections.reduce((sum, d) => sum + d.confidence, 0) / total : 0
  };
}
