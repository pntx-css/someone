import type { ApiRequest, ApiResponse } from '../server/api/_lib/http.js';
import dispatchApiRequest from '../server/api/dispatch.js';

export default function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  return dispatchApiRequest(req, res);
}
