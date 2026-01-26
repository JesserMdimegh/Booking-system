import { Controller, Post, Get, Delete, Put, Body, Param, Query } from '@nestjs/common';
import { CreateSlotDto } from '../../application/dto/create-slot.dto';
import { UpdateSlotDto } from '../../application/dto/update-slot.dto';
import { CreateSlotUseCase } from 'src/application/uses-cases/slots/create-slot.use-case';
import { GetSlotsUseCase } from 'src/application/uses-cases/slots/get-slots.use-case';
import { Public } from 'src/infrastructure/auth/public.decorator';

@Controller('slots')
@Public()
export class SlotsController {
  constructor(
    private createSlotUseCase: CreateSlotUseCase,
    private getSlotsUseCase: GetSlotsUseCase,
  ) {}

  @Post()
  async create(@Body() input: CreateSlotDto) {
    const slot = await this.createSlotUseCase.execute(input);
    return { message: 'Slot created successfully', data: slot };
  }

  @Get('provider/:providerId')
  async getByProvider(@Param('providerId') providerId: string) {
    const slots = await this.getSlotsUseCase.executeByProviderId(providerId);
    return { message: 'Slots retrieved successfully', data: slots };
  }

  @Get(':id')
  async getSlotById(@Param('id') id: string) {
    const slot = await this.getSlotsUseCase.executeById(id);
    return { message: 'Slot retrieved successfully', data: slot };
  }

  @Get('available/:providerId')
  async getAvailableSlots(@Param('providerId') providerId: string, @Query('date') date?: string) {
    const slots = date 
      ? await this.getSlotsUseCase.executeAvailableByProviderAndDate(providerId, new Date(date))
      : await this.getSlotsUseCase.executeAvailableByProvider(providerId);
    
    if (!slots || slots.length === 0) {
      return { message: 'No available slots found', data: [] };
    }
    return { message: 'Available slots retrieved successfully', data: slots };
  }

  @Put(':id')
  async updateSlot(@Param('id') id: string, @Body() data: UpdateSlotDto) {
    const slot = await this.getSlotsUseCase.updateSlot(id, data);
    return { message: 'Slot updated successfully', data: slot };
  }

  @Delete(':id')
  async deleteSlot(@Param('id') id: string) {
    await this.getSlotsUseCase.deleteSlot(id);
    return { message: 'Slot deleted successfully' };
  }
}
