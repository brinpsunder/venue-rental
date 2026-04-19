import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UserRestClient } from '../rest/user-rest.client';

@Controller('auth')
export class AuthController {
  constructor(private readonly users: UserRestClient) {}

  @Post('register')
  async register(@Body() body: any, @Res() res: Response) {
    const r = await this.users.register(body);
    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.status(r.status).json({ id: r.data?.id, email: r.data?.email, role: r.data?.role });
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    const r = await this.users.login(body);
    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.status(r.status).json({
      token: r.data?.token,
      user: { id: r.data?.user?.id, role: r.data?.user?.role },
    });
  }
}
