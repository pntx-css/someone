const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new SupabaseRequestError(`Missing server environment variable: ${name}`, 503);
  return value;
};

const supabaseUrl = () => env('SUPABASE_URL').replace(/\/+$/, '');
const anonKey = () => env('SUPABASE_ANON_KEY');
const serviceRoleKey = () => env('SUPABASE_SERVICE_ROLE_KEY');

export class SupabaseRequestError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.name = 'SupabaseRequestError';
    this.status = status;
  }
}

export const supabaseFetch = async (
  path: string,
  options: RequestInit = {},
  credential: 'anon' | 'service' = 'service'
): Promise<Response> => {
  const key = credential === 'anon' ? anonKey() : serviceRoleKey();
  const headers = new Headers(options.headers);
  headers.set('apikey', key);
  if (!headers.has('Authorization') && !key.startsWith('sb_')) {
    headers.set('Authorization', `Bearer ${key}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(`${supabaseUrl()}${path}`, { ...options, headers });
  } catch {
    throw new SupabaseRequestError('Supabase is unavailable.', 503);
  }
};

export const supabaseError = async (response: Response): Promise<SupabaseRequestError> => {
  const detail = await response.text().catch(() => '');
  console.error('Supabase request failed', {
    status: response.status,
    code: response.headers.get('x-supabase-error-code') ?? undefined,
    hasDetails: Boolean(detail),
  });
  return new SupabaseRequestError('The database request failed.', response.status);
};
