import axios from 'axios';
import { config } from '../config';
import { makeBreaker } from '../breakers/registry';

const http = axios.create({ baseURL: config.venueRestUrl, validateStatus: () => true });

interface RestResult { status: number; data: any }

const degradedList = (): RestResult => ({
  status: 503,
  data: { items: [], degraded: true, reason: 'venue-service unavailable' },
});

const degradedItem = (): RestResult => ({
  status: 503,
  data: { degraded: true, reason: 'venue-service unavailable' },
});

async function listVenuesRaw(query: { location?: string; minCapacity?: number }): Promise<RestResult> {
  const res = await http.get('/venues', { params: query });
  return { status: res.status, data: res.data };
}

async function getVenueRestRaw(id: number): Promise<RestResult> {
  const res = await http.get(`/venues/${id}`);
  return { status: res.status, data: res.data };
}

async function createVenueRaw(body: any, token: string): Promise<RestResult> {
  const res = await http.post('/venues', body, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, data: res.data };
}

async function updateVenueRaw(id: number, body: any, token: string): Promise<RestResult> {
  const res = await http.put(`/venues/${id}`, body, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, data: res.data };
}

async function deleteVenueRaw(id: number, token: string): Promise<RestResult> {
  const res = await http.delete(`/venues/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, data: res.data };
}

const listBreaker   = makeBreaker('venue.rest.list',   listVenuesRaw,   degradedList);
const getBreaker    = makeBreaker('venue.rest.get',    getVenueRestRaw, degradedItem);
const createBreaker = makeBreaker('venue.rest.create', createVenueRaw,  degradedItem);
const updateBreaker = makeBreaker('venue.rest.update', updateVenueRaw,  degradedItem);
const deleteBreaker = makeBreaker('venue.rest.delete', deleteVenueRaw,  degradedItem);

export const listVenues   = (query: { location?: string; minCapacity?: number }) => listBreaker.fire(query);
export const getVenueRest = (id: number) => getBreaker.fire(id);
export const createVenue  = (body: any, token: string) => createBreaker.fire(body, token);
export const updateVenue  = (id: number, body: any, token: string) => updateBreaker.fire(id, body, token);
export const deleteVenue  = (id: number, token: string) => deleteBreaker.fire(id, token);
