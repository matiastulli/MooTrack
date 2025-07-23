import imageCompression from 'browser-image-compression';

export async function compressImage(file) {
  const options = {
    maxSizeMB: 5,             // Maximum file size in MB
    maxWidthOrHeight: 4096,   // Maximum width/height while maintaining aspect ratio
    useWebWorker: true,       // Use web workers for better performance
    preserveExif: true        // Preserve image metadata
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}
