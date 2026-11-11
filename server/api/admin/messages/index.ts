import type { ApiRequest, ApiResponse } from '../../_lib/http.js';
import { jsonError, methodNotAllowed } from '../../_lib/http.js';
import { reportApiError } from '../../_lib/errors.js';
import { requireAdmin } from '../../_lib/security.js';
import { supabaseFetch, supabaseError } from '../../_lib/supabase.js';

const PAGE_SIZE = 50;

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    if (!(await requireAdmin(req, res))) return;
    const rawPage = req.query?.page;
    const page = rawPage === undefined ? 0 : Number(rawPage);
    if (!Number.isSafeInteger(page) || page < 0 || page > 1_000_000) {
      jsonError(res, 400, 'Invalid page number.');
      return;
    }

    const start = page * PAGE_SIZE;
    const response = await supabaseFetch(
      `/rest/v1/wishlist_messages?select=id,message,created_at,is_read&order=created_at.desc&limit=${PAGE_SIZE}&offset=${start}`,
      { headers: { Prefer: 'count=exact' } }
    );
    if (!response.ok) throw await supabaseError(response);

    const messages: unknown = await response.json();
    const contentRange = response.headers.get('content-range');
    const match = contentRange?.match(/\/(\d+|\*)$/);
    const total = match?.[1] && match[1] !== '*' ? Number(match[1]) : null;
    res.status(200).json({ messages, page, pageSize: PAGE_SIZE, total });
  } catch (error) {
    reportApiError(res, error);
  }
}
