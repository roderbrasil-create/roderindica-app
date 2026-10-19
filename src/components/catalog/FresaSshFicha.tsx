import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Video,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { pdfDasFolhas, entregarPdf, nomeArquivoFicha, usePodeEnviarFicha } from './fichaPdf';
import { toast } from 'sonner';
import { EditableImage } from './EditableImage';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useVoltarFecha } from '../../lib/useVoltarFecha';
import { BotaoEnviarFicha } from './BotaoEnviarFicha';

// Cores da ficha técnica Roder (grafite, laranja e laranja claro)
const COR_G = '#1B1E22';
const COR_L = '#E8590C';
const COR_LC = '#FFF1E8';
const COR_T2 = '#5E6672';
const COR_BD = '#E2E5E8';
const COR_VD = '#15803D';
const COR_VM = '#B91C1C';
const FONTE_TIT = "'Archivo Variable', 'Geist Variable', sans-serif";
const FONTE_TXT = "'Geist Variable', system-ui, sans-serif";
// A4 na largura de 840 px da folha: 840 x 297 / 210
const ALTURA_FOLHA = 1188;

// "1600 mm" vira "1.600"
const milhar = (s: string) => {
  const n = s.match(/\d+/)?.[0];
  return n ? n.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s;
};
// "200 - 360 (400) HP (CVT)" vira "200 a 360 (400)"
const faixaTrator = (s: string) => s.replace(/\s*HP.*$/i, '').replace(/\s*-\s*/, ' a ').trim();
// "58 + 4 dentes (Tipo A/3 + MH)" vira "58 + 4"
const dentesCurto = (s: string) => s.match(/^\s*(\d+\s*\+\s*\d+)/)?.[1].replace(/\s*\+\s*/, ' + ') || s;


interface FresaSshFichaProps {
  onClose: () => void;
  defaultModelId?: string;
  // aberta pelo "Enviar ficha": destaca o botão Enviar
  enviar?: boolean;
}

interface ModelSpec {
  trator_hp: string;
  pto_rpm: string;
  largura_trabalho_mm: string;
  largura_total_mm: string;
  peso_kg: string;
  diametro_rotor_mm: string;
  diametro_max_trituracao_mm: string;
  profundidade_max_trabalho_mm: string;
  dentes_tipo: string;
}

export function FresaSshFicha({ onClose, defaultModelId = 'ssh-150', enviar = false }: FresaSshFichaProps) {
  // "Voltar" do celular fecha a ficha e volta para a tela de onde ela foi aberta
  useVoltarFecha(true, onClose);
  const { isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const canEdit = isAdmin || isManager || isTriagem || isMarketing || isInternalSeller;
  const podeEnviar = usePodeEnviarFicha();
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [faeLogo, setFaeLogo] = useState<string | null>(null);
  
  const [scale, setScale] = useState<number>(1);
  const [cardHeight, setCardHeight] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current && printRef.current) {
        if (isPrinting) {
          setScale(1);
          setCardHeight(printRef.current.offsetHeight);
          return;
        }

        const parentWidth = wrapperRef.current.clientWidth;
        const targetWidth = 840; // Perfect standard A4 proportional desktop width
        
        // On mobile we want some padding (e.g., 16px on each side)
        const padding = window.innerWidth < 640 ? 16 : 32;
        const availableWidth = parentWidth - padding;

        const currentScale = availableWidth < targetWidth ? availableWidth / targetWidth : 1;
        setScale(currentScale);
        
        // Keep the scaled height in sync to prevent extra blank vertical scroll area
        setCardHeight(printRef.current.offsetHeight * currentScale);
      }
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (printRef.current) observer.observe(printRef.current);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener('resize', handleResize);

    // Dynamic scheduling to ensure height calculations are completely accurate as dynamic content & images finish loading
    const timers = [100, 300, 600, 1200, 2500].map(delay => 
      setTimeout(handleResize, delay)
    );

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [selectedModelId, isPrinting]);

  useEffect(() => {
    if (defaultModelId) {
      setSelectedModelId(defaultModelId);
    }
  }, [defaultModelId]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const fetchFaeLogo = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_files', 'fae_header_logo'));
        if (snap.exists() && snap.data()?.data) {
          setFaeLogo(snap.data().data);
        }
      } catch (err) {
        console.error("Erro ao carregar logo FAE:", err);
      }
    };
    fetchFaeLogo();
  }, []);

  // Persistent custom image states for each model
  const [customPrimaryImages, setCustomPrimaryImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_custom_primary_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
    };
  });

  const [customSecondaryImages, setCustomSecondaryImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_custom_secondary_images_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
    };
  });

  // Zooms states for editable images
  const [primaryZoom, setPrimaryZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_primary_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 };
  });

  const [secondaryZoom, setSecondaryZoom] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fresa_ssh_secondary_zoom_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_custom_primary_images_v2', JSON.stringify(customPrimaryImages));
    } catch (e) {
      console.warn('Falha ao persistir foto principal no localStorage:', e);
    }
  }, [customPrimaryImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_custom_secondary_images_v2', JSON.stringify(customSecondaryImages));
    } catch (e) {
      console.warn('Falha ao persistir segunda foto no localStorage:', e);
    }
  }, [customSecondaryImages]);

  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_primary_zoom_v2', JSON.stringify(primaryZoom));
    } catch (e) {}
  }, [primaryZoom]);

  useEffect(() => {
    try {
      localStorage.setItem('fresa_ssh_secondary_zoom_v2', JSON.stringify(secondaryZoom));
    } catch (e) {}
  }, [secondaryZoom]);

  const handleResetToDefault = () => {
    setCustomPrimaryImages({
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
    });
    setCustomSecondaryImages({
      'ssh-150': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-200': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-225': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
      'ssh-250': 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-01.jpg',
    });
    setPrimaryZoom({ 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 });
    setSecondaryZoom({ 'ssh-150': 100, 'ssh-200': 100, 'ssh-225': 100, 'ssh-250': 100 });
    toast.success('Imagens e ajustes restaurados para os padrões originais!');
  };

  const models = [
    {
      id: 'ssh-150',
      name: 'SSH 150',
      video_url: 'https://youtu.be/1nEPwzt8K4k',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '160 - 280 HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '1600 mm',
        largura_total_mm: '1980 mm',
        peso_kg: '3690 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '58 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    },
    {
      id: 'ssh-200',
      name: 'SSH 200',
      video_url: 'https://youtu.be/1nEPwzt8K4k',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '200 - 360 (400) HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '2080 mm',
        largura_total_mm: '2472 mm',
        peso_kg: '4850 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '78 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    },
    {
      id: 'ssh-225',
      name: 'SSH 225',
      video_url: 'https://youtu.be/1nEPwzt8K4k',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '200 - 360 (400) HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '2320 mm',
        largura_total_mm: '2712 mm',
        peso_kg: '5200 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '88 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    },
    {
      id: 'ssh-250',
      name: 'SSH 250',
      video_url: 'https://www.youtube.com/watch?v=na5Z2tLWMgA',
      image_url: 'https://roderbrasil.com.br/wp-content/uploads/2024/07/img-fresa-ssh-trituradora-tocos-02.jpg',
      specs: {
        trator_hp: '240 - 360 (400) HP (CVT)',
        pto_rpm: '1000 rpm',
        largura_trabalho_mm: '2560 mm',
        largura_total_mm: '2950 mm',
        peso_kg: '5600 kg',
        diametro_rotor_mm: '900 mm',
        diametro_max_trituracao_mm: '700 mm (70 cm)',
        profundidade_max_trabalho_mm: '500 mm (50 cm)',
        dentes_tipo: '98 + 4 dentes (Tipo A/3 + MH)'
      } as ModelSpec
    }
  ];


  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];
  const folha1Ref = useRef<HTMLDivElement>(null);
  const folha2Ref = useRef<HTMLDivElement>(null);

  const sp = selectedModel.specs;
  const tratorFaixa = faixaTrator(sp.trator_hp);

  const handleDownloadPdf = async (modo: 'baixar' | 'enviar' = 'baixar') => {
    const element = printRef.current;
    if (!element) return;

    const toastId = toast.loading("Gerando arquivo PDF da Ficha Técnica...");

    try {
      // 1. Scroll the container to the top to avoid scrolled-related clipping in html-to-image
      if (wrapperRef.current) {
        wrapperRef.current.scrollTop = 0;
      }

      // 2. Force scale = 1 temporarily by setting isPrinting to true so that it renders fully and unscaled
      setIsPrinting(true);

      // 3. Wait for React to apply state change and browser to repaint
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 4. Explicitly wait for all image components inside the element to decode and load
      const images = Array.from(element.getElementsByTagName('img')) as HTMLImageElement[];
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // continue even if there is an error
          });
        })
      );

      // 5. Cada folha vira uma página A4 própria: a folha 2 sempre começa numa página nova.
      // Os botões marcados com no-print (site, vídeo) ficam fora do PDF.
      const folhas = [folha1Ref.current, folha2Ref.current].filter(Boolean) as HTMLDivElement[];
      const pdf = await pdfDasFolhas(folhas);

      // Restore printing state immediately
      setIsPrinting(false);

      const docName = modo === 'enviar' ? nomeArquivoFicha(`FAE ${selectedModel.name}`) : `Ficha_Tecnica_FAE_SSH_${selectedModel.name.replace(/\s+/g, '_')}.pdf`;
      toast.dismiss(toastId);
      await entregarPdf(pdf, docName, modo, `Ficha técnica Fresa FAE ${selectedModel.name}`);
      if (modo === 'baixar') toast.success("PDF gerado e baixado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF with html-to-image:", error);

      // Make sure we reset printing state
      setIsPrinting(false);

      // Fallback to traditional browser print if html-to-image fails (e.g. CORS)
      toast.loading("Iniciando método de impressão alternativo...", { id: toastId });

      try {
        const printDiv = document.createElement('div');
        printDiv.id = "print-temp-div";
        printDiv.className = "bg-white text-black";
        printDiv.innerHTML = element.innerHTML;

        const style = document.createElement('style');
        style.id = "print-temp-style";
        style.innerHTML = `
          @media print {
            body > *:not(#print-temp-div) {
              display: none !important;
            }
            #print-temp-div {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #print-temp-div .ficha-folha + .ficha-folha {
              page-break-before: always !important;
              break-before: page !important;
            }
            .no-print, [class*="no-print"] {
              display: none !important;
            }
          }
          @media screen {
            #print-temp-div {
              display: none !important;
            }
          }
        `;

        document.head.appendChild(style);
        document.body.appendChild(printDiv);

        setTimeout(() => {
          toast.dismiss(toastId);
          window.print();

          setTimeout(() => {
            document.getElementById('print-temp-div')?.remove();
            document.getElementById('print-temp-style')?.remove();
          }, 1000);
        }, 500);
      } catch (printErr) {
        console.error("Print fallback failed:", printErr);
        toast.error("Erro ao gerar PDF. Por favor, tente novamente ou use um navegador moderno.", { id: toastId });
      }
    } finally {
      setIsPrinting(false);
    }
  };

  // ---------- Peças da folha ----------
  const estiloFolha: React.CSSProperties = {
    width: '840px',
    minWidth: '840px',
    minHeight: `${ALTURA_FOLHA}px`,
    background: '#ffffff',
    color: COR_G,
    fontFamily: FONTE_TXT,
    padding: '38px 42px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: '0 4px 14px rgba(0,0,0,.12)',
    borderRadius: '4px',
    boxSizing: 'border-box',
    lineHeight: 1.4,
  };

  const cabecalho = (meio: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `2px solid ${COR_G}` }}>
      <div style={{ width: '200px' }}>
        <img
          src={RODER_LOGO_BASE64}
          onError={(e) => {
            e.currentTarget.src = "/api/proxy-image?url=" + encodeURIComponent("https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png");
          }}
          alt="Roder"
          style={{ height: '40px', width: 'auto', display: 'block', maxHeight: '40px' }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.14em', color: COR_T2, textTransform: 'uppercase' }}>
        {meio}
      </div>
      <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
        {faeLogo ? (
          <img
            src={faeLogo && faeLogo.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(faeLogo)}` : faeLogo}
            alt="FAE Logo"
            style={{ height: '30px', width: 'auto', display: 'block', maxHeight: '30px' }}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span style={{ fontFamily: FONTE_TIT, fontStretch: '120%', fontWeight: 900, fontSize: '27px', color: COR_L, letterSpacing: '0.06em', lineHeight: 1 }}>FAE</span>
        )}
        <span style={{ fontSize: '9.5px', letterSpacing: '0.12em', color: COR_T2, fontWeight: 700 }}>Distribuidor oficial no Brasil</span>
      </div>
    </div>
  );

  const rodape = (
    <div style={{ marginTop: 'auto', borderTop: `1px solid ${COR_BD}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: COR_T2 }}>
      <span>Roder Máquinas e Equipamentos Ltda.</span>
      <span>Distribuição, serviços e garantia oficial FAE</span>
      <span>roderbrasil.com.br</span>
    </div>
  );

  const tituloSecao = (texto: string) => (
    <div style={{ fontFamily: FONTE_TIT, fontStretch: '108%', fontWeight: 800, fontSize: '14.5px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: COR_G }}>
      <span style={{ width: '4px', height: '15px', background: COR_L, borderRadius: '2px', display: 'inline-block' }} />
      {texto}
    </div>
  );

  const unid = (t: string) => <small style={{ fontSize: '12px', fontWeight: 700 }}>{t}</small>;

  const numeros: { rotulo: string; valor: React.ReactNode; destaque?: boolean }[] = [
    {
      rotulo: 'Trator',
      // "200 a 360 (400)": o teto entre parênteses vai pequeno para caber numa linha
      valor: (() => {
        const [, base, teto] = tratorFaixa.match(/^(.*?)\s*(\(\d+\))?$/) || [, tratorFaixa, undefined];
        return <span style={{ whiteSpace: 'nowrap' }}>{base} {teto ? unid(`${teto} cv`) : unid('cv')}</span>;
      })(),
      destaque: true,
    },
    { rotulo: 'Largura de trabalho', valor: <>{milhar(sp.largura_trabalho_mm)} {unid('mm')}</> },
    { rotulo: 'Profundidade', valor: <>até {Number(milhar(sp.profundidade_max_trabalho_mm).replace('.', '')) / 10} {unid('cm')}</> },
    { rotulo: 'Trituração', valor: <>até {Number(milhar(sp.diametro_max_trituracao_mm).replace('.', '')) / 10} {unid('cm')}</> },
    { rotulo: 'Peso', valor: <>{milhar(sp.peso_kg)} {unid('kg')}</> },
  ];

  const linhasSpecs: [string, string][] = [
    ['Potência do trator', `${tratorFaixa} cv (CVT)`],
    ['Rotação da TDP', `${milhar(sp.pto_rpm)} rpm`],
    ['Largura de trabalho', `${milhar(sp.largura_trabalho_mm)} mm`],
    ['Largura total', `${milhar(sp.largura_total_mm)} mm`],
    ['Peso', `${milhar(sp.peso_kg)} kg`],
    ['Diâmetro do rotor', `${milhar(sp.diametro_rotor_mm)} mm`],
    ['Trituração máxima', `${milhar(sp.diametro_max_trituracao_mm)} mm`],
    ['Profundidade máxima', `${milhar(sp.profundidade_max_trabalho_mm)} mm`],
    ['Dentes (A/3 + MH)', dentesCurto(sp.dentes_tipo)],
  ];

  const tratores: { marca: string; serie: string; texto: string; serieDe: boolean }[] = [
    { marca: 'Massey Ferguson', serie: 'MF 8700 S Dyna-VT', texto: '270 a 370 cv. Dyna-VT de série.', serieDe: true },
    { marca: 'Valtra', serie: 'T CVT, Q5 e S6', texto: 'T195 a T250 CVT (195 a 250 cv), Q5 (265 a 305 cv), S6 (345 a 375 cv). Só se tiver "CVT" no nome, ou for Q5 ou S6.', serieDe: true },
    { marca: 'Fendt', serie: '700 e 900 Vario', texto: 'Toda Fendt é Vario. 700 (263 a 283 cv) atende todas; 900 atende SSH 200, 225 e 250 até 400 cv.', serieDe: true },
    { marca: 'Case IH', serie: 'Puma 260 CVX', texto: '260 cv (até 300). Puma sem "CVX" no nome é powershift.', serieDe: true },
    { marca: 'New Holland', serie: 'T7.300 Auto Command', texto: '260 cv. T7 Power Command e Range Command são powershift.', serieDe: true },
    { marca: 'John Deere', serie: '8R eAutoPowr (EVT)', texto: 'Opcional no 8R. Conferir o adesivo eAutoPowr, EVT ou AutoPowr e a potência.', serieDe: false },
  ];

  const tdBase: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${COR_BD}` };
  const thComp: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: COR_T2, textAlign: 'right', padding: '6px 8px', borderBottom: `2px solid ${COR_G}`, fontWeight: 700 };

  const fotoBox = (
    src: string,
    onTroca: (b64: string) => void,
    zoom: number,
    onZoom: (z: number) => void,
    alt: string,
    legenda: string
  ) => (
    <div style={{ flexShrink: 0, height: '236px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${COR_BD}`, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-1 min-h-0 relative w-full flex items-center justify-center p-1">
        <EditableImage
          src={src}
          onChange={onTroca}
          zoom={zoom}
          onZoomChange={onZoom}
          alt={alt}
          maxHeightClass="max-h-[196px]"
          aspectRatioClass="w-full h-full border-0 bg-transparent p-0 hover:shadow-none focus:ring-0 rounded-none"
          outerMinHeightClass="min-h-full"
          innerMinHeightClass="min-h-full"
          disabled={!canEdit}
        />
      </div>
      <div style={{ background: 'rgba(27,30,34,.92)', color: '#ffffff', fontSize: '11px', fontWeight: 600, padding: '6px 10px' }}>
        {legenda}
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }} className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-backdrop">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">

        {/* Header Controls */}
        <div className="bg-muted px-3 sm:px-6 py-4 flex items-center justify-between gap-2 border-b border-border no-print shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground truncate">Ficha Técnica Oficial - FRESA FAE SSH</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {podeEnviar && (
              <>
                <button
                  onClick={() => handleDownloadPdf('baixar')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-all shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Salvar PDF</span><span className="sm:hidden">PDF</span>
                </button>
                <BotaoEnviarFicha onClick={() => handleDownloadPdf('enviar')} destaque={enviar} />
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <div ref={wrapperRef} className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-8 bg-neutral-100 flex flex-col items-center">

          {/* Tabs inside app but hidden in print */}
          <div className="w-full max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 bg-white p-1.5 rounded-xl border border-neutral-200 no-print shrink-0">
            <div className="flex flex-wrap gap-1 flex-1">
              {models.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                    selectedModelId === m.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {canEdit && (
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-red-200 hover:bg-red-50 text-neutral-600 hover:text-red-600 text-xs font-semibold transition-all"
                title="Restaurar todas as fotos e zooms para as originais de fábrica"
              >
                <RefreshCw className="h-3 w-3 animate-none hover:rotate-180 transition-transform duration-300" />
                Restaurar Fotos Originais
              </button>
            )}
          </div>

          <div
            className="w-full flex justify-center"
            style={{
              height: isPrinting ? 'auto' : (cardHeight ? `${cardHeight}px` : 'auto'),
              overflow: 'visible',
            }}
          >
            <div
              className="print-container origin-top"
              style={{
                width: '840px',
                minWidth: '840px',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                transform: isPrinting ? 'none' : `scale(${scale})`,
                transformOrigin: 'top center',
              }}
              ref={printRef}
            >
            {/* ================= FOLHA 1 ================= */}
            <div ref={folha1Ref} className="ficha-folha" style={estiloFolha}>
              {cabecalho('Ficha técnica oficial')}

              {/* Título, modelos e links */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontFamily: FONTE_TIT, fontStretch: '112%', fontWeight: 850, fontSize: '35px', lineHeight: 1, letterSpacing: '-0.4px', margin: 0, color: COR_G }}>
                    Fresa FAE {selectedModel.name}
                  </h1>
                  <p style={{ fontSize: '13px', color: COR_T2, marginTop: '7px', maxWidth: '460px', lineHeight: 1.45 }}>
                    Destoca profunda: fresa tocos, raízes e pedras até 50 cm de profundidade, em área agrícola e florestal.
                  </p>
                  {!isPrinting && <div className="no-print flex flex-wrap gap-2" style={{ marginTop: '10px' }}>
                    <a
                      href="https://roderbrasil.com.br/triturador-florestal/fresa-trituradora-tocos-pedras/fresa-ssh-trituradora-tocos/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-black rounded-md border border-neutral-200 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver no Site Roder
                    </a>
                    <a
                      href={selectedModel.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-black rounded-md border border-red-200 transition-colors"
                    >
                      <Video className="h-3 w-3" /> Ver Vídeo de Operação ({selectedModel.name})
                    </a>
                  </div>}
                </div>
                {/* Chips de modelo: só na tela; no PDF o título já diz o modelo.
                    Saem do DOM durante a geração: escondidos só pelo filtro, o espaço deles ficava em branco na folha */}
                {!isPrinting && <div className="no-print" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {models.map(m => {
                    const ativo = m.id === selectedModelId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModelId(m.id)}
                        style={{
                          fontFamily: FONTE_TXT,
                          fontSize: '12px',
                          fontWeight: 700,
                          lineHeight: 1.25,
                          textAlign: 'left',
                          border: `1.5px solid ${ativo ? COR_G : COR_BD}`,
                          background: ativo ? COR_G : '#ffffff',
                          color: ativo ? '#ffffff' : COR_T2,
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          minWidth: '56px',
                        }}
                      >
                        {m.name.replace(' ', '\n').split('\n').map((p, i) => <span key={i} style={{ display: 'block' }}>{p}</span>)}
                      </button>
                    );
                  })}
                </div>}
              </div>

              {/* Fotos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '10px' }}>
                {fotoBox(
                  customPrimaryImages[selectedModelId],
                  (base64) => {
                    setCustomPrimaryImages(prev => ({ ...prev, [selectedModelId]: base64 }));
                    toast.success(`Foto do implemento principal atualizada para ${selectedModel.name}!`);
                  },
                  primaryZoom[selectedModelId],
                  (zoom) => setPrimaryZoom(prev => ({ ...prev, [selectedModelId]: zoom })),
                  `Fresa FAE SSH ${selectedModel.name}`,
                  'Fresa SSH em ação profunda'
                )}
                {fotoBox(
                  customSecondaryImages[selectedModelId],
                  (base64) => {
                    setCustomSecondaryImages(prev => ({ ...prev, [selectedModelId]: base64 }));
                    toast.success(`Segunda imagem (área/operação) atualizada para ${selectedModel.name}!`);
                  },
                  secondaryZoom[selectedModelId],
                  (zoom) => setSecondaryZoom(prev => ({ ...prev, [selectedModelId]: zoom })),
                  'Fresa FAE SSH Operação/Área',
                  'Resultado da destoca no campo'
                )}
              </div>

              {/* Números principais */}
              <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr', border: `1px solid ${COR_BD}`, borderRadius: '12px', overflow: 'hidden' }}>
                {numeros.map((n, i) => (
                  <div key={n.rotulo} style={{ padding: '11px 11px', borderRight: i < numeros.length - 1 ? `1px solid ${COR_BD}` : 'none', background: n.destaque ? COR_LC : '#ffffff' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COR_T2 }}>{n.rotulo}</span>
                    <b style={{ display: 'block', fontFamily: FONTE_TIT, fontStretch: '108%', fontWeight: 800, fontSize: '19px', marginTop: '3px', color: n.destaque ? COR_L : COR_G, lineHeight: 1.2 }}>{n.valor}</b>
                    {n.destaque && <span style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: COR_L, marginTop: '2px' }}>só com CVT</span>}
                  </div>
                ))}
              </div>

              {/* Bloco CVT */}
              <div style={{ flexShrink: 0, border: `2px solid ${COR_L}`, borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ background: COR_L, color: '#ffffff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontFamily: FONTE_TIT, fontStretch: '110%', fontWeight: 850, fontSize: '17px', letterSpacing: '0.01em', margin: 0 }}>SÓ FUNCIONA COM TRATOR CVT</h2>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, background: 'rgba(255,255,255,.2)', borderRadius: '999px', padding: '3px 10px' }}>Obrigatório</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ padding: '12px 14px', borderRight: `1px solid ${COR_BD}` }}>
                    <h3 style={{ fontFamily: FONTE_TIT, fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', color: COR_VD }}>Por que o CVT</h3>
                    <p style={{ fontSize: '11.5px', lineHeight: 1.45, color: '#333', marginBottom: '6px' }}>O solo muda a cada toco, raiz ou pedra. O CVT ajusta sozinho o avanço (0 a 1 km/h) e segura o motor na faixa de torque.</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11.5px', fontWeight: 700, color: COR_VD, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <li>✔ Avanço preciso e constante</li>
                      <li>✔ Não perde potência</li>
                      <li>✔ Gasta menos diesel</li>
                    </ul>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{ fontFamily: FONTE_TIT, fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', color: COR_VM }}>Super redutor (creeper) não serve</h3>
                    <p style={{ fontSize: '11.5px', lineHeight: 1.45, color: '#333', marginBottom: '6px' }}>O creeper só reduz a velocidade com engrenagens fixas. Não ajusta avanço, rotação e torque quando a carga da fresa oscila.</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11.5px', fontWeight: 700, color: COR_VM, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <li>✖ Sobrecarga e quebra na transmissão</li>
                      <li>✖ Rotação oscilando, perde eficiência</li>
                      <li>✖ Muita parada no campo</li>
                    </ul>
                  </div>
                </div>
                <div style={{ background: '#FDECEC', borderTop: '1px solid #F5C2C2', fontSize: '11px', lineHeight: 1.45, padding: '9px 14px', color: '#5B1010' }}>
                  <b>Garantia:</b> usar em trator sem CVT derruba a produção, aumenta o diesel, sobrecarrega embreagem e transmissão e pode anular a garantia de fábrica.
                </div>
              </div>

              {/* Especificações e observações */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  {tituloSecao(`Especificações ${selectedModel.name}`)}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <tbody>
                      {linhasSpecs.map(([rotulo, valor], i) => (
                        <tr key={rotulo}>
                          <td style={{ ...tdBase, color: COR_T2, fontWeight: 600, background: i % 2 === 0 ? '#F7F8F9' : '#ffffff' }}>{rotulo}</td>
                          <td style={{ ...tdBase, fontWeight: 800, textAlign: 'right', color: COR_G, background: i % 2 === 0 ? '#F7F8F9' : '#ffffff' }}>{valor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: '9.5px', color: COR_T2, fontStyle: 'italic', marginTop: '5px' }}>Padrão de fábrica. O fabricante pode alterar sem aviso.</div>
                </div>
                <div>
                  {tituloSecao('Profundidade e potência')}
                  <div style={{ background: '#F7F8F9', borderRadius: '10px', padding: '11px 13px', fontSize: '11.3px', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: '7px', color: COR_G }}>
                    <div><b style={{ fontWeight: 800 }}>Depende do solo.</b> Os 50 cm e o quanto se alcança numa passada variam com a resistência e a compactação.</div>
                    <div><b style={{ fontWeight: 800 }}>Mais de uma passada.</b> Em solo muito compacto pode ser preciso repetir. Não garante 50 cm numa passada só.</div>
                    <div><b style={{ fontWeight: 800 }}>Depende do trator.</b> Para chegar ao máximo, o trator trabalha na potência máxima exigida, não na mínima.</div>
                    <div><b style={{ fontWeight: 800 }}>Compactação extrema</b> pode limitar a profundidade mesmo com várias passadas.</div>
                  </div>
                </div>
              </div>

              {rodape}
            </div>

            {/* ================= FOLHA 2 ================= */}
            <div ref={folha2Ref} className="ficha-folha" style={estiloFolha}>
              {cabecalho(`Fresa FAE ${selectedModel.name} · folha 2`)}

              {/* Comparativo dos quatro modelos */}
              <div>
                {tituloSecao('Os quatro modelos')}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thComp, textAlign: 'left' }}>Modelo</th>
                        <th style={thComp}>Trator (cv, CVT)</th>
                        <th style={thComp}>Largura trabalho</th>
                        <th style={thComp}>Largura total</th>
                        <th style={thComp}>Peso</th>
                        <th style={thComp}>Dentes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((m, i) => {
                        const ativo = m.id === selectedModelId;
                        const fundo = ativo ? COR_LC : (i % 2 === 0 ? '#F7F8F9' : '#ffffff');
                        const td: React.CSSProperties = { ...tdBase, textAlign: 'right', fontWeight: 700, color: COR_G, background: fundo };
                        return (
                          <tr key={m.id}>
                            <td style={{ ...td, textAlign: 'left', fontWeight: 800, color: ativo ? COR_L : COR_G }}>{m.name}</td>
                            <td style={td}>{faixaTrator(m.specs.trator_hp)}</td>
                            <td style={td}>{milhar(m.specs.largura_trabalho_mm)} mm</td>
                            <td style={td}>{milhar(m.specs.largura_total_mm)} mm</td>
                            <td style={td}>{milhar(m.specs.peso_kg)} kg</td>
                            <td style={td}>{dentesCurto(m.specs.dentes_tipo)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '9.5px', color: COR_T2, fontStyle: 'italic', marginTop: '5px' }}>Todos: rotor 900 mm, trituração até 70 cm, profundidade até 50 cm, TDP 1.000 rpm.</div>
              </div>

              {/* Tratores CVT */}
              <div>
                {tituloSecao('Tratores CVT vendidos no Brasil')}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.2px' }}>
                  <tbody>
                    {tratores.map((t, i) => {
                      const fundo = i % 2 === 0 ? '#F7F8F9' : '#ffffff';
                      const td: React.CSSProperties = { ...tdBase, verticalAlign: 'top', background: fundo };
                      return (
                        <tr key={t.marca}>
                          <td style={{ ...td, fontWeight: 800, color: COR_G, whiteSpace: 'nowrap' }}>{t.marca}</td>
                          <td style={{ ...td, fontWeight: 700, color: COR_G, width: '150px' }}>{t.serie}</td>
                          <td style={{ ...td, color: '#444', fontWeight: 500 }}>{t.texto}</td>
                          <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontSize: '10.5px', fontWeight: 800, borderRadius: '6px', padding: '2px 7px', display: 'inline-block',
                              background: t.serieDe ? '#DCFCE7' : '#FEF3C7', color: t.serieDe ? '#14532D' : '#78350F',
                            }}>{t.serieDe ? 'De série' : 'Opcional'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Não servem */}
              <div style={{ border: '1.5px dashed #E8A0A0', borderRadius: '10px', padding: '10px 13px', fontSize: '11.2px', lineHeight: 1.45, background: '#FFF8F8', color: COR_G }}>
                <b style={{ color: COR_VM }}>Não servem</b> (powershift ou mecânica): MF Dyna-6 e Dyna-4, Valtra HiTech e Versu, Case IH Puma e Magnum nacionais, New Holland Power Command, Range Command e UltraCommand, John Deere e23, PowrShift, PowrQuad e AutoQuad. A potência precisa estar na faixa do modelo, com TDP de 1.000 rpm.
              </div>

              {/* Peças e entrega técnica */}
              <div style={{ background: COR_G, color: '#E6E8EB', borderRadius: '14px', padding: '15px 17px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', fontSize: '11.3px', lineHeight: 1.5 }}>
                <div>
                  <h3 style={{ fontFamily: FONTE_TIT, fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFB27A', marginBottom: '5px' }}>Peças e suporte</h3>
                  Dentes FAE originais tipo A/3 e MH, com pastilha de carboneto de tungstênio (vídea). Estoque na Matriz e em Sinop-MT: eixos, correias, rolamentos e dentes para reposição imediata.
                </div>
                <div>
                  <h3 style={{ fontFamily: FONTE_TIT, fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFB27A', marginBottom: '5px' }}>Na entrega técnica</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 700 }}>
                    <li>✔ Acoplamento acompanhado pela engenharia</li>
                    <li>✔ Calibração do hidráulico e da TDP</li>
                    <li>✔ Treino do operador no avanço CVT</li>
                  </ul>
                </div>
              </div>

              {rodape}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
