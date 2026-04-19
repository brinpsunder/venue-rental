import { createContext, useContext } from 'react';

const VenuesCtx = createContext({ token: null, user: null, onAuthError: () => {} });

export const VenuesCtxProvider = VenuesCtx.Provider;

export function useCtx() {
  return useContext(VenuesCtx);
}
