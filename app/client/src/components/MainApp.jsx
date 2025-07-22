"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AlertCircle, Camera, CheckCircle, Eye, EyeOff, RotateCcw, Upload } from "lucide-react"
import { useEffect, useState } from "react"

// Mock API service - replace with your actual API service
const api = {
  cowDetection: {
    detectFromFile: async (file, filename, method) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Mock detection results with more realistic data
      const mockDetections = [
        { bbox: [120, 180, 340, 420], confidence: 0.94, model: "YOLOv8-Enhanced" },
        { bbox: [380, 220, 580, 480], confidence: 0.89, model: "YOLOv8-Enhanced" },
        { bbox: [620, 120, 820, 380], confidence: 0.91, model: "YOLOv8-Enhanced" },
        { bbox: [50, 300, 250, 550], confidence: 0.87, model: "YOLOv8-Enhanced" },
      ]

      return {
        total_cows: mockDetections.length,
        detections: mockDetections,
        method: method === "enhanced" ? "Enhanced Detection" : "Ultra Precision",
        analysis_complete: true,
        message: `Successfully detected ${mockDetections.length} cows using ${method} detection method with high confidence`,
        image_path: filename,
        processing_time: "2.3s",
        model_version: "v2.1.0",
      }
    },
  },
}

export default function MainApp() {
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [detectionResults, setDetectionResults] = useState(null)
  const [selectedDetectionMethod, setSelectedDetectionMethod] = useState("enhanced")
  const [uploadedFile, setUploadedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedDetections, setSelectedDetections] = useState(new Set())
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 })
  const [imageDisplayDimensions, setImageDisplayDimensions] = useState({ width: 0, height: 0 })
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleFileUpload = async (file, detectionMethod = "enhanced") => {
    if (!file) return

    setUploadLoading(true)
    setUploadStatus(null)
    setDetectionResults(null)

    try {
      const filename = file.name || `upload_${Date.now()}.jpg`
      console.log(`Uploading file: ${filename} with detection method: ${detectionMethod}`)

      const result = await api.cowDetection.detectFromFile(file, filename, detectionMethod)

      if (result.error) {
        setUploadStatus({
          type: "error",
          message: `Detection failed: ${result.error}`,
        })
      } else {
        setUploadStatus({
          type: "success",
          message: `Analysis complete! Found ${result.total_cows} cow(s) in ${result.processing_time || "2.3s"}`,
        })
        setDetectionResults(result)
        const imageUrl = URL.createObjectURL(file)
        setImagePreview(imageUrl)
        if (result.detections) {
          setSelectedDetections(new Set(result.detections.map((_, index) => index)))
        }
      }
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: `Detection failed: ${error.message}`,
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setUploadStatus({
          type: "error",
          message: "File size must be less than 50MB. Please choose a smaller image.",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadStatus({
          type: "error",
          message: "Please select a valid image file (JPG, JPEG, or PNG).",
        })
        return
      }

      setUploadedFile(file)
      const imageUrl = URL.createObjectURL(file)
      setImagePreview(imageUrl)
      handleFileUpload(file, selectedDetectionMethod)
    }
  }

  const handleDetectionMethodChange = (method) => {
    setSelectedDetectionMethod(method)
    if (uploadedFile && !uploadLoading) {
      handleFileUpload(uploadedFile, method)
    }
  }

  const toggleDetectionSelection = (detectionIndex) => {
    setSelectedDetections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(detectionIndex)) {
        newSet.delete(detectionIndex)
      } else {
        newSet.add(detectionIndex)
      }
      return newSet
    })
  }

  const selectAllDetections = () => {
    if (detectionResults?.detections) {
      setSelectedDetections(new Set(detectionResults.detections.map((_, index) => index)))
    }
  }

  const deselectAllDetections = () => {
    setSelectedDetections(new Set())
  }

  const resetAnalysis = () => {
    setUploadedFile(null)
    setImagePreview(null)
    setDetectionResults(null)
    setUploadStatus(null)
    setSelectedDetections(new Set())
    // Reset file input
    const fileInput = document.getElementById("file-upload")
    if (fileInput) fileInput.value = ""
  }

  const handleImageLoad = (event) => {
    const img = event.target
    setImageNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })
    setImageDisplayDimensions({
      width: img.clientWidth,
      height: img.clientHeight,
    })
  }

  const getScaledBoundingBox = (bbox) => {
    if (!imageNaturalDimensions.width || !imageDisplayDimensions.width) return bbox

    const scaleX = imageDisplayDimensions.width / imageNaturalDimensions.width
    const scaleY = imageDisplayDimensions.height / imageNaturalDimensions.height

    return [bbox[0] * scaleX, bbox[1] * scaleY, bbox[2] * scaleX, bbox[3] * scaleY]
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "text-cow-confirmed border-cow-confirmed bg-cow-confirmed/10"
    if (confidence >= 0.8) return "text-cow-pending border-cow-pending bg-cow-pending/10"
    return "text-cow-rejected border-cow-rejected bg-cow-rejected/10"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Enhanced Header with better spacing */}
      <header className="bg-card/90 backdrop-blur-sm border-b-2 border-border shadow-comfortable sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-6xl p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 shadow-comfortable">
                🐄
              </div>
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">MooTrack</h1>
                <p className="text-xl text-muted-foreground font-semibold">Professional Cow Detection System</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 px-6 py-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <div className="h-4 w-4 rounded-full animate-gentle-pulse bg-emerald-500"></div>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">System Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with enhanced spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-12">
          {/* Left Column - Upload Section */}
          <div className="w-full xl:w-1/2 space-y-10 flex-shrink-0">
            <div className="text-center xl:text-left">
              <h2 className="text-4xl font-bold text-foreground mb-4">Upload Your Image</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Select a clear image of cows for our advanced AI to analyze and count automatically
              </p>
            </div>

            <Card className="shadow-comfortable border-comfortable">
              <CardContent className="p-10">
                <div className="space-y-8">
                  {/* Enhanced Upload Area */}
                  <div
                    className={cn(
                      "border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
                      uploadLoading
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border hover:border-primary/60 hover:bg-primary/5 hover:shadow-md cursor-pointer",
                    )}
                    onClick={() => !uploadLoading && document.getElementById("file-upload")?.click()}
                  >
                    <div className="space-y-8">
                      <div className="text-7xl opacity-70">{uploadLoading ? "⏳" : "📁"}</div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {uploadLoading ? "Processing Your Image..." : "Choose Image File"}
                        </h3>
                        <p className="text-lg text-muted-foreground">JPG, JPEG, or PNG files • Maximum 50MB</p>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          size="lg"
                          disabled={uploadLoading}
                          className="min-w-48 h-14 text-lg font-bold"
                          onClick={(e) => {
                            e.stopPropagation()
                            document.getElementById("file-upload")?.click()
                          }}
                        >
                          {uploadLoading ? (
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-comfortable-spin"></div>
                              Analyzing...
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Upload className="w-6 h-6" />
                              Select File
                            </div>
                          )}
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={uploadLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detection Method Selection - Enhanced */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-foreground">Detection Method:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button
                        onClick={() => handleDetectionMethodChange("enhanced")}
                        disabled={uploadLoading}
                        className={cn(
                          "p-6 rounded-xl border-2 transition-all duration-200 text-left",
                          selectedDetectionMethod === "enhanced"
                            ? "bg-primary text-primary-foreground border-primary shadow-comfortable"
                            : "border-border hover:border-primary/50 hover:bg-primary/5",
                          uploadLoading && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-3xl">✨</span>
                          <span className="text-xl font-bold">Enhanced</span>
                        </div>
                        <p className="text-base opacity-90">Standard detection with high accuracy for most images</p>
                      </button>
                      <button
                        onClick={() => handleDetectionMethodChange("ultra")}
                        disabled={uploadLoading}
                        className={cn(
                          "p-6 rounded-xl border-2 transition-all duration-200 text-left",
                          selectedDetectionMethod === "ultra"
                            ? "bg-primary text-primary-foreground border-primary shadow-comfortable"
                            : "border-border hover:border-primary/50 hover:bg-primary/5",
                          uploadLoading && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-3xl">🎯</span>
                          <span className="text-xl font-bold">Ultra</span>
                        </div>
                        <p className="text-base opacity-90">Maximum precision for complex or crowded images</p>
                      </button>
                    </div>
                  </div>

                  {/* Status Alert */}
                  {uploadStatus && (
                    <Alert
                      className={cn(
                        "border-2",
                        uploadStatus.type === "success"
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
                      )}
                    >
                      {uploadStatus.type === "success" ? (
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      )}
                      <AlertDescription className="text-lg font-semibold">{uploadStatus.message}</AlertDescription>
                    </Alert>
                  )}

                  {/* Reset Button */}
                  {(imagePreview || detectionResults) && !uploadLoading && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={resetAnalysis}
                        className="flex items-center gap-2 text-base bg-transparent"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Start New Analysis
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Preview with Enhanced Controls */}
            {imagePreview && (
              <Card className="shadow-comfortable border-comfortable">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <Camera className="w-6 h-6" />
                      Image Preview
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      {uploadedFile && (
                        <Badge variant="secondary" className="text-base px-4 py-2">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      )}
                      {detectionResults && (
                        <Button
                          variant="outline"
                          onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                          className="flex items-center gap-2 text-base"
                        >
                          {showBoundingBoxes ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          {showBoundingBoxes ? "Hide" : "Show"} Detection Boxes
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Uploaded preview"
                      className="w-full h-auto max-h-[600px] object-contain rounded-xl border-2 border-border shadow-md"
                      onLoad={handleImageLoad}
                    />

                    {/* Enhanced Bounding Boxes */}
                    {detectionResults?.detections && showBoundingBoxes && (
                      <div className="absolute inset-0">
                        {detectionResults.detections.map((detection, index) => {
                          const [x1, y1, x2, y2] = getScaledBoundingBox(detection.bbox)
                          const isSelected = selectedDetections.has(index)
                          const confidenceColorClass = getConfidenceColor(detection.confidence)

                          return (
                            <div
                              key={index}
                              className={cn(
                                "absolute border-3 cursor-pointer transition-all duration-200 rounded-lg",
                                isSelected
                                  ? "border-primary bg-primary/15 shadow-lg"
                                  : "border-yellow-400 bg-yellow-400/10 hover:border-primary/70",
                              )}
                              style={{
                                left: `${x1}px`,
                                top: `${y1}px`,
                                width: `${x2 - x1}px`,
                                height: `${y2 - y1}px`,
                              }}
                              onClick={() => toggleDetectionSelection(index)}
                              title={`Cow #${index + 1} - ${(detection.confidence * 100).toFixed(1)}% confidence`}
                            >
                              {/* Enhanced Label with Confidence */}
                              <div
                                className={cn(
                                  "absolute -top-10 left-0 px-3 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2",
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-yellow-400 text-yellow-900",
                                )}
                              >
                                <span>Cow #{index + 1}</span>
                                <Badge variant="secondary" size="sm" className={cn("text-xs", confidenceColorClass)}>
                                  {(detection.confidence * 100).toFixed(1)}%
                                </Badge>
                              </div>

                              {/* Selection Indicator */}
                              <div
                                className={cn(
                                  "absolute top-2 right-2 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md",
                                  isSelected ? "bg-primary border-primary-foreground" : "bg-white border-yellow-400",
                                )}
                              >
                                {isSelected && <div className="w-4 h-4 rounded-full bg-primary-foreground"></div>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {uploadLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-6 text-white">
                          <div className="w-16 h-16 border-3 border-white/30 border-t-white rounded-full animate-comfortable-spin"></div>
                          <div className="text-center">
                            <span className="text-2xl font-bold block">Analyzing Image...</span>
                            <span className="text-lg opacity-80">This may take a few moments</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {uploadedFile && (
                    <p className="text-base text-muted-foreground text-center mt-6 font-semibold">
                      {uploadedFile.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results Section */}
          <div className="w-full xl:w-1/2 space-y-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-bold text-foreground">Detection Results</h2>
              {detectionResults && (
                <Badge variant="default" className="px-6 py-3 text-lg font-bold">
                  <span className="mr-3 text-xl">🐄</span>
                  {detectionResults.total_cows} cow(s) detected
                </Badge>
              )}
            </div>

            {detectionResults ? (
              <div className="space-y-8">
                {/* Enhanced Summary Card */}
                <Card className="shadow-comfortable border-comfortable bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-10">
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-bold flex items-center gap-4">
                          <span className="text-4xl">✅</span>
                          Analysis Complete
                        </h3>
                        <Badge variant="default" className="text-xl px-6 py-3 font-bold">
                          {detectionResults.total_cows} Total
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="text-center p-8 bg-white/50 dark:bg-black/20 rounded-xl border-2 border-primary/20 shadow-md">
                          <div className="text-4xl font-bold text-primary mb-3">{selectedDetections.size}</div>
                          <div className="text-lg font-bold text-muted-foreground">Selected Cows</div>
                        </div>
                        <div className="text-center p-8 bg-white/50 dark:bg-black/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
                          <div className="text-3xl font-bold text-emerald-600 mb-3">
                            {detectionResults.method || "Enhanced"}
                          </div>
                          <div className="text-lg font-bold text-muted-foreground">Detection Method</div>
                        </div>
                      </div>

                      {detectionResults.message && (
                        <div className="p-6 bg-white/30 dark:bg-black/20 rounded-xl border-2 border-border">
                          <p className="text-lg text-muted-foreground font-semibold text-center">
                            {detectionResults.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Detection List */}
                {detectionResults.detections && detectionResults.detections.length > 0 && (
                  <Card className="shadow-comfortable border-comfortable">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl flex items-center gap-3">
                          <span className="text-2xl">📋</span>
                          Individual Detections
                        </CardTitle>
                        <div className="flex gap-4">
                          <Button
                            variant="outline"
                            onClick={selectAllDetections}
                            disabled={selectedDetections.size === detectionResults.detections.length}
                            className="font-bold text-base bg-transparent"
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            onClick={deselectAllDetections}
                            disabled={selectedDetections.size === 0}
                            className="font-bold text-base bg-transparent"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6 max-h-[500px] overflow-y-auto">
                        {detectionResults.detections.map((detection, index) => {
                          const isSelected = selectedDetections.has(index)
                          const confidenceColorClass = getConfidenceColor(detection.confidence)
                          return (
                            <div
                              key={index}
                              className={cn(
                                "p-6 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                isSelected
                                  ? "bg-primary/10 border-primary shadow-md"
                                  : "bg-muted/30 border-border hover:border-primary/50 hover:shadow-sm",
                              )}
                              onClick={() => toggleDetectionSelection(index)}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={cn(
                                      "w-7 h-7 rounded-full border-2 flex items-center justify-center",
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : "bg-background border-muted-foreground",
                                    )}
                                  >
                                    {isSelected && <div className="w-4 h-4 rounded-full bg-primary-foreground"></div>}
                                  </div>
                                  <span className="font-bold text-xl">Cow #{index + 1}</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn("text-base font-bold px-4 py-2", confidenceColorClass)}
                                >
                                  {(detection.confidence * 100).toFixed(1)}% confidence
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-6 text-base text-muted-foreground">
                                <div className="space-y-2">
                                  <span className="font-bold text-foreground">Position:</span>
                                  <br />
                                  <span className="font-mono text-lg">
                                    ({Math.round(detection.bbox[0])}, {Math.round(detection.bbox[1])})
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <span className="font-bold text-foreground">Size:</span>
                                  <br />
                                  <span className="font-mono text-lg">
                                    {Math.round(detection.bbox[2] - detection.bbox[0])} ×{" "}
                                    {Math.round(detection.bbox[3] - detection.bbox[1])} px
                                  </span>
                                </div>
                              </div>
                              {detection.model && (
                                <div className="mt-4 text-base text-muted-foreground">
                                  <span className="font-bold text-foreground">Model:</span> {detection.model}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Processing Information */}
                <Card className="shadow-comfortable border-comfortable">
                  <CardHeader>
                    <CardTitle className="text-2xl">Processing Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-5 bg-muted/30 rounded-lg">
                        <span className="font-bold text-lg">Total Detections</span>
                        <Badge variant="secondary" className="text-base font-bold px-4 py-2">
                          {detectionResults.total_cows}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-muted/30 rounded-lg">
                        <span className="font-bold text-lg">Selected Count</span>
                        <Badge variant="default" className="text-base font-bold px-4 py-2">
                          {selectedDetections.size}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-muted/30 rounded-lg">
                        <span className="font-bold text-lg">Detection Method</span>
                        <Badge variant="secondary" className="text-base font-bold px-4 py-2">
                          {detectionResults.method || "Enhanced"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-muted/30 rounded-lg">
                        <span className="font-bold text-lg">Processing Time</span>
                        <Badge variant="outline" className="text-base font-bold px-4 py-2">
                          {detectionResults.processing_time || "2.3s"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-muted/30 rounded-lg">
                        <span className="font-bold text-lg">Model Version</span>
                        <Badge variant="outline" className="text-base font-bold px-4 py-2">
                          {detectionResults.model_version || "v2.1.0"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="shadow-comfortable border-comfortable border-dashed">
                <CardContent className="p-16 text-center">
                  <div className="space-y-8">
                    <div className="text-8xl opacity-40">📊</div>
                    <h3 className="text-3xl font-bold text-foreground">Ready for Analysis</h3>
                    <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Upload an image to see detailed cow detection results here. Our advanced AI will analyze your
                      image and provide comprehensive information about each detected cow.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
