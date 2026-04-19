import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ReservationsApp from './ReservationsApp';

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
    <BrowserRouter basename="/reservations">
      <ReservationsApp ctx={stubCtx} />
    </BrowserRouter>
  </React.StrictMode>
);
