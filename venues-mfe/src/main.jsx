import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import VenuesApp from './VenuesApp';

const stubCtx = {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  onAuthError: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/venues">
      <VenuesApp ctx={stubCtx} />
    </BrowserRouter>
  </React.StrictMode>
);
