import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, deleteDoc, getDoc, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { CryptoService } from '../lib/CryptoService';
import { AuditService, AuditAction } from '../lib/AuditService';
import { runSelfHealing } from '../lib/SelfHealing';
import { Product } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  MessageCircle,
  Video,
  Youtube,
  FileText,
  Calculator,
  Loader2,
  Upload,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  FileDown,
  Share2,
  DollarSign,
  Info,
  Package,
  List,
  LayoutGrid,
  CloudDownload,
  ArrowLeft,
  GripVertical,
  Megaphone,
  Layers,
  ClipboardCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { useNavigate, useLocation } from 'react-router-dom';
import { compressImage } from '../lib/imageUtils';
import { cn, getApiBaseUrl } from '../lib/utils';
import { ImageLightbox } from '../components/ui/ImageLightbox';
import { HighTipSelector } from '../components/catalog/HighTipSelector';
import { HighTipFicha } from '../components/catalog/HighTipFicha';
import { MulcherTechnicalDelivery } from '../components/catalog/MulcherTechnicalDelivery';
import { FresaSshFicha } from '../components/catalog/FresaSshFicha';
import { TrituradorLoaderFaeFicha } from '../components/catalog/TrituradorLoaderFaeFicha';
import { EngateRapidoFicha } from '../components/catalog/EngateRapidoFicha';
import { GarraEstufagemFicha } from '../components/catalog/GarraEstufagemFicha';
import { RODER_LOGO_BASE64 } from '../components/catalog/RoderLogo';

function SmartImage({ src, alt, className, zoom = 1, objectFit = 'cover', ...props }: any) {
  const [resolvedSrc, setResolvedSrc] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [attemptIndex, setAttemptIndex] = useState(0);

  useEffect(() => {
    if (!src) {
      setResolvedSrc('');
      setAttempts([]);
      setAttemptIndex(0);
      return;
    }

    if (src.startsWith('db-file://')) {
      const fileId = src.replace('db-file://', '');
      getDoc(doc(db, 'app_files', fileId)).then(docSnap => {
        if (docSnap.exists()) {
          const base64Data = docSnap.data().data;
          setResolvedSrc(base64Data);
          setAttempts([base64Data]);
          setAttemptIndex(0);
        } else {
          setResolvedSrc('');
          setAttempts([]);
          setAttemptIndex(0);
        }
      }).catch(() => {
        setResolvedSrc('');
        setAttempts([]);
        setAttemptIndex(0);
      });
    } else {
      // Build high-availability hierarchy of attempts
      const list: string[] = [src];

      if (src.includes('roderbrasil.com.br')) {
        // Attempt 1: WebP express directory translation for same date
        if (src.includes('/wp-content/uploads/')) {
          const webpVer = src.replace('/wp-content/uploads/', '/wp-content/webp-express/webp-images/uploads/') + '.webp';
          list.push(webpVer);
        }

        // Attempt 2: Maybe it was uploaded under August 2025 (latest product batch)
        if (src.includes('/2021/05/')) {
          const aug2025Ver = src.replace('/2021/05/', '/2025/08/');
          list.push(aug2025Ver);
          
          const aug2025Webp = aug2025Ver.replace('/wp-content/uploads/', '/wp-content/webp-express/webp-images/uploads/') + '.webp';
          list.push(aug2025Webp);
        }

        // Attempt 3: Change 2021/05 to July 2024
        if (src.includes('/2021/05/')) {
          const jul2024Ver = src.replace('/2021/05/', '/2024/07/');
          list.push(jul2024Ver);
          const jul2024Webp = jul2024Ver.replace('/wp-content/uploads/', '/wp-content/webp-express/webp-images/uploads/') + '.webp';
          list.push(jul2024Webp);
        }
      }

      // Attempt 4: Clean, themed high-quality Unsplash machinery and logging fallbacks
      let fallbackUnsplash = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop'; // excavator fallback
      
      const lowercaseAlt = (alt || '').toLowerCase();
      const lowercaseSrc = src.toLowerCase();

      if (lowercaseAlt.includes('fae') || lowercaseSrc.includes('fae') || lowercaseAlt.includes('triturador') || lowercaseAlt.includes('desbastador') || lowercaseAlt.includes('florestal')) {
        fallbackUnsplash = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop'; // forest logging environment
      } else if (lowercaseAlt.includes('garra') || lowercaseSrc.includes('garra')) {
        fallbackUnsplash = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop'; // metal claw/mechanic
      } else if (lowercaseAlt.includes('feller') || lowercaseSrc.includes('feller')) {
        fallbackUnsplash = 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800&auto=format&fit=crop'; // forestry/woods
      } else if (lowercaseAlt.includes('skidder') || lowercaseSrc.includes('skidder') || lowercaseAlt.includes('mini')) {
        fallbackUnsplash = 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop'; // heavy forest path
      }

      list.push(fallbackUnsplash);

      setAttempts(list);
      setResolvedSrc(list[0]);
      setAttemptIndex(0);
    }
  }, [src, alt]);

  const handleImageError = () => {
    if (attemptIndex < attempts.length - 1) {
      const nextIndex = attemptIndex + 1;
      setAttemptIndex(nextIndex);
      setResolvedSrc(attempts[nextIndex]);
    }
  };

  const isFailed = attemptIndex >= attempts.length - 1 && attempts.length > 0 && !resolvedSrc;

  return (
    <div className={cn("overflow-hidden flex items-center justify-center bg-slate-900 relative border border-border/10", className)}>
      {isFailed ? (
        <div key="failed-placeholder" className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center z-10 select-none">
          <div className="p-2.5 bg-amber-500/10 rounded-full border border-amber-500/20 mb-2.5 text-amber-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-amber-500">RODER EQUIPAMENTOS</span>
          <span className="font-sans text-[9px] font-medium text-slate-400 mt-0.5 truncate max-w-full px-2" title={alt}>{alt || 'Produto Catalogado'}</span>
        </div>
      ) : resolvedSrc ? (
        <div key="loaded-img-container" className="w-full h-full flex items-center justify-center">
          <img 
            src={resolvedSrc} 
            alt={alt} 
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
            className={cn(
              "w-full h-full transition-transform duration-300 pointer-events-none",
              objectFit === 'contain' ? "object-contain p-1 md:p-2 bg-white" : "object-cover"
            )} 
            onError={handleImageError}
            {...props} 
            referrerPolicy="no-referrer" 
          />
        </div>
      ) : (
        <div className="w-full h-full bg-slate-950 animate-pulse flex items-center justify-center">
          <span className="text-[10px] text-zinc-500">Carregando...</span>
        </div>
      )}
    </div>
  );
}

function ImageCarousel({ images, zoom = 1, objectFit = 'cover', onClick }: { images: string[], zoom?: number, objectFit?: string, onClick?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="w-full h-full relative cursor-pointer group" onClick={onClick}>
      {images.map((img, idx) => (
        <SmartImage
          key={idx}
          src={img}
          alt=""
          zoom={zoom}
          objectFit={objectFit}
          className={cn(
            "absolute inset-0 w-full h-full transition-opacity duration-1000",
            idx === currentIndex ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                idx === currentIndex ? "bg-primary w-3" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const isEngateProduct = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  const lower = nameOrUrl.toLowerCase();
  return lower.includes('engat') || 
         lower.includes('engan') || 
         lower.includes('acopl') || 
         lower.includes('acople') || 
         lower.includes('hitch') || 
         lower.includes('coupler') || 
         lower.includes('quick') || 
         lower.includes('attach') ||
         lower.includes('troca') ||
         lower.includes('rápida') ||
         lower.includes('rapida') ||
         lower.includes('carregadeira') ||
         lower.includes('carregadeiras') ||
         lower.includes('loader');
};

const isHighTipProduct = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  const lower = nameOrUrl.toLowerCase();
  if (lower.includes('prolongador') || lower.includes('pcr')) return false;
  return lower.includes('high tip') || 
         lower.includes('high-tip') || 
         lower.includes('cacamba-high-tip') || 
         lower.includes('concha-high-tip') ||
         lower.includes('caçamba de alto despejo') ||
         lower.includes('alto despejo') ||
         lower.includes('vuelco alto') ||
         lower.includes('despejo') ||
         lower.includes('high_tip');
};

const isFresaProduct = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  const lower = nameOrUrl.toLowerCase();
  return lower.includes('fresa') || 
         lower.includes('ssh') || 
         lower.includes('trituradora') ||
         lower.includes('triturador');
};

const isLoaderTrituradorProduct = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  const lower = nameOrUrl.toLowerCase();
  return (lower.includes('triturador') && (lower.includes('pá carregadeira') || lower.includes('pa carregadeira') || lower.includes('carregadeira') || lower.includes('loader'))) ||
         lower.includes('uml-ssl-vt') || lower.includes('uml ssl vt') || lower.includes('140 u pm') || lower.includes('140-u-pm') || lower.includes('uml_ssl_vt') || lower.includes('140_u_pm');
};

const isEstufagemProduct = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  const lower = nameOrUrl.toLowerCase();
  return lower.includes('estufagem') || 
         lower.includes('af-360') || 
         lower.includes('af-400') || 
         lower.includes('af-600') || 
         lower.includes('af-800') || 
         lower.includes('afg-600') || 
         lower.includes('afg-800') ||
         lower.includes('empilhadeira') ||
         lower.includes('forklift');
};

const isAnyFichaSupported = (product: any) => {
  if (!product) return false;
  const url = (product.pdf_url || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  
  // Guard for Prolongador com Concha / PCR: should not support high tip default fallbacks
  const isProlongador = url.includes('prolongador') || 
                        name.includes('prolongador') || 
                        desc.includes('prolongador') || 
                        cat.includes('prolongador') || 
                        name.includes('pcr') || 
                        (product.id && product.id.toLowerCase().includes('prolongador'));
  
  if (isProlongador) {
    return !!product.pdf_url;
  }
  
  const containsEngateKeyword = (str: string) => {
    const s = (str || '').toLowerCase();
    return s.includes('engat') || s.includes('rapido') || s.includes('rápido') || s.includes('acopl') || s.includes('acople') || s.includes('hitch');
  };
  const isEngate = containsEngateKeyword(url) || containsEngateKeyword(name) || containsEngateKeyword(desc) || containsEngateKeyword(cat) ||
                    !!(product.id && (product.id.toLowerCase().includes('engate') || product.id.toLowerCase().includes('er-')));

  const containsHighTipKeyword = (str: string) => {
    const s = (str || '').toLowerCase();
    if (s.includes('prolongador')) return false;
    return s.includes('high') || s.includes('tip') || s.includes('despejo') || s.includes('concha') || s.includes('caçamba de alto') || s.includes('cacamba de alto');
  };
  const isHighTip = !isProlongador && (containsHighTipKeyword(url) || containsHighTipKeyword(name) || containsHighTipKeyword(desc) || containsHighTipKeyword(cat));

  const containsFresaKeyword = (str: string) => {
    const s = (str || '').toLowerCase();
    return s.includes('fresa') || s.includes('ssh') || s.includes('triturador') || s.includes('trituradora');
  };
  const isFresa = containsFresaKeyword(url) || containsFresaKeyword(name) || containsFresaKeyword(desc) || containsFresaKeyword(cat);

  const isLoaderTriturador = isLoaderTrituradorProduct(url) || isLoaderTrituradorProduct(name) || isLoaderTrituradorProduct(desc) || isLoaderTrituradorProduct(cat) ||
                             !!(product.id && (product.id.toLowerCase().includes('loader') || product.id.toLowerCase().includes('triturador_loader') || product.id.toLowerCase().includes('uml-ssl-vt') || product.id.toLowerCase().includes('140-u-pm')));

  const isEstufagem = isEstufagemProduct(url) || isEstufagemProduct(name) || isEstufagemProduct(desc) || isEstufagemProduct(cat) ||
                      !!(product.id && (product.id.toLowerCase().includes('estufagem') || product.id.toLowerCase().includes('af-360')));

  return !!product.pdf_url || isEngate || isHighTip || isFresa || isEstufagem || isLoaderTriturador;
};



function SortableProductCard({ 
  product, 
  isManager, 
  isAdmin, 
  isMarketing,
  searchTerm, 
  onEdit, 
  onToggleBlock, 
  onToggleBanner,
  onDelete, 
  onSelectModels, 
  onOpenDigitalSelection,
  onIndicate, 
  isExternalSeller,
  openPdf,
  user,
  animationType = 'tilt',
  viewMode = 'card'
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const minPrice = product.models && product.models.length > 0
    ? Math.min(...product.models.map(m => m.base_value || 0).filter(v => v > 0))
    : 0;

  // Pricing should ONLY be visible to managers, admins, and internal sellers (financial/internal)
  const canSeePrices = !isExternalSeller && (isManager || isAdmin);

  const handleWhatsAppShare = () => {
    const budgetUrl = `${window.location.origin}/pedido-orcamento?uid=${user?.uid || ''}&pid=${product.id}`;
    const text = `*RODER BRASIL - Equipamento Florestal*\n\n` +
      `*Produto:* ${product.name}\n` +
      `*Descrição:* ${product.description}\n\n` +
      (product.image_url ? `*Foto:* ${product.image_url}\n` : '') +
      (product.video_url ? `*Vídeo:* ${product.video_url}\n` : '') +
      (product.pdf_url ? `*Ficha Técnica (PDF):* ${product.pdf_url}\n` : '') +
      `*Solicite seu orçamento aqui:* ${budgetUrl}\n\n` +
      `\n_Enviado via RODER Indica_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "bg-card border-border overflow-hidden flex flex-col shadow-sm rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98]",
        product.is_blocked && "opacity-50 grayscale",
        viewMode === 'list' && "md:flex-row md:w-full"
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('a')) {
          onSelectModels(product);
        }
      }}
    >
      <div className={cn("flex w-full", viewMode === 'list' ? "flex-row" : "flex-row md:flex-col")}> 
        {/* Image Section */}
        <div className={cn(
          "w-36 sm:w-44 aspect-square relative overflow-hidden bg-white flex-shrink-0 flex items-center justify-center border-r border-border/30",
          viewMode === 'list' ? "md:w-72 md:aspect-square md:rounded-none md:border-r" : "md:w-full md:aspect-square md:rounded-none md:border-b"
        )}>
          {(isManager || isAdmin || isMarketing) && !searchTerm && (
            <div 
              {...attributes} 
              {...listeners}
              className="absolute top-1 left-1 md:top-2 md:left-2 z-10 bg-black/50 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-black/70 transition-colors"
            >
              <GripVertical className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
          )}
          
          <motion.div 
            animate={animationType === 'tilt' ? { 
              rotate: [0, -1.5, 1.5, -1.5, 0],
              scale: [1, 1.02, 1]
            } : {
              rotateY: [0, -10, 10, -10, 0],
              scale: [1, 1.03, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-full h-full"
            style={{ perspective: 1000 }}
          >
            {product.image_url ? (
              <SmartImage 
                src={product.image_url} 
                alt={product.name} 
                zoom={product.image_zoom || 1} 
                objectFit="contain"
                className="w-full h-full" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[12px] bg-muted/20">Sem Foto</div>
            )}
          </motion.div>

          {product.is_blocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-[8px] md:text-xs">BLOQUEADO</Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={cn(
          "flex flex-col flex-1 min-w-0 p-2 md:p-0",
          viewMode === 'list' && "md:flex-row md:items-stretch md:gap-6 md:p-5"
        )}>
          {/* Text and Info Area */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <CardHeader className="p-0 md:p-4 pb-1 md:pb-2 md:px-0">
              <div className="flex items-start justify-between gap-1 relative w-full">
                <div className="min-w-0 flex-1 pr-[100px] sm:pr-[115px] md:pr-0">
                  <Badge variant="secondary" className="mb-0.5 md:mb-1 text-[13px] md:text-xs uppercase bg-muted text-muted-foreground px-1 h-3.5 md:h-4">{product.category}</Badge>
                  <CardTitle className="text-base md:text-xl font-bold text-foreground line-clamp-1 sm:line-clamp-2 leading-tight break-words whitespace-normal" title={product.name}>{product.name}</CardTitle>
                  {canSeePrices && minPrice > 0 && minPrice !== Infinity && (
                    <p className="text-[12px] md:text-xs font-bold text-primary mt-0.5">
                      A partir de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(minPrice)}
                    </p>
                  )}
                </div>
                {(isAdmin || isManager || isMarketing) && (
                  <div className="absolute top-0 right-0 flex gap-1 flex-shrink-0 bg-muted/90 p-0.5 rounded-lg border border-border/40 shadow-xs" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground hover:text-foreground hover:bg-background/80" onClick={() => onEdit(product)} title="Editar Produto">
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground hover:text-foreground hover:bg-background/80" onClick={() => onToggleBlock(product)} title={product.is_blocked ? "Ativar Produto" : "Bloquear Produto"}>
                      {product.is_blocked ? <Eye className="h-3 w-3 md:h-4 md:w-4" /> : <EyeOff className="h-3 w-3 md:h-4 md:w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-6 w-6 md:h-8 md:w-8 hover:bg-background/80", 
                        product.show_banner ? "text-primary shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                      )} 
                      onClick={() => onToggleBanner(product)}
                      title={product.show_banner ? "Remover Propaganda do Dashboard" : "Ativar como Propaganda no Dashboard"}
                    >
                      <Megaphone className={cn("h-3 w-3 md:h-4 md:w-4", product.show_banner && "animate-pulse")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50" 
                      onClick={() => onDelete(product.id, product.name)}
                      title="Excluir Produto Permanentemente"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 md:p-4 pt-0 md:pt-0 md:px-0 flex-1">
              <p className={cn(
                "text-[12px] md:text-sm text-muted-foreground leading-snug",
                viewMode === 'list' ? "line-clamp-3 md:line-clamp-4" : "line-clamp-2 md:line-clamp-3"
              )}>{product.description}</p>
            </CardContent>
          </div>

          {/* Action Row - Responsive */}
          <div className={cn(
            "mt-auto",
            viewMode === 'list' ? "md:mt-0 md:w-60 md:shrink-0 md:border-l md:border-border/60 md:pl-6 md:flex md:flex-col md:justify-center" : "w-full"
          )}>
            {/* Mobile Actions: Compact in bottom right */}
            <div className="md:hidden flex items-center justify-end gap-1.5 px-2 pb-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center">
                <Button 
                  size="sm"
                  className="h-8 bg-[#25D366] hover:bg-[#128C7E] text-white text-[7px] font-bold px-1.5 shadow-sm flex-col gap-0.5 justify-center leading-none min-w-[42px]" 
                  onClick={handleWhatsAppShare}
                >
                  <MessageCircle className="h-3 w-3" /> <span>Whats</span>
                </Button>
              </div>
              
              {isAnyFichaSupported(product) && (
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 border-border px-1 text-[7px] font-bold flex-col gap-0.5 justify-center leading-none min-w-[42px]"
                    onClick={() => openPdf(product.pdf_url || '', product.name, product)}
                  >
                    <FileText className="h-3 w-3 text-red-500" /> <span>Ficha</span>
                  </Button>
                </div>
              )}

              {product.name === 'Caçamba High Tip' && (
                <div className="flex items-center">
                  <Button 
                    size="sm"
                    className="h-8 bg-slate-950 hover:bg-slate-900 text-slate-100 text-[7px] font-black px-1.5 border border-slate-800 shadow-xs flex-col gap-0.5 justify-center leading-none min-w-[42px]" 
                    onClick={() => onOpenDigitalSelection && onOpenDigitalSelection(product)}
                  >
                    <Calculator className="h-3 w-3 text-amber-500" /> <span>Guia</span>
                  </Button>
                </div>
              )}

              {!isExternalSeller && product.video_url && (
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="h-8 border-border px-1 text-[7px] font-bold flex-col gap-0.5 justify-center leading-none min-w-[42px]" asChild>
                    <a href={product.video_url} target="_blank" rel="noreferrer">
                      <Video className="h-3 w-3 text-blue-500" /> <span>Vídeo</span>
                    </a>
                  </Button>
                </div>
              )}

              {product.models && product.models.length > 0 ? (
                <div className="flex items-center ml-auto">
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="h-9 text-[9px] font-black px-2 bg-muted hover:bg-muted/80 text-foreground border border-border/50 shadow-none" 
                    onClick={() => onSelectModels(product)}
                  >
                    <List className="h-3.5 w-3.5 mr-1" /> Modelos ({product.models.length})
                  </Button>
                </div>
              ) : (
                isExternalSeller && (
                  <div className="flex items-center ml-auto">
                    <Button size="sm" className="h-9 bg-primary text-white text-[9px] font-bold px-2" onClick={() => onIndicate(product)}>
                      Indicar
                    </Button>
                  </div>
                )
              )}
            </div>

            {/* Desktop Actions */}
            <div className={cn(
              "hidden md:flex flex-col gap-2",
              viewMode === 'list' ? "w-full" : "p-4 border-t border-border mt-2"
            )} onClick={(e) => e.stopPropagation()}>
              {product.name === 'Caçamba High Tip' && (
                <Button 
                  className="w-full bg-slate-950 hover:bg-slate-900 text-slate-100 text-xs h-9 font-bold border border-slate-800 shadow-sm flex items-center justify-center gap-1.5" 
                  onClick={() => onOpenDigitalSelection && onOpenDigitalSelection(product)}
                >
                  <Calculator className="h-4 w-4 text-amber-500 animate-pulse" /> Guia de Seleção Digital
                </Button>
              )}

              {product.models && product.models.length > 0 ? (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9" 
                  onClick={() => onSelectModels(product)}
                >
                  <List className="h-4 w-4 mr-2" /> Modelos ({product.models.length})
                </Button>
              ) : (
                isExternalSeller && (
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9" onClick={() => onIndicate(product)}>
                    Indicar
                  </Button>
                )
              )}

              {!isExternalSeller && product.video_url && (
                <Button variant="ghost" className="w-full text-xs text-muted-foreground bg-muted/30 hover:bg-muted/50 h-9" asChild>
                  <a href={product.video_url} target="_blank" rel="noreferrer">
                    <Video className="h-4 w-4 mr-2 text-red-500" /> Vídeo Demonstrativo
                  </a>
                </Button>
              )}

              <div className="flex gap-2 w-full">
                <Button 
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs h-9" 
                  onClick={handleWhatsAppShare}
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                </Button>
                 <Button 
                  variant="outline" 
                  className={cn(
                    "flex-1 border-border text-xs h-9",
                    isAnyFichaSupported(product) ? "text-foreground" : "hidden"
                  )}
                  onClick={() => openPdf(product.pdf_url || '', product.name, product)}
                  disabled={!isAnyFichaSupported(product)}
                >
                  <FileText className="h-4 w-4 mr-1.5" /> Ficha
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Catalog() {
  const { user, profile, realProfile, isManager, isAdmin, isExternalSeller, isMarketing, auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modelUploading, setModelUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductModels, setSelectedProductModels] = useState<Product | null>(null);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const [isHelperOpen, setIsHelperOpen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('roder_helper_isOpen');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleHelperChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsHelperOpen(customEvent.detail);
    };
    window.addEventListener('roder_helper_isOpen_changed', handleHelperChange);
    return () => {
      window.removeEventListener('roder_helper_isOpen_changed', handleHelperChange);
    };
  }, []);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('catalog_view_mode') as 'card' | 'list') || 'card';
  });

  const changeViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('catalog_view_mode', mode);
  };
  const [animationType, setAnimationType] = useState<'tilt' | 'rotate'>('rotate'); // Default to rotate as requested
  const [isHighTipFichaOpen, setIsHighTipFichaOpen] = useState(false);
  const [isFresaSshFichaOpen, setIsFresaSshFichaOpen] = useState(false);
  const [isTrituradorLoaderFaeFichaOpen, setIsTrituradorLoaderFaeFichaOpen] = useState(false);
  const [trituradorLoaderFaeDefaultModel, setTrituradorLoaderFaeDefaultModel] = useState<string>('fae-uml-ssl-vt-175');
  const [isEngateRapidoFichaOpen, setIsEngateRapidoFichaOpen] = useState(false);
  const [isGarraEstufagemFichaOpen, setIsGarraEstufagemFichaOpen] = useState(false);
  const [garraEstufagemDefaultModel, setGarraEstufagemDefaultModel] = useState<string>('af-360');
  const [suspendedProductModels, setSuspendedProductModels] = useState<Product | null>(null);
  const [suspendedViewingGallery, setSuspendedViewingGallery] = useState<Product | null>(null);
  const [fresaSshDefaultModel, setFresaSshDefaultModel] = useState<string>('ssh-150');
  const [isHighTipSelectorOpen, setIsHighTipSelectorOpen] = useState(false);
  const [isTechnicalDeliveryOpen, setIsTechnicalDeliveryOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isModelEditOpen, setIsModelEditOpen] = useState(false);
  const [editingModelData, setEditingModelData] = useState<any>(null);
  const [editingModelIndex, setEditingModelIndex] = useState<number | null>(null);
  const [modelVideoFile, setModelVideoFile] = useState<File | null>(null);
  const [productVideoFile, setProductVideoFile] = useState<File | null>(null);
  const [isEditingFromProductDialog, setIsEditingFromProductDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{id: string, name: string} | null>(null);
  const [applyImageToOtherModels, setApplyImageToOtherModels] = useState<string[]>([]);

  // Announcement states for new equipment notifications
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [announcementEquipment, setAnnouncementEquipment] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState(
    'Ficamos muito felizes em anunciar que possuímos novos equipamentos cadastrados e atualizados em nosso catálogo oficial Roder, prontos para serem compartilhados e enviados para os seus clientes!'
  );
  const [announcementLink, setAnnouncementLink] = useState(() => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://roder-indica-v2-142737915053.us-west1.run.app';
  });
  const [announcementSending, setAnnouncementSending] = useState(false);
  const [announcementProgress, setAnnouncementProgress] = useState({ current: 0, total: 0 });

  const handleSendAnnouncement = async () => {
    if (!announcementEquipment.trim()) {
      toast.error('Por favor, informe o nome do novo equipamento cadastrado.');
      return;
    }
    
    try {
      setAnnouncementSending(true);
      // Fetch all registered users
      const usersSnap = await getDocs(collection(db, 'users'));
      const userDocs = usersSnap.docs.map(doc => doc.data());
      
      // Filter out simulated and invalid emails
      const validUsers = userDocs.filter(u => {
        const email = (u.email || '').toLowerCase().trim();
        return email && 
               !email.endsWith('@mobile.roder.com.br') && 
               email.includes('@');
      });

      const uniqueEmails = Array.from(new Set(validUsers.map(u => u.email.toLowerCase().trim())));
      const total = uniqueEmails.length;
      
      if (total === 0) {
        toast.error('Nenhum usuário com e-mail válido encontrado no sistema.');
        setAnnouncementSending(false);
        return;
      }

      setAnnouncementProgress({ current: 0, total });
      
      const { sendEmail } = await import('../services/emailService');
      
      let successCount = 0;
      
      for (let i = 0; i < total; i++) {
        const email = uniqueEmails[i];
        setAnnouncementProgress(prev => ({ ...prev, current: i + 1 }));
        
        const subject = `📢 NOVIDADE NO RODER INDICA: Novo Equipamento ${announcementEquipment}`;
        const htmlText = `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="https://roderbrasil.com.br/wp-content/uploads/2024/05/Logo-Roder-Horizontal.png" alt="Roder Brasil" style="height: 55px; object-fit: contain;">
            </div>
            
            <h2 style="color: #15803d; text-align: center; font-size: 24px; margin-bottom: 10px;">Novos Equipamentos Cadastrados! 🚀</h2>
            <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #4b5563;">Olá, parceiro!</p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <p style="font-size: 16px; line-height: 1.6; color: #166534; font-weight: bold; margin-top: 0; margin-bottom: 5px;">Novidades no catálogo:</p>
              <p style="font-size: 18px; line-height: 1.6; color: #15803d; font-weight: 800; background: #ffffff; padding: 10px 15px; border-radius: 6px; border: 1px solid #dcfce7; display: inline-block; margin: 5px 0 15px 0; border-left: 4px solid #22c55e;">
                ${announcementEquipment}
              </p>
              
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1e3a1e;">
                ${announcementMessage}
              </p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; text-align: center; color: #4b5563;">Os novos produtos já estão disponíveis no sistema com todas as suas especificações técnicas, garras, pesos, vazões, pressões, fotos de alta qualidade e links de fichas técnicas para download rápido.</p>

            <p style="font-size: 15px; line-height: 1.6; text-align: center; font-weight: bold; margin-top: 25px; color: #1f2937;">Aproveite agora para prospectar seus clientes e enviar orçamentos personalizados diretamente do aplicativo!</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${announcementLink}" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">Acessar Catálogo Agora</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
              <strong>Roder Brasil</strong> - Tecnologia em Equipamentos Florestais e Agrícolas<br>
              Este é um comunicado oficial de anúncio de produto enviado para toda a equipe comercial.
            </p>
          </div>
        `;

        try {
          await sendEmail({
            to: email,
            subject,
            html: htmlText,
            fromName: 'Roder Brasil'
          });
          successCount++;
        } catch (err) {
          console.error(`Falha ao enviar e-mail para ${email}:`, err);
        }
        
        // Small delay to prevent SMTP flooding
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await AuditService.log(AuditAction.SYNC_PWA, `Disparou comunicado do produto: ${announcementEquipment} para ${successCount} vendedores.`);
      toast.success(`Comunicado enviado com sucesso para ${successCount} vendedores!`);
      setIsAnnouncementOpen(false);
      setAnnouncementEquipment('');
    } catch (error: any) {
      console.error('Error sending announcement:', error);
      toast.error('Erro ao enviar comunicado: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setAnnouncementSending(false);
    }
  };

  const [viewingGallery, setViewingGallery] = useState<Product | null>(null);

  // Catalog Image Lightbox States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image_url: '',
    video_url: '',
    pdf_url: '',
    image_zoom: 1,
    show_banner: false,
    is_banner: false,
    banner_message: '',
    parts_manual_url: '',
    is_blocked: false,
    models: [] as any[]
  });

  useEffect(() => {
    if (selectedProductModels) {
      const modelExistsInCurrent = selectedProductModels.models?.some(m => m.id === selectedModel?.id);
      if (!modelExistsInCurrent) {
        if (selectedProductModels.models && selectedProductModels.models.length > 0) {
          setSelectedModel(selectedProductModels.models[0]);
        } else {
          setSelectedModel(null);
        }
      }
    } else {
      setSelectedModel(null);
    }
  }, [selectedProductModels]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Auto-seed if empty
      if (data.length === 0) {
        seedInitialProducts();
      }

      // Seamlessly add or unblock Cabeçote Multifuncional for the owner if missing
      const cabecote = data.find(p => p.name === 'Cabeçote Multifuncional');
      const garraTracadora = data.find(p => p.name === 'Garra Traçadora');
      const miniSkidder = data.find(p => p.name === 'Mini Skidder');

      // Make Engate Rápido completely permanent for all users!
      const engateRapido = data.find(p => p.name?.toLowerCase().includes('engate'));
      if (!engateRapido && data.length > 0) {
        addEngateRapido();
      } else if (engateRapido?.is_blocked) {
        updateDoc(doc(db, 'products', engateRapido.id), { is_blocked: false });
      }

      // Make Garfo Paleteiro completely permanent for all users!
      const garfoPaleteiro = data.find(p => p.name === 'Garfo Paleteiro');
      if (!garfoPaleteiro && data.length > 0) {
        addGarfoPaleteiro();
      } else if (garfoPaleteiro) {
        if (garfoPaleteiro.is_blocked) {
          updateDoc(doc(db, 'products', garfoPaleteiro.id), { is_blocked: false });
        }
        const hasGpr4500 = garfoPaleteiro.models?.some((m: any) => m.id === 'gpr-4500');
        if (!hasGpr4500 && data.length > 0) {
          addGarfoPaleteiro();
        }
      }

      // Make Garfo Top Clamp completely permanent for all users!
      const garfoTopClamp = data.find(p => p.name === 'Garfo Top Clamp');
      if (!garfoTopClamp && data.length > 0) {
        addGarfoTopClamp();
      } else if (garfoTopClamp) {
        if (garfoTopClamp.is_blocked) {
          updateDoc(doc(db, 'products', garfoTopClamp.id), { is_blocked: false });
        }
        const hasTopClamp = garfoTopClamp.models?.some((m: any) => m.id === 'top-clamp');
        if (!hasTopClamp && data.length > 0) {
          addGarfoTopClamp();
        }
      }

      // Make Caçamba High Tip and Prolongador com Concha completely permanent for all users!
      const cacambaHighTip = data.find(p => p.name === 'Caçamba High Tip');
      if (!cacambaHighTip && data.length > 0) {
        addCacambaHighTip();
      } else if (cacambaHighTip) {
        if (cacambaHighTip.is_blocked) {
          updateDoc(doc(db, 'products', cacambaHighTip.id), { is_blocked: false });
        }
        const hasCht70 = cacambaHighTip.models?.some((m: any) => m.id === 'cht-70');
        const hasChtMedidas = cacambaHighTip.models?.some((m: any) => m.technical_specs?.medida_a !== undefined);
        const hasOldPeso = cacambaHighTip.models?.some((m: any) => m.technical_specs?.peso === 'A definir');
        
        if ((!hasCht70 || !hasChtMedidas || hasOldPeso) && data.length > 0) {
          addCacambaHighTip();
        }
      }

      const prolongadorConcha = data.find(p => p.name === 'Prolongador com Concha');
      if (!prolongadorConcha && data.length > 0) {
        addProlongadorComConcha();
      } else if (prolongadorConcha) {
        if (prolongadorConcha.is_blocked) {
          updateDoc(doc(db, 'products', prolongadorConcha.id), { is_blocked: false });
        }
        const hasPcr1400 = prolongadorConcha.models?.some((m: any) => m.id === 'pcr-1400');
        const hasConchaVolume = prolongadorConcha.models?.some((m: any) => m.technical_specs?.volume_concha !== undefined);
        if ((!hasPcr1400 || !hasConchaVolume) && data.length > 0) {
          addProlongadorComConcha();
        }
      }

      if (user?.email === 'roderbrasil@gmail.com' || user?.email === 'roderindica@gmail.com') {
        runSelfHealing(data, db);
        const fellerTesoura = data.find(p => p.name === 'Feller Tesoura');
        if (!fellerTesoura && data.length > 0) {
          addFellerTesoura();
        } else if (fellerTesoura?.is_blocked) {
          updateDoc(doc(db, 'products', fellerTesoura.id), { is_blocked: false });
        }

        if (!cabecote && data.length > 0) {
          addCabecoteMultifuncional();
        } else if (cabecote?.is_blocked) {
          updateDoc(doc(db, 'products', cabecote.id), { is_blocked: false });
        }

        const garraFrontal = data.find(p => p.name?.toLowerCase() === 'garra frontal');
        if (!garraFrontal && data.length > 0) {
          addGarraFrontal();
        }

        const garraEstufagem = data.find(p => p.name === 'Garra para Estufagem');
        if (!garraEstufagem && data.length > 0) {
          addGarraEstufagem();
        }

        const carregador = data.find(p => p.name?.toLowerCase() === 'carregador frontal');
        if (!carregador && data.length > 0) {
          addCarregadorFrontal();
        }

        if (!garraTracadora && data.length > 0) {
          addGarraTracadora();
        } else if (garraTracadora?.is_blocked) {
          updateDoc(doc(db, 'products', garraTracadora.id), { is_blocked: false });
        }

        if (!miniSkidder && data.length > 0) {
          addMiniSkidder();
        } else if (miniSkidder?.is_blocked) {
          updateDoc(doc(db, 'products', miniSkidder.id), { is_blocked: false });
        }

        const fellerDisco = data.find(p => p.name === 'Feller de Disco');
        if (!fellerDisco && data.length > 0) {
          addFellerDeDisco();
        } else if (fellerDisco?.is_blocked) {
          updateDoc(doc(db, 'products', fellerDisco.id), { is_blocked: false });
        }

        const destocadorBroca = data.find(p => p.name === 'Destocador Tipo Broca');
        if (!destocadorBroca && data.length > 0) {
          addDestocadorBroca();
        } else if (destocadorBroca?.is_blocked) {
          updateDoc(doc(db, 'products', destocadorBroca.id), { is_blocked: false });
        }

        const desbastadorFae = data.find(p => p.name === 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira');
        if (!desbastadorFae && data.length > 0) {
          addDesbastadorFlorestalFAE();
        } else if (desbastadorFae?.is_blocked) {
          updateDoc(doc(db, 'products', desbastadorFae.id), { is_blocked: false });
        }

        const trituradorLoaderFae = data.find(p => p.name === 'Triturador / Desbastador FAE p/ Pá Carregadeira');
        if (!trituradorLoaderFae && data.length > 0) {
          addTrituradorFAELoader();
        } else if (trituradorLoaderFae?.is_blocked) {
          updateDoc(doc(db, 'products', trituradorLoaderFae.id), { is_blocked: false });
        }

        const fresaSsh = data.find(p => p.name === 'FRESA FAE SSH');
        if (!fresaSsh && data.length > 0) {
          addFresaFAESSH();
        } else if (fresaSsh?.is_blocked) {
          updateDoc(doc(db, 'products', fresaSsh.id), { is_blocked: false });
        }
      }
      
      // Sort by sort_order if available, otherwise by created_at
      const sortedData = data.sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setProducts(sortedData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (location.state && (location.state as any).openProductId && products.length > 0) {
      const productId = (location.state as any).openProductId;
      const foundProduct = products.find(p => p.id === productId);
      if (foundProduct) {
        setViewingGallery(foundProduct);
        // Clean up state so it doesn't open again on page refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, products]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);
      
      const newOrder = arrayMove(products, oldIndex, newIndex) as Product[];
      setProducts(newOrder);

      if (!isAdmin && !isManager) return;

      try {
        const batch = newOrder.map((p: Product, index: number) => {
          return updateDoc(doc(db, 'products', p.id), {
            sort_order: index
          });
        });
        await Promise.all(batch);
      } catch (error) {
        console.error('Error saving order:', error);
        toast.error('Erro ao salvar nova ordem');
      }
    }
  };

  const addFellerDeDisco = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Feller de Disco'));
      const snap = await getDocs(q);
      
      const fellerDiscoData = {
        name: 'Feller de Disco',
        description: 'O Cabeçote Feller de Disco Roder oferece altíssima performance no corte e acumulação de árvores em florestas plantadas densas. Equipado com energia cinética armazenada em um disco robusto de corte contínuo e dentes de metal duro, garante velocidade incomparável e eficiência operacional máxima, operando com segurança e suavidade na base de escavadeiras hidráulicas.',
        category: 'Cabeçote Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-feller-de-disco.jpg.webp',
        video_url: '',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Feller-de-Disco-Roder.pdf',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'cfd-40',
            name: 'CFD 40',
            base_value: 0,
            images: [
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-feller-de-disco.jpg.webp'
            ],
            technical_specs: {
              diametro_corte: '400',
              peso: '2150',
              acumulador: 'SIM',
              dentes_disco: '18 dentes',
              maquina_base: '20 a 35 Ton.',
              pressao: '280',
              vazao: '250 a 350'
            }
          }
        ]
      };

      if (!snap.empty) {
        await updateDoc(doc(db, 'products', snap.docs[0].id), fellerDiscoData);
      } else {
        await addDoc(collection(db, 'products'), fellerDiscoData);
      }
      
      toast.success('Feller de Disco sincronizado com sucesso!');
    } catch (err) {
      console.error('Error adding Feller de Disco:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDestocadorBroca = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Destocador Tipo Broca'));
      const snap = await getDocs(q);
      
      const destocadorData = {
        name: 'Destocador Tipo Broca',
        description: 'O Destocador tipo Broca Roder é o equipamento patenteado ideal para a eliminação rápida, segura e sustentável de tocos através de perfuração circular com baixíssimo impacto e perturbação do solo. Projetado com alto coeficiente de engenharia de torque e dentes de metal duro intercambiáveis, garante eficiência máxima na preparação de solo e renovação de florestas plantadas.',
        category: 'Acessório Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/destocador.jpg.webp',
        video_url: 'https://youtu.be/Y7304GPW_p4',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Destocador-Roder.pdf',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'dth-240b',
            name: 'DTH 240B',
            base_value: 0,
            images: [
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/destocador.jpg.webp',
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-destocador-roder-03.jpg.webp'
            ],
            technical_specs: {
              diametro_corte: '240',
              peso: '750',
              maquina_base: '14 a 25 Ton.',
              pressao: '210 a 250',
              vazao: '120 a 180'
            }
          }
        ]
      };

      if (!snap.empty) {
        await updateDoc(doc(db, 'products', snap.docs[0].id), destocadorData);
      } else {
        await addDoc(collection(db, 'products'), destocadorData);
      }
      
      toast.success('Destocador Tipo Broca sincronizado com sucesso!');
    } catch (err) {
      console.error('Error adding Destocador Tipo Broca:', err);
    } finally {
      setLoading(false);
    }
  };

  const addFellerTesoura = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Feller Tesoura'));
      const snap = await getDocs(q);
      
      const fellerData = {
        name: 'Feller Tesoura',
        description: 'O Cabeçote Feller Tesoura Roder é a ferramenta ideal para a colheita florestal de biomassa e desbastes. Com alta produtividade e baixo custo de manutenção, este equipamento permite o corte e acúmulo de árvores de forma ágil e segura, sendo compatível com escavadeiras e carregadeiras florestais.',
        category: 'Cabeçote Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Feller-Tesoura.jpg.webp',
        video_url: 'https://www.youtube.com/embed/VP0FmUzJYRo',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Feller-Tesoura-Roder.pdf',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'cft-35',
            name: 'CFT 35',
            base_value: 0,
            technical_specs: {
              diametro_max_corte: '300 mm',
              peso: '900 kg',
              n_facas: '2',
              acumulador: 'NÃO',
              carregadeira: '9-12 Ton.',
              escavadeira: '12-16 Ton.',
              pressao: '220-260 bar'
            }
          },
          {
            id: 'cft-50',
            name: 'CFT 50',
            base_value: 0,
            images: [
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-feller-tesoura-02.jpg.webp',
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-feller-tesoura-01.jpg.webp',
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-cabecote-feller-tesoura-04.jpg.webp'
            ],
            technical_specs: {
              diametro_max_corte: '450 mm',
              peso: '1650 kg',
              n_facas: '1',
              acumulador: 'SIM',
              carregadeira: '12-16 Ton.',
              escavadeira: '16-22 Ton.',
              pressao: '220-260 bar'
            }
          },
          {
            id: 'cft-60',
            name: 'CFT 60',
            base_value: 0,
            technical_specs: {
              diametro_max_corte: '600 mm',
              peso: '1980 kg',
              n_facas: '2',
              acumulador: 'NÃO',
              carregadeira: '-',
              escavadeira: '22-25 Ton.',
              pressao: '220-260 bar'
            }
          },
          {
            id: 'cfta-60',
            name: 'CFTA 60',
            base_value: 0,
            technical_specs: {
              diametro_max_corte: '600 mm',
              peso: '2080 kg',
              n_facas: '2',
              acumulador: 'SIM',
              carregadeira: '-',
              escavadeira: '22-25 Ton.',
              pressao: '220-260 bar'
            }
          }
        ]
      };

      if (!snap.empty) {
        await updateDoc(doc(db, 'products', snap.docs[0].id), fellerData);
      } else {
        await addDoc(collection(db, 'products'), fellerData);
      }
      
      toast.success('Feller Tesoura sincronizado com sucesso!');
    } catch (err) {
      console.error('Error adding Feller Tesoura:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGarraTracadora = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Garra Traçadora'));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const productDoc = snap.docs[0];
        await updateDoc(doc(db, 'products', productDoc.id), { is_blocked: false });
        return;
      }

      const garra = {
        name: 'Garra Traçadora',
        description: 'A Garra Traçadora Roder é a ferramenta definitiva para o processamento de madeira em pátios ou no campo. Equipada com um sistema de serra hidráulica de alta performance, permite o traçamento preciso de toras simultaneamente ao carregamento, otimizando o tempo de ciclo e eliminando a necessidade de equipamentos adicionais para o corte.',
        category: 'Garras Florestais',
        image_url: 'https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg', // Placeholder image
        video_url: 'https://youtube.com/shorts/Z7-3cheDGSI?si=jh-RMEaw5F_WZcLm',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Tracadora-Roder.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'gt-280',
            name: 'GT 280',
            base_value: 0,
            technical_specs: {
              area_carga: '0,28',
              peso: '545',
              motor: '24 cc',
              sabre: '88 cm',
              corrente: '0,404"',
              maquina_base: '5 a 10 Ton.',
              pressao: '200 a 240',
              vazao: '80 a 150'
            }
          },
          {
            id: 'gt-360',
            name: 'GT 360',
            base_value: 0,
            technical_specs: {
              area_carga: '0,36',
              peso: '700',
              motor: '24 cc',
              sabre: '100 cm',
              corrente: '0,404"',
              maquina_base: '8 a 16 Ton.',
              pressao: '200 a 250',
              vazao: '100 a 200'
            }
          },
          {
            id: 'gt-600x',
            name: 'GT 600x',
            base_value: 0,
            technical_specs: {
              area_carga: '0,60',
              peso: '1300',
              motor: '60 cc',
              sabre: '48" | 52"',
              corrente: '3/4"',
              maquina_base: '16 a 22 Ton.',
              pressao: '220 a 250',
              vazao: '180 a 250'
            }
          },
          {
            id: 'gt-800x',
            name: 'GT 800x',
            base_value: 0,
            technical_specs: {
              area_carga: '0,80',
              peso: '1440',
              motor: '80 cc',
              sabre: '58"',
              corrente: '3/4"',
              maquina_base: '20 a 30 Ton.',
              pressao: '220 a 250',
              vazao: '200 a 250'
            }
          },
          {
            id: 'gt-1000x',
            name: 'GT 1000x',
            base_value: 0,
            technical_specs: {
              area_carga: '1,00',
              peso: '1650',
              motor: '-',
              sabre: '65"',
              corrente: '3/4"',
              maquina_base: '25 a 35 Ton.',
              pressao: '240 a 300',
              vazao: '220 a 300'
            }
          }
        ]
      };
      
      await addDoc(collection(db, 'products'), garra);
      toast.success('Garra Traçadora adicionada com sucesso!');
    } catch (err) {
      console.error('Error adding Garra Traçadora:', err);
      toast.error('Erro ao adicionar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const addMiniSkidder = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Mini Skidder'));
      const snap = await getDocs(q);
      
      const skidderData = {
        name: 'Mini Skidder',
        description: 'O Mini Skidder Roder é o equipamento ideal para arraste de madeira em curtas distâncias, oferecendo agilidade e robustez para sua operação florestal. Sua construção simplificada e alto desempenho garantem eficiência no campo.',
        category: 'Equipamento de Arraste',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-mini-skidder.jpg.webp',
        video_url: 'https://www.youtube.com/watch?v=Kzqi_Cn2WG4',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Mini-Skidder-Roder.pdf',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'msr-600',
            name: 'MSR 600',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Mini-Skidder-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Mini-Skidder-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-mini-skidder.jpg.webp'],
            technical_specs: {
              area_da_garra: '0,60 m²',
              potencia_do_trator: '110-160 HP',
              capacidade_de_carga: '1800',
              peso_do_equipamento: '550',
              abertura_maxima: '1280'
            }
          },
          {
            id: 'msr-1000',
            name: 'MSR 1000',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Mini-Skidder-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Mini-Skidder-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-mini-skidder.jpg.webp'],
            technical_specs: {
              area_da_garra: '1,00 m²',
              potencia_do_trator: '145-200 CV',
              capacidade_de_carga: '3000',
              peso_do_equipamento: '750',
              abertura_maxima: '1500'
            }
          }
        ]
      };

      if (!snap.empty) {
        const productDoc = snap.docs[0];
        await updateDoc(doc(db, 'products', productDoc.id), skidderData);
      } else {
        await addDoc(collection(db, 'products'), skidderData);
      }
      
      toast.success('Mini Skidder atualizado com sucesso!');
    } catch (err) {
      console.error('Error adding Mini Skidder:', err);
      toast.error('Erro ao adicionar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const addCabecoteMultifuncional = async () => {
    try {
      setLoading(true);
      
      // Check if it already exists (even if blocked)
      const q = query(collection(db, 'products'), where('name', '==', 'Cabeçote Multifuncional'));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // If it exists, just unblock it
        const productDoc = snap.docs[0];
        await updateDoc(doc(db, 'products', productDoc.id), { is_blocked: false });
        toast.success('Cabeçote Multifuncional reativado com sucesso!');
        return;
      }

      const cabecote = {
        name: 'Cabeçote Multifuncional',
        description: 'O Cabeçote Multifuncional Roder é a solução ideal para colheita florestal, oferecendo versatilidade e alto desempenho em diferentes tipos de madeira e condições de terreno.',
        category: 'Cabeçote Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg',
        video_url: 'https://youtu.be/yK7pnHbW8rE',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Cabecote-Multifuncional-Roder.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'cmf-500',
            name: 'CMF 500',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg'],
            technical_specs: {
              diametro_corte: '500',
              sabre: '88 cm',
              corrente: '0,404',
              vazao: '100 a 200',
              pressao: '200 a 220',
              peso_operacional: '8 a 22 Ton.',
              motor: '24 cc'
            }
          },
          {
            id: 'cmf-600',
            name: 'CMF 600',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg'],
            technical_specs: {
              diametro_corte: '600',
              sabre: '45"',
              corrente: '3/4"',
              vazao: '150 a 200',
              pressao: '200 a 240',
              peso_operacional: '13 a 22 Ton.',
              motor: '60 cc'
            }
          },
          {
            id: 'cmf-800',
            name: 'CMF 800',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg'],
            technical_specs: {
              diametro_corte: '800',
              sabre: '48"',
              corrente: '3/4"',
              vazao: '200 a 250',
              pressao: '200 a 240',
              peso_operacional: '20 a 30 Ton.',
              motor: '60 cc'
            }
          }
        ]
      };
      
      await addDoc(collection(db, 'products'), cabecote);
      toast.success('Cabeçote Multifuncional adicionado com sucesso!');
    } catch (err) {
      console.error('Error adding Cabeçote:', err);
      toast.error('Erro ao adicionar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const addCarregadorFrontal = async () => {
    try {
      setLoading(true);
      // Search for either version of the name to avoid duplication
      const qOld = query(collection(db, 'products'), where('name', '==', 'Carregador Frontal Roder'));
      const qNew = query(collection(db, 'products'), where('name', '==', 'Carregador frontal'));
      const snapOld = await getDocs(qOld);
      const snapNew = await getDocs(qNew);
      
      const existingDoc = !snapNew.empty ? snapNew.docs[0] : (!snapOld.empty ? snapOld.docs[0] : null);

      const carregadorData = {
        name: 'Carregador frontal',
        description: 'O Carregador Frontal Roder é um equipamento robusto e versátil, projetado para otimizar o carregamento e movimentação de materiais em diversas aplicações. Com construção reforçada e sistemas hidráulicos de alta precisão, oferece durabilidade e eficiência operacional superior.',
        category: 'Carregadores e Garras',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp',
        video_url: 'https://www.youtube.com/watch?v=nUj95ImEqb0',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Carregador-Frontal-Roder.pdf',
        is_blocked: false,
        created_at: !existingDoc ? new Date().toISOString() : (existingDoc.data() as any).created_at,
        models: [
          {
            id: 'cfr-280',
            name: 'CFR 280',
            base_value: 0,
            technical_specs: {
              trator: '4 a 6 Ton.',
              peso: '800 kg',
              abertura_total: '1465 mm',
              diametro_max_carga: '550 mm',
              comprimento_giro: '2200 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp']
          },
          {
            id: 'cfr-400',
            name: 'CFR 400',
            base_value: 0,
            technical_specs: {
              trator: '6 a 8 Ton.',
              peso: '930 kg',
              abertura_total: '1900 mm',
              diametro_max_carga: '760 mm',
              comprimento_giro: '2200 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp']
          },
          {
            id: 'crf-600',
            name: 'CRF 600',
            base_value: 0,
            technical_specs: {
              trator: '8 a 10 Ton.',
              peso: '1300 kg',
              abertura_total: '1900 mm',
              diametro_max_carga: '760 mm',
              comprimento_giro: '3000 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp']
          },
          {
            id: 'cfr-800',
            name: 'CFR 800',
            base_value: 0,
            technical_specs: {
              trator: '10 a 17 Ton.',
              peso: '1650 kg',
              abertura_total: '2120 mm',
              diametro_max_carga: '840 mm',
              comprimento_giro: '3000 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal-01.jpg.webp']
          },
          {
            id: 'crf-1000',
            name: 'CRF 1000',
            base_value: 0,
            technical_specs: {
              trator: '14 a 18 Ton.',
              peso: '1880 kg',
              abertura_total: '2670 mm',
              diametro_max_carga: '1040 mm',
              comprimento_giro: '3000 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp']
          },
          {
            id: 'crf-1200',
            name: 'CRF 1200',
            base_value: 0,
            technical_specs: {
              trator: '17 a 21 Ton.',
              peso: '2100 kg',
              abertura_total: '3015 mm',
              diametro_max_carga: '1170 mm',
              comprimento_giro: '3000 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp']
          },
          {
            id: 'cfr-1500',
            name: 'CFR 1500',
            base_value: 0,
            technical_specs: {
              trator: '17 a 21 Ton.',
              peso: '2386 kg',
              abertura_total: '3430 mm',
              diametro_max_carga: '1340 mm',
              comprimento_giro: '3000 mm'
            },
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-carregador-frontal.jpg.webp']
          }
        ]
      };
      
      if (existingDoc) {
        await updateDoc(doc(db, 'products', existingDoc.id), carregadorData);
      } else {
        await addDoc(collection(db, 'products'), carregadorData);
      }
      
      toast.success('Carregador frontal atualizado com sucesso!');
    } catch (err) {
      console.error('Error adding Carregador Frontal:', err);
      toast.error('Erro ao adicionar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const addProlongadorComConcha = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Prolongador com Concha'));
      const snap = await getDocs(q);

      const prolongadorData = {
        name: 'Prolongador com Concha',
        description: 'O Prolongador com Concha Roder (também conhecido como Prolongador com Caçamba) é um equipamento robusto e de alta produtividade, especially projetado para acoplamento em pás carregadeiras florestais e industriais. Proporciona maior alcance vertical e horizontal na movimentação de materiais a granel, biomassa, cavacos, serragem e resíduos em geral. Fabricado em aço estrutural de alta resistência mecânica, garante máxima estabilidade e segurança nas operações de carregamento de caminhões basculantes e carretas graneleiras de grande porte.',
        category: 'Carregadores e Garras',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-prolongador-com-concha.jpg.webp',
        video_url: '',
        pdf_url: '',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'pcr-1400',
            name: 'PCR 1400',
            base_value: 0,
            pdf_url: '',
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-prolongador-com-concha.jpg.webp'],
            technical_specs: {
              maquina_base: '6 a 10 Ton.',
              trator: '6 a 10 Ton.',
              volume_concha: '1,4 m³',
              peso: '900',
              capacidade_de_carga: '800'
            }
          },
          {
            id: 'pcr-1700',
            name: 'PCR 1700',
            base_value: 0,
            pdf_url: '',
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-prolongador-com-concha.jpg.webp'],
            technical_specs: {
              maquina_base: '6 a 10 Ton.',
              trator: '6 a 10 Ton.',
              volume_concha: '1,7 m³',
              peso: '975',
              capacidade_de_carga: '1350'
            }
          },
          {
            id: 'pcr-3000',
            name: 'PCR 3000',
            base_value: 0,
            pdf_url: '',
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-prolongador-com-concha.jpg.webp'],
            technical_specs: {
              maquina_base: '10 a 17 Ton.',
              trator: '10 a 17 Ton.',
              volume_concha: '3,0 m³',
              peso: '1530',
              capacidade_de_carga: '1600'
            }
          }
        ]
      };

      if (!snap.empty) {
        await updateDoc(doc(db, 'products', snap.docs[0].id), prolongadorData);
      } else {
        await addDoc(collection(db, 'products'), prolongadorData);
      }
      toast.success('Prolongador com Concha sincronizado com sucesso!');
    } catch (err) {
      console.error('Error adding Prolongador com Concha:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCacambaHighTip = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Caçamba High Tip'));
      const snap = await getDocs(q);
      
      const cacambaData = {
        name: 'Caçamba High Tip',
        description: 'A Caçamba High Tip Roder, também conhecida como Caçamba de Despejo Alto, é a escolha ideal para operações que exigem o despejo de materiais em pontos elevados, como caminhões basculantes, carretas graneleiras, silos, moegas ou contêineres altos.\n\nProjetada para ser acoplada a carregadeiras de pneus, a caçamba High Tip da Roder proporciona maior alcance vertical e excelente capacidade volumétrica, garantindo eficiência logística e menor tempo de ciclo nas operações de carga e descarga.',
        category: 'Carregadores e Garras',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp',
        video_url: '',
        pdf_url: 'https://roderbrasil.com.br/maquinas-florestais/cacamba-high-tip/',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'cht-20',
            name: 'Caçamba High Tip 2,0 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '2,0 m³',
              peso: '1.000 kg',
              maquina_base: '8 a 10 Ton.',
              tipo_material: 'Material leve e volumoso ou pesado em compactas',
              medida_a: '900 mm',
              medida_b: '2.400 mm',
              medida_c: '1.600 mm'
            }
          },
          {
            id: 'cht-25',
            name: 'Caçamba High Tip 2,5 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '2,5 m³',
              peso: '1.800 kg',
              maquina_base: '10 a 12 Ton.',
              tipo_material: 'Pesado / Médio em máquinas pequenas',
              medida_a: '1.125 mm',
              medida_b: '2.780 mm',
              medida_c: '1.800 mm'
            }
          },
          {
            id: 'cht-28',
            name: 'Caçamba High Tip 2,8 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '2,8 m³',
              peso: '1.800 kg',
              maquina_base: '12 a 14 Ton.',
              tipo_material: 'Pesado / Médio em máquinas médias',
              medida_a: '1.210 mm',
              medida_b: '2.786 mm',
              medida_c: '1.800 mm'
            }
          },
          {
            id: 'cht-30',
            name: 'Caçamba High Tip 3,0 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '3,0 m³',
              peso: '1.800 kg',
              maquina_base: '10 a 12 Ton. (Leve) / 14 a 18 Ton. (Pesado)',
              tipo_material: 'Leve (máq. pequenas) ou Pesado (máq. médias)',
              medida_a: '1.295 mm',
              medida_b: '2.786 mm',
              medida_c: '1.800 mm'
            }
          },
          {
            id: 'cht-40',
            name: 'Caçamba High Tip 4,0 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '4,0 m³',
              peso: '2.000 kg',
              maquina_base: '12 a 14 Ton. (Leve)',
              tipo_material: 'Leve / Volumoso em máquinas médias',
              medida_a: '1.350 mm',
              medida_b: '2.800 mm',
              medida_c: '2.300 mm'
            }
          },
          {
            id: 'cht-50',
            name: 'Caçamba High Tip 5,0 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '5,0 m³',
              peso: '2.200 kg',
              maquina_base: '14 a 18 Ton. (Leve)',
              tipo_material: 'Leve / Altamente volumoso',
              medida_a: '1.360 mm',
              medida_b: '2.950 mm',
              medida_c: '2.700 mm'
            }
          },
          {
            id: 'cht-70',
            name: 'Caçamba High Tip 7,0 m³',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp'],
            technical_specs: {
              capacidade: '7,0 m³',
              peso: '2.500 kg',
              maquina_base: '16 a 18 Ton. (Leve / Volumoso)',
              tipo_material: 'Materiais extremamente leves (cavacos, serragem, casca de pinus)',
              medida_a: '1.500 mm',
              medida_b: '2.950 mm',
              medida_c: '2.800 mm'
            }
          }
        ]
      };

      if (!snap.empty) {
        await updateDoc(doc(db, 'products', snap.docs[0].id), cacambaData);
      } else {
        await addDoc(collection(db, 'products'), cacambaData);
      }
      toast.success('Caçamba High Tip sincronizada com sucesso!');
    } catch (err) {
      console.error('Error adding Caçamba High Tip:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEngateRapido = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('name', '==', 'Engate Rápido para Pá Carregadeiras'));
      const snap = await getDocs(q);
      
      const engateData = {
        name: 'Engate Rápido para Pá Carregadeiras',
        description: 'O Engate Rápido Hidráulico Roder para pás carregadeiras é um equipamento de alta performance projetado exclusivamente sob medida para cada marca e modelo de máquina. Com sistema acionado de dentro da cabine via botão, o operador realiza o engate e desengate de implementos (como caçamba original e garfo pallet) sem a necessidade de sair da cabine, garantindo máxima eficiência operacional e segurança física. A Roder fornece junto ao orçamento a instalação completa da linha hidráulica extra na pá carregadeira. O sistema pode ser configurado em 3ª função padrão (2 vias, ideal para engate rápido e implementos fixos como a Garra Frontal ou garras de estufagem AF) ou em 3ª e 4ª funções extras (4 vias, necessária para equipamentos rotativos com rotador, como o Carregador Frontal ou garras de estufagem AFG com giro, permitindo giro e fechamento simultâneo).',
        category: 'Carregadores e Garras',
        image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800',
        video_url: '',
        pdf_url: 'https://roderbrasil.com.br/maquinas-florestais/engate-rapido/',
        is_blocked: false,
        created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
        models: [
          {
            id: 'er-sob-medida',
            name: 'Engate Rápido Sob Medida',
            base_value: 0,
            images: ['https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800'],
            technical_specs: {
              maquina_base: 'Dimensionado sob medida para cada marca/modelo',
              instalacao_hidraulica: '3ª Função (2 vias) ou 3ª+4ª Função (4 vias)',
              acionamento: 'Eletro-hidráulico de dentro da cabine',
              tempo_de_ciclo: 'Troca de implementos em menos de 30 segundos',
              compatibilidade: 'Caçamba original, garfo pallet, concha High Tip, garras'
            }
          }
        ]
      };

      if (!snap.empty) {
        await updateDoc(doc(db, 'products', snap.docs[0].id), engateData);
      } else {
        await addDoc(collection(db, 'products'), engateData);
      }
      toast.success('Engate Rápido sincronizado com sucesso!');
    } catch (err) {
      console.error('Error adding Engate Rápido:', err);
    } finally {
      setLoading(false);
    }
  };

   const addGarraFrontal = async () => {
     try {
       setLoading(true);
       // Fetch all products to check case-insensitively
       const snapAll = await getDocs(collection(db, 'products'));
       const existingDoc = snapAll.docs.find(d => d.data().name?.toLowerCase() === 'garra frontal');
       
       const garraData = {
         name: 'Garra Frontal',
         description: 'A Garra Frontal Roder é projetada para o carregamento e movimentação de toras com máxima agilidade. Compatível com diversos modelos de pás carregadeiras, oferece alta durabilidade e eficiência operacional em pátios de madeira e indústrias.',
         category: 'Carregadores e Garras',
         image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-Frontal.jpg.webp',
         video_url: 'https://roderbrasil.com.br/maquinas-florestais/garra-frontal/',
         pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Frontal-Roder.pdf',
         is_blocked: false,
         created_at: !existingDoc ? new Date().toISOString() : (existingDoc.data() as any).created_at,
         models: [
           {
             id: 'grf-1200',
             name: 'GRF 1200',
             base_value: 0,
             pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Frontal-Roder.pdf',
             images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-frontal-01.jpg.webp'],
             technical_specs: { 
               trator: '8 a 14 Ton.',
               peso: '970',
               area_carga: '1,2 M²',
               medida_a: '1315',
               medida_b: '1476',
               medida_c: '1260'
             }
           },
           {
             id: 'grf-2000',
             name: 'GRF 2000',
             base_value: 0,
             pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Frontal-Roder.pdf',
             images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-garra-frontal-04.jpg.webp'],
             technical_specs: { 
               trator: '12 a 17 Ton.',
               peso: '1200',
               area_carga: '2,0 M²',
               medida_a: '1900',
               medida_b: '2000',
               medida_c: '1260'
             }
           }
         ]
       };

       if (existingDoc) {
         await updateDoc(doc(db, 'products', existingDoc.id), garraData);
       } else {
         await addDoc(collection(db, 'products'), garraData);
       }
       
       toast.success('Garra frontal atualizada com sucesso!');
     } catch (err) {
       console.error('Error adding Garra frontal:', err);
     } finally {
       setLoading(false);
     }
   };

   const addGarraEstufagem = async () => {
     try {
       setLoading(true);
       const snapAll = await getDocs(collection(db, 'products'));
       const existingDoc = snapAll.docs.find(d => d.data().name === 'Garra para Estufagem');
       
       const garraData = {
         name: 'Garra para Estufagem',
         description: 'A Garra para Estufagem Roder é a solução definitiva para o carregamento e descarregamento de toras em containers (estufagem) ou vagões. Projetada para oferecer máxima eficiência e agilidade, este equipamento conta com sistema giratório opcional e construção robusta para suportar regimes de trabalho intensos, garantindo segurança e produtividade na sua logística de madeira.',
         category: 'Garras Florestais',
         image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp',
         video_url: 'https://youtu.be/yK7pnHbW8rE',
         pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-para-Estufagem-Roder.pdf',
         is_blocked: false,
         created_at: !existingDoc ? new Date().toISOString() : (existingDoc.data() as any).created_at,
         models: [
           {
             id: 'af-360',
             name: 'AF - 360',
             base_value: 0,
             technical_specs: { 
               maquina_base: 'Empilhadeira',
               peso_operacional: '2,4 a 4,0',
               area_da_garra: '0,36 m³',
               peso: '680',
               capacidade_de_carga: '800'
             }
           },
           {
             id: 'af-400',
             name: 'AF - 400',
             base_value: 0,
             technical_specs: { 
               maquina_base: 'Pá Carregadeira',
               peso_operacional: '6 a 10',
               area_da_garra: '0,36 m³',
               peso: '680',
               capacidade_de_carga: '800'
             }
           },
           {
             id: 'af-600',
             name: 'AF - 600',
             base_value: 0,
             technical_specs: { 
               maquina_base: 'Pá Carregadeira',
               peso_operacional: '10 a 14',
               area_da_garra: '0,60 m³',
               peso: '1300',
               capacidade_de_carga: '1200'
             }
           },
           {
             id: 'af-800',
             name: 'AF - 800',
             base_value: 0,
             technical_specs: { 
               maquina_base: 'Pá Carregadeira',
               peso_operacional: '12 a 17',
               area_da_garra: '0,80 m³',
               peso: '1500',
               capacidade_de_carga: '1600'
             }
           },
           {
             id: 'afg-600',
             name: 'AFG-600',
             base_value: 0,
             images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp'],
             technical_specs: { 
               maquina_base: 'Pá Carregadeira',
               peso_operacional: '10 a 17',
               area_da_garra: '0,60 m³',
               peso: '1550',
               capacidade_de_carga: '1200',
               giro_360: 'Sim'
             }
           },
           {
             id: 'afg-800',
             name: 'AFG-800',
             base_value: 0,
             images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garra-para-Estufagem-giratoria.jpg.webp'],
             technical_specs: { 
               maquina_base: 'Pá Carregadeira',
               peso_operacional: '12 a 17',
               area_da_garra: '0,80 m³',
               peso: '1820',
               capacidade_de_carga: '1600',
               giro_360: 'Sim'
             }
           }
         ]
       };

       if (existingDoc) {
         await updateDoc(doc(db, 'products', existingDoc.id), garraData);
       } else {
         await addDoc(collection(db, 'products'), garraData);
       }
       
       toast.success('Garra para Estufagem sincronizada com sucesso!');
     } catch (err) {
       console.error('Error adding Garra para Estufagem:', err);
     } finally {
       setLoading(false);
     }
   };

    const addGarfoPaleteiro = async () => {
      try {
        setLoading(true);
        const snapAll = await getDocs(collection(db, 'products'));
        const existingDoc = snapAll.docs.find(d => d.data().name?.toLowerCase() === 'garfo paleteiro');
        
        const garfoData = {
          name: 'Garfo Paleteiro',
          description: 'O Garfo Paleteiro Roder para pás carregadeiras é um equipamento de alta robustez e excelente capacidade de carga, projetado para otimizar a movimentação de pallets, madeiras e fardos em ambientes industriais, florestais e agrícolas. Fabricado sob medida, garante perfeita compatibilidade mecânica, segurança absoluta e alta durabilidade na operação.',
          category: 'Carregadores e Garras',
          image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garfo-Paleteiro.jpg.webp',
          video_url: '',
          pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Roder.pdf',
          is_blocked: false,
          created_at: !existingDoc ? new Date().toISOString() : (existingDoc.data() as any).created_at,
          models: [
            {
              id: 'gpr-4500',
              name: 'GPR 4500',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Roder.pdf',
              images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garfo-Paleteiro.jpg.webp'],
              technical_specs: {
                trator: '6 a 9 Ton.',
                peso_do_equipamento: '520',
                capacidade_de_carga: '4500',
                altura_total: '1500',
                largura_total: '1380',
                comprimento_util_garfo: '1200'
              }
            },
            {
              id: 'gpr-7000',
              name: 'GPR 7000',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Roder.pdf',
              images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Garfo-Paleteiro.jpg.webp'],
              technical_specs: {
                trator: '8 a 12 Ton.',
                peso_do_equipamento: '600',
                capacidade_de_carga: '7000',
                altura_total: '1500',
                largura_total: '1380',
                comprimento_util_garfo: '1200'
              }
            }
          ]
        };

        if (existingDoc) {
          await updateDoc(doc(db, 'products', existingDoc.id), garfoData);
        } else {
          await addDoc(collection(db, 'products'), garfoData);
        }
        
        toast.success('Garfo Paleteiro sincronizado com sucesso!');
      } catch (err) {
        console.error('Error adding Garfo Paleteiro:', err);
      } finally {
        setLoading(false);
      }
    };

    const addGarfoTopClamp = async () => {
      try {
        setLoading(true);
        const snapAll = await getDocs(collection(db, 'products'));
        const existingDoc = snapAll.docs.find(d => d.data().name?.toLowerCase() === 'garfo top clamp');
        
        const topClampData = {
          name: 'Garfo Top Clamp',
          description: 'O Garfo Paleteiro com Top Clamp (prensa superior) Roder é a solução definitiva para o manuseio seguro, ágil e altamente produtivo de toras, madeiras, fardos e paletes. Projetado para pás carregadeiras de 9 a 17 toneladas, o equipamento combina a versatilidade dos garfos paleteiros com o travamento hidráulico superior do Top Clamp, impedindo a queda ou escorregamento dos materiais durante o transporte em terrenos irregulares.',
          category: 'Carregadores e Garras',
          image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-garfo-top-clamp.jpg.webp',
          video_url: '',
          pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Top-Clamp.pdf',
          is_blocked: false,
          created_at: !existingDoc ? new Date().toISOString() : (existingDoc.data() as any).created_at,
          models: [
            {
              id: 'top-clamp',
              name: 'TOP CLAMP',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garfo-Paleteiro-Top-Clamp.pdf',
              images: ['https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/06/img-garfo-top-clamp.jpg.webp'],
              technical_specs: {
                trator: '9 - 17 Ton.',
                peso_do_equipamento: '1220',
                capacidade_de_carga: '7000',
                medida_a: '1900',
                medida_b: '1530',
                medida_c: '1600',
                medida_d: '1800'
              }
            }
          ]
        };

        if (existingDoc) {
          await updateDoc(doc(db, 'products', existingDoc.id), topClampData);
        } else {
          await addDoc(collection(db, 'products'), topClampData);
        }
        
        toast.success('Garfo Top Clamp sincronizado com sucesso!');
      } catch (err) {
        console.error('Error adding Garfo Top Clamp:', err);
      } finally {
        setLoading(false);
      }
    };

    const addDesbastadorFlorestalFAE = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('name', '==', 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira'));
        const snap = await getDocs(q);
        
        const desbastadorData = {
          name: 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira',
          description: 'O desbastador florestal é um equipamento robusto e eficiente utilizado principalmente em atividades de manejo florestal, como a limpeza de terrenos, remoção de vegetação densa e preparação de áreas para plantio ou construção.',
          category: 'Triturador Florestal',
          image_url: 'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg',
          video_url: 'https://youtu.be/MM6lKPveo0A',
          pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL1_EX.pdf',
          is_blocked: false,
          created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
          models: [
            {
              id: 'fae-bl0-ex',
              name: 'FAE BL0/EX',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL0_EX.pdf',
              images: [
                'db-file://tpaBKAFko6LXkBTbjYBr',
                'db-file://YyvWLpsskmBHVznLiSSC',
                'db-file://eavAWBFBYBssN8fmaCCd'
              ],
              technical_specs: {
                peso_do_equipamento: '290 a 325',
                maquina_base: '2 a 4 Ton.',
                pressao: '180 a 250',
                vazao: '50 a 90',
                diametro_max_trituracao: '80 mm (8 cm)',
                tipo_dente: 'Mini BL (Bite Limiter) / Lâmina ou Martelo Vídea (Fixo)'
              }
            },
            {
              id: 'fae-pml-ex',
              name: 'FAE PML/EX',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/PML_EX.pdf',
              images: [
                'db-file://o250muUq0PnA7fQR5nCR',
                'db-file://QsxxAqUDFJRo40oMtXpt',
                'db-file://uigCh3oqg876krXWU0qa'
              ],
              technical_specs: {
                peso_do_equipamento: '190 a 210',
                maquina_base: '1.5 a 5.5 Ton.',
                pressao: '150 a 220',
                vazao: '20 a 90',
                diametro_max_trituracao: '50 mm (5 cm)',
                tipo_dente: 'Mini PML Lâminas Y ou Martelos PML'
              }
            },
            {
              id: 'fae-bl1-ex-vt',
              name: 'FAE BL1/EX/VT',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL1_EX.pdf',
              video_url: 'https://youtu.be/MM6lKPveo0A',
              images: [
                'db-file://KxCghJ5QsKPTfZaoAR7R',
                'db-file://4y38tfNrliO7S3VXj9nT',
                'db-file://sS0Iavw9T0X4n0GDW4az',
                'db-file://65MBZrx9KoO7oJ947rgS'
              ],
              technical_specs: {
                peso_do_equipamento: '350 a 410',
                maquina_base: '4 a 8 Ton.',
                pressao: '180 a 350',
                vazao: '50 a 140',
                diametro_max_trituracao: '120 mm (12 cm)',
                tipo_dente: 'Mini BL (Bite Limiter) dentes fixos planos com Vídea'
              }
            },
            {
              id: 'fae-dml-hy',
              name: 'FAE DML/HY',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/DML_HY.pdf',
              images: [
                'db-file://8h8pALZN9iG5fd4Q9Snb',
                'db-file://mhymO2tQOxcvGSqUS4h4',
                'db-file://ohgeHtitPErHqIgDMHI7'
              ],
              technical_specs: {
                peso_do_equipamento: '490 a 590',
                maquina_base: '5 a 13 Ton.',
                pressao: '200 a 350',
                vazao: '50 a 160',
                diametro_max_trituracao: '120 mm (12 cm)',
                tipo_dente: 'Dentes cilíndricos tipo E com Vídea'
              }
            },
            {
              id: 'fae-bl2-ex-vt',
              name: 'FAE BL2/EX/VT',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL2_EX.pdf',
              images: [
                'db-file://US9zYchyK8uPhI2ymmd0',
                'db-file://hM1qTk09k1O977KpPSSV'
              ],
              technical_specs: {
                peso_do_equipamento: '645 a 750',
                maquina_base: '8 a 14 Ton.',
                pressao: '200 a 350',
                vazao: '80 a 150',
                diametro_max_trituracao: '150 mm (15 cm)',
                tipo_dente: 'Dentes fixos planos de Vídea com tecnologia Bite Limiter'
              }
            },
            {
              id: 'fae-bl3-ex-vt',
              name: 'FAE BL3/EX/VT',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL3_EX.pdf',
              video_url: 'https://youtu.be/8FpMPUB7-jE',
              images: [
                'db-file://8tiM6rH16NMur1q4xqOv',
                'db-file://jw4WyK6lEiyBgjIYErPd',
                'db-file://2Cj5FikMsYfxGC7kObpG'
              ],
              technical_specs: {
                peso_do_equipamento: '1050 a 1250',
                maquina_base: '14 a 20 Ton.',
                pressao: '220 a 350',
                vazao: '100 a 200',
                diametro_max_trituracao: '200 mm (20 cm)',
                tipo_dente: 'Dentes fixos BL3 de Vídea tipo plano com limitador'
              }
            },
            {
              id: 'fae-uml-ex-vt',
              name: 'FAE UML/EX/VT',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/UML_EX.pdf',
              images: [
                'db-file://GuwOnI3DutvvG4fZn1h5',
                'db-file://L8gy9gjs9CSUcIf2M6mA',
                'db-file://Dwtp2CuoZNYB5bBIUzG4'
              ],
              technical_specs: {
                peso_do_equipamento: '1100 a 1350',
                maquina_base: '14 a 20 Ton.',
                pressao: '220 a 350',
                vazao: '110 a 220',
                diametro_max_trituracao: '200 mm (20 cm)',
                tipo_dente: 'Dentes fixos de Vídea tipo C/3 ou dente Blade C/3/W'
              }
            },
            {
              id: 'fae-uml-s-ex-vt',
              name: 'FAE UML/S/EX/VT',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/pdf/catalogo-triturador-debastador-fae-uml-s-ex-vt.pdf',
              video_url: 'https://youtu.be/1DCvCoX9W3w',
              images: [
                'db-file://YMeLIo2amVNuUgto0c3G',
                'db-file://rorAafjsU30y9P9W2g9o',
                'db-file://EueQzUxvKuDIiEwQmdpK'
              ],
              technical_specs: {
                peso_do_equipamento: '1340 a 1580',
                maquina_base: '18 a 25 Ton.',
                pressao: '220 a 350',
                vazao: '120 a 250',
                diametro_max_trituracao: '250 mm (25 cm)',
                tipo_dente: 'Dentes fixos de Vídea tipo C/3 ou dente Blade C/3/W'
              }
            },
            {
              id: 'fae-umm-ex-vt',
              name: 'FAE UMM/EX/VT',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/UMM_EX.pdf',
              video_url: 'https://youtu.be/1-94slIjaoA',
              images: [
                'db-file://SLdlo717yZP2smStzcnJ',
                'db-file://En5ZqIOVmzb1uoBm9JCn',
                'db-file://tvABksEedUjzZdNWqzcr'
              ],
              technical_specs: {
                peso_do_equipamento: '1550 a 1880',
                maquina_base: '20 a 30 Ton.',
                pressao: '220 a 350',
                vazao: '150 a 300',
                diametro_max_trituracao: '300 mm (30 cm)',
                tipo_dente: 'Dentes fixos de Vídea tipo C/3 ou dente HD'
              }
            }
          ]
        };

        // No dynamic enhancement (it overwrites custom and restored models images)

        if (snap.docs.length > 0) {
          await updateDoc(doc(db, 'products', snap.docs[0].id), desbastadorData);
        } else {
          await addDoc(collection(db, 'products'), desbastadorData);
        }
        
        toast.success('Desbastador Florestal FAE sincronizado com sucesso!');
      } catch (err) {
        console.error('Error adding Desbastador Florestal FAE:', err);
      } finally {
        setLoading(false);
      }
    };

    const addTrituradorFAELoader = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('name', '==', 'Triturador / Desbastador FAE p/ Pá Carregadeira'));
        const snap = await getDocs(q);
        
        const trituradorLoaderData = {
          name: 'Triturador / Desbastador FAE p/ Pá Carregadeira',
          description: 'O Triturador/Desbastador Florestal FAE para Pás Carregadeiras (Mulcher) é um equipamento de alta performance desenvolvido para trabalhos pesados de manejo florestal, limpeza de áreas e trituração de restos vegetais. Compatível com os modelos de pás carregadeiras Caterpillar equipadas com preparação original de fábrica para Mulcher.',
          category: 'Triturador Florestal',
          image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp',
          video_url: '',
          pdf_url: '',
          is_blocked: false,
          created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
          models: [
            {
              id: 'fae-uml-ssl-vt-175',
              name: 'FAE UML SSL VT 175',
              base_value: 0,
              pdf_url: '',
              images: [
                'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-fae-uml-ssl-vt.jpg.webp'
              ],
              technical_specs: {
                maquina_base: 'CAT 924K',
                motor: '75 - 120 hp',
                vazao: '120 - 200 L/min',
                pressao: '200 - 350 bar',
                largura_trabalho: '1.820 mm',
                largura_total: '2.120 mm',
                peso: '1.400 kg',
                diametro_rotor: '425 mm',
                diametro_max_trituracao: '200 mm',
                numero_de_dentes: '36 + 2',
                tipo_dente: 'C/3 (Vídia) ou Lâmina BL'
              }
            },
            {
              id: 'fae-140-u-pm-200',
              name: 'FAE 140 U PM 200',
              base_value: 0,
              pdf_url: '',
              images: [
                'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-triturador-florestal-cat-930.jpg.webp'
              ],
              technical_specs: {
                maquina_base: 'CAT 930K / 938K',
                motor: '180 - 300 hp',
                vazao: '150 - 360 L/min',
                pressao: '250 - 415 bar',
                largura_trabalho: '2.064 mm',
                largura_total: '2.464 mm',
                peso: '2.960 kg',
                diametro_rotor: '500 mm',
                diametro_max_trituracao: '350 mm',
                numero_de_dentes: '42 + 2',
                tipo_dente: 'C/3 (Vídia) ou Lâmina BL'
              }
            }
          ]
        };

        if (snap.docs.length > 0) {
          await updateDoc(doc(db, 'products', snap.docs[0].id), trituradorLoaderData);
        } else {
          await addDoc(collection(db, 'products'), trituradorLoaderData);
        }
        
        toast.success('Triturador FAE para Pá Carregadeira sincronizado com sucesso!');
      } catch (err) {
        console.error('Error adding Triturador FAE Loader:', err);
      } finally {
        setLoading(false);
      }
    };

    const addFresaFAESSH = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('name', '==', 'FRESA FAE SSH'));
        const snap = await getDocs(q);
        
        const fresaSshData = {
          name: 'FRESA FAE SSH',
          description: 'A Fresa FAE SSH é um triturador de tocos e pedras de alta performance, desenvolvido, testado e homologado exclusivamente para operar com tratores de alta potência equipados com transmissão CVT (Continuously Variable Transmission). Garante máxima eficiência na destoca em linha, limpeza de áreas florestais, e preparação de solo.',
          category: 'Triturador Florestal',
          image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
          video_url: 'https://youtu.be/1nEPwzt8K4k',
          pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
          is_blocked: false,
          created_at: snap.empty ? new Date().toISOString() : (snap.docs[0].data() as any).created_at,
          models: [
            {
              id: 'fae-ssh-150',
              name: 'SSH 150',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
              video_url: 'https://youtu.be/1nEPwzt8K4k',
              images: [
                'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
              ],
              technical_specs: {
                trator_hp: '160 - 280 hp',
                pto_rpm: '1000 rpm',
                largura_de_trabalho_mm: '1600 mm',
                largura_total_mm: '1980 mm',
                peso_kg: '3690 kg',
                diametro_do_rotor_mm: '900 mm',
                diametro_max_de_trituracao_mm: '700 mm (70 cm)',
                profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
                numero_de_dentes: '58 + 4'
              }
            },
            {
              id: 'fae-ssh-200',
              name: 'SSH 200',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
              images: [
                'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
              ],
              technical_specs: {
                trator_hp: '200 - 360 (400) hp',
                pto_rpm: '1000 rpm',
                largura_de_trabalho_mm: '2080 mm',
                largura_total_mm: '2472 mm',
                peso_kg: '4850 kg',
                diametro_do_rotor_mm: '900 mm',
                diametro_max_de_trituracao_mm: '700 mm (70 cm)',
                profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
                numero_de_dentes: '78 + 4'
              }
            },
            {
              id: 'fae-ssh-225',
              name: 'SSH 225',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
              images: [
                'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
              ],
              technical_specs: {
                trator_hp: '200 - 360 (400) hp',
                pto_rpm: '1000 rpm',
                largura_de_trabalho_mm: '2320 mm',
                largura_total_mm: '2712 mm',
                peso_kg: '5200 kg',
                diametro_do_rotor_mm: '900 mm',
                diametro_max_de_trituracao_mm: '700 mm (70 cm)',
                profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
                numero_de_dentes: '88 + 4'
              }
            },
            {
              id: 'fae-ssh-250',
              name: 'SSH 250',
              base_value: 0,
              pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/09/CATALOGO-TRATORES-compactado.pdf',
              video_url: 'https://www.youtube.com/watch?v=na5Z2tLWMgA',
              images: [
                'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg'
              ],
              technical_specs: {
                trator_hp: '240 - 360 (400) hp',
                pto_rpm: '1000 rpm',
                largura_de_trabalho_mm: '2560 mm',
                largura_total_mm: '2950 mm',
                peso_kg: '5600 kg',
                diametro_do_rotor_mm: '900 mm',
                diametro_max_de_trituracao_mm: '700 mm (70 cm)',
                profundidade_max_de_trabalho_mm: '500 mm (50 cm)',
                numero_de_dentes: '98 + 4'
              }
            }
          ]
        };

        if (snap.docs.length > 0) {
          await updateDoc(doc(db, 'products', snap.docs[0].id), fresaSshData);
        } else {
          await addDoc(collection(db, 'products'), fresaSshData);
        }
        
        toast.success('Fresa FAE SSH sincronizada com sucesso!');
      } catch (err) {
        console.error('Error adding Fresa FAE SSH:', err);
      } finally {
        setLoading(false);
      }
    };

  const seedInitialProducts = async () => {
    const initialProducts = [
      {
        name: 'Garra Florestal',
        description: 'Equipamento de alta performance projetado para o manuseio preciso de toras em ambientes florestais exigentes. Construída com aço de alta resistência, a Garra Florestal Roder oferece o melhor equilíbrio entre peso e capacidade de carga, garantindo produtividade e longevidade para sua operação.',
        category: 'Garras Florestais',
        image_url: 'https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg',
        video_url: 'https://www.youtube.com/watch?v=Kzqi_Cn2WG4',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          { 
            id: 'r250', 
            name: 'R250', 
            base_value: 15000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '0,25', diametro_minimo: '100', abertura_maxima: '1190', peso: '160', pressao_trabalho: '180', maquina_base: '5-8 Ton.' } 
          },
          { 
            id: 'r280', 
            name: 'R280', 
            base_value: 18000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '0,28', diametro_minimo: '140', abertura_maxima: '1465', peso: '250', pressao_trabalho: '180', maquina_base: '6-10 Ton.' } 
          },
          { 
            id: 'r360', 
            name: 'R360', 
            base_value: 22000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '0,36', diametro_minimo: '170', abertura_maxima: '1830', peso: '330', pressao_trabalho: '180', maquina_base: '8-12 Ton.' } 
          },
          { 
            id: 'r400', 
            name: 'R400', 
            base_value: 26000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '0,40', diametro_minimo: '180', abertura_maxima: '1905', peso: '360', pressao_trabalho: '180', maquina_base: '12-18 Ton.' } 
          },
          { 
            id: 'r600', 
            name: 'R600', 
            base_value: 35000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '0,60', diametro_minimo: '190', abertura_maxima: '2130', peso: '710', pressao_trabalho: '190', maquina_base: '14-22 Ton.' } 
          },
          { 
            id: 'r800', 
            name: 'R800', 
            base_value: 42000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '0,80', diametro_minimo: '230', abertura_maxima: '2675', peso: '890', pressao_trabalho: '190', maquina_base: '18-25 Ton.' } 
          },
          { 
            id: 'r1000', 
            name: 'R1000', 
            base_value: 55000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '1,00', diametro_minimo: '400', abertura_maxima: '3015', peso: '1125', pressao_trabalho: '220', maquina_base: '22-30 Ton.' } 
          },
          { 
            id: 'r1200', 
            name: 'R1200', 
            base_value: 68000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '1,20', diametro_minimo: '400', abertura_maxima: '3430', peso: '1410', pressao_trabalho: '220', maquina_base: '24-35 Ton.' } 
          },
          { 
            id: 'r1400', 
            name: 'R1400', 
            base_value: 85000, 
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            parts_manual_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Garra-Florestal-Roder.pdf',
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/05/garra-florestal-roder.jpg'],
            technical_specs: { area_carga: '1,40', diametro_minimo: '400', abertura_maxima: '3450', peso: '1500', pressao_trabalho: '220', maquina_base: '25-35 Ton.' } 
          },
        ]
      },
      {
        name: 'Cabeçote Multifuncional',
        description: 'O Cabeçote Multifuncional Roder é a solução ideal para colheita florestal, oferecendo versatilidade e alto desempenho em diferentes tipos de madeira e condições de terreno.',
        category: 'Cabeçote Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg',
        video_url: 'https://youtu.be/yK7pnHbW8rE',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Cabecote-Multifuncional-Roder.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'cmf-500',
            name: 'CMF 500',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg'],
            technical_specs: {
              diametro_corte: '500',
              sabre: '88 cm',
              corrente: '0,404',
              vazao: '100 a 200',
              pressao: '200 a 220',
              peso_operacional: '8 a 22 Ton.',
              motor: '24 cc'
            }
          },
          {
            id: 'cmf-600',
            name: 'CMF 600',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg'],
            technical_specs: {
              diametro_corte: '600',
              sabre: '45"',
              corrente: '3/4"',
              vazao: '150 a 200',
              pressao: '200 a 240',
              peso_operacional: '13 a 22 Ton.',
              motor: '60 cc'
            }
          },
          {
            id: 'cmf-800',
            name: 'CMF 800',
            base_value: 0,
            images: ['https://roderbrasil.com.br/wp-content/uploads/2021/06/Cabecote-Multifuncional-Roder.jpg'],
            technical_specs: {
              diametro_corte: '800',
              sabre: '48"',
              corrente: '3/4"',
              vazao: '200 a 250',
              pressao: '200 a 240',
              peso_operacional: '20 a 30 Ton.',
              motor: '60 cc'
            }
          }
        ]
      },
      {
        name: 'Feller de Disco',
        description: 'O Cabeçote Feller de Disco Roder oferece altíssima performance no corte e acumulação de árvores em florestas plantadas densas. Equipado com energia cinética armazenada em um disco robusto de corte contínuo e dentes de metal duro, garante velocidade incomparável e eficiência operacional máxima, operando com segurança e suavidade na base de escavadeiras hidráulicas.',
        category: 'Cabeçote Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-feller-de-disco.jpg.webp',
        video_url: '',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Feller-de-Disco-Roder.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'cfd-40',
            name: 'CFD 40',
            base_value: 0,
            images: [
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-feller-de-disco.jpg.webp'
            ],
            technical_specs: {
              diametro_corte: '400',
              peso: '2150',
              acumulador: 'SIM',
              dentes_disco: '18 dentes',
              maquina_base: '20 a 35 Ton.',
              pressao: '280',
              vazao: '250 a 350'
            }
          }
        ]
      },
      {
        name: 'Destocador Tipo Broca',
        description: 'O Destocador tipo Broca Roder é o equipamento patenteado ideal para a eliminação rápida, segura e sustentável de tocos através de perfuração circular com baixíssimo impacto e perturbação do solo. Projetado com alto coeficiente de engenharia de torque e dentes de metal duro intercambiáveis, garante eficiência máxima na preparação de solo e renovação de florestas plantadas.',
        category: 'Acessório Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/destocador.jpg.webp',
        video_url: 'https://youtu.be/Y7304GPW_p4',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/10/Destocador-Roder.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'dth-240b',
            name: 'DTH 240B',
            base_value: 0,
            images: [
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/destocador.jpg.webp',
              'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2024/07/img-destocador-roder-03.jpg.webp'
            ],
            technical_specs: {
              diametro_corte: '240',
              peso: '750',
              maquina_base: '14 a 25 Ton.',
              pressao: '210 a 250',
              vazao: '120 a 180'
            }
          }
        ]
      },
      {
        name: 'Desbastador Florestal FAE para Escavadeiras e Retroescavadeira',
        description: 'O desbastador florestal é um equipamento robusto e eficiente utilizado principalmente em atividades de manejo florestal, como a limpeza de terrenos, remoção de vegetação densa e preparação de áreas para plantio ou construção.',
        category: 'Triturador Florestal',
        image_url: 'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg',
        video_url: 'https://youtu.be/MM6lKPveo0A',
        pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL1_EX.pdf',
        is_blocked: false,
        created_at: new Date().toISOString(),
        models: [
          {
            id: 'fae-bl0-ex',
            name: 'FAE BL0/EX',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL0_EX.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-bl0-ex.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '290 a 325',
              maquina_base: '2 a 4 Ton.',
              pressao: '180 a 250',
              vazao: '50 a 90',
              diametro_max_trituracao: '80 mm (8 cm)',
              tipo_dente: 'Mini BL (Bite Limiter) / Lâmina ou Martelo Vídea (Fixo)'
            }
          },
          {
            id: 'fae-pml-ex',
            name: 'FAE PML/EX',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/PML_EX.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-pml-ex.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '190 a 210',
              maquina_base: '1.5 a 5.5 Ton.',
              pressao: '150 a 220',
              vazao: '20 a 90',
              diametro_max_trituracao: '50 mm (5 cm)',
              tipo_dente: 'Mini PML Lâminas Y ou Martelos PML'
            }
          },
          {
            id: 'fae-bl1-ex-vt',
            name: 'FAE BL1/EX/VT',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL1_EX.pdf',
            video_url: 'https://youtu.be/MM6lKPveo0A',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-bl1-ex-vt.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '350 a 410',
              maquina_base: '4 a 8 Ton.',
              pressao: '180 a 350',
              vazao: '50 a 140',
              diametro_max_trituracao: '120 mm (12 cm)',
              tipo_dente: 'Mini BL (Bite Limiter) dentes fixos planos com Vídea'
            }
          },
          {
            id: 'fae-dml-hy',
            name: 'FAE DML/HY',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/DML_HY.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-dml-hy.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '490 a 590',
              maquina_base: '5 a 13 Ton.',
              pressao: '200 a 350',
              vazao: '50 a 160',
              diametro_max_trituracao: '120 mm (12 cm)',
              tipo_dente: 'Dentes cilíndricos tipo E com Vídea'
            }
          },
          {
            id: 'fae-bl2-ex-vt',
            name: 'FAE BL2/EX/VT',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL2_EX.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-bl2-ex-vt.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '645 a 750',
              maquina_base: '8 a 14 Ton.',
              pressao: '200 a 350',
              vazao: '80 a 150',
              diametro_max_trituracao: '150 mm (15 cm)',
              tipo_dente: 'Dentes fixos planos de Vídea com tecnologia Bite Limiter'
            }
          },
          {
            id: 'fae-bl3-ex-vt',
            name: 'FAE BL3/EX/VT',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/BL3_EX.pdf',
            video_url: 'https://youtu.be/8FpMPUB7-jE',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-bl3-ex-vt.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '1050 a 1250',
              maquina_base: '14 a 20 Ton.',
              pressao: '220 a 350',
              vazao: '100 a 200',
              diametro_max_trituracao: '200 mm (20 cm)',
              tipo_dente: 'Dentes fixos BL3 de Vídea tipo plano com limitador'
            }
          },
          {
            id: 'fae-uml-ex-vt',
            name: 'FAE UML/EX/VT',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/UML_EX.pdf',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-uml-ex-vt.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '1100 a 1350',
              maquina_base: '14 a 20 Ton.',
              pressao: '220 a 350',
              vazao: '110 a 220',
              diametro_max_trituracao: '200 mm (20 cm)',
              tipo_dente: 'Dentes C/3/HD planos com Vídea'
            }
          },
          {
            id: 'fae-uml-s-ex-vt',
            name: 'FAE UML/S/EX/VT',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/pdf/catalogo-triturador-debastador-fae-uml-s-ex-vt.pdf',
            video_url: 'https://youtu.be/1DCvCoX9W3w',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-uml-s-ex-vt.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '1350 a 1600',
              maquina_base: '18 a 25 Ton.',
              pressao: '220 a 350',
              vazao: '120 a 250',
              diametro_max_trituracao: '250 mm (25 cm)',
              tipo_dente: 'Dentes fixos de Vídea tipo C/3/HD ou dentes planos F'
            }
          },
          {
            id: 'fae-umm-ex-vt',
            name: 'FAE UMM/EX/VT',
            base_value: 0,
            pdf_url: 'https://roderbrasil.com.br/wp-content/uploads/2025/08/UMM_EX.pdf',
            video_url: 'https://youtu.be/1-94slIjaoA',
            images: [
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae-umm-ex-vt.jpg',
              'https://roderbrasil.com.br/wp-content/uploads/2021/05/triturador-florestal-fae.jpg'
            ],
            technical_specs: {
              peso_do_equipamento: '1700 a 1950',
              maquina_base: '20 a 30 Ton.',
              pressao: '220 a 350',
              vazao: '150 a 300',
              diametro_max_trituracao: '300 mm (30 cm)',
              tipo_dente: 'Dentes fixos reforçados tipo UMM/HD com Vídea'
            }
          }
        ]
      }
    ];

    for (const prod of initialProducts) {
      await addDoc(collection(db, 'products'), prod);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      image_url: product.image_url || '',
      video_url: product.video_url || '',
      pdf_url: product.pdf_url || '',
      image_zoom: product.image_zoom || 1,
      show_banner: !!product.show_banner,
      is_banner: !!product.is_banner,
      banner_message: product.banner_message || '',
      parts_manual_url: product.parts_manual_url || '',
      is_blocked: !!product.is_blocked,
      models: product.models || []
    });
    setImageUrlInput(product.image_url);
    setIsDialogOpen(true);
  };

  const smartUploadVideo = async (file: File | null, path: string): Promise<string> => {
    if (!file) return '';
    try {
      toast.loading(`Processando vídeo: ${file.name}...`, { id: 'video-upload' });
      // Clean filename
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storageRef = ref(storage, `${path}/${Date.now()}_${cleanName}`);
      
      // Upload bytes
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      toast.success('Vídeo disponível!', { id: 'video-upload' });
      return url;
    } catch (err: any) {
      console.error('Error uploading video:', err);
      toast.error('Erro ao enviar vídeo: ' + (err.message || ''), { id: 'video-upload' });
      return '';
    }
  };

  const smartUpload = async (fileOrBase64: File | string, path: string): Promise<string> => {
    if (!fileOrBase64) return '';
    if (typeof fileOrBase64 === 'string' && !fileOrBase64.startsWith('data:image/')) return fileOrBase64;

    try {
      let blob: Blob;
      let fileName: string;
      let base64Data: string;

      if (typeof fileOrBase64 === 'string') {
        base64Data = fileOrBase64;
        // Correct base64 to blob conversion without fetch
        const part = fileOrBase64.split(';base64,');
        const contentType = part[0].split(':')[1];
        const raw = window.atob(part[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        blob = new Blob([uInt8Array], { type: contentType });
        fileName = `pasted_${Date.now()}.${contentType.split('/')[1] || 'jpg'}`;
      } else {
        // If it's a file, compress it first if it's large
        const compressed = fileOrBase64.size > 200 * 1024 ? await compressImage(fileOrBase64) : fileOrBase64;
        blob = compressed;
        fileName = fileOrBase64.name || `image_${Date.now()}.png`;
        
        // Need to read as base64 for Firestore fallback
        base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      // Priority 1: Firestore (app_files) for small files - very fast
      if (blob.size < 900 * 1024 && blob.type.startsWith('image/')) {
        try {
          console.log(`SmartUpload: Using Firestore for ${fileName} (${blob.size} bytes)`);
          const docRef = await addDoc(collection(db, 'app_files'), {
            name: fileName,
            type: blob.type,
            data: base64Data,
            created_at: new Date().toISOString()
          });
          return `db-file://${docRef.id}`;
        } catch (e) {
          console.warn('Firestore upload failed, falling back to Storage', e);
        }
      }

      // Priority 2: Storage
      console.log(`SmartUpload: Using Storage for ${fileName} (${blob.size} bytes)`);
      try {
        const storageRef = ref(storage, `${path}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        await uploadBytes(storageRef, blob, { contentType: blob.type });
        return await getDownloadURL(storageRef);
      } catch (storageError: any) {
        console.warn(`Direct client-side Firebase Storage upload failed for ${fileName}. Trying robust server-side proxy fallback...`, storageError);
        try {
          const uploadFile = blob instanceof File ? blob : new File([blob], fileName, { type: blob.type });
          const formDataObj = new FormData();
          formDataObj.append('image', uploadFile);
          formDataObj.append('folder', path);
          
          const baseUrl = getApiBaseUrl();
          const proxyRes = await fetch(`${baseUrl}/api/upload-image`, {
            method: 'POST',
            credentials: 'include',
            body: formDataObj
          });
          
          if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data.success && data.url) {
              console.log("Server fallback upload successful!", data.url);
              return data.url;
            }
          }
          throw new Error('Server proxy upload failed or returned invalid response');
        } catch (fallbackError) {
          console.error("Both direct and proxy fallbacks failed for upload:", fallbackError);
          throw storageError;
        }
      }
    } catch (error) {
      console.error('Error in smartUpload:', error);
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name) {
      toast.error('O nome do produto é obrigatório');
      return;
    }
    setSubmitting(true);
    let isOperationFinished = false;

    // Timeout safety to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (!isOperationFinished) {
        setSubmitting(false);
        toast.error('O salvamento está demorando mais que o esperado. Verifique sua conexão ou tente uma imagem menor.', { id: 'save-product-toast', duration: 5000 });
      }
    }, 90000); // Increased to 90s

    try {
      let imageUrl = imageUrlInput || editingProduct?.image_url || '';
      if (imageFile) {
        toast.loading('Enviando imagem principal...', { id: 'save-product-toast' });
        imageUrl = await smartUpload(imageFile, 'products');
      }

      let videoUrl = formData.video_url || '';
      if (productVideoFile) {
        toast.loading('Enviando vídeo do produto...', { id: 'save-product-toast' });
        videoUrl = await smartUploadVideo(productVideoFile, 'product_videos');
        setProductVideoFile(null);
      }

      toast.loading('Processando modelos...', { id: 'save-product-toast' });
      
        // Upload any base64 images in models
        const finalModels = await Promise.all(formData.models.map(async (m, idx) => {
          const technical_sheet_image = await smartUpload(m.technical_sheet_image, 'technical_sheets_img');
          const images = await Promise.all((m.images || []).map(async (img: string) => {
            return await smartUpload(img, 'model_images');
          }));
          
          return { ...m, technical_sheet_image, images };
        }));

      // Sanitize models to avoid undefined values which crash Firestore
      const sanitizedModels = finalModels.map(m => {
        const specs: any = {};
        if (m.technical_specs) {
          Object.keys(m.technical_specs).forEach(key => {
            const val = m.technical_specs[key];
            specs[key] = val !== undefined && val !== null ? String(val) : '';
          });
        }
        return {
          ...m,
          base_value: Number(m.base_value) || 0,
          pdf_url: m.pdf_url || '',
          parts_manual_url: m.parts_manual_url || '',
          video_url: m.video_url || '',
          images: m.images || [],
          technical_specs: specs
        };
      });

      const productData = {
        ...formData,
        models: sanitizedModels,
        image_url: imageUrl,
        video_url: videoUrl,
        image_zoom: formData.image_zoom || 1,
        show_banner: !!formData.show_banner,
        banner_message: formData.banner_message || '',
        updated_at: new Date().toISOString(),
      };

      const needsApproval = !isAdmin && !isManager;

      if (needsApproval) {
        toast.loading('Enviando para Fila de Aprovação (Encriptado)...', { id: 'save-product-toast' });
        const encryptedData = await CryptoService.encrypt(productData);
        
        await addDoc(collection(db, 'approval_queue'), {
          type: 'product_catalog',
          action: editingProduct ? 'update' : 'create',
          target_id: editingProduct?.id || '',
          entity_name: productData.name,
          data_encrypted: encryptedData,
          submitted_by_name: realProfile?.name || auth.currentUser?.email || 'Sistema',
          submitted_by_uid: auth.currentUser?.uid || '',
          status: 'pending',
          created_at: new Date().toISOString()
        });

        await AuditService.log(AuditAction.SYNC_PWA, `Enviou ${productData.name} para aprovação (Encriptado)`);
        toast.success('Solicitação enviada para aprovação do Administrador.', { id: 'save-product-toast' });
      } else {
        if (editingProduct) {
          await updateDoc(doc(db, 'products', editingProduct.id), productData);
          await AuditService.log(AuditAction.SYNC_PWA, `Atualizou produto: ${productData.name}`);
          toast.success('Produto atualizado com sucesso!', { id: 'save-product-toast' });
        } else {
          await addDoc(collection(db, 'products'), {
            ...productData,
            is_blocked: false,
            created_at: new Date().toISOString(),
          });
          await AuditService.log(AuditAction.SYNC_PWA, `Criou novo produto: ${productData.name}`);
          toast.success('Produto adicionado ao catálogo!', { id: 'save-product-toast' });
        }
      }

      isOperationFinished = true;
      clearTimeout(timeoutId);
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      isOperationFinished = true;
      clearTimeout(timeoutId);
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'), { id: 'save-product-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      category: '', 
      image_url: '',
      video_url: '', 
      pdf_url: '', 
      image_zoom: 1,
      show_banner: false,
      is_banner: false,
      banner_message: '',
      parts_manual_url: '',
      is_blocked: false,
      models: [] 
    });
    setImageFile(null);
    setImageUrlInput('');
    setEditingProduct(null);
  };

  const toggleBlock = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        is_blocked: !product.is_blocked
      });
      toast.info(product.is_blocked ? 'Produto desbloqueado' : 'Produto bloqueado');
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  };

  const toggleBanner = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        show_banner: !product.show_banner
      });
      toast.success(product.show_banner ? 'Removido dos destaques' : 'Adicionado aos destaques do Dashboard');
    } catch (error: any) {
      toast.error('Erro ao alterar destaque: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    const toastId = toast.loading('Movendo para Lixeira Segura...');
    try {
      // 1. Get full product data
      const prodSnap = await getDoc(doc(db, 'products', productToDelete.id));
      if (!prodSnap.exists()) throw new Error('Produto não encontrado');
      
      const prodData = prodSnap.data();

      // 2. Encrypt sensitive data (or whole object)
      const encryptedData = await CryptoService.encrypt(prodData);

      // 3. Move to trash_bin with metadata
      await addDoc(collection(db, 'trash_bin'), {
        original_id: productToDelete.id,
        collection: 'products',
        entity_name: productToDelete.name,
        entity_type: 'Produto/Catálogo',
        data_encrypted: encryptedData,
        deleted_at: new Date().toISOString(),
        deleted_by_name: profile?.name || user?.email || 'Sistema',
        deleted_by_uid: user?.uid || ''
      });

      // 4. Delete from main collection
      await deleteDoc(doc(db, 'products', productToDelete.id));
      
      await AuditService.log(AuditAction.DELETE_PRODUCT, `Moveu catálogo para lixeira: ${productToDelete.name}`);
      toast.success('Produto movido para a Lixeira Segura.', { id: toastId });
      setProductToDelete(null);
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message, { id: toastId });
    }
  };

  const handleIndicate = (product: Product) => {
    navigate('/indicacoes/nova', { state: { product_name: product.name } });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let imageFound = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFound = true;
        const file = items[i].getAsFile();
        if (file) {
          toast.loading('Processando imagem colada...', { id: 'paste-toast' });
          const compressed = await compressImage(file);
          setImageFile(compressed);
          toast.success('Imagem colada com sucesso!', { id: 'paste-toast' });
        }
      }
    }
    
    if (!imageFound) {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && (pastedText.startsWith('http') || pastedText.startsWith('data:image'))) {
        setImageUrlInput(fixGoogleDriveLink(pastedText));
        toast.success('Link de imagem colado!');
      }
    }
  };

  const handleModelGalleryPaste = async (e: React.ClipboardEvent, idx: number) => {
    const items = e.clipboardData.items;
    let imageFound = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFound = true;
        const file = items[i].getAsFile();
        if (file) {
          try {
            toast.loading('Processando imagem colada...', { id: 'gallery-paste' });
            const url = await smartUpload(file, 'model_images');
            
            if (isModelEditOpen && editingModelData) {
              const currentImages = editingModelData.images || [];
              setEditingModelData({ ...editingModelData, images: [...currentImages, url] });
            } else {
              const newModels = formData.models.map((m, i) => {
                if (i === idx) {
                  const currentImages = m.images || [];
                  return { ...m, images: [...currentImages, url] };
                }
                return m;
              });
              setFormData({ ...formData, models: newModels });
            }
            toast.success('Imagem colada com sucesso!', { id: 'gallery-paste' });
          } catch (err) { 
            toast.error('Erro ao processar imagem colada'); 
          }
        }
      }
    }
    
    if (!imageFound) {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && pastedText.startsWith('http')) {
        const fixedUrl = fixGoogleDriveLink(pastedText);
        if (isModelEditOpen && editingModelData) {
          const currentImages = editingModelData.images || [];
          setEditingModelData({ ...editingModelData, images: [...currentImages, fixedUrl] });
        } else {
          const newModels = formData.models.map((m, i) => {
            if (i === idx) {
              const currentImages = m.images || [];
              return { ...m, images: [...currentImages, fixedUrl] };
            }
            return m;
          });
          setFormData({ ...formData, models: newModels });
        }
        toast.success('Link de imagem adicionado!');
      }
    }
  };

  const handleModelSheetPaste = async (e: React.ClipboardEvent, idx: number) => {
    const items = e.clipboardData.items;
    let imageFound = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFound = true;
        const file = items[i].getAsFile();
        if (file) {
          try {
            toast.loading('Processando imagem colada...', { id: 'sheet-paste' });
            const url = await smartUpload(file, 'technical_sheets_img');
            
            if (isModelEditOpen && editingModelData) {
              setEditingModelData({ ...editingModelData, technical_sheet_image: url });
            } else {
              const newModels = formData.models.map((m, i) => 
                i === idx ? { ...m, technical_sheet_image: url } : m
              );
              setFormData({ ...formData, models: newModels });
            }
            toast.success('Imagem colada com sucesso!', { id: 'sheet-paste' });
          } catch (err) {
            toast.error('Erro ao processar imagem colada', { id: 'sheet-paste' });
          }
        }
      }
    }

    if (!imageFound) {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && pastedText.startsWith('http')) {
        const fixedUrl = fixGoogleDriveLink(pastedText);
        if (isModelEditOpen && editingModelData) {
          setEditingModelData({ ...editingModelData, technical_sheet_image: fixedUrl });
        } else {
          const newModels = formData.models.map((m, i) => 
            i === idx ? { ...m, technical_sheet_image: fixedUrl } : m
          );
          setFormData({ ...formData, models: newModels });
        }
        toast.success('Link de ficha técnica adicionado!');
      }
    }
  };

  const cleanTextForEngate = (text: string, isEngateProduct: boolean) => {
    if (!text) return text;
    let cleaned = text;
    if (isEngateProduct) {
      cleaned = cleaned.replace(/escavadeira\s+recomendada/gi, 'Pá Carregadeira');
      cleaned = cleaned.replace(/engate\s+rápido\s+recomendada/gi, 'Pá Carregadeira');
    }
    cleaned = cleaned.replace(/segurança,?\s*bloqueio\s+mecânico\s+secundário\s+com\s+trava\.?/gi, '');
    cleaned = cleaned.replace(/bloqueio\s+mecânico\s+secundário\s+com\s+trava\.?/gi, '');
    cleaned = cleaned.replace(/bloqueio\s+mecânico\s+secundário\.?/gi, '');
    cleaned = cleaned.replace(/segurança,?\s*bloqueio\s+mecânico\s+secundário\.?/gi, '');
    return cleaned.trim();
  };

  const openPdf = (url: string, modelName?: string, productContext?: any) => {
    const lowerUrl = (url || '').toLowerCase();
    const lowerModelName = (modelName || '').toLowerCase();
    const lowerViewingName = (viewingGallery?.name || '').toLowerCase();
    const lowerSelectedName = (selectedProductModels?.name || '').toLowerCase();
    
    // Context fields if present
    const lowerContextName = (productContext?.name || '').toLowerCase();
    const lowerContextCategory = (productContext?.category || '').toLowerCase();
    const lowerContextDesc = (productContext?.description || '').toLowerCase();
    const lowerContextPdfUrl = (productContext?.pdf_url || '').toLowerCase();

    const containsLoaderTriturador = (str: string) => {
      const s = (str || '').toLowerCase();
      return (s.includes('triturador') && (s.includes('pá carregadeira') || s.includes('pa carregadeira') || s.includes('carregadeira') || s.includes('loader'))) ||
             s.includes('uml-ssl-vt') || s.includes('uml ssl vt') || s.includes('140 u pm') || s.includes('140-u-pm') || s.includes('uml_ssl_vt') || s.includes('140_u_pm');
    };
    const isLoaderTriturador = containsLoaderTriturador(lowerUrl) || 
                               containsLoaderTriturador(lowerModelName) || 
                               containsLoaderTriturador(lowerViewingName) || 
                               containsLoaderTriturador(lowerSelectedName) ||
                               containsLoaderTriturador(lowerContextName) ||
                               containsLoaderTriturador(lowerContextCategory) ||
                               containsLoaderTriturador(lowerContextDesc) ||
                               containsLoaderTriturador(lowerContextPdfUrl) ||
                               (productContext?.id && (productContext.id.toLowerCase().includes('loader') || productContext.id.toLowerCase().includes('triturador_loader') || productContext.id.toLowerCase().includes('uml-ssl-vt') || productContext.id.toLowerCase().includes('140-u-pm')));

    if (isLoaderTriturador) {
      if (selectedProductModels) {
        setSuspendedProductModels(selectedProductModels);
        setSelectedProductModels(null);
      }
      if (viewingGallery) {
        setSuspendedViewingGallery(viewingGallery);
        setViewingGallery(null);
      }
      const targetModelName = modelName || selectedModel?.name || '';
      if (targetModelName) {
        const lower = targetModelName.toLowerCase();
        if (lower.includes('140') || lower.includes('pm 200') || lower.includes('200')) {
          setTrituradorLoaderFaeDefaultModel('fae-140-u-pm-200');
        } else {
          setTrituradorLoaderFaeDefaultModel('fae-uml-ssl-vt-175');
        }
      } else {
        setTrituradorLoaderFaeDefaultModel('fae-uml-ssl-vt-175');
      }
      setIsTrituradorLoaderFaeFichaOpen(true);
      return;
    }

    const containsHighTipKeyword = (str: string) => {
      const s = (str || '').toLowerCase();
      if (s.includes('prolongador')) return false;
      return s.includes('high') || s.includes('tip') || s.includes('despejo') || s.includes('concha') || s.includes('caçamba de alto') || s.includes('cacamba de alto');
    };
    const isProlongador = lowerUrl.includes('prolongador') || 
                          lowerModelName.includes('prolongador') || 
                          lowerViewingName.includes('prolongador') || 
                          lowerSelectedName.includes('prolongador') || 
                          lowerContextName.includes('prolongador') || 
                          lowerContextCategory.includes('prolongador') || 
                          lowerContextDesc.includes('prolongador') || 
                          lowerContextPdfUrl.includes('prolongador') ||
                          lowerModelName.includes('pcr') ||
                          lowerSelectedName.includes('pcr') ||
                          lowerContextName.includes('pcr') ||
                          (productContext?.id && productContext.id.toLowerCase().includes('prolongador'));



    const isHighTip = !isProlongador && (
                      containsHighTipKeyword(lowerUrl) || 
                      containsHighTipKeyword(lowerModelName) || 
                      containsHighTipKeyword(lowerViewingName) || 
                      containsHighTipKeyword(lowerSelectedName) ||
                      containsHighTipKeyword(lowerContextName) ||
                      containsHighTipKeyword(lowerContextCategory) ||
                      containsHighTipKeyword(lowerContextDesc) ||
                      containsHighTipKeyword(lowerContextPdfUrl)
                    );
                      
    const containsEngateKeyword = (str: string) => {
      const s = (str || '').toLowerCase();
      return s.includes('engat') || s.includes('rapido') || s.includes('rápido') || s.includes('acopl') || s.includes('acople') || s.includes('hitch') || s.includes('medida');
    };
    const isEngate = containsEngateKeyword(lowerUrl) || 
                     containsEngateKeyword(lowerModelName) || 
                     containsEngateKeyword(lowerViewingName) || 
                     containsEngateKeyword(lowerSelectedName) ||
                     containsEngateKeyword(lowerContextName) ||
                     containsEngateKeyword(lowerContextCategory) ||
                     containsEngateKeyword(lowerContextDesc) ||
                     containsEngateKeyword(lowerContextPdfUrl) ||
                     !!(productContext?.id && (productContext.id.toLowerCase().includes('engate') || productContext.id.toLowerCase().includes('er-')));

    const isEstufagem = isEstufagemProduct(lowerUrl) || 
                        isEstufagemProduct(lowerModelName) || 
                        isEstufagemProduct(lowerViewingName) || 
                        isEstufagemProduct(lowerSelectedName) ||
                        isEstufagemProduct(lowerContextName) ||
                        isEstufagemProduct(lowerContextCategory) ||
                        isEstufagemProduct(lowerContextDesc) ||
                        isEstufagemProduct(lowerContextPdfUrl) ||
                        !!(productContext?.id && (productContext.id.toLowerCase().includes('estufagem') || productContext.id.toLowerCase().includes('af-360')));

    console.log('[DEBUG] openPdf routing check:', { 
      isEngate, 
      isHighTip, 
      isEstufagem,
      lowerUrl, 
      lowerModelName, 
      lowerSelectedName, 
      lowerContextName, 
      contextId: productContext?.id 
    });

    if (isHighTip) {
      if (selectedProductModels) {
        setSuspendedProductModels(selectedProductModels);
        setSelectedProductModels(null);
      }
      if (viewingGallery) {
        setSuspendedViewingGallery(viewingGallery);
        setViewingGallery(null);
      }
      setIsHighTipFichaOpen(true);
      return;
    }

    if (isEngate) {
      if (selectedProductModels) {
        setSuspendedProductModels(selectedProductModels);
        setSelectedProductModels(null);
      }
      if (viewingGallery) {
        setSuspendedViewingGallery(viewingGallery);
        setViewingGallery(null);
      }
      setIsEngateRapidoFichaOpen(true);
      return;
    }

    if (isEstufagem) {
      if (selectedProductModels) {
        setSuspendedProductModels(selectedProductModels);
        setSelectedProductModels(null);
      }
      if (viewingGallery) {
        setSuspendedViewingGallery(viewingGallery);
        setViewingGallery(null);
      }
      // Determine default model to view
      const targetModelName = modelName || selectedModel?.name || '';
      if (targetModelName) {
        const lower = targetModelName.toLowerCase();
        if (lower.includes('360')) {
          setGarraEstufagemDefaultModel('af-360');
        } else if (lower.includes('400')) {
          setGarraEstufagemDefaultModel('af-400');
        } else if (lower.includes('af-600') || (lower.includes('600') && !lower.includes('giro') && !lower.includes('afg'))) {
          setGarraEstufagemDefaultModel('af-600');
        } else if (lower.includes('af-800') || (lower.includes('800') && !lower.includes('giro') && !lower.includes('afg'))) {
          setGarraEstufagemDefaultModel('af-800');
        } else if (lower.includes('afg-600') || (lower.includes('600') && (lower.includes('giro') || lower.includes('afg')))) {
          setGarraEstufagemDefaultModel('afg-600');
        } else if (lower.includes('afg-800') || (lower.includes('800') && (lower.includes('giro') || lower.includes('afg')))) {
          setGarraEstufagemDefaultModel('afg-800');
        } else {
          setGarraEstufagemDefaultModel('af-360');
        }
      } else {
        setGarraEstufagemDefaultModel('af-360');
      }
      setIsGarraEstufagemFichaOpen(true);
      return;
    }

    if (!url) return;

    if (isFresaProduct(url) || isFresaProduct(modelName) || isFresaProduct(viewingGallery?.name) || isFresaProduct(selectedProductModels?.name) || isFresaProduct(lowerContextName) || isFresaProduct(lowerContextCategory) || isFresaProduct(lowerContextDesc) || isFresaProduct(lowerContextPdfUrl)) {
      if (selectedProductModels) {
        setSuspendedProductModels(selectedProductModels);
        setSelectedProductModels(null);
      }
      if (viewingGallery) {
        setSuspendedViewingGallery(viewingGallery);
        setViewingGallery(null);
      }
      const targetModelName = modelName || selectedModel?.name || '';
      if (targetModelName) {
        const lower = targetModelName.toLowerCase();
        if (lower.includes('150')) {
          setFresaSshDefaultModel('ssh-150');
        } else if (lower.includes('200')) {
          setFresaSshDefaultModel('ssh-200');
        } else if (lower.includes('225')) {
          setFresaSshDefaultModel('ssh-225');
        } else if (lower.includes('250')) {
          setFresaSshDefaultModel('ssh-250');
        } else {
          setFresaSshDefaultModel('ssh-150');
        }
      } else {
        setFresaSshDefaultModel('ssh-150');
      }
      setIsFresaSshFichaOpen(true);
      return;
    }
    
    if (url.startsWith('db-file://')) {
      const openDbFile = async () => {
        const fileId = url.replace('db-file://', '');
        toast.loading('Abrindo documento...', { id: 'open-pdf' });
        try {
          const docSnap = await getDoc(doc(db, 'app_files', fileId));
          if (docSnap.exists()) {
            const fileData = docSnap.data();
            const base64Response = await fetch(fileData.data);
            const blob = await base64Response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // For blob URLs, we often have to navigate on mobile or use a safe method
            const a = document.createElement('a');
            a.href = blobUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
            
            toast.dismiss('open-pdf');
          } else {
            toast.error('Arquivo não encontrado no banco de dados.', { id: 'open-pdf' });
          }
        } catch (err) {
          console.error('Error opening DB file:', err);
          toast.dismiss('open-pdf');
          toast.error('Erro ao abrir arquivo.');
        }
      };
      openDbFile();
      return;
    }

    // Standard URL - Use direct link to avoid popup blockers
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareFile = async (url: string, fileName: string) => {
    if (!url) return;
    
    try {
      let shareData: ShareData = {
        title: fileName,
        text: `Confira o documento: ${fileName}`,
      };

      if (url.startsWith('db-file://')) {
        const fileId = url.replace('db-file://', '');
        toast.loading('Preparando arquivo para compartilhar...', { id: 'share-file' });
        const docSnap = await getDoc(doc(db, 'app_files', fileId));
        if (docSnap.exists()) {
          const fileData = docSnap.data();
          const response = await fetch(fileData.data);
          const blob = await response.blob();
          const file = new File([blob], `${fileName}.pdf`, { type: fileData.type || 'application/pdf' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          } else {
            // Fallback for files if can't share directly
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
            toast.info('Abra o arquivo e use a opção de compartilhar do seu navegador.', { id: 'share-file' });
            return;
          }
        }
      } else {
        shareData.url = url;
      }

      if (navigator.share) {
        await navigator.share(shareData);
        toast.dismiss('share-file');
      } else {
        // Fallback to WhatsApp link share
        const text = encodeURIComponent(`Confira o documento: ${fileName}\n${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Não foi possível compartilhar o arquivo.', { id: 'share-file' });
    }
  };

  const shareModelOnWhatsApp = async (productName: string, model: any) => {
    const getUnitValue = (key: string, value: any) => {
      if (!value) return '';
      const keyLower = key.toLowerCase();
      
      // If value already contains a unit, return it as is
      const valStr = String(value).toLowerCase();
      if (valStr.includes('kg') || valStr.includes('ton') || valStr.includes('mm') || valStr.includes('bar') || valStr.includes('m²') || valStr.includes('m³') || valStr.includes('l/min') || valStr.includes('cm') || valStr.includes('\"') || valStr.includes('cc')) {
        return value;
      }

      const units: Record<string, string> = {
        area_carga: ' m³',
        pressao_trabalho: ' bar',
        pressao: ' bar',
        peso: ' kg',
        capacidade_carga: ' kg',
        abertura_maxima: ' mm',
        abertura_total: ' mm',
        diametro_minimos: ' mm',
        diametro_minimo: ' mm',
        diametro_max_corte: ' mm',
        diametro_corte: ' mm',
        area_garra: ' m²',
        area_da_garra: ' m²',
        vazao: ' L/min',
        giro_360: ''
      };
      
      // Special regex/includes for key matching
      if (keyLower === 'giro_360') return value;
      if (keyLower.includes('abertura') || keyLower.includes('diametro') || keyLower.includes('medida_')) return `${value} mm`;
      if (keyLower.includes('peso') || keyLower.includes('capacidade')) return `${value} kg`;
      if (keyLower.includes('pressao')) return `${value} bar`;

      return `${value}${units[keyLower] || ''}`;
    };

    const productId = viewingGallery?.id || selectedProductModels?.id || model.productId;
    const finalProductName = productName || viewingGallery?.name || selectedProductModels?.name || 'Equipamento Roder';

    const labelMapping: Record<string, string> = {
      instalacao_hidraulica: 'Instalação Hidráulica',
                           acionamento: 'Acionamento',
                           tempo_de_ciclo: 'Tempo de Ciclo',
                           compatibilidade: 'Compatibilidade',
                           seguranca: 'Segurança',
                           trator: 'Pá Carregadeira',
      abertura_total: 'Abertura total da garra',
      potencia_do_trator: 'Potência requerida',
      maquina_base: (finalProductName.toLowerCase().includes('engate') || model.name.toLowerCase().includes('engate') || finalProductName.toLowerCase().includes('carregadeira') || model.name.toLowerCase().includes('carregadeira')) 
        ? 'Pá Carregadeira' 
        : 'Escavadeira recomendada',
      diametro_corte: 'Ø Máx. Corte',
      area_carga: 'Área Carga',
      peso: 'Peso Equipamento',
      medida_a: 'Comprimento "A"',
      medida_b: 'Altura "B"',
      medida_c: 'Largura Total "C"',
      medida_d: 'Medida "D"',
      giro_360: 'Giro 360 graus ilimitado',
      dentes_disco: 'Dentes do Disco',
      acumulador: 'Acumulador'
    };

    const isEngateProduct = finalProductName.toLowerCase().includes('engate') || model.name.toLowerCase().includes('engate');

    const specs = Object.entries(model.technical_specs || {})
      .filter(([k, v]) => {
        if (!v) return false;
        const valStr = String(v).toLowerCase();
        const keyStr = k.toLowerCase();
        if (keyStr === 'seguranca' || valStr.includes('bloqueio mecânico') || valStr.includes('bloqueio mecanico')) {
          return false;
        }
        return String(v).trim() !== '' && String(v).trim() !== '-';
      })
      .map(([k, v]) => {
        const label = labelMapping[k.toLowerCase()] || k.replace(/_/g, ' ').toUpperCase();
        const cleanedValue = cleanTextForEngate(getUnitValue(k, v), isEngateProduct);
        return `• *${label}:* ${cleanedValue}`;
      })
      .filter(line => line && !line.endsWith(':* ') && !line.endsWith(':*'))
      .join('\n');
    
    // Minimal params for WhatsApp sharing
    const budgetUrl = `${window.location.origin}/pedido-orcamento?uid=${profile?.uid || user?.uid || ''}&pid=${productId || ''}&mid=${model.id || ''}`;

    // Get up to 5 gallery images to include in the message (if any)
    const galleryLinks = (model.images || [])
      .slice(0, 3)
      .filter((img: string) => img.startsWith('http'))
      .map((img: string, i: number) => `Foto ${i + 1}: ${img}`)
      .join('\n');

    const productVideo = viewingGallery?.video_url || selectedProductModels?.video_url;

    let extraIntro = '';
    if (finalProductName.toLowerCase().includes('engate') || model.name.toLowerCase().includes('engate')) {
      extraIntro = `*Apresentação:* O Engate Rápido Hidráulico Roder para pás carregadeiras é fabricado 100% sob medida para cada marca/modelo de máquina. Permite a troca rápida de implementos (caçamba original, garfo pallet, conchas e garras) de dentro da cabine em menos de 30 segundos, com segurança máxima.\n\n` +
                   `*Instalações Hidráulicas Extras:*\n` +
                   `• *3ª Função (2 vias):* Para acionamento do cilindro do engate rápido, ideal para caçamba ou garfo pallet.\n` +
                   `• *3ª e 4ª Função (4 vias):* Necessária para equipamentos rotativos com giro hidráulico (como Garras AFG com giro), permitindo acionar o engate, giro e fechamento simultâneos com total agilidade operacional.\n\n`;
    }

    const text = `*RODER BRASIL - Especificações Técnicas*\n\n` +
      `*Equipamento:* ${finalProductName}\n` +
      `*Modelo:* ${model.name}\n\n` +
      (extraIntro ? extraIntro : '') +
      `*DADOS TÉCNICOS:*\n${specs || 'Consulte o manual para mais detalhes.'}\n\n` +
      (galleryLinks ? `*Fotos do Modelo:*\n${galleryLinks}\n\n` : '') +
      (model.video_url ? `*Vídeo do Modelo:* ${model.video_url}\n` : '') +
      (productVideo && productVideo !== model.video_url ? `*Vídeo do Equipamento:* ${productVideo}\n` : '') +
      (model.pdf_url ? `*Ficha de Dimensionamento:* ${model.pdf_url}\n` : '') +
      `*Solicite seu orçamento aqui:* ${budgetUrl}\n\n` +
      `_Enviado via RODER Indica_`;
    
    const mainImage = model.images?.[0];

    // Primary choice for WhatsApp requests - Always use window.open for WhatsApp buttons 
    // to ensure reliability and direct web redirect across all browsers, matching main card behavior.
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sharePartsManualOnWhatsApp = (productName: string, model: any) => {
    const manualUrl = model.parts_manual_url?.startsWith('db-file://') 
      ? '(Documento salvo no sistema)' 
      : (model.parts_manual_url || 'Não disponível');

    const text = `*RODER BRASIL - Manual de Peças*\n\n` +
      `*Equipamento:* ${productName}\n` +
      `*Modelo:* ${model.name}\n\n` +
      `*Link do Manual:* ${manualUrl}\n\n` +
      `_Enviado via RODER Indica_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const fixGoogleDriveLink = (url: string) => {
    if (!url) return url;
    if (url.includes('drive.google.com')) {
      // Handle various Google Drive link formats
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        // Use the 'view' endpoint which is the most compatible for mobile browsers
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/view?usp=sharing`;
      }
    }
    return url;
  };

  const handleModelFileUpload = async (idx: number, file: File, field: 'pdf_url' | 'parts_manual_url') => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error('O arquivo é muito grande. O limite é 50MB.');
      return;
    }

    let isFinished = false;
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        setModelUploading(false);
        toast.error('O upload está demorando muito. Tente um arquivo menor ou use um link do Google Drive.', { id: 'model-file-upload' });
      }
    }, 120000); // 120 seconds timeout for individual file upload

    try {
      setModelUploading(true);
      toast.loading('Enviando arquivo...', { id: 'model-file-upload' });
      
      const folder = field === 'pdf_url' ? 'technical_sheets' : 'parts_manuals';
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      
      let url = '';
      try {
        // Try standard storage upload first
        await uploadBytes(storageRef, file, { contentType: file.type });
        url = await getDownloadURL(storageRef);
      } catch (storageError: any) {
        console.warn('Storage upload failed, trying Firestore fallback...', storageError);
        
        // Fallback for small files (< 1MB) using Firestore
        if (file.size < 1024 * 1024) {
          toast.loading('Usando método alternativo...', { id: 'model-file-upload' });
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const base64Data = await base64Promise;
          const docRef = await addDoc(collection(db, 'app_files'), {
            name: file.name,
            type: file.type,
            data: base64Data,
            created_at: new Date().toISOString()
          });
          url = `db-file://${docRef.id}`;
        } else {
          throw storageError;
        }
      }
      
      const newModels = formData.models.map((m, i) => 
        i === idx ? { ...m, [field]: url } : m
      );
      setFormData({ ...formData, models: newModels });
      isFinished = true;
      clearTimeout(timeoutId);
      toast.success('Documento salvo com sucesso!', { id: 'model-file-upload' });
    } catch (error: any) {
      isFinished = true;
      clearTimeout(timeoutId);
      console.error('Error uploading model file:', error);
      let errorMessage = 'Erro ao carregar documento';
      if (error.code === 'storage/retry-limit-exceeded' || error.code === 'storage/unknown' || error.code === 'permission-denied') {
        errorMessage = 'Falha no servidor. Por favor, use um link do Google Drive como alternativa.';
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      toast.error(errorMessage, { id: 'model-file-upload' });
    } finally {
      setModelUploading(false);
    }
  };

  const importFromDrive = async (idx: number, url: string, field: 'pdf_url' | 'parts_manual_url') => {
    if (!url || !url.includes('drive.google.com')) {
      toast.error('O link fornecido não parece ser do Google Drive.');
      return;
    }

    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch || !fileIdMatch[1]) {
      toast.error('Não foi possível identificar o ID do arquivo no link.');
      return;
    }

    const fileId = fileIdMatch[1];
    
    try {
      setModelUploading(true);
      
      if (field === 'pdf_url') {
        toast.loading('Convertendo PDF para imagem leve...', { id: 'model-file-upload' });

        // Use our server-side proxy to avoid CORS issues
        const proxyUrl = `${getApiBaseUrl()}/api/proxy-thumbnail?fileId=${fileId}`;
        
        const response = await fetch(proxyUrl, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Não foi possível converter o arquivo. Verifique se o link está aberto para "Qualquer pessoa com o link".');
        }

        const blob = await response.blob();
        const fileName = `sheet_img_${fileId.substring(0, 8)}_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // Upload the image to Firebase Storage
        const storageRef = ref(storage, `technical_sheets_img/${Date.now()}_${fileName}`);
        await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
        const downloadUrl = await getDownloadURL(storageRef);
        
        const newModels = formData.models.map((m, i) => {
          if (i === idx) {
            return { ...m, [field]: url, technical_sheet_image: downloadUrl };
          }
          return m;
        });
        
        setFormData({ ...formData, models: newModels });
        toast.success('Arquivo convertido e salvo como imagem leve!', { id: 'model-file-upload' });
      } else {
        // For Manual de Peças, we want the FULL PDF imported to our cloud
        toast.loading('Importando Manual de Peças completo para a Nuvem RODER...', { id: 'model-file-upload' });

        const proxyUrl = `${getApiBaseUrl()}/api/proxy-drive?fileId=${fileId}`;
        const response = await fetch(proxyUrl, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Não foi possível baixar o manual completo. Verifique se o link está aberto para "Qualquer pessoa com o link".');
        }

        const blob = await response.blob();
        const fileName = `manual_${fileId.substring(0, 8)}_${Date.now()}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });

        // Upload the PDF to Firebase Storage
        const storageRef = ref(storage, `parts_manuals/${Date.now()}_${fileName}`);
        await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
        const downloadUrl = await getDownloadURL(storageRef);
        
        const newModels = formData.models.map((m, i) => 
          i === idx ? { ...m, [field]: downloadUrl } : m
        );
        
        setFormData({ ...formData, models: newModels });
        toast.success('Manual de Peças importado com sucesso para a Nuvem RODER!', { id: 'model-file-upload' });
      }
    } catch (error: any) {
      console.error('Error importing from Drive:', error);
      toast.error('Erro ao importar: ' + (error.message || 'Verifique as permissões do link.'), { id: 'model-file-upload' });
    } finally {
      setModelUploading(false);
    }
  };

  const handleModelImagesUpload = async (idx: number, files: FileList) => {
    try {
      const totalFiles = files.length;
      toast.loading(`Processando ${totalFiles} imagens...`, { id: 'upload-toast' });
      
      const uploadPromises = Array.from(files).map(async (file) => {
        return await smartUpload(file, 'model_images');
      });

      const urls = await Promise.all(uploadPromises);
      
      if (isModelEditOpen && editingModelData) {
        const currentImages = editingModelData.images || [];
        setEditingModelData({ ...editingModelData, images: [...currentImages, ...urls] });
      } else {
        const newModels = formData.models.map((m, i) => {
          if (i === idx) {
            const currentImages = m.images || [];
            return { ...m, images: [...currentImages, ...urls] };
          }
          return m;
        });
        setFormData({ ...formData, models: newModels });
      }
      
      toast.success(`${urls.length} imagens adicionadas!`, { id: 'upload-toast' });
    } catch (error: any) {
      console.error('Error processing model images:', error);
      toast.error('Erro ao processar imagens', { id: 'upload-toast' });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSaveModel = async () => {
    if (!editingModelData || editingModelIndex === null) return;

    if (isEditingFromProductDialog) {
      setSubmitting(true);
      try {
        // We are editing a model within the Product Edit Dialog (formData state)
        
        // Upload any base64 images that might have been added to editingModelData
        toast.loading('Processando imagens do modelo...', { id: 'save-model-mini' });
        const technical_sheet_image = await smartUpload(editingModelData.technical_sheet_image, 'technical_sheets_img');
        const images = await Promise.all((editingModelData.images || []).map(async (img: string) => {
          return await smartUpload(img, 'model_images');
        }));
        
        let video_url = editingModelData.video_url || '';
        if (modelVideoFile) {
          toast.loading('Processando vídeo do modelo...', { id: 'save-model-mini' });
          video_url = await smartUploadVideo(modelVideoFile, 'model_videos');
          setModelVideoFile(null);
        }

        const finalModelData = { 
          ...editingModelData, 
          technical_sheet_image, 
          images,
          video_url,
          image_zoom: editingModelData.image_zoom || 1
        };

        const newModels = [...formData.models];
        
        // Apply images to other selected models if any were selected
        if (applyImageToOtherModels.length > 0 && images.length > 0) {
          applyImageToOtherModels.forEach(modelId => {
            const idx = newModels.findIndex(m => m.id === modelId);
            if (idx !== -1) {
              if (!newModels[idx].images) newModels[idx].images = [];
              newModels[idx].images = [...new Set([...newModels[idx].images, ...images])];
            }
          });
        }

        newModels[editingModelIndex] = finalModelData;
        setFormData({ ...formData, models: newModels });
        setIsModelEditOpen(false);
        setApplyImageToOtherModels([]);
        toast.success('Alterações do modelo aplicadas!', { id: 'save-model-mini' });
      } catch (err: any) {
        console.error('Error applying model changes:', err);
        toast.error('Erro ao aplicar alterações: ' + (err.message || ''), { id: 'save-model-mini' });
      } finally {
        setSubmitting(false);
      }
    } else if (selectedProductModels || viewingGallery) {
      // We are editing a model directly from the Product View Dialog or Gallery View (Firestore update)
      const currentProduct = selectedProductModels || viewingGallery;
      if (!currentProduct) return;

      try {
        setSubmitting(true);
        toast.loading('Salvando alterações do modelo...', { id: 'save-model-toast' });
        
        // Upload any base64 images
        const technical_sheet_image = await smartUpload(editingModelData.technical_sheet_image, 'technical_sheets_img');
        const images = await Promise.all((editingModelData.images || []).map(async (img: string) => {
          return await smartUpload(img, 'model_images');
        }));

        // Upload video if selected
        let video_url = editingModelData.video_url || '';
        if (modelVideoFile) {
          video_url = await smartUploadVideo(modelVideoFile, 'model_videos');
          setModelVideoFile(null); // Clear after upload
        }
        
        const finalModelData = { 
          ...editingModelData, 
          technical_sheet_image, 
          images,
          video_url,
          image_zoom: editingModelData.image_zoom || 1
        };
        
        const newModels = [...(currentProduct.models || [])];
        
        // Apply images to other selected models
        if (applyImageToOtherModels.length > 0 && images.length > 0) {
          applyImageToOtherModels.forEach(modelId => {
            const idx = newModels.findIndex(m => m.id === modelId);
            if (idx !== -1) {
              if (!newModels[idx].images) newModels[idx].images = [];
              newModels[idx].images = [...new Set([...newModels[idx].images, ...images])];
            }
          });
        }

        newModels[editingModelIndex] = finalModelData;
        
        const productRef = doc(db, 'products', currentProduct.id);
        await updateDoc(productRef, { models: newModels });
        
        if (selectedProductModels) {
          setSelectedProductModels({ ...selectedProductModels, models: newModels });
        }
        if (viewingGallery) {
          setViewingGallery({ ...viewingGallery, models: newModels });
        }
        
        if (selectedModel?.id === editingModelData.id) {
          setSelectedModel(finalModelData);
        }
        
        setIsModelEditOpen(false);
        setApplyImageToOtherModels([]);
        toast.success('Modelo atualizado com sucesso!', { id: 'save-model-toast' });
      } catch (error: any) {
        console.error('Error updating model:', error);
        // Catch permission errors or other Firestore errors
        const errorMessage = error?.message || 'Erro desconhecido';
        toast.error(`Erro ao atualizar modelo: ${errorMessage}`, { id: 'save-model-toast' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  useEffect(() => {
    // One-time fix for CFR 280 image requested by user
    if (user?.email === 'roderbrasil@gmail.com' && products.length > 0) {
      const fixCFRImage = async () => {
        const product = products.find(p => p.name === 'Carregador frontal');
        if (product && product.models) {
          const cfr280 = product.models.find(m => m.id === 'cfr-280');
          const targetImage = 'https://ais-dev-5iqoo2vhpig2v4eiflfmpf-239499535537.us-west2.run.app/api/attachments/B72A4E02-F4A7-4404-B3C5-0010E0C93E28/image_CFR-280.jpg';
          
          if (cfr280 && (!cfr280.images || cfr280.images.length === 0 || cfr280.images[0] !== targetImage)) {
            console.log('AdminFix: Updating CFR 280 image...');
            const updatedModels = product.models.map(m => 
              m.id === 'cfr-280' ? { ...m, images: [targetImage, ...(m.images || [])].slice(0, 5) } : m
            );
            try {
              await updateDoc(doc(db, 'products', product.id), { models: updatedModels });
              toast.info('Imagem do CFR 280 atualizada automaticamente.');
            } catch (err) {
              console.error('Error in admin fix:', err);
            }
          }
        }
      };
      fixCFRImage();
    }
  }, [user, products]);

  return (
    <Layout>
      {viewingGallery ? (
        <div className="flex flex-col min-h-screen bg-slate-50 -m-4 md:-m-8">
          {/* Gallery Header - Fixed Sticky */}
          <header className="sticky top-0 z-30 bg-white border-b border-border shadow-md p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewingGallery(null)}
              className="h-9 w-9 p-0 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex flex-col min-w-0 flex-1">
              <h2 className="text-[12px] font-bold text-primary uppercase leading-tight tracking-widest truncate">Modelos</h2>
              <h1 className="text-lg md:text-2xl font-bold text-foreground uppercase tracking-tighter truncate">
                {viewingGallery.name}
              </h1>
            </div>
            
            {(isManager || isAdmin || user?.email === 'roderbrasil@gmail.com' || user?.email === 'roderindica@gmail.com') && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-2"
                onClick={() => {
                  setFormData({
                    name: viewingGallery.name,
                    description: viewingGallery.description || '',
                    category: viewingGallery.category || '',
                    image_url: viewingGallery.image_url || '',
                    video_url: viewingGallery.video_url || '',
                    pdf_url: viewingGallery.pdf_url || '',
                    image_zoom: viewingGallery.image_zoom || 1,
                    show_banner: viewingGallery.show_banner || false,
                    banner_message: viewingGallery.banner_message || '',
                    parts_manual_url: viewingGallery.parts_manual_url || '',
                    is_banner: viewingGallery.is_banner || false,
                    is_blocked: viewingGallery.is_blocked || false,
                    models: viewingGallery.models || []
                  });
                  setEditingProduct(viewingGallery);
                  setIsDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editar Produto</span>
              </Button>
            )}
          </header>

          {/* Models List - Compact Bento Style */}
          <div className="flex-1 px-6 py-4 md:px-3 md:py-6 max-w-[1440px] mx-auto w-full space-y-4 md:space-y-4">
            {viewingGallery.models?.map((model: any, idx: number) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={model.id || `gallery-model-${idx}`}
                className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-row h-auto min-h-[140px] md:min-h-[252px]"
              >
                {/* Left side: Compact Image */}
                <div className="w-32 sm:w-40 md:w-[280px] bg-muted/10 relative border-r border-border shrink-0">
                  <div className="absolute inset-0">
                    {model.images && model.images.length > 0 ? (
                      <ImageCarousel 
                        images={model.images} 
                        zoom={model.image_zoom || 1} 
                        onClick={() => {
                          setLightboxImages(model.images);
                          setLightboxTitle(model.name);
                          setIsLightboxOpen(true);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                        <Package className="h-6 w-6 md:h-11 md:w-11" />
                      </div>
                    )}
                  </div>
                  
                  {/* Floating YouTube Button - Compact */}
                  {model.video_url && (
                    <div className="absolute bottom-1.5 left-1.5 z-10">
                      <Button
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full shadow-lg bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center gap-0"
                        onClick={() => window.open(model.video_url, '_blank')}
                        title="Ver Vídeo"
                      >
                        <Video className="h-3.5 w-3.5 md:h-5 md:w-5" />
                        <span className="text-[6.5px] md:hidden font-bold leading-none uppercase">VÍDEO</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right side: Compact Info */}
                <div className="flex-1 p-2 md:p-6 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1 md:mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h3 className="!text-[14px] md:!text-2xl font-black text-slate-500 tracking-tighter uppercase truncate leading-none">
                          {model.name}
                        </h3>
                      </div>
                      {!isExternalSeller && typeof model.base_value === 'number' && model.base_value > 0 ? (
                        <p className="font-bold text-primary !text-[11px] md:!text-xl mt-0.5">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(model.base_value)}
                        </p>
                      ) : null}
                    </div>

                    {(isManager || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          const modelIndex = viewingGallery.models?.findIndex((m: any) => m.id === model.id);
                          if (modelIndex !== undefined && modelIndex !== -1) {
                            setEditingModelData({ ...model });
                            setEditingModelIndex(modelIndex);
                            setIsEditingFromProductDialog(false);
                            setIsModelEditOpen(true);
                          }
                        }}
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Specs Grid - Bento Style boxes with Units */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2.5 mb-1.5 md:mb-4">
                    {Object.entries(model.technical_specs || {})
                      .filter(([key, value]) => {
                        if (viewingGallery?.name === 'Mini Skidder') {
                          const excluded = ['diametro_corte', 'sabre', 'corrente', 'motor', 'peso_operacional'];
                          if (excluded.some(ex => key.toLowerCase().includes(ex))) return false;
                        }
                        return value && String(value).trim() !== '' && String(value).trim() !== '-';
                      })
                      .sort(([a], [b]) => {
                        const order = [
                          'maquina_base', 'instalacao_hidraulica', 'acionamento', 'tempo_de_ciclo', 'compatibilidade', 'seguranca', 'peso_operacional', 'giro_360',
                          'diametro_max_corte', 'diametro_corte', 'peso', 'peso_do_equipamento', 
                          'n_facas', 'acumulador', 'area_carga', 'area_da_garra', 
                          'abertura_maxima', 'diametro_minimo', 'carregadeira',
                          'escavadeira', 'pressao', 'pressao_trabalho', 'potencia_do_trator', 
                          'capacidade_de_carga', 'capacidade_carga',
                          'altura_total', 'largura_total', 'comprimento_util_garfo'
                        ];
                        const idxA = order.indexOf(a.toLowerCase());
                        const idxB = order.indexOf(b.toLowerCase());
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        return (idxA !== -1 ? -1 : (idxB !== -1 ? 1 : a.localeCompare(b)));
                      })
                      .slice(0, 9)
                      .map(([key, value]: any) => {
                        // Helper to format units
                        let displayValue = String(value);
                        const k = key.toLowerCase();
                        if ((k.includes('peso') || k.includes('capacidade')) && !k.includes('operacional') && !displayValue.toLowerCase().includes('kg') && !displayValue.toLowerCase().includes('ton')) displayValue += ' kg';
                        if ((k.includes('medida') || k.includes('abertura') || k.includes('diametro') || k.includes('altura') || k.includes('largura') || k.includes('comprimento')) && !displayValue.toLowerCase().includes('mm')) displayValue += ' mm';
                        if ((k.includes('pressao') || k.includes('pressão')) && !displayValue.toLowerCase().includes('bar')) displayValue += ' bar';
                        
                        const kMapping = key.toLowerCase();
                        const specLabels: Record<string, string> = {
                          trator: 'Pá Carregadeira',
                          peso: 'Peso Equipamento',
                          area_carga: 'Área Carga',
                          medida_a: 'Comprimento "A"',
                          medida_b: 'Altura "B"',
                          medida_c: 'Largura Total "C"',
                          medida_d: 'Medida "D"',
                          abertura_total: 'Abertura total da garra',
                          peso_do_equipamento: 'Peso Equipamento',
                          area_da_garra: 'Área da Garra',
                          capacidade_de_carga: 'Capacidade de Carga',
                          potencia_do_trator: 'Pá Carregadeira',
                          diametro_corte: 'Ø Máx. Corte',
                          diametro_max_corte: 'Ø Máx. Corte',
                          n_facas: 'Nº Facas',
                          acumulador: 'Acumulador',
                          carregadeira: 'Carregadeira',
                          escavadeira: 'Escavadeira',
                          pressao: 'Pressão',
                          peso_operacional: 'Peso Operacional(T)',
                          giro_360: 'Giro 360º ilimitado',
                          diametro_max_carga: 'Ø Máx. Carga',
                          comprimento_giro: 'Comprimento Giro',
                          diametro_max_trituracao: 'Ø Máx. Trituração',
                          tipo_dente: 'Tipo de Dente',
                          tipo_material: 'Tipo de Material',
                          trator_hp: 'Potência do Trator',
                          pto_rpm: 'Rotação da TDP',
                          largura_de_trabalho_mm: 'Largura de Trabalho',
                          largura_total_mm: 'Largura Total',
                          peso_kg: 'Peso',
                          diametro_do_rotor_mm: 'Diâmetro do Rotor',
                          diametro_max_de_trituracao_mm: 'Ø Máx. Trituração',
                          profundidade_max_de_trabalho_mm: 'Profundidade Máx.',
                          numero_de_dentes: 'Número de Dentes',
                          altura_total: 'Altura Total',
                          largura_total: 'Largura Total',
                          comprimento_util_garfo: 'Comprimento Útil do Garfo'
                        };
                        const label = specLabels[kMapping] || key.replace(/_/g, ' ');
                        const isGiro360 = kMapping === 'giro_360';
                        const isTipoMaterial = kMapping === 'tipo_material';

                        return (
                            <div key={key} className={cn(
                              "min-w-0 border rounded-md p-1 md:p-2 flex flex-col justify-center overflow-hidden transition-colors",
                              isGiro360 
                                ? "bg-orange-500/10 border-orange-500/30 shadow-orange-500/10" 
                                : "bg-slate-50/80 border-slate-200",
                              isTipoMaterial && "col-span-2 md:col-span-3 lg:col-span-4"
                            )}>
                              <p className={cn(
                                "!text-[6px] md:!text-[10px] font-bold uppercase leading-none mb-0.5 truncate italic",
                                isGiro360 ? "text-orange-700" : "text-slate-900"
                              )}>
                                {label}
                              </p>
                              <p className={cn(
                                "!text-[9px] md:!text-[13px] font-bold",
                                isTipoMaterial ? "whitespace-normal break-words leading-tight" : "truncate leading-none",
                                isGiro360 ? "text-orange-600" : "text-primary"
                              )}>
                                {displayValue}
                              </p>
                            </div>
                        );
                      })}
                  </div>

                  {/* Documentation & Actions - Ultra Compact Single Row */}
                  <div className="mt-auto pt-0.5 border-t border-border/50">
                    <div className={cn(
                      "grid gap-0.5 md:gap-2.5 pt-2",
                      ['fae-uml-ex-vt', 'fae-uml-s-ex-vt', 'fae-umm-ex-vt'].includes(model.id?.toLowerCase()) 
                        ? "grid-cols-5" 
                        : "grid-cols-4"
                    )}>
                       <div className="flex items-center gap-0.5 md:gap-1">
                        <Button 
                          size="sm"
                          className="w-full bg-white border border-[#128C7E]/20 hover:bg-slate-50 text-[#075E54] font-black h-7 md:h-12 uppercase px-0 shadow-sm tracking-tighter leading-none flex flex-col md:flex-row items-center justify-center pt-0.5 md:pt-0"
                          onClick={() => shareModelOnWhatsApp(viewingGallery?.name || '', model)}
                        >
                          <MessageCircle className="!h-2.5 !w-2.5 md:!h-4 md:!w-4 mb-0.5 md:mb-0 md:mr-0.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                          <span className="inline sm:hidden !text-[7px]">WHATS</span>
                        </Button>
                       </div>
                       
                       <div className="flex items-center gap-0.5 md:gap-1">
                        <Button 
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full h-5 md:h-12 uppercase px-0 border-slate-200 text-foreground shadow-sm leading-none",
                            !(model.pdf_url || viewingGallery?.pdf_url || isEngateProduct(model.name) || isEngateProduct(viewingGallery?.name) || isHighTipProduct(model.name) || isHighTipProduct(viewingGallery?.name) || isFresaProduct(model.name) || isFresaProduct(viewingGallery?.name) || isLoaderTrituradorProduct(model.name) || isLoaderTrituradorProduct(viewingGallery?.name)) && "hidden"
                          )}
                          onClick={() => openPdf(model.pdf_url || viewingGallery?.pdf_url || '', model.name, viewingGallery)}
                          disabled={!(model.pdf_url || viewingGallery?.pdf_url || isEngateProduct(model.name) || isEngateProduct(viewingGallery?.name) || isHighTipProduct(model.name) || isHighTipProduct(viewingGallery?.name) || isFresaProduct(model.name) || isFresaProduct(viewingGallery?.name) || isLoaderTrituradorProduct(model.name) || isLoaderTrituradorProduct(viewingGallery?.name))}
                        >
                          <FileText className="!h-2.5 !w-2.5 md:!h-4 md:!w-4 mb-0.5 md:mb-0 md:mr-0.5 text-red-500" />
                          <span className="hidden sm:inline">Ficha</span>
                          <span className="inline sm:hidden !text-[7px]">FICHA</span>
                        </Button>
                       </div>

                       {model.parts_manual_url ? (
                           <div className="flex items-center gap-0.5 md:gap-1 font-bold">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full h-5 md:h-12 uppercase px-0 border-slate-200 text-foreground shadow-sm leading-none"
                              onClick={() => openPdf(model.parts_manual_url || viewingGallery?.parts_manual_url || '')}
                              disabled={!(model.parts_manual_url || viewingGallery?.parts_manual_url)}
                            >
                              <Package className="!h-2.5 !w-2.5 md:!h-4 md:!w-4 mb-0.5 md:mb-0 md:mr-0.5 text-orange-500" />
                              <span className="hidden sm:inline">Manual</span>
                              <span className="inline sm:hidden !text-[7px]">MANU</span>
                            </Button>
                           </div>
                       ) : (
                           <div className="flex items-center gap-0.5 md:gap-1 opacity-40">
                             <Button 
                                disabled
                                variant="outline" 
                                size="sm"
                                className="w-full h-5 md:h-12 !text-[5px] md:!text-[12px] uppercase px-0 border-slate-200 text-foreground grayscale shadow-sm"
                             >
                               <Package className="!h-1.5 !w-1.5 md:!h-4 md:!w-4 mr-0.5" />
                               <span className="hidden sm:inline">Manual</span>
                               <span className="inline sm:hidden">MANU</span>
                             </Button>
                           </div>
                       )}

                       {/* Ficha de Entrega Técnica - Only for FAE UML/EX/VT, UML/S/EX/VT, UMM/EX/VT */}
                       {['fae-uml-ex-vt', 'fae-uml-s-ex-vt', 'fae-umm-ex-vt'].includes(model.id?.toLowerCase()) && (
                         <div className="flex items-center gap-0.5 md:gap-1">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full h-5 md:h-12 uppercase px-0 border-amber-500/30 text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 shadow-sm leading-none flex flex-col md:flex-row items-center justify-center font-bold"
                            onClick={() => {
                              setSelectedModel(model);
                              setIsTechnicalDeliveryOpen(true);
                            }}
                          >
                            <ClipboardCheck className="!h-2.5 !w-2.5 md:!h-4 md:!w-4 mb-0.5 md:mb-0 md:mr-0.5 text-amber-500" />
                            <span className="hidden sm:inline">Entrega</span>
                            <span className="inline sm:hidden !text-[7.5px]">OPER</span>
                          </Button>
                         </div>
                       )}

                       <div className="flex items-center gap-0.5 md:gap-1">
                        <Button 
                          size="sm"
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black h-5 md:h-12 uppercase px-0 shadow-sm leading-none !text-[11px] md:!text-[18px]"
                          onClick={() => {
                            const fullName = `${viewingGallery.name} ${model.name}`;
                            navigate('/indicacoes/nova', { state: { product_name: fullName } });
                          }}
                        >
                          <span className="hidden sm:inline">INDICAR</span>
                          <span className="inline sm:hidden">INDICAR</span>
                        </Button>
                       </div>

                     </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Seção Informativa de Engate Rápido */}
            {isEngateProduct(viewingGallery.name) && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-8 mt-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-5 gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={RODER_LOGO_BASE64} 
                      alt="Logo Roder" 
                      className="h-10 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="border-l border-slate-200 pl-3">
                      <h3 className="text-md font-extrabold text-slate-900 tracking-tight uppercase leading-none">
                        Engate Rápido Hidráulico
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mt-1">Tecnologia e Performance Sob Medida</span>
                    </div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-orange-600 uppercase tracking-wide">
                    Produto 100% Personalizado
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                  <div className="lg:col-span-7 space-y-4 text-slate-700 text-xs md:text-sm leading-relaxed">
                    <p className="text-justify">
                      O <strong>Engate Rápido Hidráulico Roder para pás carregadeiras</strong> é um equipamento de alta performance e robustez projetado e fabricado exclusivamente sob medida para cada marca e modelo de máquina. Como cada pá carregadeira possui dimensões únicas de pinos de acoplamento e largura interna de braço de elevação, o dimensionamento personalizado é fundamental para garantir a perfeita compatibilidade mecânica e segurança física absoluta.
                    </p>
                    <p className="text-justify">
                      Com o engate rápido Roder, o operador realiza o engate e desengate de implementos (como a caçamba original de terra, garfo pallet de carregamento, conchas High Tip, garras e outros) em menos de 30 segundos, sem a necessidade de sair de dentro da cabine, otimizando os tempos de ciclo e aumentando drasticamente a produtividade logística da sua operação.
                    </p>
                  </div>

                  <div className="lg:col-span-5 bg-slate-50 rounded-xl p-4 md:p-6 border border-slate-150 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Vantagens de Operação
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-600">
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>Segurança Física:</strong> Acoplamento rígido de alta resistência projetado sob medida para garantir estabilidade total da operação.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>Agilidade na Troca:</strong> Substituição rápida de acessórios sem esforço físico do operador.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>Instalação Roder:</strong> A Roder fornece junto ao orçamento a instalação completa da linha hidráulica extra na pá carregadeira do cliente.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Highlight Panel: Hydraulic Variations */}
                <div className="bg-slate-900 text-white rounded-xl p-4 md:p-6 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <div className="bg-orange-500 p-1.5 rounded-lg shrink-0">
                      <span className="block w-4 h-4 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-tight leading-none">
                        Destaque Importante: Instalações Hidráulicas Extras
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">Configure o fluxo hidráulico ideal para o seu conjunto de implementos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs leading-relaxed">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">Variação de 3ª Função</span>
                      <h5 className="text-sm font-black text-white uppercase">3ª Função Padrão (2 Vias)</h5>
                      <p className="text-slate-300">
                        Indicada para o acoplamento do cilindro hidráulico do próprio engate rápido. É a configuração padrão recomendada para operações que utilizam implementos fixos (ou sem cilindro próprio de abre/fecha), tais como:
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
                        <li>Caçamba original de terra</li>
                        <li>Garfo pallet para carregamento</li>
                        <li>Garras e garras de estufagem fixas (AF)</li>
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-orange-500/20 space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Variação de 3ª e 4ª Funções</span>
                      <h5 className="text-sm font-black text-white uppercase">3ª e 4ª Funções Extras (4 Vias)</h5>
                      <p className="text-slate-300">
                        Necessária para equipamentos rotativos com giro hidráulico ou com múltiplos acionamentos mecânicos paralelos. Essa configuração permite realizar o giro do implemento e, simultaneamente, o movimento de abertura/fechamento das garras:
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
                        <li>Garras de estufagem com giro hidráulico (AFG)</li>
                        <li>Carregadores frontais rotativos</li>
                        <li>Implementos ativos com acionamentos extras</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Orientação para os Vendedores */}
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-800 dark:text-orange-200 p-5 rounded-xl text-xs leading-relaxed flex items-start gap-3 mt-4">
                  <span className="text-lg shrink-0">⚠️</span>
                  <div>
                    <strong>ORIENTAÇÃO PARA OS VENDEDORES:</strong> É de responsabilidade dos vendedores buscar com o cliente as informações completas da máquina (marca, modelo e ano exato), além de solicitar fotos e vídeos para enviar ao setor técnico da Roder. Se o cliente for adquirir um implemento Roder que possua giro (como o Carregador Frontal ou Garras AFG), o orçamento comercial deve contemplar a instalação de <strong>3ª e 4ª funções extras</strong> na máquina para permitir o perfeito acionamento do sistema.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer indicator */}
          <div className="py-12 text-center text-muted-foreground text-sm border-t border-dashed border-border mt-10">
            <p>Fim da lista de modelos para {viewingGallery.name}.</p>
            <Button 
              variant="link" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-primary font-bold mt-2"
            >
              Voltar ao topo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-8">
          {/* Sticky Header Container - Offset by Layout header height on mobile */}
          <div className="sticky top-[80px] md:top-0 z-20 bg-background/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 border-b border-border shadow-sm md:static md:bg-transparent md:backdrop-blur-none md:p-0 md:m-0 md:border-none md:shadow-none">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm border border-border">
                    <img 
                      src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Catálogo de Equipamentos</h1>
                    <p className="text-[10px] md:text-sm text-muted-foreground hidden xs:block">Linha completa Roder.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
                      <Button 
                        variant={animationType === 'tilt' ? 'default' : 'ghost'} 
                        size="sm" 
                        className="h-7 md:h-8 text-[9px] md:text-xs px-2 md:px-3"
                        onClick={() => setAnimationType('tilt')}
                      >
                        Tilt
                      </Button>
                      <Button 
                        variant={animationType === 'rotate' ? 'default' : 'ghost'} 
                        size="sm" 
                        className="h-7 md:h-8 text-[9px] md:text-xs px-2 md:px-3"
                        onClick={() => setAnimationType('rotate')}
                      >
                        Giro
                      </Button>
                    </div>
                  )}
                  {(isAdmin || isManager) && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const newestProduct = products[0]?.name || '';
                          setAnnouncementEquipment(newestProduct);
                          setIsAnnouncementOpen(true);
                        }} 
                        className="border-green-600 text-green-600 hover:bg-green-50 h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm font-semibold flex items-center gap-1.5"
                      >
                        <Megaphone className="h-4 w-4" /> <span className="hidden xs:inline">Anunciar Novidades</span>
                      </Button>
                      <Button 
                        onClick={() => { resetForm(); setIsDialogOpen(true); }} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden xs:inline">Novo Produto</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 items-center">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar equipamento ou modelo..." 
                    className="pl-10 pr-10 h-9 md:h-11 bg-background border-border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Seletor de Modo de Visualização (Apenas Computador) */}
                <div className="hidden md:flex items-center bg-muted/60 rounded-xl p-1 border border-border/80 md:ml-2 flex-shrink-0">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => changeViewMode('card')}
                    className={cn(
                      "h-8 text-xs px-3 gap-1.5 font-bold rounded-lg transition-all",
                      viewMode === 'card' ? "shadow-xs bg-background text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    <span>Card</span>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => changeViewMode('list')}
                    className={cn(
                      "h-8 text-xs px-3 gap-1.5 font-bold rounded-lg transition-all",
                      viewMode === 'list' ? "shadow-xs bg-background text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="h-3.5 w-3.5 text-primary" />
                    <span>Lista</span>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {(isAdmin || isManager) && (
                    <Button 
                      variant="outline"
                      onClick={() => { 
                        resetForm(); 
                        setFormData(prev => ({ ...prev, name: 'Nova Família' }));
                        setIsDialogOpen(true); 
                      }} 
                      className="flex-1 md:flex-none border-primary text-primary hover:bg-primary/5 h-9 px-3 text-[10px] md:h-10 md:px-4 md:text-xs"
                    >
                      <Layers className="h-4 w-4 mr-1 md:mr-2" /> <span>Nova Família</span>
                    </Button>
                  )}
                  <div className="hidden md:flex gap-2">
                    {(isAdmin || isManager) && !products.some(p => p.name === 'Cabeçote Multifuncional') && (
                      <Button 
                        variant="outline" 
                        onClick={addCabecoteMultifuncional} 
                        disabled={loading}
                        className="border-primary text-primary hover:bg-primary/10 font-bold h-9 md:h-10 text-xs"
                      >
                        <CloudDownload className="h-4 w-4 mr-1" /> Sinc. Cabeçote
                      </Button>
                    )}
                    {(isAdmin || isManager) && !products.some(p => p.name === 'Garra Traçadora') && (
                      <Button 
                        variant="outline" 
                        onClick={addGarraTracadora} 
                        disabled={loading}
                        className="border-green-600 text-green-600 hover:bg-green-600/10 font-bold h-9 md:h-10 text-xs"
                      >
                        <CloudDownload className="h-4 w-4 mr-1" /> Sinc. Garra
                      </Button>
                    )}
                    {(isAdmin || isManager) && (
                      <Button 
                        variant="outline" 
                        onClick={addGarraEstufagem} 
                        disabled={loading}
                        className="border-orange-600 text-orange-600 hover:bg-orange-600/10 font-bold h-9 md:h-10 text-xs"
                      >
                        <CloudDownload className="h-4 w-4 mr-1" /> Sinc. Estufagem
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={products.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className={cn(
                viewMode === 'list' 
                  ? "flex flex-col gap-4 w-full" 
                  : cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4",
                      isHelperOpen ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"
                    )
              )}>
                {products
                  .filter(p => !p.is_blocked || isManager || isAdmin || isMarketing)
                  .filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((product) => (
                    <SortableProductCard 
                      key={product.id}
                      product={product}
                      isManager={isManager}
                      isAdmin={isAdmin}
                      isMarketing={isMarketing}
                      searchTerm={searchTerm}
                      isExternalSeller={isExternalSeller}
                      openPdf={openPdf}
                      user={user}
                      animationType={animationType}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      onToggleBlock={toggleBlock}
                      onToggleBanner={toggleBanner}
                      onDelete={(id: string, name: string) => setProductToDelete({id, name})}
                      onSelectModels={(product: Product) => {
                        setViewingGallery(product);
                      }}
                      onOpenDigitalSelection={(product: Product) => {
                        setIsHighTipSelectorOpen(true);
                      }}
                      onIndicate={handleIndicate}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

        <Dialog open={!!selectedProductModels} onOpenChange={(open) => !open && setSelectedProductModels(null)}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[98vw] lg:max-w-[1300px] w-full max-h-[95vh] overflow-hidden flex flex-col p-0 shadow-2xl">
            <DialogHeader className="p-6 border-b border-border bg-muted/30 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">{selectedProductModels?.name}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Selecione um modelo para ver detalhes técnicos.</DialogDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-muted"
                onClick={() => setSelectedProductModels(null)}
              >
                <Plus className="h-6 w-6 rotate-45" />
              </Button>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Models List */}
              <div className={cn(
                "w-full md:w-[320px] border-r border-border overflow-y-auto bg-muted/5 shrink-0",
                selectedModel && "hidden md:block"
              )}>
                <div className="p-3 space-y-2">
                  <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 mb-3 no-print">
                    <p className="text-xs font-bold text-primary flex items-start gap-2 leading-snug">
                      <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>Por favor, selecione qual modelo você deseja para visualizar a ficha técnica e detalhes.</span>
                    </p>
                  </div>
                  {selectedProductModels?.models?.map((model, idx) => (
                    <div
                      key={model.id || `sel-model-${idx}`}
                      className={cn(
                        "w-full flex items-center p-1 rounded-lg transition-all group",
                        selectedModel?.id === model.id 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-muted"
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 mr-1 shrink-0",
                          (model.pdf_url || selectedProductModels?.pdf_url || isAnyFichaSupported(selectedProductModels) || isEngateProduct(model.name) || isHighTipProduct(model.name) || isFresaProduct(model.name) || isLoaderTrituradorProduct(model.name)) ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : "hidden"
                        )}
                        disabled={!(model.pdf_url || selectedProductModels?.pdf_url || isAnyFichaSupported(selectedProductModels) || isEngateProduct(model.name) || isHighTipProduct(model.name) || isFresaProduct(model.name) || isLoaderTrituradorProduct(model.name))}
                        onClick={() => openPdf(model.pdf_url || selectedProductModels?.pdf_url || '', model.name, selectedProductModels)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>

                      <button
                        onClick={() => setSelectedModel(model)}
                        className="flex-1 flex items-center justify-between p-2 text-left"
                      >
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-bold",
                            selectedModel?.id === model.id ? "text-primary" : "text-foreground"
                          )}>{model.name}</span>
                          {!isExternalSeller && typeof model.base_value === 'number' && model.base_value > 0 ? (
                            <span className="text-[10px] text-muted-foreground">
                              Valor Base: {formatCurrency(model.base_value)}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          {(isManager || isAdmin) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingModelData(JSON.parse(JSON.stringify(model)));
                                setEditingModelIndex(selectedProductModels?.models?.findIndex(m => m.id === model.id) ?? null);
                                setIsEditingFromProductDialog(false);
                                setIsModelEditOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            selectedModel?.id === model.id ? "translate-x-1 text-primary" : "opacity-0 group-hover:opacity-100"
                          )} />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Details */}
              <div className={cn(
                "flex-1 overflow-y-auto p-6 bg-background",
                !selectedModel && "hidden md:block"
              )}>
                {selectedModel ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="md:hidden w-full mb-6 text-primary font-bold shadow-sm border border-primary/20"
                      onClick={() => setSelectedModel(null)}
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" /> Voltar para a lista de modelos
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-3xl font-black text-foreground tracking-tight">Modelo {selectedModel.name}</h3>
                      {!isExternalSeller && typeof selectedModel.base_value === 'number' && selectedModel.base_value > 0 ? (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
                          <DollarSign className="h-5 w-5" />
                          <span className="font-bold text-lg">{formatCurrency(selectedModel.base_value)}</span>
                        </div>
                      ) : null}
                    </div>

                    {selectedModel.technical_specs && (
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Image Carousel */}
                        <div className="w-full sm:w-64 h-64 bg-muted rounded-xl overflow-hidden border border-border shrink-0 relative group">
                          {selectedModel.images && selectedModel.images.length > 0 ? (
                            <ImageCarousel 
                              images={selectedModel.images} 
                              zoom={selectedModel.image_zoom || 1} 
                              onClick={() => {
                                setLightboxImages(selectedModel.images);
                                setLightboxTitle(selectedModel.name);
                                setIsLightboxOpen(true);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                              <Package className="h-10 w-10 mb-2 opacity-20" />
                              <span className="text-xs">Sem imagens específicas para este modelo</span>
                            </div>
                          )}
                        </div>

                        {/* Technical Specs Grid */}
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                          {selectedModel.technical_specs.area_carga && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Área de Carga</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.area_carga} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">m²</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.diametro_minimo && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Diâmetro Mínimo</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.diametro_minimo} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.abertura_maxima && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Abertura Máxima</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.abertura_maxima} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.abertura_total && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Abertura total da garra</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.abertura_total} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.trator && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Pá Carregadeira</p>
                              <p className="text-[9px] md:text-lg font-black text-primary">{selectedModel.technical_specs.trator}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.volume_concha && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Volume da Concha</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.volume_concha}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.peso && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Peso Equipamento</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.peso} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">kg</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.pressao_trabalho && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Pressão Trabalho</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.pressao_trabalho} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">bar</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.maquina_base && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Máquina Base</p>
                              <p className="text-[9px] md:text-lg font-black text-primary">{selectedModel.technical_specs.maquina_base}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.area_carga && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Área Carga</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.area_carga}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.medida_a && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Comprimento "A"</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.medida_a} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.medida_b && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Altura "B"</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.medida_b} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.medida_c && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Largura Total "C"</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.medida_c} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.medida_d && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Medida "D"</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.medida_d} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          
                          {/* Mini Skidder Specs */}
                          {selectedModel.technical_specs.area_da_garra && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Área da Garra</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.area_da_garra}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.potencia_do_trator && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Potência do Trator</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.potencia_do_trator}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.capacidade_de_carga && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Capacidade de Carga</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.capacidade_de_carga} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">kg</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.peso_do_equipamento && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Peso</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.peso_do_equipamento} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">kg</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.altura_total && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Altura Total</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.altura_total} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.largura_total && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Largura Total</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.largura_total} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.comprimento_util_garfo && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[6px] md:text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Comprimento Útil do Garfo</p>
                              <p className="text-[9px] md:text-xl font-black text-primary">{selectedModel.technical_specs.comprimento_util_garfo} <span className="text-[7.5px] md:text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}

                          {/* Cabeçote Multifuncional Specs */}
                          {selectedModel.technical_specs.diametro_corte && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Ø Máx. Corte</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.diametro_corte} <span className="text-xs font-medium text-muted-foreground">mm</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.sabre && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Sabre</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.sabre}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.corrente && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Corrente</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.corrente}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.vazao && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Vazão</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.vazao} <span className="text-xs font-medium text-muted-foreground">L/min</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.pressao && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Pressão</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.pressao} <span className="text-xs font-medium text-muted-foreground">bar</span></p>
                            </div>
                          )}
                          {selectedModel.technical_specs.peso_operacional && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Peso Operacional</p>
                              <p className="text-lg font-black text-primary">{selectedModel.technical_specs.peso_operacional}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.motor && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Motor</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.motor}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.dentes_disco && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Dentes do Disco</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.dentes_disco}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.acumulador && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Acumulador</p>
                              <p className="text-xl font-black text-primary">{selectedModel.technical_specs.acumulador}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.giro_360 && (
                            <div className="p-3 rounded-xl border border-border bg-orange-500/10 shadow-sm hover:border-orange-500/50 transition-all scale-105">
                              <p className="text-[10px] text-orange-600 uppercase font-black tracking-wider mb-1">Giro 360 graus ilimitado</p>
                              <p className="text-xl font-black text-orange-600">{selectedModel.technical_specs.giro_360}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.diametro_max_trituracao && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Diâmetro Máx. Trituração</p>
                              <p className="text-sm font-black text-primary">{selectedModel.technical_specs.diametro_max_trituracao}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.tipo_dente && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors col-span-2">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Tipo de dente</p>
                              <p className="text-xs font-black text-primary">{selectedModel.technical_specs.tipo_dente}</p>
                            </div>
                          )}
                          {selectedModel.technical_specs.tipo_material && (
                            <div className="p-3 rounded-xl border border-border bg-muted/20 shadow-sm hover:border-primary/30 transition-colors col-span-2">
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-1">Tipo de Material</p>
                              <p className="text-xs font-black text-primary leading-relaxed break-words whitespace-normal">{selectedModel.technical_specs.tipo_material}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informações completas do Engate Rápido */}
                    {selectedProductModels?.name?.toLowerCase().includes('engate') && (
                      <div className="mt-6 border border-orange-500/20 bg-orange-500/5 rounded-xl p-5 space-y-4 shadow-sm border-l-4 border-l-orange-500">
                        <div className="flex items-center gap-2 text-orange-600 font-extrabold uppercase text-xs tracking-wider">
                          <Info className="h-5 w-5 text-orange-500" />
                          <span>Instalações Hidráulicas & Requisitos Operacionais</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-relaxed text-justify">
                          O <strong>Engate Rápido Hidráulico Roder para Pás Carregadeiras</strong> é fabricado sob encomenda e dimensionado sob medida para cada marca e modelo específico de máquina. Como cada carregadeira possui dimensões exclusivas de pinos de acoplamento e largura de braço, a personalização de engenharia garante perfeito acoplamento, durabilidade e segurança física total. Ele permite alternar de forma extremamente rápida e dinâmica entre a caçamba original de terra, garfo pallet, concha High Tip, garras, etc., diretamente da cabine via botão eletrônico.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="bg-card border border-border rounded-lg p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                              <span className="font-bold text-xs text-foreground uppercase">3ª Função Extra (2 Vias / 1 Par de Engates)</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Opção de instalação padrão de terceira função extra (2 vias) na pá carregadeira, inclusa no orçamento comercial padrão da Roder. É utilizada para realizar o acionamento (abrir/fechar) dos pinos de travamento do engate rápido. Ideal para implementos que não giram, como a Garra Frontal ou garras de estufagem simples AF.
                            </p>
                          </div>

                          <div className="bg-card border border-border rounded-lg p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-purple-500" />
                              <span className="font-bold text-xs text-foreground uppercase">3ª e 4ª Funções Extras (4 Vias / 2 Pares de Engates)</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Necessária quando o cliente utilizará implementos rotativos (como o Carregador Frontal ou garras de estufagem com giro AFG). Nesse caso, a 3ª função faz o acionamento de abertura/fechamento das pinças do equipamento e a 4ª função aciona o giro horário/anti-horário do rotador hidráulico pendurado.
                            </p>
                          </div>
                        </div>

                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-800 dark:text-orange-200 p-3.5 rounded-lg text-xs leading-relaxed">
                          <strong>⚠️ ORIENTAÇÃO PARA OS VENDEDORES:</strong> É de responsabilidade dos vendedores buscar com o cliente as informações completas da máquina (marca, modelo e ano exato), além de solicitar fotos e vídeos para enviar ao setor técnico da Roder. Se o cliente for adquirir um implemento Roder que possua giro (como o Carregador Frontal ou Garras AFG), o orçamento comercial deve contemplar a instalação de <strong>3ª e 4ª funções extras</strong> na máquina para permitir o perfeito acionamento do sistema.
                        </div>
                      </div>
                    )}

                    {/* Embedded Video Player */}
                    {selectedModel.video_url && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Video className="h-4 w-4" />
                          <h4 className="text-sm font-bold uppercase tracking-wider">Vídeo Demonstrativo</h4>
                        </div>
                        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black shadow-lg">
                          {selectedModel.video_url.includes('youtube.com') || selectedModel.video_url.includes('youtu.be') ? (
                            <iframe 
                              src={selectedModel.video_url.replace('watch?v=', 'embed/').split('&')[0].replace('youtu.be/', 'youtube.com/embed/')}
                              className="w-full h-full"
                              allowFullScreen
                              title="Vídeo do Modelo"
                            />
                          ) : (
                            <video 
                              src={selectedModel.video_url} 
                              controls 
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {selectedModel.technical_sheet_image && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Eye className="h-4 w-4" />
                          <h4 className="text-sm font-bold uppercase tracking-wider">Visualização da Ficha Técnica</h4>
                        </div>
                        <div className="rounded-xl border border-border overflow-hidden bg-muted/10">
                          <img 
                            src={selectedModel.technical_sheet_image} 
                            alt="Ficha Técnica" 
                            className="w-full h-auto"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-border space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <FileDown className="h-4 w-4" />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Documentação e Compartilhamento</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex gap-1 w-full">
                          <Button 
                            variant="outline" 
                            className={cn(
                              "flex-1 justify-start gap-2 border-border h-11",
                              !(selectedModel.pdf_url || selectedProductModels?.pdf_url || isAnyFichaSupported(selectedProductModels) || isEngateProduct(selectedModel.name) || isHighTipProduct(selectedModel.name) || isFresaProduct(selectedModel.name) || isLoaderTrituradorProduct(selectedModel.name)) && "hidden"
                            )}
                            onClick={() => openPdf(selectedModel.pdf_url || selectedProductModels?.pdf_url || '', selectedModel.name, selectedProductModels)}
                            disabled={!(selectedModel.pdf_url || selectedProductModels?.pdf_url || isAnyFichaSupported(selectedProductModels) || isEngateProduct(selectedModel.name) || isHighTipProduct(selectedModel.name) || isFresaProduct(selectedModel.name) || isLoaderTrituradorProduct(selectedModel.name))}
                          >
                            <FileText className="h-4 w-4 text-red-500" /> Ficha Técnica (PDF)
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-11 w-11 shrink-0 border-border",
                              !(selectedModel.pdf_url || selectedProductModels?.pdf_url || isAnyFichaSupported(selectedProductModels) || isEngateProduct(selectedModel.name) || isHighTipProduct(selectedModel.name) || isFresaProduct(selectedModel.name) || isLoaderTrituradorProduct(selectedModel.name)) && "hidden"
                            )}
                            onClick={() => shareFile(selectedModel.pdf_url || selectedProductModels?.pdf_url || '', `Ficha Técnica - ${selectedModel.name}`)}
                            disabled={!(selectedModel.pdf_url || selectedProductModels?.pdf_url || isAnyFichaSupported(selectedProductModels) || isEngateProduct(selectedModel.name) || isHighTipProduct(selectedModel.name) || isFresaProduct(selectedModel.name) || isLoaderTrituradorProduct(selectedModel.name))}
                          >
                            <Share2 className="h-4 w-4 text-primary" />
                          </Button>
                        </div>

                        <div className="flex gap-1 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1 justify-start gap-2 border-border h-11"
                            onClick={() => openPdf(selectedModel.parts_manual_url || '')}
                            disabled={!selectedModel.parts_manual_url}
                          >
                            <Package className="h-4 w-4 text-orange-500" /> Manual de Peças (PDF)
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0 border-border"
                            onClick={() => shareFile(selectedModel.parts_manual_url || '', `Manual de Peças - ${selectedModel.name}`)}
                            disabled={!selectedModel.parts_manual_url}
                          >
                            <Share2 className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 border-border h-11 bg-green-500/5 hover:bg-green-500/10 border-green-500/20"
                          onClick={() => shareModelOnWhatsApp(selectedProductModels?.name || '', selectedModel)}
                        >
                          <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp (Ficha + Vídeo)
                        </Button>
                        {['fae-uml-ex-vt', 'fae-uml-s-ex-vt', 'fae-umm-ex-vt'].includes(selectedModel.id) && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2 border-border h-11 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-slate-800 font-semibold"
                            onClick={() => setIsTechnicalDeliveryOpen(true)}
                          >
                            <FileText className="h-4 w-4 text-amber-500" /> Ficha de Entrega Técnica
                          </Button>
                        )}
                        {selectedModel.parts_manual_url && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2 border-border h-11 bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20"
                            onClick={() => sharePartsManualOnWhatsApp(selectedProductModels?.name || '', selectedModel)}
                          >
                            <Share2 className="h-4 w-4 text-orange-500" /> Enviar Manual via WhatsApp
                          </Button>
                        )}
                        {selectedModel.video_url && (
                          <Button variant="outline" className="w-full justify-start gap-2 border-border h-11 bg-red-500/5 hover:bg-red-500/10 border-red-500/20" asChild>
                            <a href={selectedModel.video_url} target="_blank" rel="noreferrer">
                              <Video className="h-4 w-4 text-red-500" /> Ver Vídeo do Modelo
                            </a>
                          </Button>
                        )}
                      </div>

                      {isExternalSeller && (
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 mt-4"
                          onClick={() => {
                            navigate('/indicacoes/nova', { state: { product_name: `${selectedProductModels?.name} ${selectedModel.name}` } });
                            setSelectedProductModels(null);
                          }}
                        >
                          Indicar Este Modelo
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  selectedProductModels?.name === 'Caçamba High Tip' ? (
                    <div className="space-y-4 pb-8">
                      <HighTipSelector 
                        onSelectModel={(capacity) => {
                          const found = selectedProductModels.models?.find(m => 
                            m.name.includes(capacity) || 
                            (m.technical_specs && (m.technical_specs as any).capacidade?.includes(capacity))
                          );
                          if (found) {
                            setSelectedModel(found);
                          }
                        }}
                        embedded={true}
                        modelsList={selectedProductModels.models || []}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <div className="p-4 rounded-full bg-muted">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Selecione um modelo à esquerda<br/>para ver as especificações.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Deletion Confirmation Dialog */}
        <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Confirmar Exclusão</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Tem certeza que deseja excluir o produto <span className="font-bold text-foreground">"{productToDelete?.name}"</span>? 
                Esta ação removerá permanentemente o equipamento do catálogo e não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setProductToDelete(null)} className="border-border text-foreground">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                Excluir Permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Announcement Dialog */}
        <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-[95vw] sm:max-w-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Megaphone className="h-5 w-5 text-green-600" />
                Anunciar Novos Equipamentos por E-mail
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Envie um comunicado oficial para todos os vendedores (internos e externos) cadastrados na plataforma informando sobre novas máquinas no catálogo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="announcement_equipment" className="text-sm font-semibold flex items-center justify-between">
                  <span>Equipamentos Cadastrados (novo produto)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Ex: DTH 240B, Feller Tesoura</span>
                </Label>
                <Input 
                  id="announcement_equipment"
                  placeholder="Ex: DTH 240B"
                  value={announcementEquipment}
                  onChange={(e) => setAnnouncementEquipment(e.target.value)}
                  className="bg-background border-border text-foreground h-11"
                  disabled={announcementSending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement_message" className="text-sm font-semibold">Explicativo / Parágrafo do Comunicado</Label>
                <Textarea 
                  id="announcement_message"
                  placeholder="Mensagem explicando a importância ou detalhes operacionais do produto..."
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  className="bg-background border-border text-foreground min-h-[100px] text-xs leading-relaxed font-sans"
                  disabled={announcementSending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement_link" className="text-sm font-semibold">Link de Acesso Direto</Label>
                <Input 
                  id="announcement_link"
                  placeholder="https://..."
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  className="bg-background border-border text-foreground h-11 text-xs"
                  disabled={announcementSending}
                />
              </div>

              {announcementSending && (
                <div className="space-y-2 pt-2 animate-pulse">
                  <div className="flex justify-between text-xs font-semibold text-green-600">
                    <span>Enviando e-mails para os parceiros...</span>
                    <span>{announcementProgress.current} de {announcementProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-green-600 h-full transition-all duration-300"
                      style={{ width: `${(announcementProgress.current / announcementProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setIsAnnouncementOpen(false)} 
                disabled={announcementSending}
                className="border-border text-foreground"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSendAnnouncement} 
                disabled={announcementSending}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2 h-11 px-4"
              >
                {announcementSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando... ({announcementProgress.current}/{announcementProgress.total})</span>
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4" />
                    <span>Disparar Anúncio</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-[95vw] sm:max-w-xl shadow-xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Preencha as informações técnicas do equipamento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input 
                    id="category" 
                    placeholder="Ex: Garras Florestais"
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-background border-border min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video">Vídeo (Link YouTube ou Upload)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="video" 
                      value={formData.video_url} 
                      onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                      className="bg-background border-border flex-1"
                      placeholder="Link do YouTube"
                    />
                    <div className="relative">
                      <Input 
                        type="file"
                        accept="video/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProductVideoFile(file);
                            toast.success('Vídeo selecionado!');
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {productVideoFile && (
                    <div className="flex items-center justify-between bg-primary/10 p-2 rounded border border-primary/20">
                      <span className="text-[10px] font-medium truncate max-w-[150px]">{productVideoFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => setProductVideoFile(null)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf">Link do PDF / Ficha Técnica</Label>
                  <Input 
                    id="pdf" 
                    value={formData.pdf_url} 
                    onChange={(e) => setFormData({...formData, pdf_url: e.target.value})}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Destaque no Dashboard
                    </Label>
                    <p className="text-[10px] text-muted-foreground">O produto aparecerá como uma barra de propaganda no Dashboard.</p>
                  </div>
                  <Checkbox 
                    checked={formData.show_banner} 
                    onCheckedChange={(checked) => setFormData({...formData, show_banner: !!checked})}
                  />
                </div>
                {formData.show_banner && (
                  <div className="space-y-2">
                    <Label htmlFor="banner_message" className="text-xs">Mensagem do Banner (Opcional)</Label>
                    <Input 
                      id="banner_message" 
                      placeholder="Ex: Oferta Especial de Lançamento! Confira as condições."
                      value={formData.banner_message || ''} 
                      onChange={(e) => setFormData({...formData, banner_message: e.target.value})}
                      className="bg-background border-border text-xs h-8"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2" onPaste={handlePaste}>
                <Label htmlFor="image">Foto do Produto (Link, Arquivo ou Cole aqui)</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    {(imageFile || (editingProduct?.image_url && !imageUrlInput)) && (
                      <div className="flex items-center gap-4 w-full">
                        <div className="relative group shrink-0">
                          <SmartImage 
                            src={imageFile ? URL.createObjectURL(imageFile) : editingProduct?.image_url} 
                            alt="Preview" 
                            zoom={formData.image_zoom || 1}
                            className="w-20 h-20 rounded-lg object-cover border border-border" 
                          />
                          {imageFile && (
                            <button 
                              onClick={() => setImageFile(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] uppercase">Ajuste de Zoom: {Math.round((formData.image_zoom || 1) * 100)}%</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px]" 
                              onClick={() => setFormData({...formData, image_zoom: 1})}
                            >
                              Resetar
                            </Button>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="3" 
                            step="0.05" 
                            value={formData.image_zoom || 1} 
                            onChange={(e) => setFormData({...formData, image_zoom: parseFloat(e.target.value)})}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Input 
                        placeholder="Cole o link da imagem aqui..." 
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(fixGoogleDriveLink(e.target.value))}
                        className="bg-background border-border"
                      />
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input 
                            id="image" 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                toast.loading('Comprimindo imagem...', { id: 'file-toast' });
                                compressImage(file).then(compressed => {
                                  setImageFile(compressed);
                                  toast.success('Imagem carregada!', { id: 'file-toast' });
                                });
                              }
                            }}
                            className="bg-background border-border pr-10"
                          />
                          <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic hidden sm:block">
                          Dica: Você também pode colar uma imagem (Ctrl+V)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Models Management */}
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Modelos do Produto</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const newModel = { 
                        id: Math.random().toString(36).substr(2, 9), 
                        name: '', 
                        base_value: 0,
                        pdf_url: '',
                        parts_manual_url: '',
                        video_url: '',
                        images: [],
                        image_zoom: 1,
                        technical_specs: { area_carga: '', diametro_minimo: '', abertura_maxima: '', peso: '', pressao_trabalho: '', maquina_base: '' }
                      };
                      setFormData({
                        ...formData, 
                        models: [...formData.models, newModel]
                      });
                      setEditingModelData(newModel);
                      setEditingModelIndex(formData.models.length);
                      setIsEditingFromProductDialog(true);
                      setIsModelEditOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Modelo
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {formData.models.map((model, idx) => (
                      <div key={model.id || `mgmt-model-${idx}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{model.name || 'Modelo sem nome'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{model.technical_specs?.maquina_base || 'Sem máquina base'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-xs"
                            onClick={() => {
                              setEditingModelData(JSON.parse(JSON.stringify(model)));
                              setEditingModelIndex(idx);
                              setIsEditingFromProductDialog(true);
                              setIsModelEditOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-2" /> Editar Dados
                          </Button>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newModels = [...formData.models];
                              newModels.splice(idx, 1);
                              setFormData({ ...formData, models: newModels });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {formData.models.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">Nenhum modelo adicionado ainda.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border" disabled={submitting || modelUploading}>Cancelar</Button>
              <Button onClick={handleSaveProduct} disabled={submitting || modelUploading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {modelUploading ? 'Aguarde o upload...' : 'Salvar Produto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Individual Model Edit Dialog */}
        <Dialog open={isModelEditOpen} onOpenChange={setIsModelEditOpen}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[600px] w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Editar Dados do Modelo
              </DialogTitle>
              <DialogDescription>
                Altere as especificações técnicas e documentos deste modelo específico.
              </DialogDescription>
            </DialogHeader>

            {editingModelData && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Modelo</Label>
                    <Input 
                      value={editingModelData.name} 
                      onChange={(e) => setEditingModelData({ ...editingModelData, name: e.target.value })}
                      placeholder="Ex: R250"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Base (R$)</Label>
                    <Input 
                      type="number"
                      value={editingModelData.base_value} 
                      onChange={(e) => setEditingModelData({ ...editingModelData, base_value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Especificações Técnicas</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Garra Florestal Fields */}
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Área Carga (m²)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.area_carga} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, area_carga: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Ø Mínimo (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.diametro_minimo} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, diametro_minimo: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Pá Carregadeira (Trator)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.trator} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, trator: e.target.value } 
                        })}
                        placeholder="Ex: 4 a 6 Ton."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Volume da Concha</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.volume_concha} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, volume_concha: e.target.value } 
                        })}
                        placeholder="Ex: 1,4 m³"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Abertura total da garra (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.abertura_total} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, abertura_total: e.target.value } 
                        })}
                        placeholder="Ex: 1465"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Abertura Máx (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.abertura_maxima} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, abertura_maxima: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Ø Máx Carga (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.diametro_max_carga} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, diametro_max_carga: e.target.value } 
                        })}
                        placeholder="Ex: 550"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Comprimento Giro (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.comprimento_giro} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, comprimento_giro: e.target.value } 
                        })}
                        placeholder="Ex: 2200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Peso (kg)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.peso} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, peso: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Pressão Trab (bar)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.pressao_trabalho} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, pressao_trabalho: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Máquina Base</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.maquina_base} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, maquina_base: e.target.value } 
                        })}
                      />
                    </div>

                    {/* Mini Skidder Fields */}
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Área da Garra (m²)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.area_da_garra} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, area_da_garra: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Potência do Trator (HP)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.potencia_do_trator} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, potencia_do_trator: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Capacidade de Carga (kg)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.capacidade_de_carga} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, capacidade_de_carga: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Peso do Equipamento (kg)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.peso_do_equipamento} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, peso_do_equipamento: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Ø Máx Corte (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.diametro_corte} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, diametro_corte: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Sabre</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.sabre} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, sabre: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Corrente</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.corrente} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, corrente: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Vazão (L/min)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.vazao} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, vazao: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Pressão (bar)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.pressao} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, pressao: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Peso Operacional</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.peso_operacional} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, peso_operacional: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Motor</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.motor} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, motor: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Ø Máx. Trituração</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.diametro_max_trituracao} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, diametro_max_trituracao: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Tipo de Dente</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.tipo_dente} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, tipo_dente: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Comprimento "A" (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.medida_a || ''} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, medida_a: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Altura "B" (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.medida_b || ''} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, medida_b: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Largura Total "C" (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.medida_c || ''} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, medida_c: e.target.value } 
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Medida "D" (mm)</Label>
                      <Input 
                        className="h-9 text-xs"
                        value={editingModelData.technical_specs?.medida_d || ''} 
                        onChange={(e) => setEditingModelData({ 
                          ...editingModelData, 
                          technical_specs: { ...editingModelData.technical_specs, medida_d: e.target.value } 
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Documentos e Mídia</Label>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Ficha Técnica (Link Drive)</Label>
                    <Input 
                      className="h-9 text-xs"
                      value={editingModelData.pdf_url} 
                      onChange={(e) => setEditingModelData({ ...editingModelData, pdf_url: fixGoogleDriveLink(e.target.value) })}
                      placeholder="Link do Google Drive"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Manual de Peças (Link Drive)</Label>
                    <Input 
                      className="h-9 text-xs"
                      value={editingModelData.parts_manual_url} 
                      onChange={(e) => setEditingModelData({ ...editingModelData, parts_manual_url: fixGoogleDriveLink(e.target.value) })}
                      placeholder="Link do Google Drive"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Informações e Cálculo de Produtividade do Modelo</Label>
                    <Textarea 
                      className="text-xs min-h-[70px] bg-background"
                      value={editingModelData.productivity_text || ''} 
                      onChange={(e) => setEditingModelData({ ...editingModelData, productivity_text: e.target.value })}
                      placeholder="Ex: A produtividade nominal é de X m³/h. Para madeira de 3m, peso por ciclo = Área da Garra * 3 * 800 kg."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Ficha Técnica como Imagem (Upload ou Cole)</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input 
                          className="h-9 text-xs flex-1"
                          value={editingModelData.technical_sheet_image} 
                          onChange={(e) => setEditingModelData({ ...editingModelData, technical_sheet_image: e.target.value })}
                          onPaste={(e) => handleModelSheetPaste(e, editingModelIndex!)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value.startsWith('http')) {
                                setEditingModelData({ ...editingModelData, technical_sheet_image: target.value });
                                toast.success('Link de ficha técnica adicionado!');
                              }
                            }
                          }}
                          placeholder="Cole a imagem ou use o link"
                        />
                        <div className="relative">
                          <Input 
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-10"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  toast.loading('Processando imagem...', { id: 'sheet-img' });
                                  const url = await smartUpload(file, 'technical_sheets_img');
                                  setEditingModelData({ ...editingModelData, technical_sheet_image: url });
                                  toast.success('Imagem carregada!', { id: 'sheet-img' });
                                } catch (err) { 
                                  toast.error('Erro ao processar imagem'); 
                                }
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Vídeo do Modelo (Link YouTube ou Upload)</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Input 
                          id="video-url" 
                          value={editingModelData.video_url || ''} 
                          onChange={(e) => setEditingModelData({ ...editingModelData, video_url: e.target.value })}
                          placeholder="Link do YouTube"
                          className="h-9 text-xs flex-1"
                        />
                        <div className="relative">
                          <Input 
                            type="file"
                            accept="video/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-10"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setModelVideoFile(file);
                                toast.success('Vídeo selecionado para upload!');
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                            <Video className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {modelVideoFile && (
                        <div className="flex items-center justify-between bg-primary/10 p-2 rounded border border-primary/20">
                          <span className="text-[10px] font-medium truncate max-w-[150px]">{modelVideoFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => setModelVideoFile(null)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase">Imagens da Galeria (Link, Upload ou Cole)</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input 
                          className="h-9 text-xs flex-1"
                          placeholder="Cole a imagem ou cole o link aqui"
                          onPaste={(e) => handleModelGalleryPaste(e, editingModelIndex!)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value.startsWith('http')) {
                                const currentImages = editingModelData.images || [];
                                setEditingModelData({ ...editingModelData, images: [...currentImages, target.value] });
                                target.value = '';
                                toast.success('Link de imagem adicionado!');
                              }
                            }
                          }}
                        />
                        <div className="relative">
                          <Input 
                            type="file"
                            multiple
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-10"
                            onChange={(e) => {
                              if (e.target.files) handleModelImagesUpload(editingModelIndex!, e.target.files);
                            }}
                          />
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {editingModelData.images && editingModelData.images.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] uppercase">Ajuste de Zoom: {Math.round((editingModelData.image_zoom || 1) * 100)}%</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px]" 
                            onClick={() => setEditingModelData({...editingModelData, image_zoom: 1})}
                          >
                            Resetar
                          </Button>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="3" 
                          step="0.05" 
                          value={editingModelData.image_zoom || 1} 
                          onChange={(e) => setEditingModelData({...editingModelData, image_zoom: parseFloat(e.target.value)})}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-lg">
                          {editingModelData.images.map((img: string, i: number) => (
                            <div key={`${img}-${i}`} className="relative w-10 h-10 rounded overflow-hidden group">
                              <SmartImage src={img} alt="" zoom={editingModelData.image_zoom || 1} className="w-full h-full object-cover" />
                              <button 
                                className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                onClick={() => {
                                  const newImages = [...editingModelData.images];
                                  newImages.splice(i, 1);
                                  setEditingModelData({ ...editingModelData, images: newImages });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Apply to other models UI */}
                    {((isEditingFromProductDialog && formData.models.length > 1) || (!isEditingFromProductDialog && (selectedProductModels?.models || viewingGallery?.models) && (selectedProductModels?.models?.length || viewingGallery?.models?.length || 0) > 1)) && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-bold mb-2 text-primary uppercase flex items-center gap-1">
                          <Info className="h-3 w-3" /> Aplicar fotos deste modelo a outros modelos?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(isEditingFromProductDialog ? formData.models : (selectedProductModels?.models || viewingGallery?.models || []))
                            .filter(m => m.id !== editingModelData.id)
                            .map((m, idx) => (
                              <div key={m.id || `apply-${idx}`} className="flex items-center gap-2">
                                <Checkbox 
                                  id={`apply-${m.id}`}
                                  checked={applyImageToOtherModels.includes(m.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplyImageToOtherModels([...applyImageToOtherModels, m.id]);
                                    } else {
                                      setApplyImageToOtherModels(applyImageToOtherModels.filter(id => id !== m.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`apply-${m.id}`} className="text-[10px] cursor-pointer truncate">{m.name}</Label>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { 
                setIsModelEditOpen(false); 
                setModelVideoFile(null); 
                setApplyImageToOtherModels([]);
              }}>Cancelar</Button>
              <Button type="button" onClick={handleSaveModel} disabled={submitting || modelUploading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Alterações do Modelo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ImageLightbox 
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={lightboxImages}
          title={lightboxTitle}
        />

        {isHighTipFichaOpen && (
          <HighTipFicha 
            onClose={() => {
              setIsHighTipFichaOpen(false);
              if (suspendedProductModels) {
                setSelectedProductModels(suspendedProductModels);
                setSuspendedProductModels(null);
              }
              if (suspendedViewingGallery) {
                setViewingGallery(suspendedViewingGallery);
                setSuspendedViewingGallery(null);
              }
            }} 
          />
        )}

        {isFresaSshFichaOpen && (
          <FresaSshFicha 
            onClose={() => {
              setIsFresaSshFichaOpen(false);
              if (suspendedProductModels) {
                setSelectedProductModels(suspendedProductModels);
                setSuspendedProductModels(null);
              }
              if (suspendedViewingGallery) {
                setViewingGallery(suspendedViewingGallery);
                setSuspendedViewingGallery(null);
              }
            }} 
            defaultModelId={fresaSshDefaultModel} 
          />
        )}

        {isTrituradorLoaderFaeFichaOpen && (
          <TrituradorLoaderFaeFicha 
            onClose={() => {
              setIsTrituradorLoaderFaeFichaOpen(false);
              if (suspendedProductModels) {
                setSelectedProductModels(suspendedProductModels);
                setSuspendedProductModels(null);
              }
              if (suspendedViewingGallery) {
                setViewingGallery(suspendedViewingGallery);
                setSuspendedViewingGallery(null);
              }
            }} 
            defaultModelId={trituradorLoaderFaeDefaultModel} 
          />
        )}

        {isEngateRapidoFichaOpen && (
          <EngateRapidoFicha 
            onClose={() => {
              setIsEngateRapidoFichaOpen(false);
              if (suspendedProductModels) {
                setSelectedProductModels(suspendedProductModels);
                setSuspendedProductModels(null);
              }
              if (suspendedViewingGallery) {
                setViewingGallery(suspendedViewingGallery);
                setSuspendedViewingGallery(null);
              }
            }} 
          />
        )}

        {isGarraEstufagemFichaOpen && (
          <GarraEstufagemFicha 
            onClose={() => {
              setIsGarraEstufagemFichaOpen(false);
              if (suspendedProductModels) {
                setSelectedProductModels(suspendedProductModels);
                setSuspendedProductModels(null);
              }
              if (suspendedViewingGallery) {
                setViewingGallery(suspendedViewingGallery);
                setSuspendedViewingGallery(null);
              }
            }} 
            defaultModelId={garraEstufagemDefaultModel}
          />
        )}

        {isTechnicalDeliveryOpen && selectedModel && (
          <MulcherTechnicalDelivery
            modelId={selectedModel.id}
            modelName={`${selectedProductModels?.name} ${selectedModel.name}`}
            isOpen={isTechnicalDeliveryOpen}
            onClose={() => setIsTechnicalDeliveryOpen(false)}
          />
        )}

        <Dialog open={isHighTipSelectorOpen} onOpenChange={setIsHighTipSelectorOpen}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full max-h-[95vh] overflow-y-auto p-0 shadow-2xl rounded-2xl flex flex-col">
            <DialogHeader className="p-6 border-b border-border bg-muted/30 relative shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary animate-pulse">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Guia de Seleção Digital de Caçamba High Tip</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs md:text-sm mt-0.5">
                    Selecione a sua pá carregadeira e o material para obter o modelo ideal de Caçamba High Tip Roder.
                  </DialogDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-muted"
                onClick={() => setIsHighTipSelectorOpen(false)}
              >
                <Plus className="h-6 w-6 rotate-45" />
              </Button>
            </DialogHeader>
            <div className="p-4 md:p-6 flex-1 overflow-y-auto">
              <HighTipSelector 
                embedded={true}
                modelsList={products.find(p => p.name === 'Caçamba High Tip')?.models || []}
                onSelectModel={(capacity) => {
                  const foundProduct = products.find(p => p.name === 'Caçamba High Tip');
                  if (foundProduct) {
                    setSelectedProductModels(foundProduct);
                    const foundModel = foundProduct.models?.find(m => 
                      m.name.includes(capacity) || 
                      (m.technical_specs && (m.technical_specs as any).capacidade?.includes(capacity))
                    );
                    if (foundModel) {
                      setSelectedModel(foundModel);
                    }
                  }
                }}
                onViewFicha={(capacity) => {
                  setIsHighTipSelectorOpen(false);
                  const foundProduct = products.find(p => p.name === 'Caçamba High Tip');
                  if (foundProduct) {
                    setSelectedProductModels(foundProduct);
                    const foundModel = foundProduct.models?.find(m => 
                      m.name.includes(capacity) || 
                      (m.technical_specs && (m.technical_specs as any).capacidade?.includes(capacity))
                    );
                    if (foundModel) {
                      setSelectedModel(foundModel);
                    }
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
    </Layout>
  );
}

