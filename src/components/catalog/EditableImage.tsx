import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Upload, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  onZoomChange
}: EditableImageProps) {
  const [internalZoom, setInternalZoom] = useState(100);
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;

  const setZoomValue = (value: number) => {
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
    setZoomValue(Math.min(zoom + 10, 300));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomValue(Math.max(zoom - 10, 10));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomValue(100);
  };

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        onChange(event.target.result);
        setZoomValue(100); // Reset zoom for new image
        toast.success('Imagem carregada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Click handler to trigger file selection
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle Paste event on the container
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      tabIndex={0}
      className={`group relative flex flex-col items-center justify-center bg-white border border-slate-200 hover:border-primary/50 hover:shadow-md rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all p-2 ${outerMinHeightClass} ${aspectRatioClass}`}
      title="Clique, arraste uma imagem ou cole (Ctrl+V) para substituir"
    >
      {/* File input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image preview with white background always */}
      <div className={`relative w-full h-full flex items-center justify-center bg-white overflow-hidden ${innerMinHeightClass}`}>
        {src ? (
          <img 
            src={src} 
            alt={alt} 
            className={`${maxHeightClass} w-auto object-contain transition-transform duration-100 ease-out`}
            style={{ transform: `scale(${zoom / 100})` }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4">
            <ImageIcon className="h-8 w-8 mb-1.5 text-slate-300" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Adicionar Imagem</span>
            <span className="text-[8px] text-slate-400 text-center mt-0.5">Clique, arraste ou cole</span>
          </div>
        )}
      </div>

      {/* Floating Toolbar - HIDDEN in PDF Print */}
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
    </div>
  );
}
