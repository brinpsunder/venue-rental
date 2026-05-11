import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { makeBreaker } from '../breakers/registry';

const USER_PROTO_PATH = join(__dirname, '..', 'proto', 'user.proto');
const VENUE_PROTO_PATH = join(__dirname, '..', 'proto', 'venue.proto');

const userPackageDef = protoLoader.loadSync(USER_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const venuePackageDef = protoLoader.loadSync(VENUE_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto: any = grpc.loadPackageDefinition(userPackageDef);
const venueProto: any = grpc.loadPackageDefinition(venuePackageDef);

const userHost = `${process.env.USER_SERVICE_HOST ?? 'localhost'}:${process.env.USER_GRPC_PORT ?? '50051'}`;
const venueHost = `${process.env.VENUE_SERVICE_HOST ?? 'localhost'}:${process.env.VENUE_GRPC_PORT ?? '50052'}`;

const userClient = new userProto.user.UserService(userHost, grpc.credentials.createInsecure());
const venueClient = new venueProto.venue.VenueService(venueHost, grpc.credentials.createInsecure());

export interface VerifyTokenResult {
  valid: boolean;
  userId: number;
  email: string;
  role: string;
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

function verifyTokenRaw(token: string): Promise<VerifyTokenResult> {
  return new Promise((resolve, reject) => {
    userClient.VerifyToken({ token }, (err: any, response: any) => {
      if (err) return reject(err);
      resolve({
        valid: response.valid,
        userId: response.user_id,
        email: response.email,
        role: response.role,
      });
    });
  });
}

function getVenueRaw(venueId: number): Promise<VenueResult> {
  return new Promise((resolve, reject) => {
    venueClient.GetVenue({ venue_id: venueId }, (err: any, response: any) => {
      if (err) return reject(err);
      resolve({
        id: response.id,
        ownerId: response.owner_id,
        name: response.name,
        location: response.location,
        capacity: response.capacity,
        pricePerDay: response.price_per_day,
        isAvailable: response.is_available,
      });
    });
  });
}

function checkAvailabilityRaw(venueId: number, startDate: string, endDate: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    venueClient.CheckAvailability(
      { venue_id: venueId, start_date: startDate, end_date: endDate },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response.available);
      },
    );
  });
}

// Brez fallbackov: rezervacija je kritičen poslovni proces, kjer raje
// vrnemo napako (5xx) kot da tiho izumimo podatke. Breaker tu skrbi za
// fast-fail in zaščito pred kaskadno odpovedjo, ne pa za graceful degradation.
const verifyTokenBreaker      = makeBreaker('user.verifyToken',      verifyTokenRaw);
const getVenueBreaker         = makeBreaker('venue.getVenue',        getVenueRaw);
const checkAvailabilityBreaker = makeBreaker('venue.checkAvailability', checkAvailabilityRaw);

export const verifyToken = (token: string) => verifyTokenBreaker.fire(token);
export const getVenue = (venueId: number) => getVenueBreaker.fire(venueId);
export const checkAvailability = (venueId: number, startDate: string, endDate: string) =>
  checkAvailabilityBreaker.fire(venueId, startDate, endDate);
