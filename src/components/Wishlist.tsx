import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatedText } from './AnimatedText';
import {
  readWishlistState,
  saveWishlistState,
} from '../state/wishlistSession';
import './Wishlist.css';

const SpecialChapter = lazy(() =>
  import('./SpecialChapter').then((module) => ({ default: module.SpecialChapter }))
);

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface WishlistProps {
  onRevealFootprint: () => void;
  planeArrived: boolean;
}

export const Wishlist: React.FC<WishlistProps> = ({ onRevealFootprint, planeArrived }) => {
  const [initialWishlistState] = useState(readWishlistState);
  const [message, setMessage] = useState(initialWishlistState.draft);
  const [hasSent, setHasSent] = useState(initialWishlistState.hasSent);
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  useEffect(() => {
    saveWishlistState({ draft: hasSent ? '' : message, hasSent });
  }, [hasSent, message]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting' || status === 'success' || hasSent) return;

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

      saveWishlistState({ draft: '', hasSent: true });
      setStatus('success');
      setHasSent(true);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Pesan belum berhasil dikirim. Coba lagi ya.'
      );
      setStatus('error');
    }
  };

  const isSubmitting = status === 'submitting';
  const isSent = status === 'success' || hasSent;
  const stageStatus = isSubmitting ? 'pending' : isSent ? 'success' : status;

  return (
    <section className="wishlist-section" aria-labelledby="wishlist-title">
      <div className={`wishlist-heading ${planeArrived ? '' : 'wishlist-heading--waiting'}`}>
        <p className="wishlist-eyebrow">
          <AnimatedText text="a little note for later" />
        </p>

        <h2 id="wishlist-title">
          <AnimatedText text="Your Hope" delay={180} />
        </h2>

        <p className="wishlist-intro">
          <AnimatedText
            text="Tulis harapan dan pesan kamu buat aku disini yaa"
            delay={360}
            interval={16}
          />
        </p>
      </div>

      <div className={`wishlist-envelope-stage wishlist-envelope-stage--${stageStatus}`}>
        <div className="wishlist-envelope-back" aria-hidden="true" />

        <form
          className={`wishlist-paper ${planeArrived ? 'puzzle-paper--revealed' : 'puzzle-paper--hidden'}`}
          onSubmit={handleSubmit}
          noValidate
        >
          <label
            className={`wishlist-label puzzle-item puzzle-label ${planeArrived ? 'is-revealed' : ''}`}
            htmlFor="wishlist-message"
          >
            Dear, papan...
          </label>

          <textarea
            className={`wishlist-textarea puzzle-item puzzle-textarea ${planeArrived ? 'is-revealed' : ''}`}
            id="wishlist-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);

              if (validationMessage) setValidationMessage('');

              if (status === 'error') {
                setStatus('idle');
                setSubmissionError('');
              }
            }}
            placeholder="Tulis harapan dan pesanmu di sini..."
            maxLength={1200}
            disabled={isSubmitting || isSent}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby="wishlist-feedback wishlist-count"
          />

          <div className="wishlist-paper-footer">
            <span
              id="wishlist-count"
              className={`wishlist-count puzzle-item puzzle-count ${planeArrived ? 'is-revealed' : ''}`}
            >
              {message.length}/1200
            </span>

            <button
              className={`wishlist-submit puzzle-button ${planeArrived ? 'is-revealed' : ''}`}
              type="submit"
              disabled={isSubmitting || isSent}
            >
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
        {isSent && 'Pesanmu udah kuterima, makasih yaa ♡'}
      </p>

      <Suspense fallback={null}>
        <SpecialChapter wishlistSent={isSent} onRevealFootprint={onRevealFootprint} />
      </Suspense>
    </section>
  );
};