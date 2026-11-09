import type { ApiResponse } from './http.js';
import { jsonError } from './http.js';
import { SupabaseRequestError } from './supabase.js';

export const reportApiError = (res: ApiResponse, error: unknown): void => {
  const status = error instanceof SupabaseRequestError ? 503 : 500;
  console.error('API request failed', error instanceof Error ? error.message : 'Unknown error');
  jsonError(
    res,
    status,
    status === 503
      ? 'Service is temporarily unavailable. Please try again later.'
      : 'The request could not be completed.'
  );
};
