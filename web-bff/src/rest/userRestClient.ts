import axios from 'axios';
import { config } from '../config';
import { makeBreaker } from '../breakers/registry';

const http = axios.create({ baseURL: config.userRestUrl, validateStatus: () => true });

interface RestResult { status: number; data: any }

const degraded = (): RestResult => ({
  status: 503,
  data: { degraded: true, reason: 'user-service unavailable' },
});

async function registerUserRaw(body: { email: string; password: string; role?: string }): Promise<RestResult> {
  const res = await http.post('/auth/register', body);
  return { status: res.status, data: res.data };
}

async function loginUserRaw(body: { email: string; password: string }): Promise<RestResult> {
  const res = await http.post('/auth/login', body);
  return { status: res.status, data: res.data };
}

async function getUserByIdRaw(id: number, token: string): Promise<RestResult> {
  const res = await http.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}

const registerBreaker = makeBreaker('user.rest.register', registerUserRaw, degraded);
const loginBreaker    = makeBreaker('user.rest.login',    loginUserRaw,    degraded);
const getByIdBreaker  = makeBreaker('user.rest.getById',  getUserByIdRaw,  degraded);

export const registerUser = (body: { email: string; password: string; role?: string }) => registerBreaker.fire(body);
export const loginUser    = (body: { email: string; password: string }) => loginBreaker.fire(body);
export const getUserById  = (id: number, token: string) => getByIdBreaker.fire(id, token);
