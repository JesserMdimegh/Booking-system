// src/application/use-cases/appointment/create-appointment.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAppointmentUseCase } from './create-appointment.use-case';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { Slot } from '../../../domain/entities/slot.entity';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;
  let appointmentRepository: jest.Mocked<any>;
  let slotRepository: jest.Mocked<any>;

  // Mock repositories
  const mockAppointmentRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSlotRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentUseCase,
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

    useCase = module.get<CreateAppointmentUseCase>(CreateAppointmentUseCase);
    appointmentRepository = module.get(APPOINTMENT_REPOSITORY);
    slotRepository = module.get(SLOT_REPOSITORY);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput: CreateAppointmentDto = {
      clientId: 'client-123',
      slotId: 'slot-456',
    };

    const mockAvailableSlot = {
      id: 'slot-456',
      doctorId: 'doctor-789',
      startTime: new Date('2024-01-20T10:00:00Z'),
      endTime: new Date('2024-01-20T11:00:00Z'),
      status: 'available',
      isAvailable: jest.fn().mockReturnValue(true),
      book: jest.fn(),
    } as unknown as Slot;

    const mockBookedSlot = {
      id: 'slot-456',
      doctorId: 'doctor-789',
      startTime: new Date('2024-01-20T10:00:00Z'),
      endTime: new Date('2024-01-20T11:00:00Z'),
      status: 'booked',
      isAvailable: jest.fn().mockReturnValue(false),
      book: jest.fn(),
    } as unknown as Slot;

    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should successfully create an appointment when slot is available', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(slotRepository.findById).toHaveBeenCalledWith('slot-456');
        expect(slotRepository.findById).toHaveBeenCalledTimes(1);

        expect(mockAvailableSlot.isAvailable).toHaveBeenCalled();
        expect(mockAvailableSlot.book).toHaveBeenCalled();

        expect(appointmentRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            clientId: 'client-123',
            slotId: 'slot-456',
          })
        );
        expect(appointmentRepository.create).toHaveBeenCalledTimes(1);

        expect(slotRepository.update).toHaveBeenCalledWith(mockAvailableSlot);
        expect(slotRepository.update).toHaveBeenCalledTimes(1);

        expect(result).toBeInstanceOf(Appointment);
        expect(result.id).toBe('mocked-uuid-1234');
        expect(result.clientId).toBe('client-123');
        expect(result.slotId).toBe('slot-456');
      });

      it('should generate unique appointment ID using uuid', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(result.id).toBe('mocked-uuid-1234');
      });

      it('should call slot.book() to mark slot as booked', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(mockAvailableSlot.book).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundException when slot does not exist', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          NotFoundException
        );
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Slot not found'
        );

        expect(slotRepository.findById).toHaveBeenCalledWith('slot-456');
        expect(appointmentRepository.create).not.toHaveBeenCalled();
        expect(slotRepository.update).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when slot is not available', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockBookedSlot);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          BadRequestException
        );
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Slot is not available'
        );

        expect(slotRepository.findById).toHaveBeenCalledWith('slot-456');
        expect(mockBookedSlot.isAvailable).toHaveBeenCalled();
        expect(appointmentRepository.create).not.toHaveBeenCalled();
        expect(slotRepository.update).not.toHaveBeenCalled();
      });

      it('should not create appointment if slot is already booked', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockBookedSlot);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow();

        expect(appointmentRepository.create).not.toHaveBeenCalled();
        expect(mockBookedSlot.book).not.toHaveBeenCalled();
        expect(slotRepository.update).not.toHaveBeenCalled();
      });

      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        slotRepository.findById.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Database connection failed'
        );

        expect(appointmentRepository.create).not.toHaveBeenCalled();
        expect(slotRepository.update).not.toHaveBeenCalled();
      });

      it('should handle appointment creation failure', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockRejectedValue(
          new Error('Failed to create appointment')
        );

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Failed to create appointment'
        );

        expect(slotRepository.findById).toHaveBeenCalled();
        expect(appointmentRepository.create).toHaveBeenCalled();
        expect(slotRepository.update).not.toHaveBeenCalled();
      });

      it('should handle slot update failure', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockRejectedValue(
          new Error('Failed to update slot')
        );

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Failed to update slot'
        );

        expect(slotRepository.findById).toHaveBeenCalled();
        expect(appointmentRepository.create).toHaveBeenCalled();
        expect(slotRepository.update).toHaveBeenCalled();
      });
    });

    describe('Input Validation', () => {
      it('should handle empty clientId', async () => {
        // Arrange
        const invalidInput: CreateAppointmentDto = {
          clientId: '',
          slotId: 'slot-456',
        };
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        const result = await useCase.execute(invalidInput);

        // Assert
        expect(result.clientId).toBe('');
      });

      it('should handle special characters in IDs', async () => {
        // Arrange
        const specialInput: CreateAppointmentDto = {
          clientId: 'client-!@#$%',
          slotId: 'slot-^&*()',
        };
        const specialSlot = { ...mockAvailableSlot, id: 'slot-^&*()' };
        slotRepository.findById.mockResolvedValue(specialSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        const result = await useCase.execute(specialInput);

        // Assert
        expect(result.clientId).toBe('client-!@#$%');
        expect(result.slotId).toBe('slot-^&*()');
      });
    });

    describe('Repository Interactions', () => {
      it('should call repositories in correct order', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        const callOrder: string[] = [];
        slotRepository.findById.mockImplementation(async () => {
          callOrder.push('findById');
          return mockAvailableSlot;
        });
        appointmentRepository.create.mockImplementation(async () => {
          callOrder.push('create');
        });
        slotRepository.update.mockImplementation(async () => {
          callOrder.push('update');
        });

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(callOrder).toEqual(['findById', 'create', 'update']);
      });

      it('should pass correct slot to update method', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(slotRepository.update).toHaveBeenCalledWith(mockAvailableSlot);
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent booking attempts gracefully', async () => {
        // Arrange
        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act - Simulate concurrent calls
        const promises = [
          useCase.execute(validInput),
          useCase.execute(validInput),
          useCase.execute(validInput),
        ];

        // Assert
        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);
        expect(slotRepository.findById).toHaveBeenCalledTimes(3);
      });

      it('should create appointments with different UUIDs for different calls', async () => {
        // Arrange
        const uuid = require('uuid');
        (uuid.v4 as jest.Mock)
          .mockReturnValueOnce('uuid-1')
          .mockReturnValueOnce('uuid-2');

        slotRepository.findById.mockResolvedValue(mockAvailableSlot);
        appointmentRepository.create.mockResolvedValue(undefined);
        slotRepository.update.mockResolvedValue(undefined);

        // Act
        const result1 = await useCase.execute(validInput);
        const result2 = await useCase.execute(validInput);

        // Assert
        expect(result1.id).toBe('uuid-1');
        expect(result2.id).toBe('uuid-2');
      });
    });
  });
});