import { Controller, Get, Post, Put, Param, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { CreateProviderUseCase } from '../../application/uses-cases/providers/create-provider.use-case';
import { GetProvidersUseCase } from '../../application/uses-cases/providers/get-providers.use-case';
import { UpdateProviderUseCase } from '../../application/uses-cases/providers/update-provider.use-case';
import { CreateProviderDto } from '../../application/dto/create-provider.dto';
import { UpdateProviderDto } from '../../application/dto/update-provider.dto';
import { RolesGuard } from 'src/infrastructure/auth/roles.guard';
import { Public, Roles } from 'src/infrastructure/auth/public.decorator';

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
    try {
      const provider = await this.createProviderUseCase.execute(data);
      return { message: 'Provider created successfully', data: provider };
    } catch (error) {
      throw new NotFoundException(`Failed to create provider: ${error.message}`);
    }
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
    try {
      const provider = await this.getProvidersUseCase.getById(id);
      if (!provider) {
        throw new NotFoundException('Provider not found');
      }
      return { message: 'Provider retrieved successfully', data: provider };
    } catch (error) {
      throw new NotFoundException(`Failed to retrieve provider: ${error.message}`);
    }
  }

  @Get('service/:service')
  async getProvidersByService(@Param('service') service: string) {
    try {
      const providers = await this.getProvidersUseCase.getByService(service);
      if (!providers || providers.length === 0) {
        return { message: 'No providers found for this service', data: [] };
      }
      return { message: 'Providers retrieved successfully', data: providers };
    } catch (error) {
      throw new NotFoundException(`Failed to retrieve providers: ${error.message}`);
    }
  }

  @Get('email/:email')
  async getProviderByEmail(@Param('email') email: string) {
    try {
      const provider = await this.getProvidersUseCase.findByEmail(email);
      if (!provider) {
        throw new NotFoundException('Provider not found');
      }
      return { message: 'Provider retrieved successfully', data: provider };
    } catch (error) {
      throw new NotFoundException(`Failed to retrieve provider: ${error.message}`);
    }
  }

  @Put(':id')
  async updateProvider(@Param('id') id: string, @Body() data: UpdateProviderDto) {
    try {
      const provider = await this.updateProviderUseCase.execute(id, data);
      return { message: 'Provider updated successfully', data: provider };
    } catch (error) {
      throw new NotFoundException(`Failed to update provider: ${error.message}`);
    }
  }
}
