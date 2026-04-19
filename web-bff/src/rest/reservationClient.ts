import axios from 'axios';
import { config } from '../config';

const http = axios.create({ baseURL: config.reservationRestUrl, validateStatus: () => true });

export async function createReservation(
  body: { venueId: number; startDate: string; endDate: string },
  token: string,
) {
  const res = await http.post('/reservations', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

export async function listReservations(
  query: { renterId?: number; venueId?: number },
  token: string,
) {
  const res = await http.get('/reservations', {
    params: query,
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

export async function getReservation(id: number, token: string) {
  const res = await http.get(`/reservations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

export async function confirmReservation(id: number, token: string) {
  const res = await http.patch(`/reservations/${id}/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

export async function cancelReservation(id: number, token: string) {
  const res = await http.patch(`/reservations/${id}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}
