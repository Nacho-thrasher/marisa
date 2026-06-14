import PDFDocument from 'pdfkit';
import type { Response } from 'express';

const BRAND = '#4f46e5';
const money = (n: unknown) => `$ ${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function header(doc: PDFKit.PDFDocument, titulo: string, numero: string) {
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('Marisa', 50, 30);
  doc.fontSize(10).font('Helvetica').text('Producción y Nómina', 50, 55);
  doc.fontSize(16).font('Helvetica-Bold').text(titulo, 0, 32, { align: 'right', width: doc.page.width - 50 });
  doc.fontSize(10).font('Helvetica').text(numero, 0, 56, { align: 'right', width: doc.page.width - 50 });
  doc.fillColor('black').moveDown(4);
}

function startPdf(res: Response, filename: string) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

interface RemitoData {
  numero: string;
  fecha: Date;
  cliente: string | null;
  cuit: string | null;
  vendedor: string | null;
  listaPrecio: string | null;
  detalles: { producto: string; cantidad: unknown; precioUnitario: unknown; subtotal: unknown }[];
  totalBruto: unknown;
  descuento: unknown;
  totalNeto: unknown;
}

export function remitoPdf(res: Response, d: RemitoData) {
  const doc = startPdf(res, `${d.numero}.pdf`);
  header(doc, 'REMITO', d.numero);

  let y = 120;
  doc.fontSize(10).font('Helvetica-Bold').text('Cliente:', 50, y).font('Helvetica').text(d.cliente ?? 'Consumidor final', 130, y);
  y += 16;
  if (d.cuit) { doc.font('Helvetica-Bold').text('CUIT:', 50, y).font('Helvetica').text(d.cuit, 130, y); y += 16; }
  doc.font('Helvetica-Bold').text('Fecha:', 50, y).font('Helvetica').text(new Date(d.fecha).toLocaleDateString('es-AR'), 130, y);
  y += 16;
  if (d.vendedor) { doc.font('Helvetica-Bold').text('Vendedor:', 50, y).font('Helvetica').text(d.vendedor, 130, y); y += 16; }
  if (d.listaPrecio) { doc.font('Helvetica-Bold').text('Lista:', 50, y).font('Helvetica').text(d.listaPrecio, 130, y); y += 16; }

  y += 14;
  // Cabecera tabla
  doc.rect(50, y, doc.page.width - 100, 22).fill('#f1f5f9');
  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
  doc.text('PRODUCTO', 58, y + 7);
  doc.text('CANT.', 320, y + 7, { width: 50, align: 'right' });
  doc.text('P. UNIT.', 380, y + 7, { width: 70, align: 'right' });
  doc.text('SUBTOTAL', 460, y + 7, { width: 85, align: 'right' });
  y += 22;

  doc.fillColor('black').font('Helvetica').fontSize(9);
  for (const it of d.detalles) {
    doc.text(it.producto, 58, y + 6, { width: 250 });
    doc.text(String(Number(it.cantidad)), 320, y + 6, { width: 50, align: 'right' });
    doc.text(money(it.precioUnitario), 380, y + 6, { width: 70, align: 'right' });
    doc.text(money(it.subtotal), 460, y + 6, { width: 85, align: 'right' });
    y += 20;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e2e8f0').stroke();
  }

  y += 12;
  const tx = 380;
  doc.font('Helvetica').fontSize(10);
  doc.text('Total bruto:', tx, y, { width: 80, align: 'right' }).text(money(d.totalBruto), 460, y, { width: 85, align: 'right' });
  y += 16;
  doc.text('Descuento:', tx, y, { width: 80, align: 'right' }).text(money(d.descuento), 460, y, { width: 85, align: 'right' });
  y += 18;
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('TOTAL:', tx, y, { width: 80, align: 'right' }).fillColor(BRAND).text(money(d.totalNeto), 460, y, { width: 85, align: 'right' });

  doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text('Documento no válido como factura.', 50, doc.page.height - 70, { align: 'center', width: doc.page.width - 100 });
  doc.end();
}

interface ReciboData {
  numero: string;
  empleado: string;
  periodo: string;
  items: { label: string; monto: unknown; descuento?: boolean }[];
  totalHaberes: unknown;
  totalDescuentos: unknown;
  neto: unknown;
}

export function reciboPdf(res: Response, d: ReciboData) {
  const doc = startPdf(res, `${d.numero}.pdf`);
  header(doc, 'RECIBO DE SUELDO', d.numero);

  let y = 120;
  doc.fontSize(10).font('Helvetica-Bold').text('Empleado:', 50, y).font('Helvetica').text(d.empleado, 140, y);
  y += 16;
  doc.font('Helvetica-Bold').text('Período:', 50, y).font('Helvetica').text(d.periodo, 140, y);
  y += 26;

  doc.rect(50, y, doc.page.width - 100, 22).fill('#f1f5f9');
  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
  doc.text('CONCEPTO', 58, y + 7);
  doc.text('HABERES', 330, y + 7, { width: 100, align: 'right' });
  doc.text('DESCUENTOS', 440, y + 7, { width: 105, align: 'right' });
  y += 22;

  doc.fillColor('black').font('Helvetica').fontSize(9);
  for (const it of d.items) {
    doc.text(it.label, 58, y + 6, { width: 260 });
    if (it.descuento) doc.text(money(it.monto), 440, y + 6, { width: 105, align: 'right' });
    else doc.text(money(it.monto), 330, y + 6, { width: 100, align: 'right' });
    y += 18;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e2e8f0').stroke();
  }

  y += 12;
  doc.font('Helvetica').fontSize(10);
  doc.text('Total haberes:', 300, y, { width: 130, align: 'right' }).text(money(d.totalHaberes), 440, y, { width: 105, align: 'right' });
  y += 16;
  doc.text('Total descuentos:', 300, y, { width: 130, align: 'right' }).text(money(d.totalDescuentos), 440, y, { width: 105, align: 'right' });
  y += 20;
  doc.font('Helvetica-Bold').fontSize(13);
  doc.text('NETO A PAGAR:', 280, y, { width: 150, align: 'right' }).fillColor(BRAND).text(money(d.neto), 440, y, { width: 105, align: 'right' });

  doc.fillColor('#475569').font('Helvetica').fontSize(9).text('Firma del empleado: ___________________________', 50, doc.page.height - 110);
  doc.end();
}
