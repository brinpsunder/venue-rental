import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { VenueGrpcService } from '../grpc/venue-grpc.service';
import { VenueRestClient } from '../rest/venue-rest.client';
import { AuthGuard } from '../common/auth.guard';

interface TrimmedVenue {
  id: number;
  name: string;
  location: string;
  pricePerDay: number;
}

function trim(v: any): TrimmedVenue {
  return { id: v.id, name: v.name, location: v.location, pricePerDay: Number(v.pricePerDay) };
}

@Controller('venues')
export class VenuesController {
  constructor(
    private readonly venueGrpc: VenueGrpcService,
    private readonly venueRest: VenueRestClient,
  ) {}

  @Get()
  async list(
    @Query('location') location: string | undefined,
    @Query('minCapacity') minCapacity: string | undefined,
    @Res() res: Response,
  ) {
    const r = await this.venueRest.list({
      location,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
    });
    if (r.status >= 400) return res.status(r.status).json(r.data);
    const trimmed = Array.isArray(r.data) ? r.data.map(trim) : r.data;
    return res.status(r.status).json(trimmed);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const v = await this.venueGrpc.getVenue(id);
    return {
      id: v.id,
      name: v.name,
      location: v.location,
      capacity: v.capacity,
      pricePerDay: v.pricePerDay,
    };
  }

  @Get(':id/availability')
  @UseGuards(AuthGuard)
  async availability(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const available = await this.venueGrpc.checkAvailability(id, startDate, endDate);
    return { available };
  }
}
