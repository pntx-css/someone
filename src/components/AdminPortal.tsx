import React, { useEffect, useState } from 'react';
import './AdminPortal.css';

type AdminStage = 'checking' | 'birthday' | 'login' | 'dashboard';

interface WishlistMessage {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface MessagePage {
  messages: WishlistMessage[];
  page: number;
  pageSize: number;
  total: number | null;
}

class AdminApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.status = status;
  }
}

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const apiJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { credentials: 'same-origin', ...init });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result && typeof result === 'object' && typeof (result as { error?: unknown }).error === 'string'
        ? (result as { error: string }).error
        : 'Permintaan belum berhasil. Coba lagi.';
    throw new AdminApiError(message, response.status);
  }
  if (!result || typeof result !== 'object') {
    throw new AdminApiError('Server returned an invalid response. Please check the API setup.', response.status);
  }
  return result as T;
};

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));

export const AdminPortal: React.FC = () => {
  const [stage, setStage] = useState<AdminStage>('checking');
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2000');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState<WishlistMessage[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WishlistMessage | null>(null);

  const returnToAccess = async () => {
    setMessages([]);
    try {
      const gate = await apiJson<{ verified: boolean }>('/api/admin/gate');
      setStage(gate.verified ? 'login' : 'birthday');
    } catch {
      setStage('birthday');
    }
  };

  const loadMessages = async (targetPage: number) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await apiJson<MessagePage>(`/api/admin/messages?page=${targetPage}`);
      setMessages(result.messages);
      setPage(result.page);
      setTotal(result.total ?? 0);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Pesan belum berhasil dimuat.';
      setError(message);
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        await returnToAccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        await apiJson<{ authenticated: boolean }>('/api/admin/session');
        if (active) {
          setStage('dashboard');
          await loadMessages(0);
        }
      } catch {
        try {
          const gate = await apiJson<{ verified: boolean }>('/api/admin/gate');
          if (active) setStage(gate.verified ? 'login' : 'birthday');
        } catch {
          if (active) {
            setStage('birthday');
            setError('Layanan admin belum dapat dihubungi. Coba muat ulang halaman.');
          }
        }
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  const handleBirthdaySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    setNotice('');
    try {
      await apiJson('/api/admin/birthday/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: Number(day), month: Number(month), year: Number(year) }),
      });
      setStage('login');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Tanggal belum terverifikasi.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    setNotice('');
    try {
      await apiJson('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      setPassword('');
      setStage('dashboard');
      await loadMessages(0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login belum berhasil.');
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        try {
          const gate = await apiJson<{ verified: boolean }>('/api/admin/gate');
          if (!gate.verified) setStage('birthday');
        } catch {
          setStage('birthday');
        }
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleReadChange = async (message: WishlistMessage) => {
    setIsBusy(true);
    setError('');
    try {
      await apiJson(`/api/admin/messages/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: !message.is_read }),
      });
      await loadMessages(page);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Status pesan belum berubah.');
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        await returnToAccess();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsBusy(true);
    setError('');
    try {
      await apiJson(`/api/admin/messages/${deleteTarget.id}`, { method: 'DELETE' });
      setNotice('Wishlist berhasil dihapus.');
      setDeleteTarget(null);
      const nextPage = messages.length === 1 && page > 0 ? page - 1 : page;
      await loadMessages(nextPage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Pesan belum berhasil dihapus.');
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        await returnToAccess();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleExport = async () => {
    setIsBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/export', { credentials: 'same-origin' });
      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const message =
          result && typeof result === 'object' && typeof (result as { error?: unknown }).error === 'string'
            ? (result as { error: string }).error
            : 'File belum berhasil dibuat.';
        throw new AdminApiError(message, response.status);
      }
      if (!response.headers.get('content-type')?.includes('text/plain')) {
        throw new AdminApiError('Server returned an invalid export response.', response.status);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wishlist-${new Date().toISOString().slice(0, 10)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('File wishlist berhasil diekspor.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ekspor belum berhasil.');
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        await returnToAccess();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = async () => {
    setIsBusy(true);
    setError('');
    try {
      await apiJson('/api/admin/logout', { method: 'POST' });
      setMessages([]);
      setStage('birthday');
      setNotice('Kamu sudah logout.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Logout belum berhasil.');
    } finally {
      setIsBusy(false);
    }
  };

  if (stage === 'checking') {
    return (
      <main className="admin-page">
        <p className="admin-loading" role="status">Memeriksa sesi admin...</p>
      </main>
    );
  }

  if (stage === 'birthday' || stage === 'login') {
    return (
      <main className="admin-page">
        <a className="admin-back-link" href="/">← kembali ke birthday journey</a>
        <section className="admin-access-paper">
          <p className="admin-eyebrow">private corner</p>
          <h1>{stage === 'birthday' ? 'Admin access' : 'Welcome back'}</h1>
          <p className="admin-access-description">
            {stage === 'birthday'
              ? 'Verifikasi tanggal untuk melanjutkan ke login admin.'
              : 'Masuk menggunakan akun admin yang sudah diotorisasi.'}
          </p>

          {stage === 'birthday' ? (
            <form className="admin-access-form" onSubmit={handleBirthdaySubmit}>
              <div className="admin-date-fields">
                <label>
                  Tanggal
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={day}
                    onChange={(event) => setDay(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Bulan
                  <select value={month} onChange={(event) => setMonth(event.target.value)}>
                    {MONTHS.map((name, index) => (
                      <option key={name} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Tahun
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    required
                  />
                </label>
              </div>
              <button className="admin-primary-button" type="submit" disabled={isBusy}>
                {isBusy ? 'MEMERIKSA...' : 'LANJUT'}
              </button>
            </form>
          ) : (
            <form className="admin-access-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button className="admin-primary-button" type="submit" disabled={isBusy}>
                {isBusy ? 'SIGNING IN...' : 'LOGIN'}
              </button>
            </form>
          )}

          {error && stage === 'login' && <p className="admin-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
        </section>
        {error && stage === 'birthday' && (
          <div className="admin-alert-backdrop" role="presentation">
            <section
              className="admin-alert-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="admin-birthday-error-title"
              aria-describedby="admin-birthday-error-message"
            >
              <h2 id="admin-birthday-error-title">Belum bisa masuk</h2>
              <p id="admin-birthday-error-message">{error}</p>
              <button
                className="admin-primary-button"
                type="button"
                onClick={() => setError('')}
                autoFocus
              >
                MENGERTI
              </button>
            </section>
          </div>
        )}
      </main>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / 50));

  return (
    <main className="admin-page admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">private corner</p>
          <h1>Wishlist letters</h1>
          <p className="admin-dashboard-subtitle">{total} pesan tersimpan</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-secondary-button" type="button" onClick={handleExport} disabled={isBusy}>
            EKSPOR .TXT
          </button>
          <button className="admin-logout-button" type="button" onClick={handleLogout} disabled={isBusy}>
            LOGOUT
          </button>
        </div>
      </header>

      {error && <p className="admin-banner admin-banner--error" role="alert">{error}</p>}
      {notice && <p className="admin-banner" role="status">{notice}</p>}

      <section className="admin-message-list" aria-label="Daftar wishlist">
        {isLoading ? (
          <p className="admin-empty-state" role="status">Memuat wishlist...</p>
        ) : messages.length === 0 ? (
          <p className="admin-empty-state">Belum ada wishlist.</p>
        ) : (
          messages.map((message) => (
            <article
              className={`admin-message ${message.is_read ? '' : 'admin-message--unread'}`}
              key={message.id}
            >
              <div className="admin-message-topline">
                <time dateTime={message.created_at}>{formatDate(message.created_at)}</time>
                <span className={`admin-read-status ${message.is_read ? '' : 'is-unread'}`}>
                  {!message.is_read && <span className="admin-unread-dot" />}
                  {message.is_read ? 'Sudah dibaca' : 'Belum dibaca'}
                </span>
              </div>
              <p className="admin-message-body">{message.message}</p>
              <div className="admin-message-actions">
                <button
                  className="admin-text-button"
                  type="button"
                  onClick={() => void handleReadChange(message)}
                  disabled={isBusy}
                >
                  {message.is_read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                </button>
                <button
                  className="admin-delete-button"
                  type="button"
                  onClick={() => setDeleteTarget(message)}
                  disabled={isBusy}
                >
                  Hapus
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <nav className="admin-pagination" aria-label="Navigasi daftar wishlist">
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => void loadMessages(page - 1)}
          disabled={page === 0 || isLoading}
        >
          Sebelumnya
        </button>
        <span>Halaman {page + 1} dari {pageCount}</span>
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => void loadMessages(page + 1)}
          disabled={page + 1 >= pageCount || isLoading}
        >
          Berikutnya
        </button>
      </nav>

      {deleteTarget && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section
            className="admin-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
            aria-describedby="admin-delete-description"
          >
            <h2 id="admin-delete-title">Hapus wishlist ini?</h2>
            <p id="admin-delete-description">Pesan yang dihapus tidak dapat dikembalikan.</p>
            <div className="admin-dialog-actions">
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isBusy}
              >
                BATAL
              </button>
              <button
                className="admin-delete-button admin-delete-button--confirm"
                type="button"
                onClick={() => void handleDelete()}
                disabled={isBusy}
              >
                {isBusy ? 'MENGHAPUS...' : 'HAPUS'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
