import { clsx } from "clsx"

/**
 * Utility function to combine class names
 */
export function cn(...inputs) {
  return clsx(inputs)
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
  const confirmedCows = detectionData.detections.filter(d => d.is_cow)
  const results = {
    image_name: detectionData.image_name,
    total_confirmed_cows: confirmedCows.length,
    confirmed_detections: confirmedCows,
    verification_complete: detectionData.detections.every(d => d.verified),
    export_timestamp: new Date().toISOString(),
  }

  const dataStr = JSON.stringify(results, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `verified_cow_count_${new Date().toISOString().split('T')[0]}.json`
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}
