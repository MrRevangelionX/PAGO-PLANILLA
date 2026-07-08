import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COMPANY_NAME = "Pago Planilla";
const BRAND_DARK = [44, 37, 33];
const BRAND_PRIMARY = [217, 136, 76];
const BRAND_MUTED = [141, 129, 119];
const ROW_ALT = [251, 248, 244];

function timestamp() {
  return format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
}

export function exportToExcel({ rows, columns, fileName, sheetName = "Reporte", title, subtitle, summary }) {
  const colCount = columns.length;
  const aoa = [];
  const merges = [];

  if (title) {
    aoa.push([COMPANY_NAME + " · " + title]);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
  }
  if (subtitle) {
    aoa.push([subtitle]);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
  }
  if (title || subtitle) {
    aoa.push([`Generado: ${timestamp()}`]);
    merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
    aoa.push([]);
  }

  aoa.push(columns.map((col) => col.header));
  rows.forEach((row) => aoa.push(columns.map((col) => col.value(row))));

  if (summary?.length) {
    aoa.push([]);
    summary.forEach((item) => aoa.push([item.label, item.value]));
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet["!cols"] = columns.map((col) => ({ wch: col.width || 18 }));
  if (merges.length) worksheet["!merges"] = merges;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToPDF({ rows, columns, fileName, title, subtitle, summary }) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.text(COMPANY_NAME, margin, 11);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10.5);
  doc.text(title, margin, 18);

  doc.setFontSize(8.5);
  doc.setTextColor(220, 210, 200);
  doc.text(`Generado: ${timestamp()}`, pageWidth - margin, 11, { align: "right" });
  if (subtitle) {
    doc.text(subtitle, pageWidth - margin, 18, { align: "right" });
  }

  let cursorY = 32;

  if (summary?.length) {
    const gap = 6;
    const boxWidth = (pageWidth - margin * 2 - gap * (summary.length - 1)) / summary.length;
    const boxHeight = 18;
    summary.forEach((item, i) => {
      const x = margin + i * (boxWidth + gap);
      doc.setFillColor(...(item.fill || [251, 248, 244]));
      doc.roundedRect(x, cursorY, boxWidth, boxHeight, 2, 2, "F");
      doc.setTextColor(...(item.textColor || BRAND_MUTED));
      doc.setFontSize(8);
      doc.text(item.label, x + 5, cursorY + 7);
      doc.setFontSize(12.5);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...(item.valueColor || [50, 42, 34]));
      doc.text(String(item.value), x + 5, cursorY + 14.5);
      doc.setFont(undefined, "normal");
    });
    cursorY += boxHeight + 8;
  }

  autoTable(doc, {
    startY: cursorY,
    head: [columns.map((col) => col.header)],
    body: rows.map((row) => columns.map((col) => col.value(row))),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: BRAND_PRIMARY, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: ROW_ALT },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(232, 225, 216);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_MUTED);
    doc.text(`${COMPANY_NAME} · Documento generado por el sistema`, margin, pageHeight - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save(`${fileName}.pdf`);
}
