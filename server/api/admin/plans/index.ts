import type { ApiRequest, ApiResponse } from '../../_lib/http.js';
import { jsonError, methodNotAllowed } from '../../_lib/http.js';
import { reportApiError } from '../../_lib/errors.js';
import { requireAdmin } from '../../_lib/security.js';
import { supabaseError, supabaseFetch } from '../../_lib/supabase.js';

const PAGE_SIZE = 30;

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
      jsonError(res, 400, 'Nomor halaman rencana tidak valid.');
      return;
    }

    const start = page * PAGE_SIZE;
    const response = await supabaseFetch(
      `/rest/v1/place_plan_submissions?select=id,visits,created_at&order=created_at.desc&limit=${PAGE_SIZE}&offset=${start}`,
      { headers: { Prefer: 'count=exact' } }
    );
    if (!response.ok) throw await supabaseError(response);

    const plans: unknown = await response.json();
    const contentRange = response.headers.get('content-range');
    const match = contentRange?.match(/\/(\d+|\*)$/);
    const total = match?.[1] && match[1] !== '*' ? Number(match[1]) : null;
    res.status(200).json({ plans, page, pageSize: PAGE_SIZE, total });
  } catch (error) {
    reportApiError(res, error);
  }
}
