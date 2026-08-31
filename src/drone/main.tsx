import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SiteApp from './SiteApp';
import { AuthProvider } from '../auth/AuthProvider';
import '../components/auth/auth.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SiteApp />
    </AuthProvider>
  </StrictMode>,
);
