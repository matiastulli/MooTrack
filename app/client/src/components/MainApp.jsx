"use client"

import { AlertCircle, Camera, CheckCircle, Eye, EyeOff, Moon, RotateCcw, Sun, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { cn, getConfidenceColor } from "../lib/utils"
import { Alert, AlertDescription } from "./ui/Alert"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"

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
  const [theme, setTheme] = useState(() => 
    typeof window !== "undefined" ? window.localStorage.getItem("theme") || "light" : "light"
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light")
  }

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
  const [isUploadCollapsed, setIsUploadCollapsed] = useState(false)
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(false)
  const [isDetectionsCollapsed, setIsDetectionsCollapsed] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
        setIsUploadCollapsed(true)
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
    setIsUploadCollapsed(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Enhanced Header with better spacing */}
      <header className="bg-card/90 backdrop-blur-sm border-b-2 border-border shadow-comfortable sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl p-2 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 shadow-comfortable">
                🐄
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">MooTrack</h1>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "w-9 h-9 p-0 rounded-full",
                "border-2 border-border bg-background hover:bg-muted",
                "transition-all duration-300"
              )}
            >
              {theme === "light" ? (
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              ) : (
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Image-Centered Layout */}
      <main className="max-w-full mx-auto px-4 py-3">
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Controls Column */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-12" : "w-80",
            "relative flex-shrink-0"
          )}>
            {/* Collapse Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={cn(
                "absolute -right-3 top-1/2 z-50 h-24 w-6 py-2 px-0 border shadow-md flex flex-col items-center justify-center gap-1",
                "bg-card hover:bg-muted transition-colors",
                "rounded-full"
              )}
            >
              <div className={cn(
                "w-4 h-4 transition-transform duration-300",
                isSidebarCollapsed ? "rotate-180" : ""
              )}>
                ◀
              </div>
            </Button>
            
            <div className={cn(
              "space-y-4 overflow-y-auto no-scrollbar h-full transition-all duration-300",
              isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
            )}>
            {/* Upload Section */}
            <Card className="shadow-comfortable border-comfortable">
              <CardHeader 
                className={cn("pb-3 cursor-pointer select-none", imagePreview && "hover:bg-muted/50")}
                onClick={() => imagePreview && setIsUploadCollapsed(!isUploadCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </CardTitle>
                  {imagePreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUploadCollapsed(!isUploadCollapsed)
                      }}
                    >
                      <div className={cn("transition-transform", isUploadCollapsed ? "rotate-180" : "")}>⌃</div>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className={cn(
                "space-y-4 transition-all duration-300",
                isUploadCollapsed && "hidden"
              )}>
                {/* Compact Upload Area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer",
                    uploadLoading
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/60 hover:bg-primary/5",
                  )}
                  onClick={() => !uploadLoading && document.getElementById("file-upload")?.click()}
                >
                  <div className="space-y-3">
                    <div className="text-3xl opacity-70">{uploadLoading ? "⏳" : "📁"}</div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">
                        {uploadLoading ? "Processing..." : "Choose File"}
                      </h4>
                      <p className="text-sm text-muted-foreground">JPG, JPEG, PNG • Max 50MB</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={uploadLoading}
                      className="w-full text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        document.getElementById("file-upload")?.click()
                      }}
                    >
                      {uploadLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                          Analyzing...
                        </div>
                      ) : (
                        "Select File"
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

                {/* Detection Method Selection */}
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground text-sm">Detection Method:</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDetectionMethodChange("enhanced")}
                      disabled={uploadLoading}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm",
                        selectedDetectionMethod === "enhanced"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-primary/5 bg-card text-foreground/90",
                        uploadLoading && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">✨</span>
                        <span className="font-bold">Enhanced</span>
                      </div>
                      <p className="text-xs text-muted-foreground">High accuracy detection</p>
                    </button>
                    <button
                      onClick={() => handleDetectionMethodChange("ultra")}
                      disabled={uploadLoading}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm",
                        selectedDetectionMethod === "ultra"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-primary/5 bg-card text-foreground/90",
                        uploadLoading && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🎯</span>
                        <span className="font-bold">Ultra</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Maximum precision</p>
                    </button>
                  </div>
                </div>

                {/* Status Alert */}
                {uploadStatus && (
                  <Alert
                    className={cn(
                      "border-2 text-sm",
                      uploadStatus.type === "success"
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                        : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
                    )}
                  >
                    {uploadStatus.type === "success" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className="text-sm font-medium">{uploadStatus.message}</AlertDescription>
                  </Alert>
                )}

                {/* Reset Button */}
                {(imagePreview || detectionResults) && !uploadLoading && (
                  <Button
                    variant="outline"
                    onClick={resetAnalysis}
                    className="w-full flex items-center gap-2 text-sm bg-transparent text-foreground/90 hover:text-foreground"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Analysis
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results Summary */}
            {detectionResults && (
              <Card className="shadow-comfortable border-comfortable">
                <CardHeader 
                  className={cn("pb-3 cursor-pointer select-none hover:bg-muted/50")}
                  onClick={() => setIsResultsCollapsed(!isResultsCollapsed)}
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
                          <div className={cn("transition-transform", isResultsCollapsed ? "rotate-180" : "")}>⌃</div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={cn(
                  "space-y-4 transition-all duration-300",
                  isResultsCollapsed && "hidden"
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Time:</span>
                      <Badge variant="outline" size="sm" className="text-foreground/90 border-border/50">
                        {detectionResults.processing_time}
                      </Badge>
                    </div>
                  </div>

                  {detectionResults && (
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
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detection List */}
            {detectionResults?.detections && detectionResults.detections.length > 0 && (
              <Card className="shadow-comfortable border-comfortable">
                <CardHeader 
                  className={cn("pb-3 cursor-pointer select-none hover:bg-muted/50")}
                  onClick={() => setIsDetectionsCollapsed(!isDetectionsCollapsed)}
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
                          <div className={cn("transition-transform", isDetectionsCollapsed ? "rotate-180" : "")}>⌃</div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={cn(
                  "space-y-4 transition-all duration-300",
                  isDetectionsCollapsed && "hidden"
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
                      const confidenceColorClass = getConfidenceColor(detection.confidence)
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
            )}
            </div>
          </div>

          {/* Right Area - Large Image Display */}
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            isSidebarCollapsed && "ml-2"
          )}>
            {imagePreview ? (
              <Card className="shadow-comfortable border-comfortable h-full flex flex-col">
                <CardHeader className="pb-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Image Analysis
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {uploadedFile && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      )}
                      {detectionResults && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "px-3 py-1 text-sm font-bold",
                            "bg-background text-foreground border-border",
                            "shadow-sm",
                            "transition-colors duration-200"
                          )}
                        >
                          <span className="mr-2">🐄</span>
                          {detectionResults.total_cows} detected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4">
                  <div className="relative flex-1 flex items-center justify-center bg-muted/20 rounded-xl overflow-hidden">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Uploaded preview"
                      className="max-w-full max-h-full object-contain"
                      onLoad={handleImageLoad}
                      style={{ maxHeight: "calc(100vh - 250px)" }}
                    />

                    {/* Enhanced Bounding Boxes */}
                    {detectionResults?.detections && showBoundingBoxes && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="relative"
                          style={{
                            width: `${imageDisplayDimensions.width}px`,
                            height: `${imageDisplayDimensions.height}px`,
                          }}
                        >
                          {detectionResults.detections.map((detection, index) => {
                            const [x1, y1, x2, y2] = getScaledBoundingBox(detection.bbox)
                            const isSelected = selectedDetections.has(index)

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
                                {/* Enhanced Label */}
                                <div
                                  className={cn(
                                    "absolute -top-8 left-0 px-2 py-1 rounded-lg text-sm font-bold shadow-md flex items-center gap-2",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary border border-primary/20",
                                  )}
                                >
                                  <span>#{index + 1}</span>
                                  <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-md">
                                    {(detection.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>

                                {/* Selection Indicator */}
                                <div
                                  className={cn(
                                    "absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-md",
                                    isSelected ? "bg-primary border-primary-foreground" : "bg-white border-yellow-400",
                                  )}
                                >
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {uploadLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-3 border-card/30 border-t-card rounded-full animate-spin"></div>
                          <div className="text-center">
                            <span className="text-xl font-bold block text-card">Analyzing Image...</span>
                            <span className="text-sm text-card/90">Please wait while we detect cows</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-comfortable border-comfortable border-dashed h-full flex items-center justify-center">
                <CardContent className="text-center p-16">
                  <div className="space-y-6">
                    <div className="text-8xl opacity-40">🖼️</div>
                    <h3 className="text-3xl font-bold text-foreground">Image Preview</h3>
                    <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Upload an image to see it displayed here in full size. You'll be able to clearly identify each
                      detected cow with visual indicators.
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
