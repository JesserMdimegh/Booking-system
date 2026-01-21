// src/application/use-cases/appointment/list-appointments.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ListAppointmentsUseCase } from './list-appointments.use-case';
import { APPOINTMENT_REPOSITORY } from '../../../domain/repositories/appointment.repository';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../../domain/enums/appointment-status.enum';

describe('ListAppointmentsUseCase', () => {
  let useCase: ListAppointmentsUseCase;
  let appointmentRepository: jest.Mocked<any>;
  let slotRepository: jest.Mocked<any>;

  // Mock repositories
  const mockAppointmentRepository = {
    getAll: jest.fn(),
    findById: jest.fn(),
    findByClientId: jest.fn(),
    findByProviderId: jest.fn(),
    findByDateRange: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSlotRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListAppointmentsUseCase,
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

    useCase = module.get<ListAppointmentsUseCase>(ListAppointmentsUseCase);
    appointmentRepository = module.get(APPOINTMENT_REPOSITORY);
    slotRepository = module.get(SLOT_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should return all appointments when execute() is called', async () => {
        // Arrange
        const mockAppointments = [
          {
            id: 'appointment-1',
            clientId: 'client-1',
            slotId: 'slot-1',
            status: AppointmentStatus.CONFIRMED,
          },
          {
            id: 'appointment-2',
            clientId: 'client-2',
            slotId: 'slot-2',
            status: AppointmentStatus.CANCELLED,
          },
        ] as Appointment[];

        appointmentRepository.getAll.mockResolvedValue(mockAppointments);

        // Act
        const result = await useCase.execute();

        // Assert
        expect(appointmentRepository.getAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockAppointments);
        expect(result).toHaveLength(2);
      });

      it('should return empty array when no appointments exist', async () => {
        // Arrange
        appointmentRepository.getAll.mockResolvedValue([]);

        // Act
        const result = await useCase.execute();

        // Assert
        expect(appointmentRepository.getAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        appointmentRepository.getAll.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.execute()).rejects.toThrow('Database connection failed');
        expect(appointmentRepository.getAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('executeById', () => {
    const appointmentId = 'appointment-123';

    it('should return appointment when found by ID', async () => {
      // Arrange
      const mockAppointment = {
        id: appointmentId,
        clientId: 'client-456',
        slotId: 'slot-789',
        status: AppointmentStatus.CONFIRMED,
      } as Appointment;

      appointmentRepository.findById.mockResolvedValue(mockAppointment);

      // Act
      const result = await useCase.executeById(appointmentId);

      // Assert
      expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
      expect(appointmentRepository.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAppointment);
      expect(result.id).toBe(appointmentId);
    });

    it('should throw NotFoundException when appointment is not found by ID', async () => {
      // Arrange
      appointmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.executeById(appointmentId)).rejects.toThrow(NotFoundException);

      expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
    });

    describe('Input Validation', () => {
      it('should handle empty appointment ID', async () => {
        // Arrange
        appointmentRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.executeById('')).rejects.toThrow(
          NotFoundException
        );

        expect(appointmentRepository.findById).toHaveBeenCalledWith('');
      });

      it('should handle special characters in appointment ID', async () => {
        // Arrange
        const specialId = 'appointment-!@#$%';
        const mockAppointment = {
          id: specialId,
          clientId: 'client-456',
          slotId: 'slot-789',
          status: AppointmentStatus.CONFIRMED,
        } as Appointment;

        appointmentRepository.findById.mockResolvedValue(mockAppointment);

        // Act
        const result = await useCase.executeById(specialId);

        // Assert
        expect(appointmentRepository.findById).toHaveBeenCalledWith(specialId);
        expect(result.id).toBe(specialId);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        appointmentRepository.findById.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.executeById(appointmentId)).rejects.toThrow(
          'Database connection failed'
        );

        expect(appointmentRepository.findById).toHaveBeenCalledWith(appointmentId);
      });
    });
  });

  describe('executeByClientId', () => {
    const clientId = 'client-456';

    it('should return appointments when found by client ID', async () => {
      // Arrange
      const mockAppointments = [
        {
          id: 'appointment-1',
          clientId: clientId,
          slotId: 'slot-1',
          status: AppointmentStatus.CONFIRMED,
        },
        {
          id: 'appointment-2',
          clientId: clientId,
          slotId: 'slot-2',
          status: AppointmentStatus.CANCELLED,
        },
      ] as Appointment[];

      appointmentRepository.findByClientId.mockResolvedValue(mockAppointments);

      // Act
      const result = await useCase.executeByClientId(clientId);

      // Assert
      expect(appointmentRepository.findByClientId).toHaveBeenCalledWith(clientId);
      expect(appointmentRepository.findByClientId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAppointments);
      expect(result).toHaveLength(2);
      expect(result.every(appointment => appointment.clientId === clientId)).toBe(true);
    });

    it('should return empty array when client has no appointments', async () => {
      // Arrange
      appointmentRepository.findByClientId.mockResolvedValue([]);

      // Act
      const result = await useCase.executeByClientId(clientId);

      // Assert
      expect(appointmentRepository.findByClientId).toHaveBeenCalledWith(clientId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    describe('Input Validation', () => {
      it('should handle empty client ID', async () => {
        // Arrange
        appointmentRepository.findByClientId.mockResolvedValue([]);

        // Act
        const result = await useCase.executeByClientId('');

        // Assert
        expect(appointmentRepository.findByClientId).toHaveBeenCalledWith('');
        expect(result).toEqual([]);
      });

      it('should handle special characters in client ID', async () => {
        // Arrange
        const specialClientId = 'client-!@#$%';
        const mockAppointments = [
          {
            id: 'appointment-1',
            clientId: specialClientId,
            slotId: 'slot-1',
            status: AppointmentStatus.CONFIRMED,
          },
        ] as Appointment[];

        appointmentRepository.findByClientId.mockResolvedValue(mockAppointments);

        // Act
        const result = await useCase.executeByClientId(specialClientId);

        // Assert
        expect(appointmentRepository.findByClientId).toHaveBeenCalledWith(specialClientId);
        expect(result[0].clientId).toBe(specialClientId);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        appointmentRepository.findByClientId.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.executeByClientId(clientId)).rejects.toThrow(
          'Database connection failed'
        );

        expect(appointmentRepository.findByClientId).toHaveBeenCalledWith(clientId);
      });
    });
  });

  describe('executeByProviderId', () => {
    const providerId = 'provider-789';

    it('should return appointments when found by provider ID', async () => {
      // Arrange
      const mockAppointments = [
        {
          id: 'appointment-1',
          clientId: 'client-1',
          slotId: 'slot-1',
          status: AppointmentStatus.CONFIRMED,
        },
        {
          id: 'appointment-2',
          clientId: 'client-2',
          slotId: 'slot-2',
          status: AppointmentStatus.CANCELLED,
        },
      ] as Appointment[];

      appointmentRepository.findByProviderId.mockResolvedValue(mockAppointments);

      // Act
      const result = await useCase.executeByProviderId(providerId);

      // Assert
      expect(appointmentRepository.findByProviderId).toHaveBeenCalledWith(providerId);
      expect(appointmentRepository.findByProviderId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAppointments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when provider has no appointments', async () => {
      // Arrange
      appointmentRepository.findByProviderId.mockResolvedValue([]);

      // Act
      const result = await useCase.executeByProviderId(providerId);

      // Assert
      expect(appointmentRepository.findByProviderId).toHaveBeenCalledWith(providerId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    describe('Input Validation', () => {
      it('should handle empty provider ID', async () => {
        // Arrange
        appointmentRepository.findByProviderId.mockResolvedValue([]);

        // Act
        const result = await useCase.executeByProviderId('');

        // Assert
        expect(appointmentRepository.findByProviderId).toHaveBeenCalledWith('');
        expect(result).toEqual([]);
      });

      it('should handle special characters in provider ID', async () => {
        // Arrange
        const specialProviderId = 'provider-!@#$%';
        const mockAppointments = [
          {
            id: 'appointment-1',
            clientId: 'client-1',
            slotId: 'slot-1',
            status: AppointmentStatus.CONFIRMED,
          },
        ] as Appointment[];

        appointmentRepository.findByProviderId.mockResolvedValue(mockAppointments);

        // Act
        const result = await useCase.executeByProviderId(specialProviderId);

        // Assert
        expect(appointmentRepository.findByProviderId).toHaveBeenCalledWith(specialProviderId);
        expect(result).toEqual(mockAppointments);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        appointmentRepository.findByProviderId.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.executeByProviderId(providerId)).rejects.toThrow(
          'Database connection failed'
        );

        expect(appointmentRepository.findByProviderId).toHaveBeenCalledWith(providerId);
      });
    });
  });

  describe('executeByDateRange', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('should return appointments when found by date range', async () => {
      // Arrange
      const mockAppointments = [
        {
          id: 'appointment-1',
          clientId: 'client-1',
          slotId: 'slot-1',
          status: AppointmentStatus.CONFIRMED,
        },
        {
          id: 'appointment-2',
          clientId: 'client-2',
          slotId: 'slot-2',
          status: AppointmentStatus.CANCELLED,
        },
      ] as Appointment[];

      appointmentRepository.findByDateRange.mockResolvedValue(mockAppointments);

      // Act
      const result = await useCase.executeByDateRange(startDate, endDate);

      // Assert
      expect(appointmentRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(appointmentRepository.findByDateRange).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAppointments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no appointments found in date range', async () => {
      // Arrange
      appointmentRepository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await useCase.executeByDateRange(startDate, endDate);

      // Assert
      expect(appointmentRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    describe('Input Validation', () => {
      it('should handle same start and end date', async () => {
        // Arrange
        const sameDate = new Date('2024-01-15');
        appointmentRepository.findByDateRange.mockResolvedValue([]);

        // Act
        const result = await useCase.executeByDateRange(sameDate, sameDate);

        // Assert
        expect(appointmentRepository.findByDateRange).toHaveBeenCalledWith(sameDate, sameDate);
        expect(result).toEqual([]);
      });

      it('should handle end date before start date', async () => {
        // Arrange
        const reversedStart = new Date('2024-01-31');
        const reversedEnd = new Date('2024-01-01');
        appointmentRepository.findByDateRange.mockResolvedValue([]);

        // Act
        const result = await useCase.executeByDateRange(reversedStart, reversedEnd);

        // Assert
        expect(appointmentRepository.findByDateRange).toHaveBeenCalledWith(reversedStart, reversedEnd);
        expect(result).toEqual([]);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        appointmentRepository.findByDateRange.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.executeByDateRange(startDate, endDate)).rejects.toThrow(
          'Database connection failed'
        );

        expect(appointmentRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent requests gracefully', async () => {
      // Arrange
      appointmentRepository.getAll.mockResolvedValue([]);

      // Act - Simulate concurrent calls
      const promises = [
        useCase.execute(),
        useCase.execute(),
        useCase.execute(),
      ];

      // Assert
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(appointmentRepository.getAll).toHaveBeenCalledTimes(3);
    });

    it('should handle large number of appointments', async () => {
      // Arrange
      const largeAppointmentList = Array.from({ length: 1000 }, (_, i) => ({
        id: `appointment-${i}`,
        clientId: `client-${i}`,
        slotId: `slot-${i}`,
        status: AppointmentStatus.CONFIRMED,
      })) as Appointment[];

      appointmentRepository.getAll.mockResolvedValue(largeAppointmentList);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1000);
      expect(appointmentRepository.getAll).toHaveBeenCalledTimes(1);
    });
    });
  });
});
