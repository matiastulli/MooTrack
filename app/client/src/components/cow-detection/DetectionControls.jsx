import { Activity, CheckCircle, Download, Image as ImageIcon, RefreshCw, Upload, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import APIStatusCheck from './APIStatusCheck'

const DetectionControls = ({ 
  onLoadResults, 
  onFileUpload, 
  onConfirmAll, 
  onRejectAll, 
  onExport,
  isLoading,
  showAPIStatus = false
}) => {
  const [availableImages, setAvailableImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [showStatus, setShowStatus] = useState(showAPIStatus)

  // Load available images from server
  const loadAvailableImages = async () => {
    try {
      setLoadingImages(true)
      const result = await api.cowDetection.listImages()
      if (result.error) {
        console.error('Failed to load images:', result.error)
        return
      }
      setAvailableImages(result.images || [])
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  // Detect from existing file on server
  const handleDetectFromServerFile = async (filename) => {
    try {
      const result = await api.cowDetection.detectFromFile(filename, 0.3)
      if (result.error) {
        throw new Error(result.error)
      }
      // Transform and set the data (similar to file upload)
      const transformApiResponse = (apiResponse) => {
        if (!apiResponse || !apiResponse.detections) {
          return null
        }

        const imageName = apiResponse.image_path ? 
          apiResponse.image_path.split('/').pop() || apiResponse.image_path.split('\\').pop() : 
          'unknown.jpg'

        return {
          image_name: imageName,
          image_base64: null,
          image_width: 1920,
          image_height: 1080,
          total_detections: apiResponse.total_cows || 0,
          detections: apiResponse.detections.map((detection, index) => ({
            id: index,
            bbox: {
              x1: Math.round(detection.bbox[0]),
              y1: Math.round(detection.bbox[1]),
              x2: Math.round(detection.bbox[2]),
              y2: Math.round(detection.bbox[3]),
              width: Math.round(detection.bbox[2] - detection.bbox[0]),
              height: Math.round(detection.bbox[3] - detection.bbox[1])
            },
            confidence: detection.confidence,
            class_name: detection.class_name || 'cow',
            model: 'yolo',
            size: (detection.bbox[2] - detection.bbox[0]) * (detection.bbox[3] - detection.bbox[1]),
            is_cow: true,
            verified: false
          }))
        }
      }
      
      const transformedData = transformApiResponse(result)
      if (onFileUpload) {
        // Use onFileUpload callback to update the parent component
        onFileUpload(null, transformedData)
      }
    } catch (error) {
      console.error('Detection from server file failed:', error)
    }
  }

  useEffect(() => {
    loadAvailableImages()
  }, [])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Controls
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowStatus(!showStatus)}
              title="Toggle API Status"
            >
              <Activity className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload Image for Detection:
          </label>
          <Input
            type="file"
            accept="image/*,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supported formats: JPG, JPEG, PNG
          </p>
        </div>

        {/* Server Images */}
        {availableImages.length > 0 && (
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ImageIcon className="h-4 w-4 text-muted-foreground mr-2" />
              <label className="text-sm font-medium text-foreground">
                Detect from Server Images:
              </label>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableImages.map((image) => (
                <div key={image.filename} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {image.filename}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetectFromServerFile(image.filename)}
                    disabled={isLoading}
                    className="ml-2 text-xs"
                  >
                    Detect
                  </Button>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadAvailableImages}
              disabled={loadingImages}
              className="w-full mt-2 text-xs"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${loadingImages ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
          </div>
        )}

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
    
    {/* API Status Check */}
    {showStatus && <APIStatusCheck />}
  </>
  )
}

export default DetectionControls
