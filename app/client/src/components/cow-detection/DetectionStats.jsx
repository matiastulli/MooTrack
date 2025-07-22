import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

const DetectionStats = ({ detectionData }) => {
  if (!detectionData) return null

  const total = detectionData.detections.length
  const confirmed = detectionData.detections.filter(d => d.is_cow).length
  const rejected = total - confirmed

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">🐄 Cow Detection Interface</CardTitle>
        <p className="text-center text-muted-foreground">
          Review and verify cow detections from your aerial images
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{total}</div>
            <div className="text-sm text-muted-foreground">Total Detections</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cow-confirmed">{confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed Cows</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cow-rejected">{rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DetectionStats
