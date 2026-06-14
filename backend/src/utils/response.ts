import type { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function ok(res: Response, data: unknown, message = 'Operación completada exitosamente') {
  return res.status(200).json({
    success: true,
    code: 'SUCCESS',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function created(res: Response, data: unknown, code = 'CREATED', message = 'Recurso creado') {
  return res.status(201).json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function paginated(res: Response, data: unknown[], pagination: PaginationMeta) {
  return res.status(200).json({
    success: true,
    code: 'SUCCESS',
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Lee page/limit de query con tope de 500 (ver docs/05_API_ENDPOINTS.md §10). */
export function parsePaging(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(String(query.limit ?? '50'), 10) || 50));
  return { page, limit, skip: (page - 1) * limit };
}
