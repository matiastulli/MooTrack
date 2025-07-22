import { formatConfidence, getConfidenceLevel } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

const DetectionList = ({ detectionData, onDetectionClick }) => {
  if (!detectionData || detectionData.detections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Individual Detections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No detections found. Try running the detection script with different settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual Detections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {detectionData.detections.map((detection, index) => {
          const confidenceLevel = getConfidenceLevel(detection.confidence)
          
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                detection.is_cow
                  ? 'border-cow-confirmed/50 bg-cow-confirmed/5 hover:bg-cow-confirmed/10'
                  : 'border-cow-rejected/50 bg-cow-rejected/5 hover:bg-cow-rejected/10'
              }`}
              onClick={() => onDetectionClick(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">
                  Detection #{index + 1}
                </span>
                <Badge variant={confidenceLevel}>
                  {formatConfidence(detection.confidence)}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Class: {detection.class_name}</div>
                <div>Model: {detection.model}</div>
                <div>Position: ({detection.bbox.x1}, {detection.bbox.y1})</div>
                <div>Size: {detection.bbox.width} × {detection.bbox.height}px</div>
              </div>
              
              <Button
                variant={detection.is_cow ? 'success' : 'destructive'}
                size="sm"
                className="mt-3 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onDetectionClick(index)
                }}
              >
                {detection.is_cow ? '🐄 Cow' : '❌ Not Cow'}
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default DetectionList
