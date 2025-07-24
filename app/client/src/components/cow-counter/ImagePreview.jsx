import { cn } from "@/lib/utils"
import { Camera, Minus, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

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
    if (scale > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
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
      <Card className="shadow-comfortable border-comfortable border-dashed h-full flex items-center justify-center">
        <CardContent className="text-center p-16">
          <div className="space-y-6">
            <div className="text-8xl opacity-40">🖼️</div>
            <h3 className="text-3xl font-bold text-foreground">Image Preview</h3>
            <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
              Upload an image to see it displayed here in full size. You'll be able to clearly identify each
              detected cow with visual indicators.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-comfortable border-comfortable h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Image Analysis
          </CardTitle>
          <div className="flex items-center gap-3">
            {uploadedFile && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            )}
            {detectionResults && (
              <Badge 
                variant="outline" 
                className={cn(
                  "px-3 py-1 text-sm font-bold",
                  "bg-background text-foreground border-border",
                  "shadow-sm",
                  "transition-colors duration-200"
                )}
              >
                <span className="mr-2">🐄</span>
                {detectionResults.detections.filter(d => d.confidence >= confidenceFilter / 100).length} detected
                {detectionResults.detections.filter(d => d.confidence >= confidenceFilter / 100).length !== detectionResults.total_cows && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    / {detectionResults.total_cows} total
                  </span>
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <div 
          className="relative flex-1 flex items-center justify-center bg-muted/20 rounded-xl overflow-hidden"
          onMouseEnter={() => setShowZoomControls(true)}
          onMouseLeave={() => setShowZoomControls(false)}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          style={{ cursor: scale > 1 ? 'grab' : 'default' }}
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
              className="max-w-full max-h-full object-contain"
              onLoad={handleImageLoad}
              style={{ maxHeight: "calc(100vh - 250px)" }}
              draggable="false"
            />
          </div>

          {/* Enhanced Bounding Boxes */}
          {detectionResults?.detections && showBoundingBoxes && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center'
              }}
            >
              {detectionResults.detections
                .map((detection, originalIndex) => ({ detection, originalIndex }))
                .filter(({ detection }) => detection.confidence >= confidenceFilter / 100)
                .map(({ detection, originalIndex }) => {
                  const [x1, y1, x2, y2] = getScaledBoundingBox(detection.bbox)
                  const isSelected = selectedDetections.has(originalIndex)

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
              })}
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
