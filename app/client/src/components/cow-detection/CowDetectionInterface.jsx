import { useCallback, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import DetectionComparison from './DetectionComparison';
import ImageUploader from './ImageUploader';
import VerificationPanel from './VerificationPanel';

const CowDetectionInterface = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('simple');
  const [confidence, setConfidence] = useState(0.3);
  const [verificationData, setVerificationData] = useState(null);

  const handleImageUpload = useCallback(async (file) => {
    setUploadedImage(file);
    setDetectionResults(null);
    setVerificationData(null);
    setError(null);
    setActiveTab('detection');
  }, []);

  const runDetection = async (method = selectedMethod) => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      let result;
      const formData = new FormData();
      formData.append('file', uploadedImage);
      
      switch (method) {
        case 'enhanced':
          result = await api.post(`cow_counter/detect/enhanced?confidence=${confidence}`, formData);
          break;
        case 'ultra':
          result = await api.post(`cow_counter/detect/ultra?confidence=${confidence}`, formData);
          break;
        default:
          result = await api.post(`cow_counter/detect?confidence=${confidence}`, formData);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setDetectionResults(result);
      
      // Initialize verification data
      const verificationData = {
        image_name: uploadedImage.name,
        total_detections: result.total_cows,
        detections: result.detections.map((detection, index) => ({
          id: index,
          ...detection,
          is_cow: true, // Default to true, user can change
          verified: false,
          user_notes: ''
        })),
        method_used: method,
        confidence_threshold: confidence,
        verification_complete: false
      };
      
      setVerificationData(verificationData);
      setActiveTab('verification');
      
    } catch (err) {
      setError(`Detection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationUpdate = useCallback((updatedVerificationData) => {
    setVerificationData(updatedVerificationData);
  }, []);

  const resetInterface = () => {
    setUploadedImage(null);
    setDetectionResults(null);
    setVerificationData(null);
    setError(null);
    setActiveTab('upload');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          🐄 MooTrack - Cow Detection System
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload aerial images to automatically detect and count cows using AI
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-border">
        {[
          { id: 'upload', label: 'Upload Image', icon: '📁' },
          { id: 'detection', label: 'Detection Settings', icon: '🔍' },
          { id: 'verification', label: 'Verify Results', icon: '✅' },
          { id: 'comparison', label: 'Compare Methods', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <span>❌</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Aerial Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader onImageUpload={handleImageUpload} />
              
              {uploadedImage && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Image uploaded successfully!</p>
                      <p className="text-sm text-muted-foreground">
                        File: {uploadedImage.name} ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab('detection')}>
                      Next: Configure Detection →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'detection' && uploadedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Method Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Detection Method</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { 
                        id: 'simple', 
                        name: 'Simple Detection', 
                        description: 'Fast, standard YOLO detection',
                        confidence: 0.3 
                      },
                      { 
                        id: 'enhanced', 
                        name: 'Enhanced Detection', 
                        description: 'Multiple models with grid analysis',
                        confidence: 0.2 
                      },
                      { 
                        id: 'ultra', 
                        name: 'Ultra-Aggressive', 
                        description: 'Very low thresholds + color detection',
                        confidence: 0.1 
                      }
                    ].map((method) => (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedMethod(method.id);
                          setConfidence(method.confidence);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            checked={selectedMethod === method.id}
                            onChange={() => {}}
                            className="text-primary"
                          />
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confidence Threshold: {confidence}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>More detections</span>
                    <span>Higher precision</span>
                  </div>
                </div>

                {/* Run Detection Button */}
                <Button
                  onClick={() => runDetection()}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Running {selectedMethod} detection...
                    </>
                  ) : (
                    <>
                      🔍 Run {selectedMethod} Detection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Image Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={URL.createObjectURL(uploadedImage)}
                    alt="Uploaded image"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'verification' && verificationData && (
          <VerificationPanel
            verificationData={verificationData}
            onUpdate={handleVerificationUpdate}
            uploadedImage={uploadedImage}
          />
        )}

        {activeTab === 'comparison' && uploadedImage && (
          <DetectionComparison uploadedImage={uploadedImage} />
        )}
      </div>

      {/* Reset Button */}
      {(uploadedImage || detectionResults) && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={resetInterface}>
            🔄 Start Over
          </Button>
        </div>
      )}
    </div>
  );
};

export default CowDetectionInterface;
