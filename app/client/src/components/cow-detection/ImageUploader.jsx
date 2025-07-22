import { useCallback, useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

const ImageUploader = ({ onImageUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFiles = useCallback((files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl">📸</div>
          <div>
            <h3 className="text-lg font-medium">Upload Aerial Image</h3>
            <p className="text-muted-foreground">
              Drag and drop your image here, or click to select
            </p>
          </div>
          
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => document.getElementById('image-upload').click()}
          >
            Select Image File
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Supports: JPG, PNG, GIF (Max: 10MB)
          </div>
        </div>
      </div>

      {preview && (
        <Card>
          <CardContent className="pt-6">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageUploader;
