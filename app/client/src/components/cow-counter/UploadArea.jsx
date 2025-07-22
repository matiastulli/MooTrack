import { AlertCircle, CheckCircle, RotateCcw, Upload } from "lucide-react"
import { cn } from "../../lib/utils"
import { Alert, AlertDescription } from "../ui/Alert"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"

export function UploadArea({
  isCollapsed,
  setIsCollapsed,
  uploadLoading,
  imagePreview,
  handleFileChange,
  selectedDetectionMethod,
  handleDetectionMethodChange,
  uploadStatus,
  detectionResults,
  resetAnalysis,
}) {
  return (
    <Card className="shadow-comfortable border-comfortable">
      <CardHeader 
        className={cn("pb-3 cursor-pointer select-none", imagePreview && "hover:bg-muted/50")}
        onClick={() => imagePreview && setIsCollapsed(!isCollapsed)}
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
                setIsCollapsed(!isCollapsed)
              }}
            >
              <div className={cn("transition-transform", isCollapsed ? "rotate-180" : "")}>⌃</div>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(
        "space-y-4 transition-all duration-300",
        isCollapsed && "hidden"
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
  )
}
