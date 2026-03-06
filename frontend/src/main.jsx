import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// ── Mobile keyboard viewport fix ─────────────────────────────
// Updates --viewport-height CSS var so the app can size correctly
// when the on-screen keyboard opens (shrinks visible viewport).
const setViewportHeight = () => {
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
};
setViewportHeight();
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setViewportHeight, { passive: true });
}
// Fallback for older Android/Chrome
window.addEventListener('resize', setViewportHeight, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

