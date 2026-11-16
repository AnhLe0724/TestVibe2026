import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initAppStore } from './app/bootstrap.ts';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/devices.css';
import './ui/styles/manager.css';

const store = initAppStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
