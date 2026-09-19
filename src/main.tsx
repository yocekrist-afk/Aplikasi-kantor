import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AssetProvider } from './contexts/AssetContext';

// Filter out benign Vite WebSocket errors to prevent AI Studio from showing the "Fix errors" toast
const originalError = console.error;
const originalWarn = console.warn;

const isViteWebSocketError = (arg: any) => {
  if (typeof arg !== 'string') return false;
  const msg = arg.toLowerCase();
  return msg.includes('websocket') || 
         msg.includes('server connection lost') ||
         msg.includes('failed to connect to') ||
         msg.includes('[vite]');
};

console.error = (...args) => {
  if (isViteWebSocketError(args[0])) return;
  originalError.apply(console, args);
};

console.warn = (...args) => {
  if (isViteWebSocketError(args[0])) return;
  originalWarn.apply(console, args);
};

window.addEventListener('error', (event) => {
  if (isViteWebSocketError(event.message)) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isViteWebSocketError(event.reason?.message)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AssetProvider>
        <App />
      </AssetProvider>
    </ThemeProvider>
  </StrictMode>,
);
