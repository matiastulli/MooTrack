"use client"

import { compressImage } from "@/lib/imageUtils"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { BarChart3, Moon, Sun, Upload } from "lucide-react"
import { useEffect, useState } from "react"
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
  const [isManualDetectionMode, setIsManualDetectionMode] = useState(false)
  const [manualDetections, setManualDetections] = useState([])
  const [drawingBox, setDrawingBox] = useState(null)
  const [activeTab, setActiveTab] = useState("upload_image")

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Auto-deselect detections that don't meet the confidence filter
  useEffect(() => {
    if (detectionResults?.detections && selectedDetections.size > 0) {
      const validSelections = new Set()
      selectedDetections.forEach(index => {
        const detection = detectionResults.detections[index]
        if (detection && detection.confidence >= confidenceFilter / 100) {
          validSelections.add(index)
        }
      })
      
      // Only update if there are changes to avoid infinite loops
      if (validSelections.size !== selectedDetections.size) {
        setSelectedDetections(validSelections)
      }
    }
  }, [confidenceFilter, detectionResults?.detections, selectedDetections])

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

  const deselectAllDetections = () => {
    setSelectedDetections(new Set())
  }

  const resetAnalysis = () => {
    setUploadedFile(null)
    setImagePreview(null)
    setDetectionResults(null)
    setUploadStatus(null)
    setSelectedDetections(new Set())
    setManualDetections([])
    setIsManualDetectionMode(false)
    // Reset file input
    const fileInput = document.getElementById("file-upload")
    if (fileInput) fileInput.value = ""
  }

  const handleImageLoad = (event) => {
    const img = event.target
    const naturalDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
    const displayDimensions = {
      width: img.clientWidth,
      height: img.clientHeight,
    }
    
    setImageNaturalDimensions(naturalDimensions)
    setImageDisplayDimensions(displayDimensions)
    
    console.log('Image dimensions:', {
      natural: naturalDimensions,
      display: displayDimensions,
      scaleX: displayDimensions.width / naturalDimensions.width,
      scaleY: displayDimensions.height / naturalDimensions.height
    })
    
    // Store natural dimensions globally for debugging
    window.imageNaturalDimensions = naturalDimensions
  }

  const getScaledBoundingBox = (bbox) => {
    if (!imageNaturalDimensions.width || !imageDisplayDimensions.width) return bbox

    const scaleX = imageDisplayDimensions.width / imageNaturalDimensions.width
    const scaleY = imageDisplayDimensions.height / imageNaturalDimensions.height

    return [bbox[0] * scaleX, bbox[1] * scaleY, bbox[2] * scaleX, bbox[3] * scaleY]
  }

  // Manual detection functions
  const handleImageMouseDown = (e) => {
    if (!isManualDetectionMode || !imagePreview) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setDrawingBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y
    })
  }
  
  const handleImageMouseMove = (e) => {
    if (!drawingBox || !isManualDetectionMode) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setDrawingBox({
      ...drawingBox,
      endX: x,
      endY: y
    })
  }
  
  const handleImageMouseUp = () => {
    console.log('handleImageMouseUp called, drawingBox:', drawingBox, 'isManualDetectionMode:', isManualDetectionMode)
    
    if (!drawingBox || !isManualDetectionMode) {
      setDrawingBox(null) // Clear any incomplete drawing
      return
    }
    
    // Only save boxes with some minimum size
    const width = Math.abs(drawingBox.endX - drawingBox.startX)
    const height = Math.abs(drawingBox.endY - drawingBox.startY)
    
    console.log('Box dimensions:', { width, height })
    
    if (width > 20 && height > 20) {
      // Convert to [x1, y1, x2, y2] format
      const x1 = Math.min(drawingBox.startX, drawingBox.endX)
      const y1 = Math.min(drawingBox.startY, drawingBox.endY)
      const x2 = Math.max(drawingBox.startX, drawingBox.endX)
      const y2 = Math.max(drawingBox.startY, drawingBox.endY)
      
      // Convert display coordinates to natural image coordinates
      const scaleX = imageNaturalDimensions.width / imageDisplayDimensions.width
      const scaleY = imageNaturalDimensions.height / imageDisplayDimensions.height
      
      const naturalBox = [
        x1 * scaleX,
        y1 * scaleY,
        x2 * scaleX,
        y2 * scaleY
      ]
      
      console.log('Adding manual detection:', naturalBox)
      
      // Add the new manual detection
      setManualDetections([...manualDetections, {
        bbox: naturalBox,
        confidence: 1.0,
        class: "cow",
        manual: true
      }])
    } else {
      console.log('Box too small, not saving')
    }
    
    setDrawingBox(null)
  }

  const toggleManualDetectionMode = () => {
    setIsManualDetectionMode(!isManualDetectionMode)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Enhanced Header with better spacing */}
      <header className="bg-card/90 backdrop-blur-sm shadow-comfortable sticky top-0 z-50 flex-shrink-0">
        <div className="px-6 py-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <div className="text-lg p-1 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 shadow-comfortable">
                🐄
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary leading-6">MooTrack</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "w-8 h-8 p-0 rounded-full",
                "bg-background hover:bg-muted",
                "transition-all duration-300"
              )}
            >
              {theme === "light" ? (
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
              ) : (
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        <div className="w-full h-full flex">
          {/* Column 1: Navigation Icons (Narrow) */}
          <div className="w-12 bg-card/50 border-r border-border/50 flex flex-col items-center py-3 space-y-3 flex-shrink-0">
            {[
              { id: "upload_image", icon: Upload, label: "Upload Image" },
              { id: "summary", icon: BarChart3, label: "Results Summary" }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "upload_image") setUploadStatus(null);
                  }}
                  className={cn(
                    "w-8 h-8 p-0 transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  )}
                  title={tab.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>

          {/* Column 2: Options Panel (Medium) */}
          <div className="w-72 bg-background border-r border-border/50 flex-shrink-0">
            <div className="h-full flex flex-col">
              {/* Tab Content */}
              <div className="px-3 py-3 flex-1 overflow-y-auto">
                {activeTab === "upload_image" && (
                  <UploadArea
                    uploadLoading={uploadLoading}
                    imagePreview={imagePreview}
                    handleFileChange={handleFileChange}
                    selectedDetectionMethod={selectedDetectionMethod}
                    handleDetectionMethodChange={handleDetectionMethodChange}
                    uploadStatus={uploadStatus}
                    detectionResults={detectionResults}
                    resetAnalysis={resetAnalysis}
                    goToResultsTab={() => setActiveTab("summary")}
                  />
                )}

                {activeTab === "summary" && (
                  <ResultsSummary
                    detectionResults={detectionResults}
                    selectedDetections={selectedDetections}
                    showBoundingBoxes={showBoundingBoxes}
                    setShowBoundingBoxes={setShowBoundingBoxes}
                    confidenceFilter={confidenceFilter}
                    setConfidenceFilter={setConfidenceFilter}
                    toggleDetectionSelection={toggleDetectionSelection}
                    selectAllDetections={selectAllDetections}
                    deselectAllDetections={deselectAllDetections}
                    isManualDetectionMode={isManualDetectionMode}
                    toggleManualDetectionMode={toggleManualDetectionMode}
                    manualDetections={manualDetections}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Main Image Display Area (Wide) */}
          <div className="flex-1 flex items-center justify-center bg-secondary/10 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center p-2">
              <div className="max-w-full max-h-full flex items-center justify-center">
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
                  isManualDetectionMode={isManualDetectionMode}
                  handleImageMouseDown={handleImageMouseDown}
                  handleImageMouseMove={handleImageMouseMove}
                  handleImageMouseUp={handleImageMouseUp}
                  drawingBox={drawingBox}
                  manualDetections={manualDetections}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
