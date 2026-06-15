import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File, maxSizeMB = 0.5, maxWidthOrHeight = 1920) => {
  // Only compress if it's an image and larger than 300KB
  if (!file.type.startsWith('image/') || file.size < 300 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidthOrHeight,
    useWebWorker: true,
    maxIteration: 10,
  };

  try {
    console.log(`Starting compression for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed: ${file.size / 1024}KB -> ${compressedFile.size / 1024}KB`);
    return compressedFile;
  } catch (error) {
    console.error('Compression error with WebWorker, trying without...', error);
    try {
      const fallbackOptions = { ...options, useWebWorker: false };
      const compressedFile = await imageCompression(file, fallbackOptions);
      return compressedFile;
    } catch (fallbackError) {
      console.error('Compression error without WebWorker:', fallbackError);
      return file; // Return original file if all compression attempts fail
    }
  }
};
