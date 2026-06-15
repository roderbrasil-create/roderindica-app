import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, ChevronLeft, ChevronRight, MessageSquare, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string | string[]; // Single URL or array of multiple photo URLs
  title?: string;
  autoPlayInterval?: number; // Automatic transition interval (defaults to 4000ms)
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  title = "Visualização do Equipamento",
  autoPlayInterval = 4000
}: ImageLightboxProps) {
  const imageList = Array.isArray(images) 
    ? images.filter(Boolean) 
    : [images].filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // Sync index when images change or light box opens
  useEffect(() => {
    setCurrentIndex(0);
  }, [images, isOpen]);

  // Automatic cycling if more than 1 image
  useEffect(() => {
    if (!isOpen || imageList.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isOpen, imageList.length, autoPlayInterval]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || imageList.length === 0) return null;

  const currentImageUrl = imageList[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const shareViaWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSharing) return;
    
    setIsSharing(true);
    const toastId = toast.loading('Processando imagem para o WhatsApp...');

    try {
      // Create absolute URL if relative
      let absoluteUrl = currentImageUrl;
      if (currentImageUrl.startsWith('/')) {
        absoluteUrl = window.location.origin + currentImageUrl;
      }

      // Safe fetch of the image with referrerPolicy
      const response = await fetch(absoluteUrl, { referrerPolicy: 'no-referrer' });
      const blob = await response.blob();
      
      const mimeType = blob.type || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      const file = new File([blob], `equipamento_roder.${extension}`, { type: mimeType });

      // Clean check if supported inside Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Confira este equipamento da RODER: ${title}`
        });
        toast.dismiss(toastId);
        toast.success('Pronto! Selecione o WhatsApp para enviar.');
      } else {
        // Fallback: Clipboard write
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [mimeType]: blob })
          ]);
          toast.dismiss(toastId);
          toast.success('Foto copiada para a área de transferência!', {
            description: 'Abra a conversa do WhatsApp e Cole (Ctrl+V ou toque e selecione Colar) para enviar como imagem!',
            duration: 8000
          });
        } catch (clipboardError) {
          // Absolute fallback: WhatsApp web message with URL
          const shareText = `Confira o equipamento do catálogo da RODER: *${title}*\n${absoluteUrl}`;
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
          toast.dismiss(toastId);
          toast.success('Link de compartilhamento enviado para o Whatsapp!');
        }
      }
    } catch (error) {
      console.warn('CORS or fetch error while prepping image, sharing link instead:', error);
      // Absolute fallback using standard link sharing
      let absoluteUrl = currentImageUrl;
      if (currentImageUrl.startsWith('/')) {
        absoluteUrl = window.location.origin + currentImageUrl;
      }
      const shareText = `Confira o equipamento do catálogo da RODER: *${title}*\n${absoluteUrl}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
      toast.dismiss(toastId);
      toast.success('Link enviado para o Whatsapp!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Header toolbar */}
        <div className="absolute top-4 left-4 right-4 z-15 flex items-center justify-between text-white">
          <div className="max-w-[70%] drop-shadow-md">
            <h3 className="font-extrabold text-sm md:text-base leading-tight truncate">{title}</h3>
            {imageList.length > 1 && (
              <p className="text-[10px] font-mono opacity-85 tracking-wider uppercase mt-0.5">
                Foto {currentIndex + 1} de {imageList.length} (Auto-passando)
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-14 w-14 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/40 shrink-0 select-none"
            aria-label="Fechar"
            title="Fechar (Esc)"
          >
            <X className="h-8 w-8 stroke-[2.5]" />
          </button>
        </div>

        {/* Outer content wrapper */}
        <div 
          className="relative max-w-full max-h-[62vh] flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Display Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex items-center justify-center select-none rounded-xl overflow-hidden border border-white/10 bg-neutral-950/80 max-w-full max-h-[58vh] shadow-2xl"
          >
            <img
              src={currentImageUrl}
              alt={title}
              className="max-w-full max-h-[58vh] object-contain pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Float WhatsApp Share Button inside the active image */}
            <button
              onClick={shareViaWhatsApp}
              disabled={isSharing}
              className="absolute bottom-4 right-4 h-12 px-4 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase transition-all shadow-lg select-none cursor-pointer z-10 disabled:opacity-50"
            >
              <MessageSquare className="h-4.5 w-4.5 fill-white stroke-none" />
              {isSharing ? "Processando..." : "Enviar no WhatsApp"}
            </button>
          </motion.div>

          {/* Previous/Next Manual Overlay buttons if size > 1 */}
          {imageList.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {imageList.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4 select-none">
              {imageList.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    index === currentIndex ? "w-6 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Simple internal helper class matching standard Tailwind syntax
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
