"use client"

import { useState } from 'react'
import { cn } from '../lib/utils'
import { api } from '../services/api'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

export default function MainApp() {
    const [activeTab, setActiveTab] = useState('upload')
    const [uploadStatus, setUploadStatus] = useState(null)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [detectionResults, setDetectionResults] = useState(null)
    const [selectedDetectionMethod, setSelectedDetectionMethod] = useState('enhanced')
    const [uploadedFile, setUploadedFile] = useState(null)

    const tabs = [
        { id: 'upload', label: 'Upload & Detect', icon: '📤' },
        { id: 'results', label: 'Detection Results', icon: '📊' }
    ]

    const handleFileUpload = async (file, detectionMethod = 'enhanced') => {
        if (!file) return

        setUploadLoading(true)
        setUploadStatus(null)

        try {
            // Generate a filename if the file doesn't have one
            const filename = file.name || `upload_${Date.now()}.jpg`

            console.log(`file: ${file}`)
            console.log(`Uploading file: ${filename} with detection method: ${detectionMethod}`)
            
            // Use the new cow detection API
            const result = await api.cowDetection.detectFromFile(file, filename, detectionMethod)

            if (result.error) {
                setUploadStatus({
                    type: 'error',
                    message: `Detection failed: ${result.error}`
                })
            } else {
                setUploadStatus({
                    type: 'success',
                    message: `Detection completed! Found ${result.total_cows} cow(s) using ${result.method} method`
                })
                setDetectionResults(result)
                // Switch to results tab after successful detection
                setActiveTab('results')
            }
        } catch (error) {
            setUploadStatus({
                type: 'error',
                message: `Detection failed: ${error.message}`
            })
        } finally {
            setUploadLoading(false)
        }
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            setUploadedFile(file)
            handleFileUpload(file, selectedDetectionMethod)
        }
    }

    const handleDetectionMethodChange = (method) => {
        setSelectedDetectionMethod(method)
        // If we have a file, re-run detection with the new method
        if (uploadedFile && !uploadLoading) {
            handleFileUpload(uploadedFile, method)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl p-3 rounded-xl bg-primary/10 border border-primary/20">
                                🐄
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-primary">
                                    MooTrack
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Intelligent Cow Detection System
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full animate-pulse bg-cow-confirmed"></div>
                            <span className="text-sm font-medium text-foreground">
                                System Active
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-4 text-sm font-medium rounded-t-lg transition-all duration-200",
                                    activeTab === tab.id
                                        ? 'bg-background text-primary border-b-2 border-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'upload' && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Upload Image for Cow Detection
                            </h2>
                            <p className="text-muted-foreground">
                                Select an image to analyze with our enhanced detection algorithm
                            </p>
                        </div>

                        <Card className="max-w-2xl mx-auto p-8">
                            <div className="space-y-6">
                                {/* File Upload Area */}
                                <div className={cn(
                                    "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                                    uploadLoading 
                                        ? "border-primary bg-primary/5" 
                                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                                )}>
                                    <div className="space-y-4">
                                        <div className="text-6xl opacity-80">📁</div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                                Choose an image file
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                JPG, JPEG, or PNG files up to 50MB
                                            </p>
                                        </div>
                                        
                                        <div className="flex justify-center">
                                            <Button 
                                                variant="default" 
                                                size="lg"
                                                disabled={uploadLoading}
                                                className="min-w-32"
                                                onClick={() => document.getElementById('file-upload').click()}
                                            >
                                                {uploadLoading ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    'Select File'
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

                                {/* Upload Status */}
                                {uploadStatus && (
                                    <div className={cn(
                                        "p-4 rounded-lg border",
                                        uploadStatus.type === 'success' 
                                            ? 'bg-cow-confirmed/10 text-cow-confirmed border-cow-confirmed/20' 
                                            : 'bg-destructive/10 text-destructive border-destructive/20'
                                    )}>
                                        <p className="font-medium">{uploadStatus.message}</p>
                                    </div>
                                )}

                                {/* Current file status */}
                                {uploadedFile && (
                                    <div className="p-4 bg-muted/20 rounded-lg border border-border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    Current File: {uploadedFile.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <Badge variant="secondary">
                                                {selectedDetectionMethod === 'enhanced' ? '✨ Enhanced' : '🎯 Ultra'}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {/* Detection Options */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-foreground">Detection Methods:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <button
                                            onClick={() => handleDetectionMethodChange('enhanced')}
                                            disabled={uploadLoading}
                                            className={cn(
                                                "p-3 rounded-lg border transition-all duration-200",
                                                selectedDetectionMethod === 'enhanced'
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50',
                                                uploadLoading && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            <div className="flex items-center justify-center gap-2 text-sm font-medium">
                                                <span>✨</span>
                                                Enhanced (Recommended)
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleDetectionMethodChange('ultra')}
                                            disabled={uploadLoading}
                                            className={cn(
                                                "p-3 rounded-lg border transition-all duration-200",
                                                selectedDetectionMethod === 'ultra'
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50',
                                                uploadLoading && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            <div className="flex items-center justify-center gap-2 text-sm font-medium">
                                                <span>🎯</span>
                                                Ultra-Aggressive
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-foreground">Detection Results</h2>
                            {detectionResults && (
                                <Badge variant="default" className="px-4 py-2">
                                    <span className="mr-2">🐄</span>
                                    {detectionResults.methods 
                                        ? `${detectionResults.summary?.best_method || 'Comparison'} Results`
                                        : `${detectionResults.total_cows} cow(s) detected`
                                    }
                                </Badge>
                            )}
                        </div>
                        
                        {detectionResults ? (
                            <div className="space-y-6">
                                {/* Check if this is a comparison result or single detection result */}
                                {detectionResults.methods ? (
                                    // Comparison results
                                    <Card className="p-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                                    <span className="text-2xl">⚖️</span>
                                                    Method Comparison Results
                                                </h3>
                                                <Badge variant="default" size="lg">
                                                    Best: {detectionResults.summary?.best_method || 'N/A'}
                                                </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                                                    <div className="text-3xl font-bold text-primary mb-2">
                                                        {detectionResults.methods?.enhanced?.count || 0}
                                                    </div>
                                                    <div className="text-sm font-medium text-muted-foreground">Enhanced Method</div>
                                                </div>
                                                <div className="text-center p-6 bg-gradient-to-br from-cow-confirmed/10 to-cow-confirmed/5 rounded-xl border border-cow-confirmed/20">
                                                    <div className="text-3xl font-bold text-cow-confirmed mb-2">
                                                        {detectionResults.methods?.ultra?.count || 0}
                                                    </div>
                                                    <div className="text-sm font-medium text-muted-foreground">Ultra-Aggressive Method</div>
                                                </div>
                                            </div>

                                            {detectionResults.summary && (
                                                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                                    <h4 className="font-semibold mb-2">Summary</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Best performing method: <strong>{detectionResults.summary.best_method}</strong>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ) : (
                                    // Single detection results
                                    <Card className="p-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                                    <span className="text-2xl">✅</span>
                                                    Analysis Complete
                                                </h3>
                                                <Badge variant="default" size="lg">
                                                    {detectionResults.total_cows} cow(s) detected
                                                </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                                                    <div className="text-3xl font-bold text-primary mb-2">
                                                        {detectionResults.total_cows}
                                                    </div>
                                                    <div className="text-sm font-medium text-muted-foreground">Total Cows</div>
                                                </div>
                                                <div className="text-center p-6 bg-gradient-to-br from-cow-confirmed/10 to-cow-confirmed/5 rounded-xl border border-cow-confirmed/20">
                                                    <div className="text-3xl font-bold text-cow-confirmed mb-2">
                                                        {detectionResults.detections?.length || 0}
                                                    </div>
                                                    <div className="text-sm font-medium text-muted-foreground">Detections</div>
                                                </div>
                                                <div className="text-center p-6 bg-gradient-to-br from-cow-pending/10 to-cow-pending/5 rounded-xl border border-cow-pending/20">
                                                    <div className="text-2xl font-bold text-cow-pending mb-2">
                                                        {detectionResults.method || 'Enhanced'}
                                                    </div>
                                                    <div className="text-sm font-medium text-muted-foreground">Method Used</div>
                                                </div>
                                            </div>

                                            {detectionResults.message && (
                                                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                                    <p className="text-sm text-muted-foreground">
                                                        {detectionResults.message}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* Additional Results Info */}
                                {!detectionResults.methods && (
                                    <Card className="p-6">
                                        <h4 className="text-lg font-semibold mb-4">Detection Details</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                                <span className="text-sm font-medium">Processing Time</span>
                                                <Badge variant="outline">
                                                    {detectionResults.processing_time || 'N/A'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                                <span className="text-sm font-medium">Algorithm</span>
                                                <Badge variant="secondary">
                                                    {detectionResults.method || 'Enhanced Detection'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                                <span className="text-sm font-medium">Confidence Threshold</span>
                                                <Badge variant="outline">0.5</Badge>
                                            </div>
                                            {detectionResults.image_path && (
                                                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                                    <span className="text-sm font-medium">Image Path</span>
                                                    <Badge variant="outline" className="text-xs max-w-48 truncate">
                                                        {detectionResults.image_path}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <Card className="p-12 text-center">
                                <div className="space-y-4">
                                    <div className="text-6xl opacity-50">📊</div>
                                    <h3 className="text-xl font-semibold text-foreground">
                                        No Results Yet
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Upload an image to see detection results here. Our AI will analyze the image and provide detailed cow detection information.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setActiveTab('upload')}
                                        className="mt-4"
                                    >
                                        <span className="mr-2">📤</span>
                                        Upload Image
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}