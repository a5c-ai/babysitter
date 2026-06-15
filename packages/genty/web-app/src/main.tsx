import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom-v6';
import { App } from './App.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
