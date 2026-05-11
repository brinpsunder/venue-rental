import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CircuitBreaker from 'opossum';
import { makeBreaker } from '../breakers/registry';

type Resp = AxiosResponse<any>;

const degradedList = (): Resp =>
  ({
    status: 503,
    data: { items: [], degraded: true, reason: 'reservation-service unavailable' },
    statusText: 'Service Unavailable',
    headers: {},
    config: {} as any,
  });

const degradedItem = (): Resp =>
  ({
    status: 503,
    data: { degraded: true, reason: 'reservation-service unavailable' },
    statusText: 'Service Unavailable',
    headers: {},
    config: {} as any,
  });

@Injectable()
export class ReservationRestClient {
  private readonly http: AxiosInstance;
  private readonly createBreaker: CircuitBreaker<[any, string], Resp>;
  private readonly listBreaker: CircuitBreaker<[any, string], Resp>;
  private readonly getBreaker: CircuitBreaker<[number, string], Resp>;
  private readonly cancelBreaker: CircuitBreaker<[number, string], Resp>;
  private readonly confirmBreaker: CircuitBreaker<[number, string], Resp>;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.RESERVATION_REST_URL ?? 'http://localhost:3003',
      validateStatus: () => true,
    });

    this.createBreaker = makeBreaker(
      'reservation.create',
      (body: { venueId: number; startDate: string; endDate: string }, token: string) =>
        this.http.post('/reservations', body, this.auth(token)),
      degradedItem,
    );
    this.listBreaker = makeBreaker(
      'reservation.list',
      (query: { renterId?: number; venueId?: number }, token: string) =>
        this.http.get('/reservations', { params: query, ...this.auth(token) }),
      degradedList,
    );
    this.getBreaker = makeBreaker(
      'reservation.get',
      (id: number, token: string) => this.http.get(`/reservations/${id}`, this.auth(token)),
      degradedItem,
    );
    this.cancelBreaker = makeBreaker(
      'reservation.cancel',
      (id: number, token: string) => this.http.patch(`/reservations/${id}/cancel`, {}, this.auth(token)),
      degradedItem,
    );
    this.confirmBreaker = makeBreaker(
      'reservation.confirm',
      (id: number, token: string) => this.http.patch(`/reservations/${id}/confirm`, {}, this.auth(token)),
      degradedItem,
    );
  }

  private auth(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  create(body: { venueId: number; startDate: string; endDate: string }, token: string) {
    return this.createBreaker.fire(body, token);
  }

  list(query: { renterId?: number; venueId?: number }, token: string) {
    return this.listBreaker.fire(query, token);
  }

  get(id: number, token: string) {
    return this.getBreaker.fire(id, token);
  }

  cancel(id: number, token: string) {
    return this.cancelBreaker.fire(id, token);
  }

  confirm(id: number, token: string) {
    return this.confirmBreaker.fire(id, token);
  }
}
