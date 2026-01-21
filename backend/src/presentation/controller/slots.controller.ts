import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { CreateSlotDto } from '../../application/dto/create-slot.dto';
import { CreateSlotUseCase } from 'src/application/uses-cases/slots/create-slot.use-case';
import { GetSlotsUseCase } from 'src/application/uses-cases/slots/get-slots.use-case';

@Controller('slots')
export class SlotsController {
  constructor(
    private createSlotUseCase: CreateSlotUseCase,
    private getSlotsUseCase: GetSlotsUseCase,
  ) {}

  @Post()
  async create(@Body() input: CreateSlotDto) {
    return this.createSlotUseCase.execute(input);
  }

  @Get('provider/:providerId')
  async getByProvider(@Param('providerId') providerId: string) {
    return this.getSlotsUseCase.executeByProviderId(providerId);
  }

  @Get('provider/:providerId/date')
  async getByProviderAndDate(
    @Param('providerId') providerId: string,
    @Query('date') date: string,
  ) {
    return this.getSlotsUseCase.executeByProviderAndDate(providerId, new Date(date));
  }
}
