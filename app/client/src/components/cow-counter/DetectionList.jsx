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
}) {
  if (!detectionResults?.detections || detectionResults.detections.length === 0) return null

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
                {selectedDetections.size}/{detectionResults.detections.length}
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
        <div className="flex gap-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllDetections}
            disabled={selectedDetections.size === detectionResults.detections.length}
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
        <div className="space-y-2 max-h-[calc(100vh-600px)] overflow-y-auto no-scrollbar">
          {detectionResults.detections.map((detection, index) => {
            const isSelected = selectedDetections.has(index)
            return (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/30 border-border hover:border-primary/50",
                )}
                onClick={() => toggleDetectionSelection(index)}
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
                    <span className="font-medium text-foreground">Cow #{index + 1}</span>
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
      </CardContent>
    </Card>
  )
}
