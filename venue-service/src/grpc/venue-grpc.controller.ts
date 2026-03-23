import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VenueService } from '../venue/venue.service';

@Controller()
export class VenueGrpcController {
  constructor(private readonly venueService: VenueService) {}

  @GrpcMethod('VenueService', 'GetVenue')
  async getVenue(data: { venue_id: number }) {
    const venue = await this.venueService.findOne(data.venue_id);
    return {
      id: venue.id,
      owner_id: venue.ownerId,
      name: venue.name,
      location: venue.location,
      capacity: venue.capacity,
      price_per_day: Number(venue.pricePerDay),
      is_available: venue.isAvailable,
    };
  }

  @GrpcMethod('VenueService', 'CheckAvailability')
  checkAvailability(data: { venue_id: number; start_date: string; end_date: string }) {
    // Stub — real availability check will be implemented when reservation-service is built
    return { available: true };
  }
}
