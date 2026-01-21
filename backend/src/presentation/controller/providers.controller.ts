import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { CreateProviderUseCase } from '../../application/uses-cases/providers/create-provider.use-case';
import { GetProvidersUseCase } from '../../application/uses-cases/providers/get-providers.use-case';
import { UpdateProviderUseCase } from '../../application/uses-cases/providers/update-provider.use-case';
import { CreateProviderDto } from '../../application/dto/create-provider.dto';
import { UpdateProviderDto } from '../../application/dto/update-provider.dto';
import { RolesGuard } from '../../infrastructure/auth/roles.guard';
import { Public, Roles } from '../../infrastructure/auth/public.decorator';

@UseGuards(RolesGuard)
@Controller('providers')
export class ProvidersController {
  constructor(
    private createProviderUseCase: CreateProviderUseCase,
    private getProvidersUseCase: GetProvidersUseCase,
    private updateProviderUseCase: UpdateProviderUseCase,
  ) { }

  @Public()
  @Post()
  async createProvider(@Body() data: CreateProviderDto) {
    const provider = await this.createProviderUseCase.execute(data);
    return { message: 'Provider created successfully', data: provider };
  }

  @Public()
  @Get()
  async getAllProviders() {
    const providers = await this.getProvidersUseCase.getAll();
    if (!providers || providers.length === 0) {
      return { message: 'No providers found', data: [] };
    }
    return { message: 'Providers retrieved successfully', data: providers };
  }

  @Get(':id')
  async getProviderById(@Param('id') id: string) {
    const provider = await this.getProvidersUseCase.getById(id);
    return { message: 'Provider retrieved successfully', data: provider };
  }

  @Get('service/:service')
  async getProvidersByService(@Param('service') service: string) {
    const providers = await this.getProvidersUseCase.getByService(service);
    if (!providers || providers.length === 0) {
      return { message: 'No providers found for this service', data: [] };
    }
    return { message: 'Providers retrieved successfully', data: providers };
  }

  @Get('email/:email')
  async getProviderByEmail(@Param('email') email: string) {
    const provider = await this.getProvidersUseCase.findByEmail(email);
    return { message: 'Provider retrieved successfully', data: provider };
  }

  @Get(':id/appointments')
  async getProviderAppointments(@Param('id') id: string) {
    const appointments = await this.getProvidersUseCase.getProviderAppointments(id);
    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found for this provider', data: [] };
    }
    return { message: 'Provider appointments retrieved successfully', data: appointments };
  }

  @Get(':id/slots')
  async getProviderSlots(@Param('id') id: string) {
    const slots = await this.getProvidersUseCase.getProviderSlots(id);
    if (!slots || slots.length === 0) {
      return { message: 'No slots found for this provider', data: [] };
    }
    return { message: 'Provider slots retrieved successfully', data: slots };
  }

  @Delete(':id')
  async deleteProvider(@Param('id') id: string) {
    await this.updateProviderUseCase.delete(id);
    return { message: 'Provider deleted successfully' };
  }
}
