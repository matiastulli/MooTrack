import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { exportDetectionResults } from '../../lib/utils'
import { api } from '../../services/api'
import DetectionControls from './DetectionControls'
import DetectionList from './DetectionList'
import DetectionStats from './DetectionStats'
import ImageViewer from './ImageViewer'

const CowDetectionInterface = () => {
  const [detectionData, setDetectionData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apiHealth, setApiHealth] = useState(null)

  // Check API health
  const checkApiHealth = async () => {
    try {
      const result = await api.cowDetection.getHealth()
      if (result.error) {
        setApiHealth({ status: 'error', message: result.error })
      } else {
        setApiHealth(result)
      }
    } catch (err) {
      setApiHealth({ status: 'error', message: 'API connection failed' })
    }
  }

  // Transform API response to frontend expected format
  const transformApiResponse = (apiResponse) => {
    if (!apiResponse || !apiResponse.detections) {
      return null
    }

    // Create base64 image from path if needed
    const imageName = apiResponse.image_path ? 
      apiResponse.image_path.split('/').pop() || apiResponse.image_path.split('\\').pop() : 
      'unknown.jpg'

    return {
      image_name: imageName,
      image_base64: null, // Will be loaded separately if needed
      image_width: 1920, // Default values, should be updated from actual image
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
        is_cow: true, // Default to true, user can change
        verified: false // User hasn't verified yet
      }))
    }
  }

  // Load detection results from server
  const loadDetectionResults = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await api.cowDetection.getResults()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Transform the API response to match the expected frontend format
      const transformedData = transformApiResponse(result)
      setDetectionData(transformedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file, transformedData = null) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // If transformedData is provided (from server detection), use it directly
      if (transformedData) {
        setDetectionData(transformedData)
        return
      }
      
      // Otherwise, upload file and get detection results
      const result = await api.cowDetection.detectFromUpload(file, 0.3)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Transform the API response to match the expected frontend format
      const transformedResult = transformApiResponse(result)
      setDetectionData(transformedResult)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle detection status
  const toggleDetection = (index) => {
    if (!detectionData) return

    const newData = { ...detectionData }
    newData.detections[index].is_cow = !newData.detections[index].is_cow
    newData.detections[index].verified = true
    setDetectionData(newData)
  }

  // Confirm all detections as cows
  const confirmAllAsCows = () => {
    if (!detectionData) return

    const newData = { ...detectionData }
    newData.detections.forEach(detection => {
      detection.is_cow = true
      detection.verified = true
    })
    setDetectionData(newData)
  }

  // Reject all detections
  const rejectAllDetections = () => {
    if (!detectionData) return

    const newData = { ...detectionData }
    newData.detections.forEach(detection => {
      detection.is_cow = false
      detection.verified = true
    })
    setDetectionData(newData)
  }

  // Export results
  const handleExport = () => {
    if (!detectionData) return
    exportDetectionResults(detectionData)
  }

  // Load results on mount
  useEffect(() => {
    checkApiHealth()
    loadDetectionResults()
  }, [])

  // Loading state
  if (isLoading && !detectionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Loading detection results...
          </h3>
          <p className="text-muted-foreground">
            Please wait while we fetch the cow detection data.
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !detectionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Connection Error
            </h3>
            <p className="text-destructive/80 mb-4">
              {error}
            </p>
            {apiHealth && (
              <div className="text-sm text-muted-foreground mb-4">
                API Status: {apiHealth.status === 'healthy' ? '✅ Connected' : '❌ Not Available'}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs text-destructive/60">
                Make sure the MooTrack API server is running on the configured port.
              </p>
              <button
                onClick={() => {
                  checkApiHealth()
                  loadDetectionResults()
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with stats */}
        <DetectionStats detectionData={detectionData} />

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Image viewer - takes up most space */}
          <div className="xl:col-span-3">
            <ImageViewer
              detectionData={detectionData}
              onDetectionClick={toggleDetection}
            />
          </div>

          {/* Controls sidebar */}
          <div className="space-y-6">
            <DetectionControls
              onLoadResults={loadDetectionResults}
              onFileUpload={handleFileUpload}
              onConfirmAll={confirmAllAsCows}
              onRejectAll={rejectAllDetections}
              onExport={handleExport}
              isLoading={isLoading}
            />

            <DetectionList
              detectionData={detectionData}
              onDetectionClick={toggleDetection}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CowDetectionInterface
