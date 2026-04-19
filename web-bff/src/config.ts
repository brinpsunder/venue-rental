export const config = {
  port: Number(process.env.PORT ?? 4000),
  userServiceHost: process.env.USER_SERVICE_HOST ?? 'localhost',
  userGrpcPort: process.env.USER_GRPC_PORT ?? '50051',
  userRestUrl: process.env.USER_REST_URL ?? 'http://localhost:3001',
  venueServiceHost: process.env.VENUE_SERVICE_HOST ?? 'localhost',
  venueGrpcPort: process.env.VENUE_GRPC_PORT ?? '50052',
  venueRestUrl: process.env.VENUE_REST_URL ?? 'http://localhost:3002',
  reservationRestUrl: process.env.RESERVATION_REST_URL ?? 'http://localhost:3003',
};
