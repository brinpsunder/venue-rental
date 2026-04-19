import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ReservationRestClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.RESERVATION_REST_URL ?? 'http://localhost:3003',
      validateStatus: () => true,
    });
  }

  private auth(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  create(body: { venueId: number; startDate: string; endDate: string }, token: string) {
    return this.http.post('/reservations', body, this.auth(token));
  }

  list(query: { renterId?: number; venueId?: number }, token: string) {
    return this.http.get('/reservations', { params: query, ...this.auth(token) });
  }

  get(id: number, token: string) {
    return this.http.get(`/reservations/${id}`, this.auth(token));
  }

  cancel(id: number, token: string) {
    return this.http.patch(`/reservations/${id}/cancel`, {}, this.auth(token));
  }

  confirm(id: number, token: string) {
    return this.http.patch(`/reservations/${id}/confirm`, {}, this.auth(token));
  }
}
