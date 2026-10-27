import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../../src/components/AppShell';
import { Popup } from './Popup';
import '../../src/styles/global.css';
createRoot(document.getElementById('root')!).render(<StrictMode><AppShell><Popup/></AppShell></StrictMode>);
