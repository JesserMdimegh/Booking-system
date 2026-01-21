import { Module } from '@nestjs/common';
import { CLIENT_REPOSITORY } from '../domain/repositories/client.repository';
import { ClientsController } from '../presentation/controller/clients.controller';
import { PrismaModule } from 'src/shared/infrastructure/prisma.module';
import { PrismaClientRepository } from '../infrastructure/repositories/prisma-client.repository';
import { CreateClientUseCase } from '../application/uses-cases/clients/create-client.use-case';
import { GetClientsUseCase } from '../application/uses-cases/clients/get-clients.use-case';
import { UpdateClientUseCase } from '../application/uses-cases/clients/update-client.use-case';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
    CreateClientUseCase,
    GetClientsUseCase,
    UpdateClientUseCase,
  ],
  controllers: [ClientsController],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}
