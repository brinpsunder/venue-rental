import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class UserRestClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.USER_REST_URL ?? 'http://localhost:3001',
      validateStatus: () => true,
    });
  }

  register(body: { email: string; password: string; role?: string }) {
    return this.http.post('/auth/register', body);
  }

  login(body: { email: string; password: string }) {
    return this.http.post('/auth/login', body);
  }
}
