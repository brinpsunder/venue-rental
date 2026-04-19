import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ReservationRestClient } from '../rest/reservation.client';
import { AuthGuard } from '../common/auth.guard';

interface TrimmedReservation {
  id: number;
  venueId: number;
  startDate: string;
  endDate: string;
  status: string;
}

function trim(r: any): TrimmedReservation {
  return {
    id: r.id,
    venueId: r.venue_id,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
  };
}

@Controller('reservations')
@UseGuards(AuthGuard)
export class ReservationsController {
  constructor(private readonly reservations: ReservationRestClient) {}

  @Post()
  async create(
    @Body() body: { venueId: number; startDate: string; endDate: string },
    @Req() req: Request & { token: string },
    @Res() res: Response,
  ) {
    const r = await this.reservations.create(body, req.token);
    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.status(r.status).json(trim(r.data));
  }

  @Get()
  async list(
    @Query('renterId') renterId: string | undefined,
    @Query('venueId') venueId: string | undefined,
    @Req() req: Request & { token: string },
    @Res() res: Response,
  ) {
    const r = await this.reservations.list(
      {
        renterId: renterId ? Number(renterId) : undefined,
        venueId: venueId ? Number(venueId) : undefined,
      },
      req.token,
    );
    if (r.status >= 400) return res.status(r.status).json(r.data);
    const trimmed = Array.isArray(r.data) ? r.data.map(trim) : r.data;
    return res.status(r.status).json(trimmed);
  }

  @Get(':id')
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { token: string },
    @Res() res: Response,
  ) {
    const r = await this.reservations.get(id, req.token);
    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.status(r.status).json(trim(r.data));
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { token: string },
    @Res() res: Response,
  ) {
    const r = await this.reservations.cancel(id, req.token);
    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.status(r.status).json(trim(r.data));
  }
}
