import { BarChart3, Eye, EyeOff, MousePointer, PenLine } from "lucide-react"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

export function ResultsSummary({
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
  // Show advice message when no detection results are available
  if (!detectionResults) {
    return (
      <Card className="shadow-comfortable border-comfortable">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Results
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 px-4">
            <div className="text-4xl mb-4 opacity-50">📷</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Image Uploaded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please upload an image first to see detection results and analysis.
            </p>
            <div className="bg-muted/30 rounded-lg p-4 border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Switch to the "Upload Image" tab to select and analyze an image for cow detection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Results
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Results Grid */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryStat
            label="Total"
            value={filteredTotal}
            className="bg-primary/10 border-primary/20 text-primary"
          />
          <SummaryStat
            label="Picked"
            value={filteredSelectedCount}
            className="bg-emerald-50 border-emerald-200 text-emerald-600"
          />
          <SummaryStat
            label="Manual"
            value={manualDetections?.length || 0}
            className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
          />
        </div>

        {/* Confidence Filter */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Confidence Filter</span>
            <Badge variant="outline" size="sm" className="bg-primary/10 border-primary/20 text-primary">
              {confidenceFilter}%
            </Badge>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={confidenceFilter}
            onChange={e => setConfidenceFilter(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${confidenceFilter}%, hsl(var(--muted)) ${confidenceFilter}%, hsl(var(--muted)) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-foreground font-medium">{filteredDetections.length} shown</span>
            <span>100%</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className="w-full text-xs text-foreground/90 hover:text-foreground"
          >
            {showBoundingBoxes ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showBoundingBoxes ? "Hide" : "Show"} Boxes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              toggleManualDetectionMode()
            }}
            className="w-full text-xs text-foreground/90 hover:text-foreground"
          >
            {isManualDetectionMode ? <MousePointer className="w-3 h-3 mr-1" /> : <PenLine className="w-3 h-3 mr-1" />}
            {isManualDetectionMode ? "Cancel" : "Manual"}
          </Button>
        </div>
        {isManualDetectionMode && (
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-sm text-blue-800 dark:text-blue-200">Manual Detection Mode</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Click and drag on the image to draw bounding boxes around cows the AI may have missed.
            </p>
          </div>
        )}

        {/* Separator Line */}
        <hr className="my-4 border-muted" />

        {/* Selection Controls */}
        <div className="flex flex-row gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllDetections}
            disabled={filteredSelectedCount === filteredDetections.length}
            className="w-1/2 text-xs bg-transparent text-foreground/90"
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAllDetections}
            disabled={filteredSelectedCount === 0}
            className="w-1/2 text-xs bg-transparent text-foreground/90"
          >
            None
          </Button>
        </div>

        {/* Detection List */}
        <div>
          <select
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 cursor-pointer hover:border-primary/50"
            onChange={e => {
              const selectedIndex = Number(e.target.value)
              if (!isNaN(selectedIndex) && selectedIndex >= 0) {
                toggleDetectionSelection(selectedIndex)
              }
            }}
            value=""
          >
            <option value="" disabled>
              Select detection
            </option>
            {filteredDetections.map((detection, originalIndex) => {
              const detectionIndex = detectionResults.detections.findIndex(d => d === detection)
              const isSelected = selectedDetections.has(detectionIndex)
              return (
                <option key={detectionIndex} value={detectionIndex}>
                  {isSelected ? "✓ " : "○ "}Cow #{detectionIndex + 1} - {(detection.confidence * 100).toFixed(0)}%
                </option>
              )
            })}
          </select>
          {filteredSelectedCount > 0 && (
            <div className="text-xs text-muted-foreground text-center mt-2">
              {filteredSelectedCount} selected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

// Helper for summary stats
function SummaryStat({ label, value, className }) {
  return (
    <div className={`text-center p-3 rounded-lg border ${className}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  )
}
}
