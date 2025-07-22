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

  // Load detection results from server
  const loadDetectionResults = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.loadDetectionResults()
      setDetectionData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.loadFromFile(file)
      setDetectionData(data)
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
              No detection results found
            </h3>
            <p className="text-destructive/80 mb-4">
              Please run the cow detection script first by executing:{' '}
              <code className="bg-destructive/20 px-2 py-1 rounded text-sm">
                python cow_counter_ultra.py
              </code>
            </p>
            <button
              onClick={loadDetectionResults}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
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
