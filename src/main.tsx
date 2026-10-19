import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';
const host = document.getElementById('root');
if (!host) throw new Error('Missing root');
createRoot(host).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
