import React, { useState } from 'react';
import './Wishlist.css';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface WishlistProps {
  onBack: () => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ onBack }) => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting' || status === 'success') return;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setValidationMessage('Tulis wishlist atau pesanmu dulu ya.');
      return;
    }

    setValidationMessage('');
    setSubmissionError('');
    setStatus('submitting');

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage =
          result && typeof result === 'object' && typeof (result as { error?: unknown }).error === 'string'
            ? (result as { error: string }).error
            : 'Pesan belum berhasil dikirim. Coba lagi ya.';
        throw new Error(errorMessage);
      }
      if (!result || typeof result !== 'object' || (result as { sent?: unknown }).sent !== true) {
        throw new Error('Server belum mengonfirmasi penyimpanan pesan. Coba lagi ya.');
      }
      setStatus('success');
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Pesan belum berhasil dikirim. Coba lagi ya.'
      );
      setStatus('error');
    }
  };

  const isSubmitting = status === 'submitting';
  const isSent = status === 'success';
  const stageStatus = isSubmitting ? 'pending' : status;

  return (
    <section className="wishlist-section" aria-labelledby="wishlist-title">
      <div className="wishlist-heading">
        <p className="wishlist-eyebrow">a little note for later</p>
        <h2 id="wishlist-title">Your Wishlist</h2>
        <p className="wishlist-intro">Tulis harapan kecil atau pesan yang ingin kamu simpan.</p>
      </div>

      <div className={`wishlist-envelope-stage wishlist-envelope-stage--${stageStatus}`}>
        <div className="wishlist-envelope-back" aria-hidden="true" />
        <form className="wishlist-paper" onSubmit={handleSubmit} noValidate>
          <label className="wishlist-label" htmlFor="wishlist-message">
            Dear, you...
          </label>
          <textarea
            id="wishlist-message"
            className="wishlist-textarea"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (validationMessage) setValidationMessage('');
              if (status === 'error') {
                setStatus('idle');
                setSubmissionError('');
              }
            }}
            placeholder="Tulis wishlist atau pesanmu di sini..."
            maxLength={1200}
            disabled={isSubmitting || isSent}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby="wishlist-feedback wishlist-count"
          />
          <div className="wishlist-paper-footer">
            <span id="wishlist-count" className="wishlist-count">
              {message.length}/1200
            </span>
            <button className="wishlist-submit" type="submit" disabled={isSubmitting || isSent}>
              {isSubmitting ? 'MENGIRIM...' : isSent ? 'TERKIRIM' : 'KIRIM'}
            </button>
          </div>
          <p
            id="wishlist-feedback"
            className={`wishlist-feedback ${validationMessage || submissionError || isSubmitting ? 'is-visible' : ''}`}
            role={submissionError ? 'alert' : 'status'}
          >
            {validationMessage || submissionError || (isSubmitting ? 'Mengirim pesan...' : '')}
          </p>
        </form>

        <div className="wishlist-envelope" aria-hidden="true">
          <div className="wishlist-envelope-flap wishlist-envelope-flap--left" />
          <div className="wishlist-envelope-flap wishlist-envelope-flap--right" />
          <div className="wishlist-envelope-flap wishlist-envelope-flap--top" />
          <div className="wishlist-envelope-pocket" />
          <span className="wishlist-envelope-seal">♡</span>
        </div>
      </div>

      <p className={`wishlist-confirmation ${isSent ? 'is-visible' : ''}`} aria-live="polite">
        {isSent && 'Pesanmu berhasil dikirim dan dilipat rapi. Terima kasih sudah berbagi ♡'}
      </p>
      <button
        className="wishlist-back"
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
      >
        KEMBALI
      </button>
    </section>
  );
};
