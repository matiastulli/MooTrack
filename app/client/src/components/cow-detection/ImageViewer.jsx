import { useEffect, useRef, useState } from 'react'
import { scaleBoundingBox } from '../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

const ImageViewer = ({ detectionData, onDetectionClick }) => {
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [originalSize, setOriginalSize] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    if (detectionData) {
      setOriginalSize({
        width: detectionData.image_width || 1920,
        height: detectionData.image_height || 1080,
      })
    }
  }, [detectionData])

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.clientWidth,
        height: imageRef.current.clientHeight,
      })
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!detectionData) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">No detection results found</h3>
            <p>Please run the cow detection script first or upload detection results.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Detection Results: {detectionData.image_name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div ref={containerRef} className="relative inline-block max-w-full">
          <img
            ref={imageRef}
            src={detectionData.image_url || detectionData.image_base64}
            alt="Cow detection results"
            className="max-w-full h-auto rounded-lg"
            onLoad={handleImageLoad}
          />
          
          {/* Render bounding boxes */}
          {detectionData.detections.map((detection, index) => {
            if (imageSize.width === 0 || imageSize.height === 0) return null

            const scaledBox = scaleBoundingBox(detection.bbox, originalSize, imageSize)
            
            return (
              <div
                key={index}
                className={`absolute border-2 rounded cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  detection.is_cow 
                    ? 'border-cow-confirmed bg-cow-confirmed/10 hover:bg-cow-confirmed/20' 
                    : 'border-cow-rejected bg-cow-rejected/10 hover:bg-cow-rejected/20'
                }`}
                style={{
                  left: `${scaledBox.x}px`,
                  top: `${scaledBox.y}px`,
                  width: `${scaledBox.width}px`,
                  height: `${scaledBox.height}px`,
                }}
                onClick={() => onDetectionClick(index)}
              >
                <div className="absolute -top-6 left-0 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {detection.is_cow ? '🐄' : '❌'} {(detection.confidence * 100).toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default ImageViewer
