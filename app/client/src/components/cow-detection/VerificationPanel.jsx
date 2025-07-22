import { useEffect, useRef, useState } from 'react';
import { exportDetectionResults, formatConfidence, getConfidenceLevel } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';

const VerificationPanel = ({ verificationData, onUpdate, uploadedImage }) => {
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (imageRef.current && uploadedImage) {
      const img = imageRef.current;
      const updateSizes = () => {
        setDisplaySize({
          width: img.clientWidth,
          height: img.clientHeight
        });
      };
      
      img.onload = () => {
        setImageSize({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        updateSizes();
      };
      
      window.addEventListener('resize', updateSizes);
      return () => window.removeEventListener('resize', updateSizes);
    }
  }, [uploadedImage]);

  useEffect(() => {
    drawDetections();
  }, [verificationData, displaySize, selectedDetection]);

  const drawDetections = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img || !verificationData || displaySize.width === 0) return;

    const ctx = canvas.getContext('2d');
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = displaySize.width / imageSize.width;
    const scaleY = displaySize.height / imageSize.height;

    verificationData.detections.forEach((detection, index) => {
      const [x1, y1, x2, y2] = detection.bbox;
      
      const scaledX = x1 * scaleX;
      const scaledY = y1 * scaleY;
      const scaledWidth = (x2 - x1) * scaleX;
      const scaledHeight = (y2 - y1) * scaleY;

      // Set color based on verification status
      let color;
      if (detection.is_cow) {
        color = detection.verified ? '#22c55e' : '#eab308'; // Green if verified, yellow if pending
      } else {
        color = '#ef4444'; // Red if rejected
      }

      // Highlight selected detection
      if (selectedDetection === index) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
      }

      // Draw bounding box
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw label background
      const label = `${index + 1}: ${formatConfidence(detection.confidence)}`;
      ctx.font = '12px Inter, sans-serif';
      const labelWidth = ctx.measureText(label).width + 8;
      
      ctx.fillStyle = color;
      ctx.fillRect(scaledX, scaledY - 20, labelWidth, 20);
      
      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(label, scaledX + 4, scaledY - 6);
    });
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleX = displaySize.width / imageSize.width;
    const scaleY = displaySize.height / imageSize.height;

    // Find clicked detection
    for (let i = 0; i < verificationData.detections.length; i++) {
      const detection = verificationData.detections[i];
      const [x1, y1, x2, y2] = detection.bbox;
      
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;

      if (x >= scaledX1 && x <= scaledX2 && y >= scaledY1 && y <= scaledY2) {
        setSelectedDetection(i);
        return;
      }
    }
    
    setSelectedDetection(null);
  };

  const updateDetection = (index, updates) => {
    const updatedData = {
      ...verificationData,
      detections: verificationData.detections.map((detection, i) =>
        i === index ? { ...detection, ...updates } : detection
      )
    };

    // Update verification complete status
    updatedData.verification_complete = updatedData.detections.every(d => d.verified);
    
    onUpdate(updatedData);
  };

  const confirmDetection = (index) => {
    updateDetection(index, { is_cow: true, verified: true });
  };

  const rejectDetection = (index) => {
    updateDetection(index, { is_cow: false, verified: true });
  };

  const addNotes = (index, notes) => {
    updateDetection(index, { user_notes: notes });
  };

  const getConfirmedCount = () => {
    return verificationData.detections.filter(d => d.is_cow && d.verified).length;
  };

  const getPendingCount = () => {
    return verificationData.detections.filter(d => !d.verified).length;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Image with detections */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Verify Detections</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on detections to select them, then use the panel to confirm or reject
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                ref={imageRef}
                src={URL.createObjectURL(uploadedImage)}
                alt="Detection results"
                className="w-full h-auto max-h-[600px] object-contain"
              />
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="absolute top-0 left-0 cursor-pointer"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification controls */}
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Detection Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {verificationData.total_detections}
                </div>
                <div className="text-sm text-muted-foreground">Total Found</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {getConfirmedCount()}
                </div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pending verification:</span>
                <Badge variant="outline">{getPendingCount()}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Method used:</span>
                <Badge>{verificationData.method_used}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Confidence threshold:</span>
                <span>{verificationData.confidence_threshold}</span>
              </div>
            </div>

            {verificationData.verification_complete && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <span>✅</span>
                  <span className="font-medium">Verification Complete!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected detection details */}
        {selectedDetection !== null && (
          <Card>
            <CardHeader>
              <CardTitle>Detection #{selectedDetection + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const detection = verificationData.detections[selectedDetection];
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <Badge variant={getConfidenceLevel(detection.confidence)}>
                          {formatConfidence(detection.confidence)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={detection.is_cow ? 'default' : 'destructive'}>
                          {detection.is_cow ? '🐄 Cow' : '❌ Not a cow'}
                        </Badge>
                      </div>
                      {detection.model && (
                        <div className="flex justify-between">
                          <span>Detected by:</span>
                          <span className="text-sm text-muted-foreground">
                            {detection.model}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => confirmDetection(selectedDetection)}
                          disabled={detection.verified && detection.is_cow}
                        >
                          ✅ Confirm Cow
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectDetection(selectedDetection)}
                          disabled={detection.verified && !detection.is_cow}
                        >
                          ❌ Reject
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Notes (optional):
                      </label>
                      <Input
                        value={detection.user_notes || ''}
                        onChange={(e) => addNotes(selectedDetection, e.target.value)}
                        placeholder="Add notes about this detection..."
                        className="text-sm"
                      />
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="success"
              className="w-full"
              onClick={() => {
                verificationData.detections.forEach((_, index) => {
                  if (!verificationData.detections[index].verified) {
                    confirmDetection(index);
                  }
                });
              }}
              disabled={getPendingCount() === 0}
            >
              ✅ Confirm All Remaining
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => exportDetectionResults(verificationData)}
              disabled={!verificationData.verification_complete}
            >
              📥 Export Results
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationPanel;
