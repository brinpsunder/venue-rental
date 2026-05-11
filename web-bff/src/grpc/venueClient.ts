import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { config } from '../config';
import { makeBreaker } from '../breakers/registry';

const VENUE_PROTO_PATH = join(__dirname, '..', 'proto', 'venue.proto');

const venuePackageDef = protoLoader.loadSync(VENUE_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const venueProto: any = grpc.loadPackageDefinition(venuePackageDef);

const client = new venueProto.venue.VenueService(
  `${config.venueServiceHost}:${config.venueGrpcPort}`,
  grpc.credentials.createInsecure(),
);

export interface VenueResult {
  id: number;
  ownerId: number;
  name: string;
  location: string;
  capacity: number;
  pricePerDay: number;
  isAvailable: boolean;
}

function getVenueRaw(venueId: number): Promise<VenueResult> {
  return new Promise((resolve, reject) => {
    client.GetVenue({ venue_id: venueId }, (err: any, response: any) => {
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

function checkAvailabilityRaw(
  venueId: number,
  startDate: string,
  endDate: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    client.CheckAvailability(
      { venue_id: venueId, start_date: startDate, end_date: endDate },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response.available);
      },
    );
  });
}

// Brez fallbacka: pridobivanje detajlov prostora je primarna pot.
const getVenueBreaker = makeBreaker('venue.getVenue', getVenueRaw);

// Fallback: če preverjanje razpoložljivosti ni dosegljivo, raje vrnemo
// "ni razpoložljivo", da uporabnik ne dobi false confirma.
const checkAvailabilityBreaker = makeBreaker(
  'venue.checkAvailability',
  checkAvailabilityRaw,
  () => false,
);

export const getVenue = (venueId: number) => getVenueBreaker.fire(venueId);
export const checkAvailability = (venueId: number, startDate: string, endDate: string) =>
  checkAvailabilityBreaker.fire(venueId, startDate, endDate);
