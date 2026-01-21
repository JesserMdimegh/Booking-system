import { Module } from '@nestjs/common';
import { SLOT_REPOSITORY } from '../domain/repositories/slot.repository';
import { SlotsController } from 'src/presentation/controller/slots.controller';
import { PrismaModule } from 'src/shared/infrastructure/prisma.module';
import { PrismaSlotRepository } from 'src/infrastructure/repositories/prisma-slot.repository';
import { CreateSlotUseCase } from 'src/application/uses-cases/slots/create-slot.use-case';
import { GetSlotsUseCase } from 'src/application/uses-cases/slots/get-slots.use-case';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: SLOT_REPOSITORY,
      useClass: PrismaSlotRepository,
    },
    CreateSlotUseCase,
    GetSlotsUseCase,
  ],
  controllers: [SlotsController],
  exports: [SLOT_REPOSITORY, CreateSlotUseCase, GetSlotsUseCase],
})
export class SlotsModule {}
