import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken as getToken } from '@nestjs/typeorm';
import { VenueService } from '../src/venue/venue.service';
import { Venue } from '../src/venue/entities/venue.entity';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockVenue: Venue = {
  id: 1,
  ownerId: 10,
  name: 'Test Hall',
  description: 'A nice venue',
  location: 'Ljubljana',
  capacity: 100,
  pricePerDay: 500,
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('VenueService', () => {
  let service: VenueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenueService,
        {
          provide: getRepositoryToken(Venue),
          useValue: mockRepo,
        },
        {
          provide: 'PinoLogger:VenueService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<VenueService>(VenueService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a venue with the given ownerId', async () => {
      const dto = {
        name: 'Test Hall',
        description: 'A nice venue',
        location: 'Ljubljana',
        capacity: 100,
        pricePerDay: 500,
      };
      const created = { ...mockVenue };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(10, dto);

      expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, ownerId: 10 });
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    const buildMockQb = (venues: Venue[]) => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(venues),
    });

    it('should return all available venues with no filters', async () => {
      const qb = buildMockQb([mockVenue]);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});

      expect(qb.where).toHaveBeenCalledWith('venue.isAvailable = :isAvailable', {
        isAvailable: true,
      });
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([mockVenue]);
    });

    it('should filter by location when provided', async () => {
      const qb = buildMockQb([mockVenue]);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ location: 'Ljubljana' });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.location ILIKE :location', {
        location: '%Ljubljana%',
      });
    });

    it('should filter by minCapacity when provided', async () => {
      const qb = buildMockQb([mockVenue]);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ minCapacity: 50 });

      expect(qb.andWhere).toHaveBeenCalledWith('venue.capacity >= :minCapacity', {
        minCapacity: 50,
      });
    });
  });

  describe('findOne', () => {
    it('should return a venue when it exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockVenue);

      const result = await service.findOne(1);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockVenue);
    });

    it('should throw NotFoundException when venue does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException when caller is not the owner', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockVenue, ownerId: 10 });

      await expect(service.update(1, 99, { name: 'New Name' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update and save when caller is the owner', async () => {
      const venue = { ...mockVenue, ownerId: 10 };
      mockRepo.findOne.mockResolvedValue(venue);
      const updated = { ...venue, name: 'New Name' };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, 10, { name: 'New Name' });

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException when caller is not the owner', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockVenue, ownerId: 10 });

      await expect(service.remove(1, 99)).rejects.toThrow(ForbiddenException);
    });

    it('should delete the venue when caller is the owner', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockVenue, ownerId: 10 });
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, 10);

      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
