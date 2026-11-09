import React from 'react';

export const MainStory: React.FC = () => {
  return (
    <div className="main-story-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--color-pink-50)',
      padding: '2rem',
      textAlign: 'center',
      animation: 'fadeIn 1s ease forwards'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--color-pink-900)' }}>Selamat Datang!</h1>
      <p style={{ fontSize: '1.25rem', maxWidth: '600px', lineHeight: '1.6', fontFamily: 'DM Mono, monospace' }}>
        Phase 3 akan dibangun di sini.
      </p>
    </div>
  );
};
