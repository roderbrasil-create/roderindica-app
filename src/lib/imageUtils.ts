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

export function compressFileToDataURL(file: File, maxDimension = 900, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } catch (err) {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

