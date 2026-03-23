import { Type, Static } from '@sinclair/typebox';

export const CreateReservationBody = Type.Object({
  venueId: Type.Integer({ minimum: 1 }),
  startDate: Type.String({ format: 'date', description: 'YYYY-MM-DD' }),
  endDate: Type.String({ format: 'date', description: 'YYYY-MM-DD' }),
});

export const ReservationResponse = Type.Object({
  id: Type.Integer(),
  renterId: Type.Integer(),
  venueId: Type.Integer(),
  startDate: Type.String(),
  endDate: Type.String(),
  status: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const ReservationListResponse = Type.Array(ReservationResponse);

export const ErrorResponse = Type.Object({
  statusCode: Type.Integer(),
  error: Type.String(),
  message: Type.String(),
});

export type CreateReservationBodyType = Static<typeof CreateReservationBody>;
