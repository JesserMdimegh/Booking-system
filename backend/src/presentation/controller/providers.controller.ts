import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards, InternalServerErrorException, Request } from '@nestjs/common';
import { CreateProviderUseCase } from '../../application/uses-cases/providers/create-provider.use-case';
import { GetProvidersUseCase } from '../../application/uses-cases/providers/get-providers.use-case';
import { UpdateProviderUseCase } from '../../application/uses-cases/providers/update-provider.use-case';
import { CreateProviderDto } from '../../application/dto/create-provider.dto';
import { UpdateProviderDto } from '../../application/dto/update-provider.dto';
import { RolesGuard } from '../../infrastructure/auth/roles.guard';
import { Public, Roles } from '../../infrastructure/auth/public.decorator';
import { KeycloakSyncProviderAuthGuard } from '../../infrastructure/auth/keycloak-sync-provider-auth.guard';

@UseGuards(RolesGuard, KeycloakSyncProviderAuthGuard)
@Controller('providers')
export class ProvidersController {
  constructor(
    private createProviderUseCase: CreateProviderUseCase,
    private getProvidersUseCase: GetProvidersUseCase,
    private updateProviderUseCase: UpdateProviderUseCase,
  ) { }

  @Post()
  async createProvider(@Body() data: CreateProviderDto, @Request() req: any) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const provider = await this.createProviderUseCase.execute(data, keycloakUserId);
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

  @Get('profile')
  async getCurrentProviderProfile(@Request() req: any) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    console.log("searching profile by keylaock id");
    const provider = await this.getProvidersUseCase.findByKeycloakUserId(keycloakUserId);
    if (!provider) {
      throw new Error('Provider profile not found');
    }
    return { message: 'Provider profile retrieved successfully', data: provider };
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

  @Put('profile')
  async updateCurrentProviderProfile(@Request() req: any, @Body() data: Partial<UpdateProviderDto>) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const provider = await this.getProvidersUseCase.findByKeycloakUserId(keycloakUserId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }
    
    const updatedProvider = await this.updateProviderUseCase.execute(provider.id, data);
    return { message: 'Provider profile updated successfully', data: updatedProvider };
  }

  @Post('profile/services')
  async addServiceToCurrentProviderProfile(@Request() req: any, @Body() body: { service: string }) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const provider = await this.getProvidersUseCase.findByKeycloakUserId(keycloakUserId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }
    
    const updatedProvider = await this.updateProviderUseCase.addService(provider.id, body.service);
    return { message: 'Service added successfully', data: updatedProvider };
  }

  @Delete('profile/services/:service')
  async removeServiceFromCurrentProviderProfile(@Request() req: any, @Param('service') service: string) {
    const keycloakUserId = req.user?.userId;
    if (!keycloakUserId) {
      throw new NotFoundException('User not authenticated');
    }
    
    const provider = await this.getProvidersUseCase.findByKeycloakUserId(keycloakUserId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }
    
    const updatedProvider = await this.updateProviderUseCase.removeService(provider.id, service);
    return { message: 'Service removed successfully', data: updatedProvider };
  }

  @Delete(':id')
  async deleteProvider(@Param('id') id: string) {
    await this.updateProviderUseCase.delete(id);
    return { message: 'Provider deleted successfully' };
  }
}
