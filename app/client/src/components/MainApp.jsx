"use client"

import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { DetectionList } from "./cow-counter/DetectionList"
import { ImagePreview } from "./cow-counter/ImagePreview"
import { ResultsSummary } from "./cow-counter/ResultsSummary"
import { UploadArea } from "./cow-counter/UploadArea"
import { Button } from "./ui/Button"

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
            <UploadArea
              isCollapsed={isUploadCollapsed}
              setIsCollapsed={setIsUploadCollapsed}
              uploadLoading={uploadLoading}
              imagePreview={imagePreview}
              handleFileChange={handleFileChange}
              selectedDetectionMethod={selectedDetectionMethod}
              handleDetectionMethodChange={handleDetectionMethodChange}
              uploadStatus={uploadStatus}
              detectionResults={detectionResults}
              resetAnalysis={resetAnalysis}
            />

            {/* Results Summary */}
            <ResultsSummary
              isCollapsed={isResultsCollapsed}
              setIsCollapsed={setIsResultsCollapsed}
              detectionResults={detectionResults}
              selectedDetections={selectedDetections}
              showBoundingBoxes={showBoundingBoxes}
              setShowBoundingBoxes={setShowBoundingBoxes}
            />

            {/* Detection List */}
            <DetectionList
              isCollapsed={isDetectionsCollapsed}
              setIsCollapsed={setIsDetectionsCollapsed}
              detectionResults={detectionResults}
              selectedDetections={selectedDetections}
              toggleDetectionSelection={toggleDetectionSelection}
              selectAllDetections={selectAllDetections}
              deselectAllDetections={deselectAllDetections}
            />
            </div>
          </div>

          {/* Right Area - Large Image Display */}
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            isSidebarCollapsed && "ml-2"
          )}>
            <ImagePreview
              imagePreview={imagePreview}
              uploadedFile={uploadedFile}
              detectionResults={detectionResults}
              uploadLoading={uploadLoading}
              showBoundingBoxes={showBoundingBoxes}
              selectedDetections={selectedDetections}
              imageDisplayDimensions={imageDisplayDimensions}
              handleImageLoad={handleImageLoad}
              toggleDetectionSelection={toggleDetectionSelection}
              getScaledBoundingBox={getScaledBoundingBox}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
