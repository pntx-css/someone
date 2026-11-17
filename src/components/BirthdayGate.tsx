import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ScrollWheel } from './ScrollWheel';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { AnimatedText } from './AnimatedText';
import './BirthdayGate.css';

const DAYS = Array.from({length: 31}, (_, i) => i + 1);
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YEARS = Array.from({length: 30}, (_, i) => 1990 + i);

export const BirthdayGate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [day, setDay] = useState<number | string>(1);
  const [month, setMonth] = useState<number | string>('Januari');
  const [year, setYear] = useState<number | string>(2000);
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  useBodyScrollLock(Boolean(error));
  const handleUnlock = async () => {
    if (isUnlocking || isVerifying) return;
    setIsVerifying(true);
    try {
      const response = await fetch('/api/birthday/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: Number(day),
          month: MONTHS.indexOf(String(month)) + 1,
          year: Number(year),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          result && typeof result === 'object' && typeof (result as { error?: unknown }).error === 'string'
            ? (result as { error: string }).error
            : 'Tanggal belum berhasil diverifikasi. Coba lagi ya.';
        setError(message);
        return;
      }
      if (
        !result ||
        typeof result !== 'object' ||
        (result as { verified?: unknown }).verified !== true ||
        !['admin', 'journey'].includes(String((result as { destination?: unknown }).destination))
      ) {
        setError('Server belum mengonfirmasi tanggal lahir. Coba lagi ya.');
        return;
      }

      setError('');
      setIsUnlocking(true);
      const destination = (result as { destination: 'admin' | 'journey' }).destination;
      window.setTimeout(() => {
        if (destination === 'admin') {
          window.location.assign('/admin');
        } else {
          onUnlock();
        }
      }, 1000);
    } catch {
      setError('Koneksi belum tersedia. Coba lagi sebentar ya.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`gate-container ${isUnlocking ? 'unlock-anim' : ''}`}>
      <div className="gate-content">
        <h1 className="gate-title">
          <AnimatedText text="Before The Next Chapter" />
        </h1>
        <p className="gate-subtitle">
          <AnimatedText text="masukin tanggal lahir kamu yaa" delay={300} />
        </p>
        
        <div className="labels-row">
          <div className="wheel-label" style={{ width: '80px' }}>DATE</div>
          <div className="wheel-label" style={{ width: '130px' }}>MONTH</div>
          <div className="wheel-label" style={{ width: '90px' }}>YEAR</div>
        </div>

        <div className="wheels-row">
          <div className="wheel-col" style={{ width: '80px' }}>
            <ScrollWheel
              options={DAYS}
              value={day}
              onChange={setDay}
              label="Tanggal"
              initialScroll
              initialScrollDelay={0}
            />
          </div>
          <div className="wheel-col" style={{ width: '130px' }}>
            <ScrollWheel
              options={MONTHS}
              value={month}
              onChange={setMonth}
              label="Bulan"
              initialScroll
              initialScrollDelay={120}
            />
          </div>
          <div className="wheel-col" style={{ width: '90px' }}>
            <ScrollWheel
              options={YEARS}
              value={year}
              onChange={setYear}
              label="Tahun"
              initialScroll
              initialScrollDelay={240}
            />
          </div>
        </div>
        <button className="gate-btn" onClick={handleUnlock} disabled={isVerifying || isUnlocking}>
          {isVerifying ? 'checking...' : 'next'}
        </button>
      </div>

      {error && createPortal(
        <div className="error-popup-overlay">
          <div
            className="error-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="birthday-error-message"
          >
            <button className="error-popup-close" type="button" onClick={() => setError('')} aria-label="Tutup notifikasi">
              ×
            </button>
            <p id="birthday-error-message">{error}</p>
            <button className="error-popup-btn" onClick={() => setError('')} autoFocus>
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
