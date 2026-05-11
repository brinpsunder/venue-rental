import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CircuitBreaker from 'opossum';
import { makeBreaker } from '../breakers/registry';

const degraded = (): AxiosResponse<any> =>
  ({
    status: 503,
    data: { degraded: true, reason: 'user-service unavailable' },
    statusText: 'Service Unavailable',
    headers: {},
    config: {} as any,
  });

@Injectable()
export class UserRestClient {
  private readonly http: AxiosInstance;
  private readonly registerBreaker: CircuitBreaker<[any], AxiosResponse<any>>;
  private readonly loginBreaker: CircuitBreaker<[any], AxiosResponse<any>>;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.USER_REST_URL ?? 'http://localhost:3001',
      validateStatus: () => true,
    });

    this.registerBreaker = makeBreaker(
      'user.rest.register',
      (body: { email: string; password: string; role?: string }) => this.http.post('/auth/register', body),
      degraded,
    );
    this.loginBreaker = makeBreaker(
      'user.rest.login',
      (body: { email: string; password: string }) => this.http.post('/auth/login', body),
      degraded,
    );
  }

  register(body: { email: string; password: string; role?: string }) {
    return this.registerBreaker.fire(body);
  }

  login(body: { email: string; password: string }) {
    return this.loginBreaker.fire(body);
  }
}
