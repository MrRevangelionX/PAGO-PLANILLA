import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel({ rows, columns, fileName, sheetName = "Planilla" }) {
  const data = rows.map((row) => {
    const record = {};
    columns.forEach((col) => {
      record[col.header] = col.value(row);
    });
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = columns.map((col) => ({ wch: col.width || 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToPDF({ rows, columns, fileName, title, subtitle }) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.setTextColor(50, 42, 34);
  doc.text(title, 14, 16);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(141, 129, 119);
    doc.text(subtitle, 14, 22);
  }

  autoTable(doc, {
    startY: 27,
    head: [columns.map((col) => col.header)],
    body: rows.map((row) => columns.map((col) => col.value(row))),
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [217, 136, 76], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [251, 248, 244] },
  });

  doc.save(`${fileName}.pdf`);
}
