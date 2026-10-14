import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockItem, StockReservation, StockImportFAE } from '../types';
import { safeFormatDate } from '../lib/utils';

export interface GenerateStockPdfOptions {
  includeFabrica: boolean;
  includeSinop: boolean;
  includeFAE: boolean;
  onlyAvailable?: boolean;
  generatedBy?: string;
}

export function generateStockPdf({
  items = [],
  reservations = [],
  importItems = [],
  options
}: {
  items: StockItem[];
  reservations: StockReservation[];
  importItems: StockImportFAE[];
  options: GenerateStockPdfOptions;
}): { doc: jsPDF; blob: Blob; fileName: string } {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let currentY = 12;

  const orangeColor: [number, number, number] = [234, 88, 12]; // Roder Orange #ea580c
  const slateDark: [number, number, number] = [15, 23, 42]; // Slate-900 #0f172a
  const slateGray: [number, number, number] = [71, 85, 105]; // Slate-600 #475569
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate-50 #f8fafc

  const now = new Date();
  const dateFormatted = safeFormatDate(now, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate statistics
  const fabricaItemsRaw = items.filter(i => (i.branch || '').toLowerCase() !== 'sinop');
  const sinopItemsRaw = items.filter(i => (i.branch || '').toLowerCase() === 'sinop');

  const processItems = (itemList: StockItem[]) => {
    return itemList.map(item => {
      const reservedQty = reservations
        .filter(r => r.stock_item_id === item.id && r.status === 'active')
        .reduce((acc, r) => acc + (Number(r.quantity_reserved) || 0), 0);
      const totalQty = Number(item.quantity) || 0;
      const availableQty = totalQty - reservedQty;

      return {
        ...item,
        totalQty,
        reservedQty,
        availableQty
      };
    }).filter(item => {
      if (options.onlyAvailable) {
        return item.availableQty > 0 || item.reservedQty > 0;
      }
      return true;
    }).sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  };

  const fabricaProcessed = processItems(fabricaItemsRaw);
  const sinopProcessed = processItems(sinopItemsRaw);

  const fabricaTotalDisp = fabricaProcessed.reduce((acc, i) => acc + Math.max(0, i.availableQty), 0);
  const sinopTotalDisp = sinopProcessed.reduce((acc, i) => acc + Math.max(0, i.availableQty), 0);
  const faeTotalQtd = importItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  // Selected stocks label
  const selectedLabels: string[] = [];
  if (options.includeFabrica) selectedLabels.push('FÁBRICA MATRIZ');
  if (options.includeSinop) selectedLabels.push('FILIAL SINOP');
  if (options.includeFAE) selectedLabels.push('IMPORTAÇÃO FAE');
  const scopeLabel = selectedLabels.length > 0 ? selectedLabels.join(' • ') : 'ESTOQUE CONSOLIDADO';

  // HEADER FUNCTION
  const drawPageHeader = (isFirstPage: boolean = false) => {
    // Dark top banner
    doc.setFillColor(...slateDark);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // Orange brand stripe
    doc.setFillColor(...orangeColor);
    doc.rect(0, 22, pageWidth, 2.5, 'F');

    // Company Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RODER BRASIL', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('TECNOLOGIA & EQUIPAMENTOS FLORESTAIS', margin + 37, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(251, 146, 60); // orange-400
    doc.text('RELATÓRIO OFICIAL DE ESTOQUE', margin, 17);

    // Right-side info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`Emissão: ${dateFormatted}`, pageWidth - margin, 10, { align: 'right' });
    if (options.generatedBy) {
      doc.text(`Resp: ${options.generatedBy}`, pageWidth - margin, 16, { align: 'right' });
    }

    currentY = 30;
  };

  // FIRST PAGE HEADER
  drawPageHeader(true);

  // TITLE & KPI SUMMARY BOXES
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 22, 2, 2, 'FD');

  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMO CONSOLIDADO DE DISPONIBILIDADE', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateGray);
  doc.text(`Escopo do Relatório: ${scopeLabel}  |  Critério: ${options.onlyAvailable ? 'Apenas Itens com Disponibilidade' : 'Todos os Itens Cadastrados'}`, margin + 5, currentY + 11);

  // Mini summary chips inside box
  const chipWidth = (pageWidth - (margin * 2) - 20) / 3;
  let chipX = margin + 5;
  const chipY = currentY + 14;

  if (options.includeFabrica) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(chipX, chipY, chipWidth, 6, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(194, 65, 12);
    doc.text(`Fábrica: ${fabricaProcessed.length} itens (${fabricaTotalDisp} un. disp)`, chipX + 3, chipY + 4.2);
    chipX += chipWidth + 5;
  }

  if (options.includeSinop) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(chipX, chipY, chipWidth, 6, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(180, 83, 9);
    doc.text(`Sinop: ${sinopProcessed.length} itens (${sinopTotalDisp} un. disp)`, chipX + 3, chipY + 4.2);
    chipX += chipWidth + 5;
  }

  if (options.includeFAE) {
    doc.setFillColor(254, 249, 195);
    doc.setDrawColor(254, 240, 138);
    doc.roundedRect(chipX, chipY, chipWidth, 6, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(161, 98, 7);
    doc.text(`FAE Import: ${importItems.length} itens (${faeTotalQtd} un. prev)`, chipX + 3, chipY + 4.2);
  }

  currentY += 27;

  // 1. ESTOQUE FÁBRICA
  if (options.includeFabrica) {
    // Section Title
    doc.setFillColor(...orangeColor);
    doc.rect(margin, currentY, 3.5, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...slateDark);
    doc.text(`ESTOQUE FÁBRICA / MATRIZ (${fabricaProcessed.length} itens cadastrados)`, margin + 6, currentY + 5.5);
    currentY += 9;

    const tableData = fabricaProcessed.map(item => [
      item.code || '-',
      item.description || '-',
      item.totalQty.toString(),
      item.reservedQty > 0 ? item.reservedQty.toString() : '-',
      item.availableQty.toString()
    ]);

    if (tableData.length === 0) {
      tableData.push(['-', 'Nenhum item disponível no momento.', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['CÓDIGO', 'DESCRIÇÃO DO PRODUTO', 'FÍSICO', 'RESERVA', 'DISPONÍVEL']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [234, 88, 12], // Orange
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 36, font: 'courier', fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: 'auto', fontStyle: 'normal' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 18, halign: 'center', textColor: [217, 119, 6] },
        4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = parseInt(data.cell.raw as string, 10);
          if (!isNaN(val)) {
            if (val > 0) {
              data.cell.styles.textColor = [16, 149, 100]; // Emerald green
              data.cell.styles.fillColor = [236, 253, 245];
            } else {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            }
          }
        }
      }
    });

    // @ts-ignore - finalY is available in autoTable
    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 30;
  }

  // 2. ESTOQUE SINOP
  if (options.includeSinop) {
    // Check if we need a new page for Sinop
    if (currentY > pageHeight - 45) {
      doc.addPage();
      drawPageHeader();
    }

    doc.setFillColor(217, 119, 6); // Amber dark
    doc.rect(margin, currentY, 3.5, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...slateDark);
    doc.text(`ESTOQUE FILIAL SINOP / MT (${sinopProcessed.length} itens cadastrados)`, margin + 6, currentY + 5.5);
    currentY += 9;

    const tableData = sinopProcessed.map(item => [
      item.code || '-',
      item.description || '-',
      item.totalQty.toString(),
      item.reservedQty > 0 ? item.reservedQty.toString() : '-',
      item.availableQty.toString()
    ]);

    if (tableData.length === 0) {
      tableData.push(['-', 'Nenhum item disponível na filial Sinop no momento.', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['CÓDIGO', 'DESCRIÇÃO DO PRODUTO', 'FÍSICO', 'RESERVA', 'DISPONÍVEL']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [217, 119, 6], // Amber-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 36, font: 'courier', fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: 'auto', fontStyle: 'normal' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 18, halign: 'center', textColor: [217, 119, 6] },
        4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [254, 252, 245]
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = parseInt(data.cell.raw as string, 10);
          if (!isNaN(val)) {
            if (val > 0) {
              data.cell.styles.textColor = [16, 149, 100]; // Emerald green
              data.cell.styles.fillColor = [236, 253, 245];
            } else {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            }
          }
        }
      }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 30;
  }

  // 3. IMPORTAÇÃO FAE
  if (options.includeFAE) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      drawPageHeader();
    }

    doc.setFillColor(180, 83, 9); // Yellow/Amber dark
    doc.rect(margin, currentY, 3.5, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...slateDark);
    doc.text(`EQUIPAMENTOS EM IMPORTAÇÃO FAE (${importItems.length} previsões registradas)`, margin + 6, currentY + 5.5);
    currentY += 9;

    const faeTableData = importItems.map(item => [
      item.code || '-',
      item.description || '-',
      (item.quantity || 1).toString(),
      item.embarque || '-',
      item.chegada || '-'
    ]);

    if (faeTableData.length === 0) {
      faeTableData.push(['-', 'Nenhum equipamento em processo de importação FAE no momento.', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['CÓDIGO', 'EQUIPAMENTO / MODELO FAE', 'QTD', 'EMBARQUE', 'PREVISÃO CHEGADA']],
      body: faeTableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [202, 138, 4], // Yellow-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 36, font: 'courier', fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: 'auto', fontStyle: 'normal' },
        2: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9] }
      },
      alternateRowStyles: {
        fillColor: [254, 252, 232]
      }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 30;
  }

  // FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...slateGray);
    doc.text('RODER Brasil Equipamentos Florestais • www.roderbrasil.com.br • Sistema RODER Indica', margin, pageHeight - 7.5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  }

  const pdfBlob = doc.output('blob');
  
  // Format clean file name
  const dateStr = now.toISOString().split('T')[0];
  const parts: string[] = ['Estoque_Roder'];
  if (options.includeFabrica) parts.push('Fabrica');
  if (options.includeSinop) parts.push('Sinop');
  if (options.includeFAE) parts.push('FAE');
  parts.push(dateStr);
  const fileName = `${parts.join('_')}.pdf`;

  return {
    doc,
    blob: pdfBlob,
    fileName
  };
}
