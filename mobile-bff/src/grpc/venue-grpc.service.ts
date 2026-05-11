import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import CircuitBreaker from 'opossum';
import { makeBreaker } from '../breakers/registry';

interface VenueServiceClient {
  getVenue(data: { venue_id: number }): Observable<{
    id: number;
    owner_id: number;
    name: string;
    location: string;
    capacity: number;
    price_per_day: number;
    is_available: boolean;
  }>;
  checkAvailability(data: {
    venue_id: number;
    start_date: string;
    end_date: string;
  }): Observable<{ available: boolean }>;
}

export interface VenueResult {
  id: number;
  ownerId: number;
  name: string;
  location: string;
  capacity: number;
  pricePerDay: number;
  isAvailable: boolean;
}

@Injectable()
export class VenueGrpcService implements OnModuleInit {
  private venueService: VenueServiceClient;
  private getVenueBreaker: CircuitBreaker<[number], VenueResult>;
  private checkAvailabilityBreaker: CircuitBreaker<[number, string, string], boolean>;

  constructor(@Inject('VENUE_GRPC_CLIENT') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.venueService = this.client.getService<VenueServiceClient>('VenueService');

    this.getVenueBreaker = makeBreaker('venue.getVenue', (venueId: number) =>
      firstValueFrom(this.venueService.getVenue({ venue_id: venueId })).then((res) => ({
        id: res.id,
        ownerId: res.owner_id,
        name: res.name,
        location: res.location,
        capacity: res.capacity,
        pricePerDay: res.price_per_day,
        isAvailable: res.is_available,
      })),
    );

    // Konzervativni fallback: če ne moremo preveriti, raje rečemo "ni na voljo".
    this.checkAvailabilityBreaker = makeBreaker(
      'venue.checkAvailability',
      (venueId: number, startDate: string, endDate: string) =>
        firstValueFrom(
          this.venueService.checkAvailability({
            venue_id: venueId,
            start_date: startDate,
            end_date: endDate,
          }),
        ).then((res) => res.available),
      () => false,
    );
  }

  getVenue(venueId: number): Promise<VenueResult> {
    return this.getVenueBreaker.fire(venueId);
  }

  checkAvailability(venueId: number, startDate: string, endDate: string): Promise<boolean> {
    return this.checkAvailabilityBreaker.fire(venueId, startDate, endDate);
  }
}
