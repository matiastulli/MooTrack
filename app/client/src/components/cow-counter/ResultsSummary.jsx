import { Eye, EyeOff } from "lucide-react"
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
}) {
  if (!detectionResults) return null

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
              <CardTitle className="text-lg">Results</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" size="sm" className="bg-muted/50 border-border/50">
                {detectionResults.total_cows} total
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
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-xl font-bold text-primary">{detectionResults.total_cows}</div>
            <div className="text-xs font-medium text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-xl font-bold text-emerald-600">{selectedDetections.size}</div>
            <div className="text-xs font-medium text-muted-foreground">Selected</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Method:</span>
            <Badge variant="secondary" size="sm" className="text-foreground/90">
              {detectionResults.method}
            </Badge>
          </div>
        </div>

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
        </div>
      </CardContent>
    </Card>
  )
}
