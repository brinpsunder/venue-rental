import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import RemoteFallback from './components/RemoteFallback';
import { useAuth } from './context/auth';

const VenuesApp = lazy(() => import('venues/VenuesApp'));
const ReservationsApp = lazy(() => import('reservations/ReservationsApp'));

function RequireAuth({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function remoteCtx(auth) {
  return {
    token: auth.token,
    user: auth.user,
    onAuthError: auth.clearSession,
  };
}

function VenuesSlot() {
  const auth = useAuth();
  return (
    <Suspense fallback={<RemoteFallback name="venues" />}>
      <VenuesApp ctx={remoteCtx(auth)} />
    </Suspense>
  );
}

function ReservationsSlot() {
  const auth = useAuth();
  return (
    <Suspense fallback={<RemoteFallback name="reservations" />}>
      <ReservationsApp ctx={remoteCtx(auth)} />
    </Suspense>
  );
}

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="venues/*" element={<VenuesSlot />} />
        <Route path="reservations/*" element={<ReservationsSlot />} />
      </Route>

      <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
    </Routes>
  );
}
