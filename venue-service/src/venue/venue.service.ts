import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Venue } from './entities/venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectPinoLogger(VenueService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(ownerId: number, dto: CreateVenueDto): Promise<Venue> {
    this.logger.info({ ownerId }, 'Creating venue');
    const venue = this.venueRepository.create({
      ...dto,
      ownerId,
    });
    const saved = await this.venueRepository.save(venue);
    this.logger.info({ venueId: saved.id }, 'Venue created');
    return saved;
  }

  async findAll(query: QueryVenueDto): Promise<Venue[]> {
    this.logger.info({ query }, 'Fetching venues');
    const qb = this.venueRepository
      .createQueryBuilder('venue')
      .where('venue.isAvailable = :isAvailable', { isAvailable: true });

    if (query.location) {
      qb.andWhere('venue.location ILIKE :location', {
        location: `%${query.location}%`,
      });
    }

    if (query.minCapacity) {
      qb.andWhere('venue.capacity >= :minCapacity', {
        minCapacity: query.minCapacity,
      });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Venue> {
    const venue = await this.venueRepository.findOne({ where: { id } });
    if (!venue) {
      throw new NotFoundException(`Venue with id ${id} not found`);
    }
    return venue;
  }

  async update(id: number, ownerId: number, dto: UpdateVenueDto): Promise<Venue> {
    const venue = await this.findOne(id);
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this venue');
    }
    Object.assign(venue, dto);
    const saved = await this.venueRepository.save(venue);
    this.logger.info({ venueId: id }, 'Venue updated');
    return saved;
  }

  async remove(id: number, ownerId: number): Promise<void> {
    const venue = await this.findOne(id);
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this venue');
    }
    await this.venueRepository.delete(id);
    this.logger.info({ venueId: id }, 'Venue deleted');
  }
}
