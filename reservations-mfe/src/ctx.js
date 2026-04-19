import { createContext, useContext } from 'react';

const ReservationsCtx = createContext({ token: null, user: null, onAuthError: () => {} });

export const ReservationsCtxProvider = ReservationsCtx.Provider;

export function useCtx() {
  return useContext(ReservationsCtx);
}
