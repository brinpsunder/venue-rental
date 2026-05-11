import { Controller, Get } from '@nestjs/common';
import { snapshot } from '../breakers/registry';

@Controller('admin')
export class AdminController {
  @Get('breakers')
  breakers() {
    return { service: 'mobile-bff', breakers: snapshot() };
  }
}
