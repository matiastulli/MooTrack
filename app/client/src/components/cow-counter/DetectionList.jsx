import { cn } from "../../lib/utils"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

export function DetectionList({
  isCollapsed,
  setIsCollapsed,
  detectionResults,
  selectedDetections,
  toggleDetectionSelection,
  selectAllDetections,
  deselectAllDetections,
  confidenceFilter,
  setConfidenceFilter,
}) {
  if (!detectionResults?.detections || detectionResults.detections.length === 0) return null

  // Filter detections based on confidence threshold
  const filteredDetections = detectionResults.detections.filter(
    detection => detection.confidence >= confidenceFilter / 100
  )

  return (
    <Card className="shadow-comfortable border-comfortable">
      <CardHeader 
        className={cn("pb-3 cursor-pointer select-none hover:bg-muted/50")}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <CardTitle className="text-lg">Detections</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" size="sm" className="bg-muted/50 border-border/50">
                {selectedDetections.size}/{filteredDetections.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <div className={cn("transition-transform", isCollapsed ? "rotate-180" : "")}>⌃</div>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "space-y-4 transition-all duration-300",
        isCollapsed && "hidden"
      )}>
        {/* Confidence Filter Slider */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Confidence Filter</span>
            <Badge variant="outline" size="sm" className="bg-primary/10 border-primary/20 text-primary">
              {confidenceFilter}%
            </Badge>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${confidenceFilter}%, hsl(var(--muted)) ${confidenceFilter}%, hsl(var(--muted)) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-foreground font-medium">
                {filteredDetections.length} / {detectionResults.detections.length} detections
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllDetections}
            disabled={selectedDetections.size === filteredDetections.length}
            className="text-xs px-2 bg-transparent text-foreground/90"
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAllDetections}
            disabled={selectedDetections.size === 0}
            className="text-xs px-2 bg-transparent text-foreground/90"
          >
            None
          </Button>
        </div>
        {/* Detection Dropdown */}
        <div className="space-y-2">
          <select
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 cursor-pointer hover:border-primary/50"
            onChange={(e) => {
              const selectedIndex = Number(e.target.value)
              if (!isNaN(selectedIndex) && selectedIndex >= 0) {
                toggleDetectionSelection(selectedIndex)
              }
            }}
            value=""
          >
            <option value="" disabled>
              Select a detection to toggle ({filteredDetections.length} available)
            </option>
            {filteredDetections.map((detection, originalIndex) => {
              // Find the original index in the full detections array
              const detectionIndex = detectionResults.detections.findIndex(d => d === detection)
              const isSelected = selectedDetections.has(detectionIndex)
              
              return (
                <option 
                  key={detectionIndex} 
                  value={detectionIndex}
                  className={isSelected ? "bg-primary/10" : ""}
                >
                  {isSelected ? "✓ " : "○ "}Cow #{detectionIndex + 1} - {(detection.confidence * 100).toFixed(1)}% confidence - Position: ({Math.round(detection.bbox[0])}, {Math.round(detection.bbox[1])}) - Size: {Math.round(detection.bbox[2] - detection.bbox[0])} × {Math.round(detection.bbox[3] - detection.bbox[1])} px
                </option>
              )
            })}
          </select>
          
          {/* Quick Stats */}
          <div className="text-xs text-muted-foreground text-center">
            {selectedDetections.size > 0 && (
              <span>
                {selectedDetections.size} detection{selectedDetections.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
