import ExcelJS from 'exceljs';
import type { Response } from 'express';

async function send(res: Response, wb: ExcelJS.Workbook, filename: string) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    c.alignment = { vertical: 'middle' };
  });
}

interface ReporteMensualXlsx {
  periodo: string;
  vendedores: string[];
  porVendedor: { vendedor: string; ventas: number; unidades: unknown; monto: unknown }[];
  matriz: { producto: string; por_vendedor: Record<string, unknown>; total: unknown }[];
}

export async function reporteMensualXlsx(res: Response, d: ReporteMensualXlsx) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Marisa';

  // Hoja: resumen por vendedor
  const s1 = wb.addWorksheet('Por vendedor');
  s1.columns = [
    { header: 'Vendedor', key: 'v', width: 24 },
    { header: 'Ventas', key: 'n', width: 12 },
    { header: 'Unidades', key: 'u', width: 14 },
    { header: 'Monto', key: 'm', width: 18 },
  ];
  styleHeader(s1.getRow(1));
  for (const v of d.porVendedor) {
    const r = s1.addRow({ v: v.vendedor, n: v.ventas, u: Number(v.unidades), m: Number(v.monto) });
    r.getCell('m').numFmt = '"$"#,##0.00';
  }

  // Hoja: matriz producto × vendedor (planilla MENSUAL)
  const s2 = wb.addWorksheet(`MENSUAL ${d.periodo.replace('/', '-')}`);
  s2.columns = [
    { header: 'Producto', key: 'p', width: 28 },
    ...d.vendedores.map((v) => ({ header: v, key: v, width: 14 })),
    { header: 'Total', key: 'total', width: 14 },
  ];
  styleHeader(s2.getRow(1));
  for (const fila of d.matriz) {
    const row: Record<string, unknown> = { p: fila.producto, total: Number(fila.total) };
    for (const v of d.vendedores) row[v] = Number(fila.por_vendedor[v] ?? 0);
    s2.addRow(row);
  }

  await send(res, wb, `reporte-mensual-${d.periodo.replace('/', '-')}.xlsx`);
}

interface ReportePeriodoXlsx {
  desde: string;
  hasta: string;
  dias: {
    fecha: string;
    ventas_cantidad: number;
    ventas_total: unknown;
    ganancia_bruta: unknown;
    compras_insumos: unknown;
    costo_produccion: unknown;
    ordenes_completadas: number;
    unidades_producidas: unknown;
  }[];
  totales: {
    ventas_cantidad: number;
    ventas_total: unknown;
    ganancia_bruta: unknown;
    compras_insumos: unknown;
    costo_produccion: unknown;
    ordenes_completadas: number;
    unidades_producidas: unknown;
  };
}

export async function reportePeriodoXlsx(res: Response, d: ReportePeriodoXlsx) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Marisa';

  const s = wb.addWorksheet('Diario');
  s.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Ventas (cant.)', key: 'vc', width: 14 },
    { header: 'Ventas ($)', key: 'vt', width: 16 },
    { header: 'Ganancia bruta ($)', key: 'gb', width: 18 },
    { header: 'Compras insumos ($)', key: 'ci', width: 20 },
    { header: 'Costo producción ($)', key: 'cp', width: 20 },
    { header: 'Órdenes completadas', key: 'oc', width: 20 },
    { header: 'Unidades producidas', key: 'up', width: 20 },
  ];
  styleHeader(s.getRow(1));
  for (const f of d.dias) {
    const r = s.addRow({
      fecha: f.fecha,
      vc: f.ventas_cantidad,
      vt: Number(f.ventas_total),
      gb: Number(f.ganancia_bruta),
      ci: Number(f.compras_insumos),
      cp: Number(f.costo_produccion),
      oc: f.ordenes_completadas,
      up: Number(f.unidades_producidas),
    });
    ['vt', 'gb', 'ci', 'cp'].forEach((k) => (r.getCell(k).numFmt = '"$"#,##0.00'));
  }

  const total = s.addRow({
    fecha: 'TOTAL',
    vc: d.totales.ventas_cantidad,
    vt: Number(d.totales.ventas_total),
    gb: Number(d.totales.ganancia_bruta),
    ci: Number(d.totales.compras_insumos),
    cp: Number(d.totales.costo_produccion),
    oc: d.totales.ordenes_completadas,
    up: Number(d.totales.unidades_producidas),
  });
  total.font = { bold: true };
  ['vt', 'gb', 'ci', 'cp'].forEach((k) => (total.getCell(k).numFmt = '"$"#,##0.00'));

  await send(res, wb, `reporte-diario-${d.desde}-a-${d.hasta}.xlsx`);
}

interface NominaXlsx {
  periodo: string;
  recibos: {
    empleado: string;
    sueldo_basico: unknown;
    antiguedad_monto: unknown;
    total_haberes: unknown;
    total_descuentos: unknown;
    neto_a_pagar: unknown;
    aporte_patronal: unknown;
    costo_total_empleado: unknown;
  }[];
}

export async function nominaXlsx(res: Response, d: NominaXlsx) {
  const wb = new ExcelJS.Workbook();
  const s = wb.addWorksheet(`Nómina ${d.periodo.replace('/', '-')}`);
  s.columns = [
    { header: 'Empleado', key: 'e', width: 26 },
    { header: 'Básico', key: 'b', width: 14 },
    { header: 'Antigüedad', key: 'a', width: 14 },
    { header: 'Haberes', key: 'h', width: 14 },
    { header: 'Descuentos', key: 'd', width: 14 },
    { header: 'Neto', key: 'n', width: 14 },
    { header: 'Aporte patronal', key: 'p', width: 16 },
    { header: 'Costo empresa', key: 'c', width: 16 },
  ];
  styleHeader(s.getRow(1));
  for (const r of d.recibos) {
    const row = s.addRow({
      e: r.empleado,
      b: Number(r.sueldo_basico),
      a: Number(r.antiguedad_monto),
      h: Number(r.total_haberes),
      d: Number(r.total_descuentos),
      n: Number(r.neto_a_pagar),
      p: Number(r.aporte_patronal),
      c: Number(r.costo_total_empleado),
    });
    ['b', 'a', 'h', 'd', 'n', 'p', 'c'].forEach((k) => (row.getCell(k).numFmt = '"$"#,##0.00'));
  }
  await send(res, wb, `nomina-${d.periodo.replace('/', '-')}.xlsx`);
}
