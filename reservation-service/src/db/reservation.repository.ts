import { query } from './database';

export interface Reservation {
  id: number;
  renter_id: number;
  venue_id: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReservationData {
  renterId: number;
  venueId: number;
  startDate: string;
  endDate: string;
}

export interface ReservationFilters {
  renterId?: number;
  venueId?: number;
}

export async function createReservation(data: CreateReservationData): Promise<Reservation> {
  const result = await query(
    `INSERT INTO reservations (renter_id, venue_id, start_date, end_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.renterId, data.venueId, data.startDate, data.endDate],
  );
  return result.rows[0];
}

export async function findById(id: number): Promise<Reservation | null> {
  const result = await query('SELECT * FROM reservations WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findAll(filters: ReservationFilters): Promise<Reservation[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.renterId !== undefined) {
    params.push(filters.renterId);
    conditions.push(`renter_id = $${params.length}`);
  }
  if (filters.venueId !== undefined) {
    params.push(filters.venueId);
    conditions.push(`venue_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(`SELECT * FROM reservations ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}

export async function updateStatus(id: number, status: string): Promise<Reservation | null> {
  const result = await query(
    `UPDATE reservations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return result.rows[0] ?? null;
}
