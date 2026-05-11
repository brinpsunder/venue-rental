import axios from 'axios';
import { config } from '../config';
import { makeBreaker } from '../breakers/registry';

const http = axios.create({ baseURL: config.reservationRestUrl, validateStatus: () => true });

interface RestResult {
  status: number;
  data: any;
}

// Degradiran odgovor: prazen seznam + zastavica. UI lahko prikaže
// "rezervacij trenutno ni mogoče naložiti" namesto da pade.
const degradedList = (): RestResult => ({
  status: 503,
  data: { items: [], degraded: true, reason: 'reservation-service unavailable' },
});

const degradedItem = (): RestResult => ({
  status: 503,
  data: { degraded: true, reason: 'reservation-service unavailable' },
});

async function createReservationRaw(
  body: { venueId: number; startDate: string; endDate: string },
  token: string,
): Promise<RestResult> {
  const res = await http.post('/reservations', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

async function listReservationsRaw(
  query: { renterId?: number; venueId?: number },
  token: string,
): Promise<RestResult> {
  const res = await http.get('/reservations', {
    params: query,
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

async function getReservationRaw(id: number, token: string): Promise<RestResult> {
  const res = await http.get(`/reservations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

async function confirmReservationRaw(id: number, token: string): Promise<RestResult> {
  const res = await http.patch(`/reservations/${id}/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

async function cancelReservationRaw(id: number, token: string): Promise<RestResult> {
  const res = await http.patch(`/reservations/${id}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

const createBreaker  = makeBreaker('reservation.create',  createReservationRaw,  degradedItem);
const listBreaker    = makeBreaker('reservation.list',    listReservationsRaw,   degradedList);
const getBreaker     = makeBreaker('reservation.get',     getReservationRaw,     degradedItem);
const confirmBreaker = makeBreaker('reservation.confirm', confirmReservationRaw, degradedItem);
const cancelBreaker  = makeBreaker('reservation.cancel',  cancelReservationRaw,  degradedItem);

export const createReservation = (body: { venueId: number; startDate: string; endDate: string }, token: string) =>
  createBreaker.fire(body, token);
export const listReservations = (query: { renterId?: number; venueId?: number }, token: string) =>
  listBreaker.fire(query, token);
export const getReservation = (id: number, token: string) => getBreaker.fire(id, token);
export const confirmReservation = (id: number, token: string) => confirmBreaker.fire(id, token);
export const cancelReservation = (id: number, token: string) => cancelBreaker.fire(id, token);
