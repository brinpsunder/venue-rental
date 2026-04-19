import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/auth.guard';
import { VenueGrpcService } from '../grpc/venue-grpc.service';
import { VenueRestClient } from '../rest/venue-rest.client';
import { ReservationRestClient } from '../rest/reservation.client';

type AuthedReq = Request & { token: string; user: { userId: number; role: string } };

@Controller('mobile')
@UseGuards(AuthGuard)
export class MobileController {
  constructor(
    private readonly venueGrpc: VenueGrpcService,
    private readonly venueRest: VenueRestClient,
    private readonly reservations: ReservationRestClient,
  ) {}

  @Get('home')
  async home(@Req() req: AuthedReq) {
    const [venuesRes, reservationsRes] = await Promise.all([
      this.venueRest.list({}),
      this.reservations.list({ renterId: req.user.userId }, req.token),
    ]);

    const featuredVenues = Array.isArray(venuesRes.data)
      ? venuesRes.data.slice(0, 5).map((v: any) => ({
          id: v.id,
          name: v.name,
          location: v.location,
          pricePerDay: Number(v.pricePerDay),
        }))
      : [];

    const myUpcomingReservations = Array.isArray(reservationsRes.data)
      ? reservationsRes.data
          .filter((r: any) => r.status !== 'CANCELLED')
          .map((r: any) => ({
            id: r.id,
            venueId: r.venue_id,
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status,
          }))
      : [];

    return {
      greeting: `Welcome back, ${req.user.userId}`,
      featuredVenues,
      myUpcomingReservations,
    };
  }

  @Post('quick-book')
  async quickBook(
    @Body() body: { venueId: number; date: string },
    @Req() req: AuthedReq,
  ) {
    if (!body?.venueId || !body?.date) {
      throw new HttpException({ error: 'venueId and date are required' }, 400);
    }

    const start = new Date(body.date);
    if (Number.isNaN(start.getTime())) {
      throw new HttpException({ error: 'Invalid date' }, 400);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const endDate = end.toISOString().slice(0, 10);

    const available = await this.venueGrpc.checkAvailability(
      body.venueId,
      body.date,
      endDate,
    );
    if (!available) {
      throw new HttpException({ error: 'Venue not available on that date' }, 409);
    }

    const res = await this.reservations.create(
      { venueId: body.venueId, startDate: body.date, endDate },
      req.token,
    );
    if (res.status >= 400) throw new HttpException(res.data, res.status);

    return {
      reservationId: res.data.id,
      venueId: res.data.venue_id,
      date: body.date,
      status: res.data.status,
    };
  }
}
