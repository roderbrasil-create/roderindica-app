import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  Check, 
  CheckSquare, 
  Square, 
  Package, 
  Warehouse, 
  Globe, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { StockItem, StockReservation, StockImportFAE } from '../../types';
import { generateStockPdf } from '../../utils/generateStockPdf';
import { cn, safeFormatDate } from '../../lib/utils';
import { abrirDocumento } from '../../lib/abrirDocumento';

interface StockPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
  reservations: StockReservation[];
  importItems: StockImportFAE[];
  userName?: string;
}

export function StockPdfExportModal({
  isOpen,
  onClose,
  items,
  reservations,
  importItems,
  userName = 'Administrador'
}: StockPdfExportModalProps) {
  const [includeFabrica, setIncludeFabrica] = useState(true);
  const [includeSinop, setIncludeSinop] = useState(true);
  const [includeFAE, setIncludeFAE] = useState(true);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Totals calculations
  const fabricaItems = items.filter(i => (i.branch || '').toLowerCase() !== 'sinop');
  const sinopItems = items.filter(i => (i.branch || '').toLowerCase() === 'sinop');

  const calcAvailable = (itemList: StockItem[]) => {
    return itemList.reduce((acc, item) => {
      const reserved = reservations
        .filter(r => r.stock_item_id === item.id && r.status === 'active')
        .reduce((sum, r) => sum + (Number(r.quantity_reserved) || 0), 0);
      const avail = Math.max(0, (Number(item.quantity) || 0) - reserved);
      return acc + avail;
    }, 0);
  };

  const fabricaAvailable = calcAvailable(fabricaItems);
  const sinopAvailable = calcAvailable(sinopItems);
  const faeTotalQtd = importItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  const isNoneSelected = !includeFabrica && !includeSinop && !includeFAE;

  const handleSelectAll = () => {
    setIncludeFabrica(true);
    setIncludeSinop(true);
    setIncludeFAE(true);
  };

  const handleClearAll = () => {
    setIncludeFabrica(false);
    setIncludeSinop(false);
    setIncludeFAE(false);
  };

  const getPdfData = () => {
    return generateStockPdf({
      items,
      reservations,
      importItems,
      options: {
        includeFabrica,
        includeSinop,
        includeFAE,
        onlyAvailable,
        generatedBy: userName
      }
    });
  };

  const handleDownload = async () => {
    if (isNoneSelected) {
      toast.error('Selecione ao menos um estoque para exportar.');
      return;
    }

    try {
      setIsGenerating(true);
      const toastId = toast.loading('Gerando PDF do estoque...');
      
      // Allow UI tick to update spinner
      await new Promise(r => setTimeout(r, 100));

      const { doc, fileName } = getPdfData();
      doc.save(fileName);

      toast.success('PDF de estoque baixado com sucesso!', { id: toastId });
      onClose();
    } catch (error) {
      console.error('Error exporting stock PDF:', error);
      toast.error('Erro ao gerar o PDF de estoque.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (isNoneSelected) {
      toast.error('Selecione ao menos um estoque para visualizar.');
      return;
    }

    try {
      setIsGenerating(true);
      const { blob } = getPdfData();
      const blobUrl = URL.createObjectURL(blob);
      abrirDocumento(blobUrl, 'Estoque');
      toast.success('PDF aberto para visualização!');
    } catch (error) {
      console.error('Error previewing stock PDF:', error);
      toast.error('Erro ao abrir o PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (isNoneSelected) {
      toast.error('Selecione ao menos um estoque para compartilhar.');
      return;
    }

    try {
      setIsSharing(true);
      const { blob, fileName } = getPdfData();

      // Build informative message summary
      const dateStr = safeFormatDate(new Date(), { day: '2-digit', month: '2-digit', year: 'numeric' });
      let summaryText = `*RODER BRASIL - RELATÓRIO OFICIAL DE ESTOQUE* (${dateStr})\n\n`;

      if (includeFabrica) {
        summaryText += `🏭 *Estoque Fábrica (Matriz)*: ${fabricaItems.length} itens cadastrados (${fabricaAvailable} un. disponíveis)\n`;
      }
      if (includeSinop) {
        summaryText += `🏢 *Estoque Filial Sinop (MT)*: ${sinopItems.length} itens cadastrados (${sinopAvailable} un. disponíveis)\n`;
      }
      if (includeFAE) {
        summaryText += `🚢 *Importação FAE*: ${importItems.length} equipamentos (${faeTotalQtd} un. com previsão de chegada)\n`;
      }

      summaryText += `\n🔗 *Consulta de Estoque em Tempo Real:* ${window.location.origin}/stock_holder\n`;
      summaryText += `_Planilha oficial de estoque gerada pelo sistema RODER Indica._`;

      // Check if browser supports sharing files (Mobile or modern browsers)
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: 'Estoque Roder Brasil',
            text: summaryText,
            files: [pdfFile]
          });
          toast.success('Compartilhado com sucesso!');
          onClose();
          return;
        } catch (shareErr) {
          // User cancelled or fallback
          if ((shareErr as Error).name !== 'AbortError') {
            console.log('Share API fallback to WhatsApp link', shareErr);
          }
        }
      }

      // Web fallback: download file and open WhatsApp Web with formatted text
      const { doc } = getPdfData();
      doc.save(fileName);
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
      window.open(whatsappUrl, '_blank');

      toast.success('PDF baixado e WhatsApp aberto para envio!');
      onClose();
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast.error('Erro ao compartilhar via WhatsApp.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-orange-500/30">
        <DialogHeader className="p-5 pb-4 bg-slate-900 text-white border-b-2 border-orange-500">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                Exportar Estoque em PDF
                <Badge variant="outline" className="text-[9px] font-black uppercase border-orange-400/40 text-orange-300 bg-orange-950/40">
                  ADM
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 font-medium">
                Escolha os estoques para consolidar na planilha em formato PDF
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Quick selection controls */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-700">
              Estoques a Incluir no PDF
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Selecionar Todos
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:underline"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Estoques selection cards */}
          <div className="space-y-2.5">
            {/* Fábrica */}
            <div 
              onClick={() => setIncludeFabrica(!includeFabrica)}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none",
                includeFabrica 
                  ? "bg-orange-50/60 border-orange-500 shadow-sm" 
                  : "bg-slate-50/50 border-slate-200 hover:border-slate-300 opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded flex items-center justify-center transition-colors",
                  includeFabrica ? "bg-orange-600 text-white" : "border-2 border-slate-300 bg-white"
                )}>
                  {includeFabrica && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight">
                      Estoque Fábrica (Matriz)
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold text-orange-700 bg-orange-100/70 border-orange-300">
                      Central
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Equipamentos, garras, cabeçotes e peças da matriz
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-emerald-600 block">
                  {fabricaAvailable} disp.
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {fabricaItems.length} itens
                </span>
              </div>
            </div>

            {/* Sinop */}
            <div 
              onClick={() => setIncludeSinop(!includeSinop)}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none",
                includeSinop 
                  ? "bg-amber-50/60 border-amber-500 shadow-sm" 
                  : "bg-slate-50/50 border-slate-200 hover:border-slate-300 opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded flex items-center justify-center transition-colors",
                  includeSinop ? "bg-amber-600 text-white" : "border-2 border-slate-300 bg-white"
                )}>
                  {includeSinop && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight">
                      Estoque Filial Sinop
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold text-amber-700 bg-amber-100/70 border-amber-300">
                      Mato Grosso
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Equipamentos e acessórios a pronta-entrega em Sinop/MT
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-emerald-600 block">
                  {sinopAvailable} disp.
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {sinopItems.length} itens
                </span>
              </div>
            </div>

            {/* Importação FAE */}
            <div 
              onClick={() => setIncludeFAE(!includeFAE)}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none",
                includeFAE 
                  ? "bg-yellow-50/70 border-yellow-500 shadow-sm" 
                  : "bg-slate-50/50 border-slate-200 hover:border-slate-300 opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded flex items-center justify-center transition-colors",
                  includeFAE ? "bg-yellow-500 text-black" : "border-2 border-slate-300 bg-white"
                )}>
                  {includeFAE && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight">
                      Importação FAE
                    </span>
                    <Badge variant="outline" className="text-[9px] font-extrabold text-yellow-800 bg-yellow-200/80 border-yellow-400">
                      Em Trânsito
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Previsões de chegada, embarques e fresas/trituradores FAE
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-yellow-700 block">
                  {faeTotalQtd} un. prev.
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {importItems.length} lotes
                </span>
              </div>
            </div>
          </div>

          {/* Filtering options */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-100/70 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <Label htmlFor="only-available" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Apenas itens com saldo disponível
                </Label>
                <p className="text-[11px] text-slate-500">
                  Oculta itens com estoque zero e sem reservas ativas
                </p>
              </div>
              <Switch
                id="only-available"
                checked={onlyAvailable}
                onCheckedChange={setOnlyAvailable}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900 text-xs">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-blue-800">
                O PDF gerado é consolidado em alta definição, pronto para impressão, envio para clientes ou arquivamento pela gerência comercial.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isGenerating || isSharing}
            className="text-xs font-bold text-slate-600 order-last sm:order-first"
          >
            Fechar
          </Button>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isNoneSelected || isGenerating || isSharing}
              className="text-xs font-bold border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 h-9"
              title="Visualizar em uma nova aba antes de baixar"
            >
              <Eye className="h-3.5 w-3.5 text-slate-600" />
              Visualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              disabled={isNoneSelected || isGenerating || isSharing}
              className="text-xs font-black uppercase tracking-tight text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 flex items-center gap-1.5 h-9"
              title="Compartilhar PDF ou resumo pronto no WhatsApp"
            >
              {isSharing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-emerald-600" />
              )}
              WhatsApp
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={isNoneSelected || isGenerating || isSharing}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-tight flex items-center gap-1.5 shadow-md h-9 px-4 border border-orange-700"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Exportar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
