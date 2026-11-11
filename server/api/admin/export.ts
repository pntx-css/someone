import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { methodNotAllowed } from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import { requireAdmin } from '../_lib/security.js';
import { supabaseFetch, supabaseError } from '../_lib/supabase.js';

interface ExportMessage {
  message: string;
  created_at: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    if (!(await requireAdmin(req, res))) return;
    const pageSize = 1000;
    const messages: ExportMessage[] = [];

    for (let offset = 0; ; offset += pageSize) {
      const response = await supabaseFetch(
        `/rest/v1/wishlist_messages?select=message,created_at&order=created_at.asc&limit=${pageSize}&offset=${offset}`
      );
      if (!response.ok) throw await supabaseError(response);

      const page: unknown = await response.json();
      if (!Array.isArray(page)) throw new Error('Supabase returned an invalid export response.');
      messages.push(...(page as ExportMessage[]));
      if (page.length < pageSize) break;
    }

    const formatter = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    });
    const content = messages
      .map(
        (entry) =>
          `Waktu: ${formatter.format(new Date(entry.created_at))}\nPesan:\n${entry.message}`
      )
      .join('\n\n================================\n\n');
    const filename = `wishlist-${new Date().toISOString().slice(0, 10)}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(`\uFEFF${content}`);
  } catch (error) {
    reportApiError(res, error);
  }
}
