import { Routes, Route, Navigate } from 'react-router-dom';
import VenuesList from './components/VenuesList';
import VenueDetail from './components/VenueDetail';
import VenueForm from './components/VenueForm';
import { VenuesCtxProvider } from './ctx';

export default function VenuesApp({ ctx }) {
  const safeCtx = ctx ?? { token: null, user: null, onAuthError: () => {} };

  return (
    <VenuesCtxProvider value={safeCtx}>
      <Routes>
        <Route index element={<VenuesList />} />
        <Route path="new" element={<VenueForm mode="create" />} />
        <Route path=":id" element={<VenueDetail />} />
        <Route path=":id/edit" element={<VenueForm mode="edit" />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </VenuesCtxProvider>
  );
}
