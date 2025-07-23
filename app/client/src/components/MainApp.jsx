"use client"

import { compressImage } from "@/lib/imageUtils"
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
  const [confidenceFilter, setConfidenceFilter] = useState(20) // Default to 20%
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

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (file, detectionMethod = "enhanced") => {
    if (!file) return

    setUploadLoading(true)
    setUploadStatus(null)
    setDetectionResults(null)

    try {
      const filename = file.name || `upload_${Date.now()}.jpg`
      console.log(`Uploading file: ${filename} with detection method: ${detectionMethod}`)

      // Convert file to Base64
      const base64File = await convertFileToBase64(file);

      // Send the file using direct POST request
      const response = await api.post("/cow-counter/detect", {
        file_content: base64File,
        file_name: filename,
        detection_method: detectionMethod
      });

      if (response.error) {
        setUploadStatus({
          type: "error",
          message: `Detection failed: ${response.error}`,
        })
      } else {
        setUploadStatus({
          type: "success",
          message: `Analysis complete! Found ${response.total_cows} cow(s)`,
        })
        setDetectionResults(response)
        const imageUrl = URL.createObjectURL(file)
        setImagePreview(imageUrl)
        setIsUploadCollapsed(true)
        if (response.detections) {
          setSelectedDetections(new Set(response.detections.map((_, index) => index)))
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

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadStatus({
          type: "error",
          message: "Please select a valid image file (JPG, JPEG, or PNG).",
        })
        return;
      }

      try {
        // Compress image if it's larger than 5MB
        let processedFile = file;
        if (file.size > 5 * 1024 * 1024) {
          processedFile = await compressImage(file);
        }

        // Validate final file size (10MB limit)
        if (processedFile.size > 10 * 1024 * 1024) {
          setUploadStatus({
            type: "error",
            message: "File size must be less than 10MB. Please choose a smaller image.",
          })
          return;
        }

        setUploadedFile(processedFile)
        const imageUrl = URL.createObjectURL(processedFile)
        setImagePreview(imageUrl)
        handleFileUpload(processedFile, selectedDetectionMethod)
      } catch (error) {
        setUploadStatus({
          type: "error",
          message: "Error processing image. Please try again.",
        })
        console.error('Error processing image:', error)
      }
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
      const filteredIndices = detectionResults.detections
        .map((detection, index) => ({ detection, index }))
        .filter(({ detection }) => detection.confidence >= confidenceFilter / 100)
        .map(({ index }) => index)
      setSelectedDetections(new Set(filteredIndices))
    }
  }

  const selectAllOriginalDetections = () => {
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
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
              ) : (
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Image-Centered Layout */}
      <main className="max-w-full mx-auto px-4 py-3">
        <div className={cn(
          "flex gap-4 h-[calc(100vh-140px)]",
          "relative"
        )}>
          {/* Left Sidebar - Controls Column */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            "absolute md:relative",
            "z-40 h-full bg-background/95 backdrop-blur-sm",
            isSidebarCollapsed ? 
              "-translate-x-full md:translate-x-0 md:w-12" : 
              "translate-x-0 w-[85vw] md:w-80",
            "border-r border-border"
          )}>
            {/* Collapse Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={cn(
                "absolute -right-12 md:-right-3 top-1/2 z-50 h-24 w-6 py-2 px-0 border shadow-md flex flex-col items-center justify-center gap-1",
                "bg-card hover:bg-muted transition-colors",
                "rounded-r-full md:rounded-full"
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
              "p-4", // Add padding for better mobile spacing
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
              confidenceFilter={confidenceFilter}
              setConfidenceFilter={setConfidenceFilter}
            />
            </div>
          </div>

          {/* Right Area - Large Image Display */}
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            "w-full", // Ensure full width
            isSidebarCollapsed ? "md:ml-2" : "md:ml-0" // Adjust margin only on desktop
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
              confidenceFilter={confidenceFilter}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
