import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { QueryVenueDto } from './dto/query-venue.dto';
import { OwnerAuthGuard } from '../common/guards/owner-auth.guard';

@ApiTags('venues')
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @UseGuards(OwnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a venue (owners only)' })
  create(@Request() req, @Body() dto: CreateVenueDto) {
    return this.venueService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List venues' })
  findAll(@Query() query: QueryVenueDto) {
    return this.venueService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a venue by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.venueService.findOne(id);
  }

  @Put(':id')
  @UseGuards(OwnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a venue (owner only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venueService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(OwnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a venue (owner only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.venueService.remove(id, req.user.userId);
  }
}
