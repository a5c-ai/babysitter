import React from 'react';
import ReactDOM from 'react-dom/client';

import '@a5c-ai/compendium/css';
import { App } from './App.js';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
