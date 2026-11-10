type SupabaseFailureStage = 'configuration' | 'network' | 'upstream' | 'response';

interface SupabaseFailureDetails {
  stage: SupabaseFailureStage;
  operation: string;
  code?: string;
  diagnosticMessage?: string;
}

const SECRET_ENVIRONMENT_VARIABLES = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BIRTHDAY_SECRET',
] as const;

const redactDiagnostic = (message: string): string => {
  let redacted = message;
  for (const name of SECRET_ENVIRONMENT_VARIABLES) {
    const secret = process.env[name];
    if (secret) redacted = redacted.replaceAll(secret, '[REDACTED]');
  }
  return redacted
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .slice(0, 500);
};

const environmentValue = (name: string, operation: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new SupabaseRequestError(`Missing server environment variable: ${name}`, 503, {
      stage: 'configuration',
      operation,
    });
  }
  return value;
};

const projectRefFromKey = (key: string): string | null => {
  const payload = key.split('.')[1];
  if (!payload) return null;

  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      claims &&
      typeof claims === 'object' &&
      'ref' in claims &&
      typeof claims.ref === 'string'
    ) {
      return claims.ref;
    }
  } catch {
    return null;
  }
  return null;
};

const supabaseUrl = (operation: string): URL => {
  const configuredUrl = environmentValue('SUPABASE_URL', operation);
  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new SupabaseRequestError('SUPABASE_URL is not a valid URL.', 503, {
      stage: 'configuration',
      operation,
    });
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new SupabaseRequestError('SUPABASE_URL has an invalid format.', 503, {
      stage: 'configuration',
      operation,
    });
  }

  if (process.env.VERCEL === '1' && url.protocol !== 'https:') {
    throw new SupabaseRequestError('SUPABASE_URL must use HTTPS in production.', 503, {
      stage: 'configuration',
      operation,
    });
  }

  return url;
};

export class SupabaseRequestError extends Error {
  readonly status: number;
  readonly stage: SupabaseFailureStage;
  readonly operation: string;
  readonly code: string | undefined;
  readonly diagnosticMessage: string | undefined;

  constructor(message: string, status: number, details: SupabaseFailureDetails) {
    super(message);
    this.name = 'SupabaseRequestError';
    this.status = status;
    this.stage = details.stage;
    this.operation = details.operation;
    this.code = details.code;
    this.diagnosticMessage = details.diagnosticMessage
      ? redactDiagnostic(details.diagnosticMessage)
      : undefined;
  }
}

export const supabaseFetch = async (
  path: string,
  options: RequestInit = {},
  credential: 'anon' | 'service' = 'service'
): Promise<Response> => {
  const operation = `${options.method ?? 'GET'} ${path.split('?')[0]}`;
  const keyName = credential === 'anon' ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY';
  const key = environmentValue(keyName, operation);
  const url = supabaseUrl(operation);

  const projectRef = projectRefFromKey(key);
  const urlProjectRef = url.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i)?.[1];
  if (projectRef && urlProjectRef && projectRef !== urlProjectRef) {
    throw new SupabaseRequestError('Supabase URL and API key belong to different projects.', 503, {
      stage: 'configuration',
      operation,
    });
  }

  const headers = new Headers(options.headers);
  headers.set('apikey', key);
  if (!headers.has('Authorization') && !key.startsWith('sb_')) {
    headers.set('Authorization', 'Bearer ' + key);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(new URL(path, url), { ...options, headers });
  } catch (error) {
    const cause =
      error instanceof Error && 'cause' in error && error.cause instanceof Error
        ? error.cause
        : error;
    const diagnosticMessage = cause instanceof Error ? cause.message : String(cause);
    const code =
      cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string'
        ? cause.code
        : undefined;
    throw new SupabaseRequestError('Supabase is unavailable.', 503, {
      stage: 'network',
      operation,
      code,
      diagnosticMessage,
    });
  }
};

const responseError = (
  value: unknown
): { code?: string; message?: string } => {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const code =
    typeof record.code === 'string'
      ? record.code
      : typeof record.error_code === 'string'
        ? record.error_code
        : undefined;
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.msg === 'string'
        ? record.msg
        : typeof record.error_description === 'string'
          ? record.error_description
          : typeof record.error === 'string'
            ? record.error
            : undefined;
  return { code, message };
};

export const supabaseError = async (
  response: Response,
  operation = 'Supabase request'
): Promise<SupabaseRequestError> => {
  const body = await response.text().catch(() => '');
  let parsed: unknown;
  if (body) {
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = undefined;
    }
  }
  const upstreamError = responseError(parsed);
  const message = upstreamError.message ?? (parsed === undefined ? body : undefined);

  return new SupabaseRequestError('The Supabase request was rejected.', response.status, {
    stage: 'upstream',
    operation,
    code: response.headers.get('x-supabase-error-code') ?? upstreamError.code,
    diagnosticMessage: message,
  });
};

export const supabaseResponseError = (
  operation: string,
  message: string
): SupabaseRequestError =>
  new SupabaseRequestError('Supabase returned an invalid response.', 502, {
    stage: 'response',
    operation,
    diagnosticMessage: message,
  });
