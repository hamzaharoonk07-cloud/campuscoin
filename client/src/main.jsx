import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider, ThemeProvider, ToastProvider } from './context/AppContext.jsx';
import './styles/app.css';
// After app.css, so motion rules win over same-specificity base rules.
import './styles/motion.css';
import './styles/pictures.css';
import './styles/frame.css';
// The Fynix look, last so it wins.
import './styles/fynix.css';
import { installPointerEffects } from './lib/pointerEffects.js';

installPointerEffects();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
