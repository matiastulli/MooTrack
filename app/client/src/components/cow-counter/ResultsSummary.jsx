import { Eye, EyeOff, MousePointer, PenLine } from "lucide-react"
import { cn } from "../../lib/utils"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

export function ResultsSummary({
  isCollapsed,
  setIsCollapsed,
  detectionResults,
  selectedDetections,
  showBoundingBoxes,
  setShowBoundingBoxes,
  confidenceFilter,
  setConfidenceFilter,
  toggleDetectionSelection,
  selectAllDetections,
  deselectAllDetections,
  isManualDetectionMode,
  toggleManualDetectionMode,
  manualDetections,
}) {
  if (!detectionResults) return null

  // Calculate filtered results based on confidence threshold
  const filteredDetections = detectionResults.detections?.filter(
    detection => detection.confidence >= confidenceFilter / 100
  ) || []
  
  const filteredTotal = filteredDetections.length
  
  // Calculate filtered selected detections (only count selections that pass the confidence filter)
  const filteredSelectedDetections = detectionResults.detections?.filter(
    (detection, index) => selectedDetections.has(index) && detection.confidence >= confidenceFilter / 100
  ) || []
  
  const filteredSelectedCount = filteredSelectedDetections.length

  return (
    <Card className="shadow-comfortable border-comfortable">
      <CardHeader 
        className={cn("pb-3 cursor-pointer select-none hover:bg-muted/50")}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <CardTitle className="text-base md:text-lg">Results & Detections</CardTitle>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Badge variant="outline" size="sm" className="bg-muted/50 border-border/50 text-xs">
                {filteredSelectedCount}/{filteredTotal}
                {manualDetections && manualDetections.length > 0 && (
                  <span className="ml-1 text-blue-600">+{manualDetections.length}M</span>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <div className={cn("transition-transform text-sm md:text-base", isCollapsed ? "rotate-180" : "")}>⌃</div>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "space-y-4 transition-all duration-300",
        isCollapsed && "hidden"
      )}>
        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-xl font-bold text-primary">{filteredTotal}</div>
            <div className="text-xs font-medium text-muted-foreground">
              AI Total
              {filteredTotal !== detectionResults.total_cows && (
                <div className="text-xs text-muted-foreground/70 mt-1">
                  ({detectionResults.total_cows} original)
                </div>
              )}
            </div>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-xl font-bold text-emerald-600">{filteredSelectedCount}</div>
            <div className="text-xs font-medium text-muted-foreground">Selected</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{manualDetections?.length || 0}</div>
            <div className="text-xs font-medium text-muted-foreground">Manual</div>
          </div>
        </div>

        {/* Confidence Filter */}
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

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className="flex-1 text-xs text-foreground/90 hover:text-foreground"
          >
            {showBoundingBoxes ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showBoundingBoxes ? "Hide" : "Show"} Boxes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              toggleManualDetectionMode()
            }}
            className="flex-1 text-xs text-foreground/90 hover:text-foreground"
          >
            {isManualDetectionMode ? <MousePointer className="w-3 h-3 mr-1" /> : <PenLine className="w-3 h-3 mr-1" />}
            {isManualDetectionMode ? "Cancel" : "Manual"}
          </Button>
        </div>

        {/* Manual Detection Instructions */}
        {isManualDetectionMode && (
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-sm text-blue-800 dark:text-blue-200">Manual Detection Mode</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Click and drag on the image to draw bounding boxes around cows the AI may have missed
            </p>
          </div>
        )}

        {/* Selection Controls */}
        <div className="flex gap-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllDetections}
            disabled={filteredSelectedCount === filteredDetections.length}
            className="text-xs px-2 bg-transparent text-foreground/90"
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAllDetections}
            disabled={filteredSelectedCount === 0}
            className="text-xs px-2 bg-transparent text-foreground/90"
          >
            None
          </Button>
        </div>

        {/* Detection List - Responsive */}
        <div className="space-y-2">
          {/* Mobile Dropdown (screens < 768px) */}
          <div className="block md:hidden">
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
                Select detection ({filteredDetections.length} available)
              </option>
              {filteredDetections.map((detection, originalIndex) => {
                const detectionIndex = detectionResults.detections.findIndex(d => d === detection)
                const isSelected = selectedDetections.has(detectionIndex)
                
                return (
                  <option 
                    key={detectionIndex} 
                    value={detectionIndex}
                  >
                    {isSelected ? "✓ " : "○ "}Cow #{detectionIndex + 1} - {(detection.confidence * 100).toFixed(0)}%
                  </option>
                )
              })}
            </select>
            
            {/* Mobile Stats */}
            <div className="text-xs text-muted-foreground text-center mt-2">
              {filteredSelectedCount > 0 && (
                <span>
                  {filteredSelectedCount} selected
                </span>
              )}
            </div>
          </div>

          {/* Desktop/Tablet List View (screens >= 768px) */}
          <div className="hidden md:block space-y-2 max-h-[calc(100vh-700px)] overflow-y-auto no-scrollbar">
            {filteredDetections.map((detection, originalIndex) => {
              const detectionIndex = detectionResults.detections.findIndex(d => d === detection)
              const isSelected = selectedDetections.has(detectionIndex)
              
              return (
                <div
                  key={detectionIndex}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border hover:border-primary/50",
                  )}
                  onClick={() => toggleDetectionSelection(detectionIndex)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "bg-primary border-primary" : "bg-card border-muted",
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-card"></div>}
                      </div>
                      <span className="font-medium text-foreground">Cow #{detectionIndex + 1}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "text-xs font-medium px-2 py-0.5",
                        "bg-primary/5 border-primary/20 text-primary",
                        "transition-colors duration-200"
                      )}
                    >
                      {(detection.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="text-foreground/90 font-medium">({Math.round(detection.bbox[0])}, {Math.round(detection.bbox[1])})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="text-foreground/90 font-medium">{Math.round(detection.bbox[2] - detection.bbox[0])} × {Math.round(detection.bbox[3] - detection.bbox[1])} px</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
