import { useState } from 'react';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const DetectionComparison = ({ uploadedImage }) => {
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runComparison = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      // First upload the image and get results from each method
      const [simpleResult, enhancedResult, ultraResult] = await Promise.all([
        api.cowDetection.detectCows(uploadedImage, 0.3),
        api.cowDetection.detectCowsEnhanced(uploadedImage, 0.2),
        api.cowDetection.detectCowsUltra(uploadedImage, 0.1)
      ]);

      if (simpleResult.error || enhancedResult.error || ultraResult.error) {
        setError('One or more detection methods failed');
        return;
      }

      const comparisonData = {
        image_name: uploadedImage.name,
        methods: {
          simple: {
            count: simpleResult.total_cows,
            detections: simpleResult.detections,
            message: simpleResult.message,
            confidence_threshold: 0.3
          },
          enhanced: {
            count: enhancedResult.total_cows,
            detections: enhancedResult.detections,
            message: enhancedResult.message,
            confidence_threshold: 0.2
          },
          ultra: {
            count: ultraResult.total_cows,
            detections: ultraResult.detections,
            message: ultraResult.message,
            confidence_threshold: 0.1
          }
        }
      };

      // Determine best method
      comparisonData.summary = {
        best_method: Object.entries(comparisonData.methods)
          .sort(([,a], [,b]) => b.count - a.count)[0][0],
        total_detections: {
          simple: comparisonData.methods.simple.count,
          enhanced: comparisonData.methods.enhanced.count,
          ultra: comparisonData.methods.ultra.count
        }
      };

      setComparison(comparisonData);

    } catch (err) {
      setError(`Comparison failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodInfo = (methodId) => {
    const info = {
      simple: {
        name: 'Simple Detection',
        description: 'Standard YOLO model with default settings',
        icon: '🔍',
        color: 'bg-blue-500'
      },
      enhanced: {
        name: 'Enhanced Detection',
        description: 'Multiple models with grid analysis and better filtering',
        icon: '🎯',
        color: 'bg-green-500'
      },
      ultra: {
        name: 'Ultra-Aggressive',
        description: 'Very low thresholds with color-based fallback detection',
        icon: '🚀',
        color: 'bg-purple-500'
      }
    };
    return info[methodId] || {};
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compare Detection Methods</CardTitle>
          <p className="text-muted-foreground">
            Run all three detection methods on your image to see which performs best
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runComparison}
            disabled={isLoading || !uploadedImage}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Running comparison...
              </>
            ) : (
              '🔄 Compare All Methods'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <span>❌</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Comparison Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(comparison.methods).map(([methodId, data]) => {
                  const methodInfo = getMethodInfo(methodId);
                  const isBest = comparison.summary.best_method === methodId;
                  
                  return (
                    <div
                      key={methodId}
                      className={`relative p-6 rounded-lg border-2 transition-all ${
                        isBest 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {isBest && (
                        <Badge className="absolute -top-2 -right-2">
                          🏆 Best
                        </Badge>
                      )}
                      
                      <div className="text-center space-y-3">
                        <div className="text-3xl">{methodInfo.icon}</div>
                        <div>
                          <h3 className="font-semibold">{methodInfo.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {methodInfo.description}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-primary">
                            {data.count}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Cows detected
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Confidence: {data.confidence_threshold}</div>
                          <div>Detections: {data.detections.length}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(comparison.methods).map(([methodId, data]) => {
              const methodInfo = getMethodInfo(methodId);
              
              return (
                <Card key={methodId}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{methodInfo.icon}</span>
                      <span>{methodInfo.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total cows:</span>
                        <Badge variant="outline">{data.count}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Detections:</span>
                        <span>{data.detections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span>{data.confidence_threshold}</span>
                      </div>
                    </div>

                    {data.detections.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Confidence Distribution:</h4>
                        <div className="space-y-1">
                          {['high', 'medium', 'low'].map(level => {
                            const count = data.detections.filter(d => {
                              if (level === 'high') return d.confidence > 0.7;
                              if (level === 'medium') return d.confidence > 0.4 && d.confidence <= 0.7;
                              return d.confidence <= 0.4;
                            }).length;
                            
                            return (
                              <div key={level} className="flex justify-between text-sm">
                                <span className="capitalize">{level}:</span>
                                <Badge variant={level} size="sm">{count}</Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {data.message}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DetectionComparison;
