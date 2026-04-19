import axios from 'axios';
import { config } from '../config';

const http = axios.create({ baseURL: config.venueRestUrl, validateStatus: () => true });

export async function listVenues(query: { location?: string; minCapacity?: number }) {
  const res = await http.get('/venues', { params: query });
  return { status: res.status, data: res.data };
}

export async function getVenueRest(id: number) {
  const res = await http.get(`/venues/${id}`);
  return { status: res.status, data: res.data };
}

export async function createVenue(body: any, token: string) {
  const res = await http.post('/venues', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

export async function updateVenue(id: number, body: any, token: string) {
  const res = await http.put(`/venues/${id}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

export async function deleteVenue(id: number, token: string) {
  const res = await http.delete(`/venues/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}
