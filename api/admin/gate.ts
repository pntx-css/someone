import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { methodNotAllowed } from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import { adminGateValid } from '../_lib/security.js';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }
  try {
    res.status(200).json({ verified: adminGateValid(req) });
  } catch (error) {
    reportApiError(res, error);
  }
}
