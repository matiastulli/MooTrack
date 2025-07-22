import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const ImageManager = ({ onImageSelect }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get('cow_counter/images');
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setImages(result.images || []);
    } catch (err) {
      setError(`Failed to load images: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (filename) => {
    try {
      const result = await api.delete(`cow_counter/images/${filename}`);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      // Refresh the image list
      await loadImages();
    } catch (err) {
      setError(`Failed to delete image: ${err.message}`);
    }
  };

  const runDetectionOnExisting = async (filename, method = 'simple') => {
    try {
      const confidence = method === 'ultra' ? 0.1 : method === 'enhanced' ? 0.2 : 0.3;
      const endpoint = method === 'simple' 
        ? `cow_counter/detect/file/${filename}?confidence=${confidence}`
        : `cow_counter/detect/${method}/${filename}?confidence=${confidence}`;
      
      const result = await api.get(endpoint);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      // Pass result back to parent component
      onImageSelect && onImageSelect({ filename, result, method });
    } catch (err) {
      setError(`Detection failed: ${err.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Images</CardTitle>
        <Button onClick={loadImages} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <span className="animate-spin text-2xl">⏳</span>
            <p className="mt-2 text-muted-foreground">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No images uploaded yet
          </div>
        ) : (
          <div className="space-y-3">
            {images.map((image) => (
              <div key={image.filename} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{image.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => runDetectionOnExisting(image.filename, 'simple')}
                  >
                    🔍 Detect
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runDetectionOnExisting(image.filename, 'enhanced')}
                  >
                    🎯 Enhanced
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImage(image.filename)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageManager;
