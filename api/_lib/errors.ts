import type { ApiResponse } from './http.js';
import { jsonError } from './http.js';
import { SupabaseRequestError } from './supabase.js';

export const reportApiError = (res: ApiResponse, error: unknown): void => {
  const status = error instanceof SupabaseRequestError ? 503 : 500;
  if (error instanceof SupabaseRequestError) {
    console.error('Supabase request failed', {
      stage: error.stage,
      operation: error.operation,
      status: error.status,
      code: error.code,
      message: error.diagnosticMessage ?? error.message,
    });
  } else {
    console.error('API request failed', error instanceof Error ? error.message : 'Unknown error');
  }
  jsonError(
    res,
    status,
    status === 503
      ? 'Layanan sedang tidak tersedia. Coba lagi sebentar ya.'
      : 'Verifikasi sedang bermasalah. Coba lagi sebentar ya.'
  );
};
