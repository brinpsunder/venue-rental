import { Routes, Route, Navigate } from 'react-router-dom';
import ReservationsList from './components/ReservationsList';
import CreateReservation from './components/CreateReservation';
import { ReservationsCtxProvider } from './ctx';

export default function ReservationsApp({ ctx }) {
  const safeCtx = ctx ?? { token: null, user: null, onAuthError: () => {} };

  return (
    <ReservationsCtxProvider value={safeCtx}>
      <Routes>
        <Route index element={<ReservationsList />} />
        <Route path="new" element={<CreateReservation />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </ReservationsCtxProvider>
  );
}
