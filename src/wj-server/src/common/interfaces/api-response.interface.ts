/**
 * Standard API Response Structure
 * All API responses should follow this structure for consistency
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
}

/**
 * Paginated Response Structure
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error Detail Structure
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  value?: any;
}

/**
 * Validation Error Response
 */
export interface ValidationErrorResponse extends ApiResponse<null> {
  errors: ErrorDetail[];
}
