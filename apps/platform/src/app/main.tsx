import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startI18n } from '../i18n';
import { installErrorReports } from '../shared/reportError';
import '../shared/base.css';

installErrorReports();

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');
// The starting language loads first, so the page never flashes another language.
void startI18n().then(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
