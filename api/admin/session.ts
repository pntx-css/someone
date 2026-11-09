import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { methodNotAllowed } from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import { requireAdmin } from '../_lib/security.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    if (!(await requireAdmin(req, res))) return;
    res.status(200).json({ authenticated: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
