import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { configure } from './i18n';
import { App } from './App';

// In development every missing translation key is logged to the console (and listed in
// getMissing()); in production they are still recorded but not logged.
configure({ warnOnMissing: Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) });

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
