import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class VenueRestClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.VENUE_REST_URL ?? 'http://localhost:3002',
      validateStatus: () => true,
    });
  }

  list(query: { location?: string; minCapacity?: number }) {
    return this.http.get('/venues', { params: query });
  }
}
