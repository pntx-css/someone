import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles.css'

const navigationEntry = window.performance
  .getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

if (navigationEntry?.type === 'navigate') {
  const sessionStateKeys = [
    'birthday-journey-page-state',
    'birthday-cake-candles',
    'birthday-special-chapter-state',
    'birthday-music-player-expanded',
    'birthday-music-playback',
  ];

  try {
    sessionStateKeys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('Could not reset the previous birthday journey session', error);
  }
}

const handleJellyButtonClick = (event: MouseEvent) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!(event.target instanceof Element)) return;

  const control = event.target.closest('button, [role="button"]');
  if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;

  control.classList.remove('jelly-button-click');
  void control.getBoundingClientRect();
  control.classList.add('jelly-button-click');
};

const clearJellyButtonClick = (event: AnimationEvent) => {
  if (event.animationName !== 'jelly-button-click' || !(event.target instanceof Element)) return;
  event.target.classList.remove('jelly-button-click');
};

document.addEventListener('click', handleJellyButtonClick, true);
document.addEventListener('animationend', clearJellyButtonClick);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
