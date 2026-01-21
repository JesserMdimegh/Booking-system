// src/application/use-cases/appointment/cancel-appointment.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CancelAppointmentUseCase } from './cancel-appointment.use-case';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { Slot } from '../../../domain/entities/slot.entity';
import { AppointmentStatus } from '../../../domain/enums/appointment-status.enum';
import { SlotStatus } from '../../../domain/enums/slot-status.enum';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let appointmentRepository: jest.Mocked<any>;
  let slotRepository: jest.Mocked<any>;

  // Mock repositories
  const mockAppointmentRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockSlotRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelAppointmentUseCase,
        {
          provide: APPOINTMENT_REPOSITORY,
          useValue: mockAppointmentRepository,
        },
        {
          provide: SLOT_REPOSITORY,
          useValue: mockSlotRepository,
        },
      ],
    }).compile();

    useCase = module.get<CancelAppointmentUseCase>(CancelAppointmentUseCase);
    appointmentRepository = module.get(APPOINTMENT_REPOSITORY);
    slotRepository = module.get(SLOT_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const appointmentId = 'appointment-123';
    const clientId = 'client-456';
    const slotId = 'slot-789';

    let mockAppointment: any;
    let mockBookedSlot: any;

    beforeEach(() => {
      mockAppointment = {
        id: appointmentId,
        clientId: clientId,
        slotId: slotId,
        status: AppointmentStatus.CONFIRMED,
        cancel: jest.fn(),
      };

      mockBookedSlot = {
        id: slotId,
        providerId: 'provider-999',
        date: new Date('2024-01-20'),
        startTime: new Date('2024-01-20T10:00:00Z'),
        endTime: new Date('2024-01-20T11:00:00Z'),
        status: SlotStatus.BOOKED,
        release: jest.fn(),
      };
    });

    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should successfully cancel an appointment when client is authorized', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(appointmentId, clientId);

        // Assert
        expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
        expect(appointmentRepository.findById).toHaveBeenCalledTimes(1);

        expect(mockAppointment.cancel).toHaveBeenCalledTimes(1);

        expect(slotRepository.findById).toHaveBeenCalledWith(slotId);
        expect(mockBookedSlot.release).toHaveBeenCalledTimes(1);
        expect(slotRepository.update).toHaveBeenCalledWith(mockBookedSlot);

        expect(appointmentRepository.update).toHaveBeenCalledWith(mockAppointment);
        expect(appointmentRepository.update).toHaveBeenCalledTimes(1);
      });

      it('should cancel appointment even when slot is not found', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(null);
        appointmentRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(appointmentId, clientId);

        // Assert
        expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
        expect(mockAppointment.cancel).toHaveBeenCalled();
        expect(slotRepository.findById).toHaveBeenCalledWith(slotId);
        expect(appointmentRepository.update).toHaveBeenCalledWith(mockAppointment);
        expect(slotRepository.update).not.toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundException when appointment does not exist', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          NotFoundException
        );
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          'Appointment not found'
        );

        expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
        expect(appointmentRepository.update).not.toHaveBeenCalled();
        expect(slotRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException when client is not the appointment owner', async () => {
        // Arrange
        const wrongClientId = 'wrong-client-789';
        appointmentRepository.findById.mockResolvedValue(mockAppointment);

        // Act & Assert
        await expect(useCase.execute(appointmentId, wrongClientId)).rejects.toThrow(
          UnauthorizedException
        );
        await expect(useCase.execute(appointmentId, wrongClientId)).rejects.toThrow(
          'Unauthorized to cancel this appointment'
        );

        expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
        expect(mockAppointment.cancel).not.toHaveBeenCalled();
        expect(appointmentRepository.update).not.toHaveBeenCalled();
        expect(slotRepository.findById).not.toHaveBeenCalled();
      });

      it('should propagate appointment.cancel() errors', async () => {
        // Arrange
        const cancelError = new Error('Appointment is already cancelled');
        mockAppointment.cancel.mockImplementation(() => {
          throw cancelError;
        });
        appointmentRepository.findById.mockResolvedValue(mockAppointment);

        // Act & Assert
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          'Appointment is already cancelled'
        );

        expect(appointmentRepository.findById).toHaveBeenCalled();
        expect(mockAppointment.cancel).toHaveBeenCalled();
        expect(appointmentRepository.update).not.toHaveBeenCalled();
        expect(slotRepository.findById).not.toHaveBeenCalled();
      });

      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        appointmentRepository.findById.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          'Database connection failed'
        );

        expect(appointmentRepository.findById).toHaveBeenCalled();
        expect(appointmentRepository.update).not.toHaveBeenCalled();
        expect(slotRepository.update).not.toHaveBeenCalled();
      });

      it('should handle appointment update failure', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockRejectedValue(
          new Error('Failed to update appointment')
        );

        // Act & Assert
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          'Failed to update appointment'
        );

        expect(appointmentRepository.findById).toHaveBeenCalled();
        expect(mockAppointment.cancel).toHaveBeenCalled();
        expect(slotRepository.findById).toHaveBeenCalled();
        expect(mockBookedSlot.release).toHaveBeenCalled();
        expect(appointmentRepository.update).toHaveBeenCalled();
      });

      it('should handle slot update failure', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);
        slotRepository.update.mockRejectedValue(
          new Error('Failed to update slot')
        );

        // Act & Assert
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          'Failed to update slot'
        );

        expect(appointmentRepository.findById).toHaveBeenCalled();
        expect(mockAppointment.cancel).toHaveBeenCalled();
        expect(slotRepository.findById).toHaveBeenCalled();
        expect(mockBookedSlot.release).toHaveBeenCalled();
        expect(slotRepository.update).toHaveBeenCalled();
        expect(appointmentRepository.update).not.toHaveBeenCalled(); // Not called due to error
      });
    });

    describe('Input Validation', () => {
      it('should handle empty appointment ID', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute('', clientId)).rejects.toThrow(
          NotFoundException
        );

        expect(appointmentRepository.findById).toHaveBeenCalledWith('');
      });

      it('should handle empty client ID', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);

        // Act & Assert
        await expect(useCase.execute(appointmentId, '')).rejects.toThrow(
          UnauthorizedException
        );

        expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
      });

      it('should handle special characters in IDs', async () => {
        // Arrange
        const specialAppointmentId = 'appointment-!@#$%';
        const specialClientId = 'client-^&*()';
        const specialAppointment = {
          ...mockAppointment,
          id: specialAppointmentId,
          clientId: specialClientId,
        };
        
        appointmentRepository.findById.mockResolvedValue(specialAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(specialAppointmentId, specialClientId);

        // Assert
        expect(appointmentRepository.findById).toHaveBeenCalledWith(specialAppointmentId);
        expect(specialAppointment.cancel).toHaveBeenCalled();
      });
    });

    describe('Repository Interactions', () => {
      it('should call repositories in correct order', async () => {
        // Arrange
        const callOrder: string[] = [];
        
        appointmentRepository.findById.mockImplementation(async () => {
          callOrder.push('appointment.findById');
          return mockAppointment;
        });
        
        slotRepository.findById.mockImplementation(async () => {
          callOrder.push('slot.findById');
          return mockBookedSlot;
        });
        
        appointmentRepository.update.mockImplementation(async () => {
          callOrder.push('appointment.update');
        });
        
        slotRepository.update.mockImplementation(async () => {
          callOrder.push('slot.update');
        });

        // Act
        await useCase.execute(appointmentId, clientId);

        // Assert
        expect(callOrder).toEqual([
          'appointment.findById',
          'slot.findById',
          'slot.update',
          'appointment.update'
        ]);
      });

      it('should pass correct appointment to update method', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(appointmentId, clientId);

        // Assert
        expect(appointmentRepository.update).toHaveBeenCalledWith(mockAppointment);
      });

      it('should pass correct slot to update method', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(appointmentId, clientId);

        // Assert
        expect(slotRepository.update).toHaveBeenCalledWith(mockBookedSlot);
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent cancellation attempts gracefully', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act - Simulate concurrent calls
        const promises = [
          useCase.execute(appointmentId, clientId),
          useCase.execute(appointmentId, clientId),
          useCase.execute(appointmentId, clientId),
        ];

        // Assert
        await expect(Promise.all(promises)).resolves.toBeDefined();
        expect(appointmentRepository.findById).toHaveBeenCalledTimes(3);
      });

      it('should handle slot.release() errors gracefully', async () => {
        // Arrange
        const releaseError = new Error('Slot is already available');
        mockBookedSlot.release.mockImplementation(() => {
          throw releaseError;
        });
        
        appointmentRepository.findById.mockResolvedValue(mockAppointment);
        slotRepository.findById.mockResolvedValue(mockBookedSlot);
        appointmentRepository.update.mockResolvedValue(undefined);

        // Act & Assert
        await expect(useCase.execute(appointmentId, clientId)).rejects.toThrow(
          'Slot is already available'
        );

        expect(mockBookedSlot.release).toHaveBeenCalled();
        expect(appointmentRepository.update).not.toHaveBeenCalled(); // Not called due to error
        expect(slotRepository.update).not.toHaveBeenCalled();
      });
    });
  });
});
