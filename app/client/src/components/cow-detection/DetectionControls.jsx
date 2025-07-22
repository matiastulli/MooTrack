import { CheckCircle, Download, RefreshCw, Upload, XCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'

const DetectionControls = ({ 
  onLoadResults, 
  onFileUpload, 
  onConfirmAll, 
  onRejectAll, 
  onExport,
  isLoading 
}) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload Detection Results JSON:
          </label>
          <Input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            variant="success" 
            className="w-full"
            onClick={onConfirmAll}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm All as Cows
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={onRejectAll}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject All Detections
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onLoadResults}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Reload Results'}
          </Button>
          
          <Button 
            variant="default" 
            className="w-full"
            onClick={onExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Verified Results
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DetectionControls
