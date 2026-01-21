import { Module } from '@nestjs/common';
import { PROVIDER_REPOSITORY } from '../domain/repositories/provider.repository';
import { ProvidersController } from '../presentation/controller/providers.controller';
import { PrismaModule } from 'src/shared/infrastructure/prisma.module';
import { PrismaProviderRepository } from '../infrastructure/repositories/prisma-provider.repository';
import { CreateProviderUseCase } from '../application/uses-cases/providers/create-provider.use-case';
import { GetProvidersUseCase } from '../application/uses-cases/providers/get-providers.use-case';
import { UpdateProviderUseCase } from '../application/uses-cases/providers/update-provider.use-case';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PROVIDER_REPOSITORY,
      useClass: PrismaProviderRepository,
    },
    CreateProviderUseCase,
    GetProvidersUseCase,
    UpdateProviderUseCase,
  ],
  controllers: [ProvidersController],
  exports: [PROVIDER_REPOSITORY],
})
export class ProvidersModule {}
