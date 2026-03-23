import * as repo from '../db/reservation.repository';
import { publishEvent } from '../messaging/publisher';
import { verifyToken, getVenue, checkAvailability, VerifyTokenResult } from '../grpc/grpc-client';

export class ReservationService {
  constructor(
    private readonly repository = repo,
    private readonly publish = publishEvent,
    private readonly grpc = { verifyToken, getVenue, checkAvailability },
  ) {}

  async authenticate(token: string): Promise<VerifyTokenResult> {
    const result = await this.grpc.verifyToken(token);
    if (!result.valid) {
      throw Object.assign(new Error('Invalid or expired token'), { statusCode: 401 });
    }
    return result;
  }

  async createReservation(token: string, data: { venueId: number; startDate: string; endDate: string }) {
    const user = await this.authenticate(token);

    if (user.role !== 'RENTER') {
      throw Object.assign(new Error('Only renters can create reservations'), { statusCode: 403 });
    }

    const venue = await this.grpc.getVenue(data.venueId);
    if (!venue.isAvailable) {
      throw Object.assign(new Error('Venue is not available'), { statusCode: 409 });
    }

    const available = await this.grpc.checkAvailability(data.venueId, data.startDate, data.endDate);
    if (!available) {
      throw Object.assign(new Error('Venue is not available for the selected dates'), { statusCode: 409 });
    }

    const reservation = await this.repository.createReservation({
      renterId: user.userId,
      venueId: data.venueId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    await this.publish('reservation.created', { reservationId: reservation.id, renterId: user.userId, venueId: data.venueId });

    return reservation;
  }

  async getReservation(token: string, id: number) {
    await this.authenticate(token);
    const reservation = await this.repository.findById(id);
    if (!reservation) {
      throw Object.assign(new Error(`Reservation ${id} not found`), { statusCode: 404 });
    }
    return reservation;
  }

  async listReservations(token: string, filters: { renterId?: number; venueId?: number }) {
    await this.authenticate(token);
    return this.repository.findAll(filters);
  }

  async confirmReservation(token: string, id: number) {
    const user = await this.authenticate(token);

    const reservation = await this.repository.findById(id);
    if (!reservation) {
      throw Object.assign(new Error(`Reservation ${id} not found`), { statusCode: 404 });
    }

    if (reservation.status !== 'PENDING') {
      throw Object.assign(new Error('Only PENDING reservations can be confirmed'), { statusCode: 409 });
    }

    const updated = await this.repository.updateStatus(id, 'CONFIRMED');
    await this.publish('reservation.confirmed', { reservationId: id, confirmedBy: user.userId });
    return updated;
  }

  async cancelReservation(token: string, id: number) {
    const user = await this.authenticate(token);

    const reservation = await this.repository.findById(id);
    if (!reservation) {
      throw Object.assign(new Error(`Reservation ${id} not found`), { statusCode: 404 });
    }

    if (reservation.status === 'CANCELLED') {
      throw Object.assign(new Error('Reservation is already cancelled'), { statusCode: 409 });
    }

    const updated = await this.repository.updateStatus(id, 'CANCELLED');
    await this.publish('reservation.cancelled', { reservationId: id, cancelledBy: user.userId });
    return updated;
  }
}
