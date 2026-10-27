import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { cloudSync } from './services/cloudSync';

// Pull the organisation's data from Supabase before the first render (falls back to local data).
cloudSync.init().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
