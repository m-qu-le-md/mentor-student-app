import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { RoleProvider } from './app/RoleContext.jsx';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoleProvider>
      <App />
    </RoleProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
}
