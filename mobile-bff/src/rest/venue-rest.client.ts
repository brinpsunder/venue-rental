import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CircuitBreaker from 'opossum';
import { makeBreaker } from '../breakers/registry';

const degraded = (): AxiosResponse<any> =>
  ({
    status: 503,
    data: { items: [], degraded: true, reason: 'venue-service unavailable' },
    statusText: 'Service Unavailable',
    headers: {},
    config: {} as any,
  });

@Injectable()
export class VenueRestClient {
  private readonly http: AxiosInstance;
  private readonly listBreaker: CircuitBreaker<[any], AxiosResponse<any>>;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.VENUE_REST_URL ?? 'http://localhost:3002',
      validateStatus: () => true,
    });

    this.listBreaker = makeBreaker(
      'venue.rest.list',
      (query: { location?: string; minCapacity?: number }) => this.http.get('/venues', { params: query }),
      degraded,
    );
  }

  list(query: { location?: string; minCapacity?: number }) {
    return this.listBreaker.fire(query);
  }
}
