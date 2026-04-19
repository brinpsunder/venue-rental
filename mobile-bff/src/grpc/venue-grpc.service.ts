import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

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

  constructor(@Inject('VENUE_GRPC_CLIENT') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.venueService = this.client.getService<VenueServiceClient>('VenueService');
  }

  async getVenue(venueId: number): Promise<VenueResult> {
    const res = await firstValueFrom(this.venueService.getVenue({ venue_id: venueId }));
    return {
      id: res.id,
      ownerId: res.owner_id,
      name: res.name,
      location: res.location,
      capacity: res.capacity,
      pricePerDay: res.price_per_day,
      isAvailable: res.is_available,
    };
  }

  async checkAvailability(venueId: number, startDate: string, endDate: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.venueService.checkAvailability({
        venue_id: venueId,
        start_date: startDate,
        end_date: endDate,
      }),
    );
    return res.available;
  }
}
