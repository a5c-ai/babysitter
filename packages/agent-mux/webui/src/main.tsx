import React from 'react';
import ReactDOM from 'react-dom/client';

import './web-only/browser-globals.js';
import { App } from './App.js';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
