export type EstadoStock = 'OK' | 'BAJO' | 'CRITICO';

export interface InsumoListItem {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad_medida: string;
  precio_unitario: string;
  costo_actual: string;
  stock_minimo: string;
  stock_critico: string;
  stock_actual: string;
  estado_stock: EstadoStock;
  activo: boolean;
}

export interface InsumoDetalle {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  unidad_medida: string;
  precio_unitario: string;
  costo_actual: string;
  stock_minimo: string;
  stock_critico: string;
  dias_vencimiento_alerta: number;
  activo: boolean;
  observaciones: string | null;
  stock_actual: { cantidad: string; valor: string; estado: EstadoStock };
  ultimo_movimiento: { fecha: string; tipo: string; cantidad: string } | null;
}

export interface Movimiento {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'PERDIDA';
  cantidad: string;
  precio_unitario: string | null;
  valor_total: string | null;
  fecha: string;
  motivo: string | null;
  usuario: string;
  observaciones: string | null;
}

export interface ResumenStock {
  total_insumos: number;
  valor_total_stock: string;
  insumos_alerta: number;
  insumos_criticos: number;
  detalles: {
    insumo_id: number;
    nombre: string;
    cantidad: string;
    valor: string;
    estado: EstadoStock;
  }[];
}

export interface CrearInsumoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  unidad_medida: string;
  precio_unitario: number;
  stock_minimo?: number;
  stock_critico?: number;
  dias_vencimiento_alerta?: number;
  observaciones?: string;
}
