import { ReservationService } from '../src/services/reservation.service';

const mockReservation = {
  id: 1,
  renter_id: 42,
  venue_id: 5,
  start_date: '2026-04-01',
  end_date: '2026-04-03',
  status: 'PENDING',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockRepo = {
  createReservation: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  updateStatus: jest.fn(),
};

const mockPublish = jest.fn();

const mockGrpc = {
  verifyToken: jest.fn(),
  getVenue: jest.fn(),
  checkAvailability: jest.fn(),
};

function buildService() {
  return new ReservationService(mockRepo as any, mockPublish, mockGrpc);
}

beforeEach(() => jest.clearAllMocks());

const RENTER_TOKEN = 'renter-token';
const OWNER_TOKEN = 'owner-token';

const renterUser = { valid: true, userId: 42, email: 'renter@test.com', role: 'RENTER' };
const ownerUser = { valid: true, userId: 10, email: 'owner@test.com', role: 'OWNER' };

describe('ReservationService', () => {
  describe('createReservation', () => {
    it('should create a reservation and publish event', async () => {
      mockGrpc.verifyToken.mockResolvedValue(renterUser);
      mockGrpc.getVenue.mockResolvedValue({ id: 5, isAvailable: true });
      mockGrpc.checkAvailability.mockResolvedValue(true);
      mockRepo.createReservation.mockResolvedValue(mockReservation);
      mockPublish.mockResolvedValue(undefined);

      const service = buildService();
      const result = await service.createReservation(RENTER_TOKEN, {
        venueId: 5,
        startDate: '2026-04-01',
        endDate: '2026-04-03',
      });

      expect(mockRepo.createReservation).toHaveBeenCalledWith({
        renterId: 42,
        venueId: 5,
        startDate: '2026-04-01',
        endDate: '2026-04-03',
      });
      expect(mockPublish).toHaveBeenCalledWith('reservation.created', expect.objectContaining({ reservationId: 1 }));
      expect(result).toEqual(mockReservation);
    });

    it('should throw 403 if user is not a RENTER', async () => {
      mockGrpc.verifyToken.mockResolvedValue(ownerUser);

      const service = buildService();
      await expect(
        service.createReservation(OWNER_TOKEN, { venueId: 5, startDate: '2026-04-01', endDate: '2026-04-03' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 401 if token is invalid', async () => {
      mockGrpc.verifyToken.mockResolvedValue({ valid: false, userId: 0, email: '', role: '' });

      const service = buildService();
      await expect(
        service.createReservation('bad-token', { venueId: 5, startDate: '2026-04-01', endDate: '2026-04-03' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('getReservation', () => {
    it('should return a reservation when found', async () => {
      mockGrpc.verifyToken.mockResolvedValue(renterUser);
      mockRepo.findById.mockResolvedValue(mockReservation);

      const service = buildService();
      const result = await service.getReservation(RENTER_TOKEN, 1);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReservation);
    });

    it('should throw 404 when reservation not found', async () => {
      mockGrpc.verifyToken.mockResolvedValue(renterUser);
      mockRepo.findById.mockResolvedValue(null);

      const service = buildService();
      await expect(service.getReservation(RENTER_TOKEN, 99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a PENDING reservation and publish event', async () => {
      mockGrpc.verifyToken.mockResolvedValue(ownerUser);
      mockRepo.findById.mockResolvedValue({ ...mockReservation, status: 'PENDING' });
      const confirmed = { ...mockReservation, status: 'CONFIRMED' };
      mockRepo.updateStatus.mockResolvedValue(confirmed);
      mockPublish.mockResolvedValue(undefined);

      const service = buildService();
      const result = await service.confirmReservation(OWNER_TOKEN, 1);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(1, 'CONFIRMED');
      expect(mockPublish).toHaveBeenCalledWith('reservation.confirmed', expect.objectContaining({ reservationId: 1 }));
      expect(result.status).toBe('CONFIRMED');
    });

    it('should throw 404 if reservation not found', async () => {
      mockGrpc.verifyToken.mockResolvedValue(ownerUser);
      mockRepo.findById.mockResolvedValue(null);

      const service = buildService();
      await expect(service.confirmReservation(OWNER_TOKEN, 99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation and publish event', async () => {
      mockGrpc.verifyToken.mockResolvedValue(renterUser);
      mockRepo.findById.mockResolvedValue({ ...mockReservation, status: 'PENDING' });
      const cancelled = { ...mockReservation, status: 'CANCELLED' };
      mockRepo.updateStatus.mockResolvedValue(cancelled);
      mockPublish.mockResolvedValue(undefined);

      const service = buildService();
      const result = await service.cancelReservation(RENTER_TOKEN, 1);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(1, 'CANCELLED');
      expect(mockPublish).toHaveBeenCalledWith('reservation.cancelled', expect.any(Object));
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw 409 if reservation is already cancelled', async () => {
      mockGrpc.verifyToken.mockResolvedValue(renterUser);
      mockRepo.findById.mockResolvedValue({ ...mockReservation, status: 'CANCELLED' });

      const service = buildService();
      await expect(service.cancelReservation(RENTER_TOKEN, 1)).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
