import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Download, 
  Check, 
  Copy, 
  Sparkles, 
  UploadCloud, 
  Layers, 
  HelpCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { generateTechnicalDocx } from '../../utils/generateTechnicalDocx';
import { generateTechnicalManualHtml, copyFormattedTextToClipboard } from '../../utils/generateGoogleDocsHtml';
import { Product } from '../../types';

interface GoogleDocsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  guidelines: Array<{ title?: string; text?: string; category?: string }>;
  userName: string;
}

export default function GoogleDocsExportModal({
  isOpen,
  onClose,
  products,
  guidelines,
  userName
}: GoogleDocsExportModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleOpenDocsNewAndCopy = async () => {
    try {
      const html = generateTechnicalManualHtml({
        products,
        guidelines,
        version: '2.2.0',
        generatedBy: userName || 'RODER Brasil'
      });

      const plainText = `RODER BRASIL - MANUAL TÉCNICO & BASE DE CONHECIMENTO IA\n` +
        `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
        `O manual completo foi copiado com formatação rica para a área de transferência. Basta colar (Ctrl+V) no Google Docs aberto.`;

      const success = await copyFormattedTextToClipboard(html, plainText);
      
      // Open docs.new in a new tab
      window.open('https://docs.new', '_blank');

      if (success) {
        setIsCopied(true);
        toast.success('Documento formatado copiado!', {
          description: 'A nova aba do Google Docs foi aberta. Basta pressionar CTRL + V (ou botão direito -> Colar) para inserir todo o manual formatado!'
        });
        setTimeout(() => setIsCopied(false), 6000);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao copiar o documento formatado.');
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      await generateTechnicalDocx({
        products,
        guidelines,
        version: '2.2.0',
        generatedBy: userName || 'RODER Brasil'
      });
      toast.success('Arquivo .docx baixado com sucesso!', {
        description: 'Dica: Arraste este arquivo para o Google Drive para editá-lo online no Google Docs sem precisar do Microsoft Word.'
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao baixar o arquivo .docx');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                Google Docs & Word
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Como você deseja abrir no Google Docs?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Escolha a forma mais conveniente para editar o Manual Técnico no Google Docs online ou em seu computador:
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* OPTION 1: 1-Click docs.new with Rich HTML */}
          <div className="bg-gradient-to-r from-blue-950/60 to-slate-800/80 border border-blue-500/40 rounded-xl p-5 hover:border-blue-400 transition relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-300">
                    Método Instantâneo (Recomendado)
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Abrir direto no Google Docs (docs.new)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Abre uma nova aba oficial do <strong>Google Docs</strong> em branco e copia todas as tabelas, títulos e cores na sua área de transferência. Basta você pressionar <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-amber-300 font-mono text-[11px]">CTRL + V</kbd> para colar tudo pronto!
                </p>
              </div>

              <Button
                onClick={handleOpenDocsNewAndCopy}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-5 rounded-xl shadow-lg shadow-blue-600/30 text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                {isCopied ? <Check className="w-4 h-4 text-green-300" /> : <ExternalLink className="w-4 h-4" />}
                <span>{isCopied ? 'Copiado! Pressione Ctrl+V' : 'Criar no Google Docs'}</span>
              </Button>
            </div>
          </div>

          {/* OPTION 2: Download .docx with Google Drive Guide */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Arquivo .DOCX (Google Drive / Word)
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Baixar Arquivo .DOCX Editável
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Baixa o arquivo formatado em seu computador. Para editar no Google Docs sem usar o Word, basta arrastar o arquivo para o seu <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5">Google Drive <ExternalLink className="w-3 h-3" /></a> e clicar em <em>"Abrir com Documentos Google"</em>.
                </p>
              </div>

              <Button
                onClick={handleDownloadDocx}
                disabled={isDownloading}
                variant="outline"
                className="border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
                <span>{isDownloading ? 'Baixando...' : 'Baixar .DOCX'}</span>
              </Button>
            </div>
          </div>

        </div>

        {/* Quick Instructions Footer */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-400 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-300">Por que o Windows/Mac abre o Word por padrão?</strong> Computadores com o pacote Office instalado associam arquivos <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">.docx</code> ao Word. Usando o botão <strong>"Criar no Google Docs"</strong> acima ou subindo o arquivo no <strong>Google Drive</strong>, você trabalha 100% online no Google Docs.
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-slate-400 hover:text-white text-xs"
          >
            Fechar
          </Button>
        </div>

      </div>
    </div>
  );
}
