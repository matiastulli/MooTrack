import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Card, CardContent } from "../ui/Card"

export function ImagePreview({
  imagePreview,
  uploadedFile,
  detectionResults,
  uploadLoading,
  showBoundingBoxes,
  selectedDetections,
  imageDisplayDimensions,
  handleImageLoad,
  toggleDetectionSelection,
  getScaledBoundingBox,
  confidenceFilter,
  isManualDetectionMode,
  handleImageMouseDown,
  handleImageMouseMove,
  handleImageMouseUp,
  drawingBox,
  manualDetections,
}) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showZoomControls, setShowZoomControls] = useState(false)

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY * -0.01
      const newScale = Math.min(Math.max(1, scale + delta), 4)
      setScale(newScale)
    }
  }

  const handleMouseDown = (e) => {
    if (isManualDetectionMode) {
      handleImageMouseDown(e)
      return
    }
    
    if (scale > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isManualDetectionMode) {
      handleImageMouseMove(e)
      return
    }
    
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    if (isManualDetectionMode) {
      handleImageMouseUp()
      return
    }
    setIsDragging(false)
  }

  const adjustZoom = (delta) => {
    const newScale = Math.min(Math.max(1, scale + delta), 4)
    setScale(newScale)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [])
  if (!imagePreview) {
    return (
      <Card className="shadow-comfortable h-full flex items-center justify-center">
        <CardContent className="flex items-center justify-center w-full h-full">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-40">🖼️</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-comfortable h-full w-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0 w-full h-full">
        <div 
          className="relative flex-1 flex items-center justify-center w-full h-full bg-muted/10 rounded-xl overflow-hidden"
          onMouseEnter={() => setShowZoomControls(true)}
          onMouseLeave={() => setShowZoomControls(false)}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          style={{ 
            cursor: isManualDetectionMode ? 'crosshair' : scale > 1 ? 'grab' : 'default', 
            minHeight: '70vh', 
            minWidth: '70vw' 
          }}
        >
          {/* Zoom Controls */}
          <div className={cn(
            "absolute top-4 right-4 flex items-center gap-2 transition-opacity duration-200 z-50",
            showZoomControls ? "opacity-100" : "opacity-0"
          )}>
            <Button
              variant="secondary"
              size="icon"
              className="w-8 h-8 shadow-lg"
              onClick={() => adjustZoom(-0.5)}
              disabled={scale === 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="shadow-lg">
              {Math.round(scale * 100)}%
            </Badge>
            <Button
              variant="secondary"
              size="icon"
              className="w-8 h-8 shadow-lg"
              onClick={() => adjustZoom(0.5)}
              disabled={scale === 4}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="relative transition-transform duration-100"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center'
            }}
          >
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Uploaded preview"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              style={{ maxHeight: "calc(100vh - 80px)", maxWidth: "100vw" }}
              draggable="false"
            />
          </div>

          {/* Enhanced Bounding Boxes */}
          {detectionResults?.detections && showBoundingBoxes && (
            <div 
              className="absolute pointer-events-none"
              style={{
                // Position relative to the displayed image, not the container
                left: '50%',
                top: '50%',
                width: `${imageDisplayDimensions.width}px`,
                height: `${imageDisplayDimensions.height}px`,
                transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center'
              }}
            >
              {detectionResults.detections
                .map((detection, originalIndex) => ({ detection, originalIndex }))
                .filter(({ detection }) => detection.confidence >= confidenceFilter / 100)
                .map(({ detection, originalIndex }) => {
                  // Debug logging
                  if (originalIndex === 0) {
                    console.log('Detection format debug:', {
                      detection,
                      imageDisplayDimensions,
                      imageNaturalDimensions: window.imageNaturalDimensions
                    });
                  }
                  
                  // Handle different bbox formats
                  let bbox;
                  if (detection.bbox && Array.isArray(detection.bbox)) {
                    // Standard [x1, y1, x2, y2] format
                    bbox = detection.bbox;
                    if (originalIndex === 0) {
                      console.log(`Detection ${originalIndex}: Using standard bbox format:`, bbox);
                    }
                  } else if (detection.x !== undefined && detection.y !== undefined && 
                           detection.width !== undefined && detection.height !== undefined) {
                    // Roboflow format: {x, y, width, height} where x,y are center coordinates
                    bbox = [
                      detection.x - detection.width / 2,   // x1 (left)
                      detection.y - detection.height / 2,  // y1 (top)
                      detection.x + detection.width / 2,   // x2 (right)
                      detection.y + detection.height / 2   // y2 (bottom)
                    ];
                    if (originalIndex === 0) {
                      console.log(`Detection ${originalIndex}: Converted from Roboflow format:`, {
                        original: { x: detection.x, y: detection.y, width: detection.width, height: detection.height },
                        converted: bbox
                      });
                    }
                  } else {
                    // Fallback - skip this detection if format is unrecognized
                    console.warn('Unrecognized detection format:', detection);
                    return null;
                  }
                  
                  const [x1, y1, x2, y2] = getScaledBoundingBox(bbox)
                  const isSelected = selectedDetections.has(originalIndex)
                  
                  // Log only for first detection to avoid spam
                  if (originalIndex === 0) {
                    console.log(`Detection ${originalIndex}: Scaled bbox:`, { 
                      x1, y1, x2, y2, 
                      width: x2-x1, 
                      height: y2-y1,
                      imageDisplayDimensions,
                      percentX1: (x1 / imageDisplayDimensions.width * 100).toFixed(2),
                      percentY1: (y1 / imageDisplayDimensions.height * 100).toFixed(2)
                    });
                  }

                  return (
                    <div
                      key={originalIndex}
                      className={cn(
                        "absolute border-2 cursor-pointer transition-all duration-200 pointer-events-auto group",
                        isSelected
                          ? "border-violet-500"
                        : "border-violet-400 hover:border-violet-600",
                    )}
                    style={{
                      left: `${x1}px`,
                      top: `${y1}px`,
                      width: `${x2 - x1}px`,
                      height: `${y2 - y1}px`,
                    }}
                    onClick={() => toggleDetectionSelection(originalIndex)}
                    title={`Cow #${originalIndex + 1} - ${(detection.confidence * 100).toFixed(1)}% confidence`}
                  >
                    {/* Cow Number - Show on Hover */}
                    <div
                      className={cn(
                        "absolute -top-6 left-0 px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200",
                        "opacity-0 group-hover:opacity-100",
                        isSelected 
                          ? "bg-violet-600 text-white" 
                          : "bg-violet-500 text-white",
                      )}
                    >
                      Cow {originalIndex + 1}
                    </div>
                  </div>
                  )
                }).filter(Boolean)}
            </div>
          )}

          {/* Manual Detection Boxes */}
          {manualDetections && manualDetections.length > 0 && showBoundingBoxes && (
            <div 
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: `${imageDisplayDimensions.width}px`,
                height: `${imageDisplayDimensions.height}px`,
                transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center'
              }}
            >
              {manualDetections.map((detection, index) => {
                const [x1, y1, x2, y2] = getScaledBoundingBox(detection.bbox)
                
                return (
                  <div
                    key={`manual-${index}`}
                    className="absolute border-2 border-blue-500 bg-blue-500/20 transition-all duration-200 group"
                    style={{
                      left: `${x1}px`,
                      top: `${y1}px`,
                      width: `${x2 - x1}px`,
                      height: `${y2 - y1}px`,
                    }}
                    title={`Manual Detection #${index + 1}`}
                  >
                    <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                      Manual {index + 1}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Drawing Box Preview */}
          {drawingBox && isManualDetectionMode && (
            <div 
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: `${imageDisplayDimensions.width}px`,
                height: `${imageDisplayDimensions.height}px`,
                transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center'
              }}
            >
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20 border-dashed"
                style={{
                  left: `${Math.min(drawingBox.startX, drawingBox.endX)}px`,
                  top: `${Math.min(drawingBox.startY, drawingBox.endY)}px`,
                  width: `${Math.abs(drawingBox.endX - drawingBox.startX)}px`,
                  height: `${Math.abs(drawingBox.endY - drawingBox.startY)}px`,
                }}
              />
            </div>
          )}

          {uploadLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                <div className="text-center">
                  <span className="text-xl font-bold block text-white">Analyzing Image...</span>
                  <span className="text-sm text-white/90">Please wait while we detect cows</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
