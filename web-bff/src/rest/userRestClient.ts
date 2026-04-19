import axios from 'axios';
import { config } from '../config';

const http = axios.create({ baseURL: config.userRestUrl, validateStatus: () => true });

export async function registerUser(body: { email: string; password: string; role?: string }) {
  const res = await http.post('/auth/register', body);
  return { status: res.status, data: res.data };
}

export async function loginUser(body: { email: string; password: string }) {
  const res = await http.post('/auth/login', body);
  return { status: res.status, data: res.data };
}

export async function getUserById(id: number, token: string) {
  const res = await http.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: res.data };
}
