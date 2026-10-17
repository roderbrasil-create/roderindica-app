import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, MessageSquare, Loader2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useVoltarFecha } from '../../lib/useVoltarFecha';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string | string[]; // Single URL or array of multiple photo URLs (including db-file://)
  title?: string;
  autoPlayInterval?: number; // Automatic transition interval (defaults to 4000ms)
}

// In-memory cache for db-file:// base64 blobs across lightbox openings
const DB_IMAGE_CACHE = new Map<string, string>();

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0]?.split(':')[1] || 'image/jpeg';
  const raw = window.atob(parts[1] || '');
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

function getFallbackList(src: string, title: string = ''): string[] {
  if (!src) return [];
  if (src.startsWith('data:image/') || src.startsWith('blob:') || src.startsWith('db-file://')) {
    return [src];
  }

  const list: string[] = [src];

  if (src.includes('roderbrasil.com.br')) {
    if (src.includes('/wp-content/uploads/')) {
      list.push(src.replace('/wp-content/uploads/', '/wp-content/webp-express/webp-images/uploads/') + '.webp');
    }
    if (src.includes('/2021/05/')) {
      const aug2025 = src.replace('/2021/05/', '/2025/08/');
      list.push(aug2025);
      list.push(aug2025.replace('/wp-content/uploads/', '/wp-content/webp-express/webp-images/uploads/') + '.webp');
    }
  }

  const lowerTitle = (title || '').toLowerCase();
  if (lowerTitle.includes('fae') || lowerTitle.includes('triturador') || lowerTitle.includes('desbastador')) {
    list.push('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop');
  } else if (lowerTitle.includes('garra') || lowerTitle.includes('gt') || lowerTitle.includes('r280') || lowerTitle.includes('r360')) {
    list.push('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop');
  } else if (lowerTitle.includes('feller') || lowerTitle.includes('cfta') || lowerTitle.includes('cfd')) {
    list.push('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop');
  } else {
    list.push('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200&auto=format&fit=crop');
  }

  return list;
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  title = "Visualização do Equipamento",
  autoPlayInterval = 4000
}: ImageLightboxProps) {
  const rawList = Array.isArray(images) 
    ? images.filter(Boolean) 
    : [images].filter(Boolean);

  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrorStates, setImageErrorStates] = useState<Record<number, number>>({});

  // Reset states and resolve all raw image URLs (including db-file://)
  useEffect(() => {
    if (!isOpen || rawList.length === 0) {
      setResolvedImages([]);
      setIsResolving(false);
      setCurrentIndex(0);
      setImageErrorStates({});
      return;
    }

    let isMounted = true;
    setIsResolving(true);
    setCurrentIndex(0);
    setImageErrorStates({});

    const resolveAll = async () => {
      const results: string[] = [];

      for (const item of rawList) {
        if (!item) continue;

        if (item.startsWith('db-file://')) {
          const fileId = item.replace('db-file://', '');
          if (DB_IMAGE_CACHE.has(fileId)) {
            results.push(DB_IMAGE_CACHE.get(fileId)!);
          } else {
            try {
              const snap = await getDoc(doc(db, 'app_files', fileId));
              if (snap.exists() && snap.data()?.data) {
                const base64Data = snap.data().data;
                DB_IMAGE_CACHE.set(fileId, base64Data);
                results.push(base64Data);
              } else {
                // Fallback unsplash if file not found in db
                const fallback = getFallbackList('', title)[0];
                results.push(fallback);
              }
            } catch (err) {
              console.warn('Error fetching db-file image:', item, err);
              const fallback = getFallbackList('', title)[0];
              results.push(fallback);
            }
          }
        } else {
          results.push(item);
        }
      }

      if (isMounted) {
        setResolvedImages(results.filter(Boolean));
        setIsResolving(false);
      }
    };

    resolveAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, JSON.stringify(rawList), title]);

  // Automatic cycling if more than 1 image and not hovered/paused
  useEffect(() => {
    if (!isOpen || resolvedImages.length <= 1 || isPaused || isResolving) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % resolvedImages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isOpen, resolvedImages.length, autoPlayInterval, isPaused, isResolving]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && resolvedImages.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % resolvedImages.length);
      }
      if (e.key === 'ArrowLeft' && resolvedImages.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, resolvedImages.length]);

  // "Voltar" do celular fecha a foto e fica na tela de onde ela foi aberta
  useVoltarFecha(isOpen && rawList.length > 0, onClose);

  if (!isOpen || rawList.length === 0) return null;

  const currentRawUrl = resolvedImages[currentIndex] || rawList[currentIndex] || '';
  const currentAttempt = imageErrorStates[currentIndex] || 0;
  const candidateList = getFallbackList(currentRawUrl, title);
  const activeImageUrl = candidateList[currentAttempt] || candidateList[0] || currentRawUrl;
  const isFailed = currentAttempt >= candidateList.length;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % resolvedImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length);
  };

  const handleImageError = () => {
    if (currentAttempt < candidateList.length - 1) {
      setImageErrorStates((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || 0) + 1
      }));
    } else {
      setImageErrorStates((prev) => ({
        ...prev,
        [currentIndex]: candidateList.length
      }));
    }
  };

  const shareViaWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSharing || !activeImageUrl) return;
    
    setIsSharing(true);
    const toastId = toast.loading('Processando imagem para o WhatsApp...');

    try {
      if (activeImageUrl.startsWith('data:image/')) {
        // Direct Base64 blob processing
        const blob = base64ToBlob(activeImageUrl);
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.includes('png') ? 'png' : 'jpg';
        const file = new File([blob], `equipamento_roder_${currentIndex + 1}.${ext}`, { type: mimeType });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
            text: `Confira este equipamento da RODER: ${title}`
          });
          toast.dismiss(toastId);
          toast.success('Pronto! Selecione o WhatsApp para enviar.');
        } else {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [mimeType]: blob })
            ]);
            toast.dismiss(toastId);
            toast.success('Foto copiada para a área de transferência!', {
              description: 'Abra a conversa do WhatsApp e cole (Ctrl+V ou toque e Colar) para enviar como imagem!',
              duration: 8000
            });
          } catch (clipboardError) {
            const shareText = `Confira o equipamento do catálogo da RODER: *${title}*`;
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');
            toast.dismiss(toastId);
            toast.success('Mensagem enviada para o WhatsApp!');
          }
        }
      } else {
        // External URL
        let absoluteUrl = activeImageUrl;
        if (activeImageUrl.startsWith('/')) {
          absoluteUrl = window.location.origin + activeImageUrl;
        }

        try {
          const response = await fetch(absoluteUrl, { referrerPolicy: 'no-referrer' });
          const blob = await response.blob();
          const mimeType = blob.type || 'image/jpeg';
          const ext = mimeType.split('/')[1] || 'jpg';
          const file = new File([blob], `equipamento_roder.${ext}`, { type: mimeType });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title,
              text: `Confira este equipamento da RODER: ${title}`
            });
            toast.dismiss(toastId);
            toast.success('Pronto! Selecione o WhatsApp para enviar.');
          } else {
            await navigator.clipboard.write([
              new ClipboardItem({ [mimeType]: blob })
            ]);
            toast.dismiss(toastId);
            toast.success('Foto copiada! Cole (Ctrl+V) no WhatsApp para enviar.', { duration: 8000 });
          }
        } catch {
          const shareText = `Confira o equipamento do catálogo da RODER: *${title}*\n${absoluteUrl}`;
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
          toast.dismiss(toastId);
          toast.success('Link do equipamento enviado para o WhatsApp!');
        }
      }
    } catch (error) {
      console.warn('Error sharing image:', error);
      const shareText = `Confira o equipamento do catálogo da RODER: *${title}*`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
      toast.dismiss(toastId);
      toast.success('Link enviado para o WhatsApp!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-3 sm:p-6 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Header Toolbar */}
        <div style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }} className="absolute left-4 right-4 z-20 flex items-center justify-between text-white pointer-events-none">
          <div className="max-w-[70%] drop-shadow-lg pointer-events-auto">
            <h3 className="font-extrabold text-base md:text-lg leading-tight truncate text-white">{title}</h3>
            {resolvedImages.length > 1 && (
              <p className="text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
                Foto {currentIndex + 1} de {resolvedImages.length} {isPaused ? '(Pausado)' : '(Auto-passando)'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-12 w-12 md:h-14 md:w-14 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/50 shrink-0 select-none pointer-events-auto"
            aria-label="Fechar"
            title="Fechar (Esc)"
          >
            <X className="h-7 w-7 md:h-8 md:w-8 stroke-[2.5]" />
          </button>
        </div>

        {/* Main Content Area */}
        <div 
          className="relative w-full max-w-5xl h-[78vh] md:h-[84vh] flex flex-col items-center justify-center pt-10 pb-4"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Display Image Frame */}
          <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden border border-white/15 bg-neutral-950/90 shadow-2xl p-2 sm:p-4">
            {isResolving ? (
              <div className="flex flex-col items-center justify-center gap-3 text-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-sm font-medium text-neutral-300">Carregando imagem em alta resolução...</span>
              </div>
            ) : isFailed ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-neutral-300">
                <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ImageOff className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-base text-white">{title}</h4>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Esta foto está sendo atualizada no catálogo da Roder. Visualize o PDF técnico ou entre em contato com nosso time de vendas.
                </p>
              </div>
            ) : (
              <motion.div
                key={`${currentIndex}-${activeImageUrl}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full flex items-center justify-center relative select-none"
              >
                <img
                  src={activeImageUrl}
                  alt={title}
                  onError={handleImageError}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg drop-shadow-2xl pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Float WhatsApp Share Button */}
                <button
                  onClick={shareViaWhatsApp}
                  disabled={isSharing}
                  className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 h-11 sm:h-12 px-4 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xl select-none cursor-pointer z-10 disabled:opacity-50 border border-emerald-400/30"
                >
                  <MessageSquare className="h-4 w-4 fill-white stroke-none" />
                  {isSharing ? "Processando..." : "Enviar no WhatsApp"}
                </button>
              </motion.div>
            )}

            {/* Navigation Arrows */}
            {resolvedImages.length > 1 && !isResolving && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20 shadow-lg z-20"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20 shadow-lg z-20"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator & Helper text */}
          {resolvedImages.length > 1 && !isResolving && (
            <div className="flex flex-col items-center gap-1.5 mt-3 select-none">
              <div className="flex justify-center gap-1.5">
                {resolvedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                    className={cn(
                      "h-2.5 rounded-full transition-all cursor-pointer",
                      index === currentIndex ? "w-8 bg-emerald-500 shadow-md" : "w-2.5 bg-white/30 hover:bg-white/60"
                    )}
                    aria-label={`Ir para foto ${index + 1}`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                Passe o cursor sobre a foto para pausar ou use as setas do teclado
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

