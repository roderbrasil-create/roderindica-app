import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Upload, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// Helper to compress and resize images client-side before storing them
function compressImage(base64Str: string, maxDimension = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a base64 data URI (e.g. standard URL), return as-is
    if (!base64Str.startsWith('data:')) {
      resolve(base64Str);
      return;
    }
    
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
        resolve(base64Str);
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (e) {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}

interface EditableImageProps {
  src: string;
  onChange: (base64: string) => void;
  alt: string;
  maxHeightClass?: string;
  aspectRatioClass?: string;
  outerMinHeightClass?: string;
  innerMinHeightClass?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  disabled?: boolean;
}

export function EditableImage({ 
  src, 
  onChange, 
  alt, 
  maxHeightClass = "max-h-[150px]",
  aspectRatioClass = "w-full",
  outerMinHeightClass = "min-h-[120px]",
  innerMinHeightClass = "min-h-[100px]",
  zoom: externalZoom,
  onZoomChange,
  disabled = false
}: EditableImageProps) {
  const [internalZoom, setInternalZoom] = useState(100);
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;

  const setZoomValue = (value: number) => {
    if (disabled) return;
    if (onZoomChange) {
      onZoomChange(value);
    } else {
      setInternalZoom(value);
    }
  };

  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Zoom operations
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setZoomValue(Math.min(zoom + 10, 300));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setZoomValue(Math.max(zoom - 10, 10));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setZoomValue(100);
  };

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (disabled) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const loadingToast = toast.loading('Otimizando imagem...');
        try {
          const compressed = await compressImage(event.target.result);
          onChange(compressed);
          setZoomValue(100); // Reset zoom for new image
          toast.dismiss(loadingToast);
          toast.success('Imagem carregada e otimizada com sucesso!');
        } catch (error) {
          onChange(event.target.result);
          setZoomValue(100);
          toast.dismiss(loadingToast);
          toast.success('Imagem carregada!');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Click handler to trigger file selection
  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Handle Paste event on the container and window when hovered/focused
  useEffect(() => {
    if (disabled) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const isContainerFocused = document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement);
      if (!isHovered && !isContainerFocused) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            toast.success('Imagem colada da área de transferência!');
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isHovered, disabled]);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          toast.success('Imagem colada da área de transferência!');
          return;
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      tabIndex={disabled ? undefined : 0}
      className={`group relative flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl overflow-hidden transition-all p-2 ${outerMinHeightClass} ${aspectRatioClass} ${
        disabled 
          ? 'cursor-default select-none' 
          : 'hover:border-primary/50 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/45'
      }`}
      title={disabled ? undefined : "Clique para selecionar, arraste uma imagem ou cole com Ctrl+V"}
    >
      {/* File input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      {/* Image preview with white background always */}
      <div className={`relative w-full h-full flex items-center justify-center bg-white overflow-hidden ${innerMinHeightClass}`}>
        {src ? (
          <img 
            src={src && src.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src} 
            alt={alt} 
            className={`${maxHeightClass} w-auto object-contain transition-transform duration-100 ease-out`}
            style={{ transform: `scale(${zoom / 100})` }}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <ImageIcon className="h-8 w-8 mb-1.5 text-slate-300" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sem Imagem</span>
            <span className="text-[9px] text-slate-400 mt-1">Clique para carregar ou pressione <strong>Ctrl+V</strong> para colar</span>
          </div>
        )}
      </div>

      {/* Floating Toolbar - HIDDEN in PDF Print and when disabled */}
      {!disabled && (
        <div 
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-lg px-2.5 py-1 rounded-full flex items-center gap-2.5 z-20 print:hidden transition-all duration-200 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()} // Prevent triggering file dialog
        >
          <button 
            onClick={handleZoomOut}
            title="Diminuir Zoom"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[9px] font-black text-slate-700 min-w-[32px] text-center">
            {zoom}%
          </span>
          <button 
            onClick={handleZoomIn}
            title="Aumentar Zoom"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <button 
            onClick={handleResetZoom}
            title="Ajustar Original"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button 
            onClick={handleClick}
            title="Substituir Imagem"
            className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
