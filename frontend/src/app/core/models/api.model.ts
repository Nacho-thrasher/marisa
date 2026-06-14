export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message?: string;
  data: T;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  code: string;
  data: T[];
  pagination: Pagination;
  timestamp: string;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
  data?: unknown;
}
