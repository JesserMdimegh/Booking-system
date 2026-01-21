// src/application/use-cases/slots/create-slot.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateSlotUseCase } from './create-slot.use-case';
import { SLOT_REPOSITORY } from '../../../domain/repositories/slot.repository';
import { Slot } from '../../../domain/entities/slot.entity';
import { CreateSlotDto } from '../../dto/create-slot.dto';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('CreateSlotUseCase', () => {
  let useCase: CreateSlotUseCase;
  let slotRepository: jest.Mocked<any>;

  // Mock repository
  const mockSlotRepository = {
    checkOverlap: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSlotUseCase,
        {
          provide: SLOT_REPOSITORY,
          useValue: mockSlotRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateSlotUseCase>(CreateSlotUseCase);
    slotRepository = module.get(SLOT_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput: CreateSlotDto = {
      providerId: 'provider-123',
      date: '2024-01-20',
      startTime: '2024-01-20T10:00:00Z',
      endTime: '2024-01-20T11:00:00Z',
    };

        const mockNewSlot = {
          id: 'mocked-uuid-1234',
          providerId: 'provider-123',
          date: new Date('2024-01-20'),
          startTime: new Date('2024-01-20T10:00:00Z'),
          endTime: new Date('2024-01-20T11:00:00Z'),
          status: 'AVAILABLE',
        } as any;

    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should successfully create a slot when no overlap exists', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockNewSlot);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          validInput.providerId,
          new Date(validInput.startTime),
          new Date(validInput.endTime)
        );
        expect(slotRepository.checkOverlap).toHaveBeenCalledTimes(1);

        expect(slotRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            providerId: validInput.providerId,
            date: new Date(validInput.date),
            startTime: new Date(validInput.startTime),
            endTime: new Date(validInput.endTime),
          })
        );
        expect(slotRepository.create).toHaveBeenCalledTimes(1);

        expect(result).toBeDefined();
        expect(result.id).toBe('mocked-uuid-1234');
        expect(result.providerId).toBe(validInput.providerId);
        expect(result.date).toEqual(new Date(validInput.date));
        expect(result.startTime).toEqual(new Date(validInput.startTime));
        expect(result.endTime).toEqual(new Date(validInput.endTime));
      });

      it('should generate unique slot ID using uuid', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockNewSlot);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(result.id).toBe('mocked-uuid-1234');
      });

      it('should handle different date formats correctly', async () => {
        // Arrange
        const differentFormatInput: CreateSlotDto = {
          providerId: 'provider-123',
          date: '2024-01-20T00:00:00.000Z',
          startTime: '2024-01-20T14:30:00.000Z',
          endTime: '2024-01-20T15:30:00.000Z',
        };

        const mockDifferentFormatSlot = {
          id: 'mocked-uuid-1234',
          providerId: 'provider-123',
          date: new Date('2024-01-20T00:00:00.000Z'),
          startTime: new Date('2024-01-20T14:30:00.000Z'),
          endTime: new Date('2024-01-20T15:30:00.000Z'),
          status: 'AVAILABLE',
        } as unknown as Slot;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockDifferentFormatSlot);

        // Act
        const result = await useCase.execute(differentFormatInput);

        // Assert
        expect(slotRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            providerId: 'provider-123',
            date: new Date('2024-01-20T00:00:00.000Z'),
            startTime: new Date('2024-01-20T14:30:00.000Z'),
            endTime: new Date('2024-01-20T15:30:00.000Z'),
          })
        );
        expect(result.date).toEqual(new Date('2024-01-20T00:00:00.000Z'));
      });
    });

    describe('Error Cases', () => {
      it('should throw BadRequestException when slot overlaps with existing slot', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(true);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          BadRequestException
        );
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Slot overlaps with an existing slot'
        );

        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          validInput.providerId,
          new Date(validInput.startTime),
          new Date(validInput.endTime)
        );
        expect(slotRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository errors from checkOverlap', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        slotRepository.checkOverlap.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Database connection failed'
        );

        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          validInput.providerId,
          new Date(validInput.startTime),
          new Date(validInput.endTime)
        );
        expect(slotRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository errors from create', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockRejectedValue(
          new Error('Failed to create slot')
        );

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Failed to create slot'
        );

        expect(slotRepository.checkOverlap).toHaveBeenCalled();
        expect(slotRepository.create).toHaveBeenCalled();
      });
    });

    describe('Input Validation', () => {
      it('should handle empty provider ID', async () => {
        // Arrange
        const emptyProviderInput = {
          providerId: '',
          date: '2024-01-20',
          startTime: '2024-01-20T10:00:00Z',
          endTime: '2024-01-20T11:00:00Z',
        };

        const mockEmptyProviderSlot = {
          id: 'mocked-uuid-1234',
          providerId: '',
          date: new Date('2024-01-20'),
          startTime: new Date('2024-01-20T10:00:00Z'),
          endTime: new Date('2024-01-20T11:00:00Z'),
          status: 'AVAILABLE',
        } as any;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockEmptyProviderSlot);

        // Act
        const result = await useCase.execute(emptyProviderInput);

        // Assert
        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          '',
          new Date(emptyProviderInput.startTime),
          new Date(emptyProviderInput.endTime)
        );
        expect(result.providerId).toBe('');
      });

      it('should handle empty date', async () => {
        // Arrange
        const emptyDateInput = {
          providerId: 'provider-123',
          date: '',
          startTime: '2024-01-20T10:00:00Z',
          endTime: '2024-01-20T11:00:00Z',
        };

        const mockEmptyDateSlot = {
          id: 'mocked-uuid-1234',
          providerId: 'provider-123',
          date: new Date(''),
          startTime: new Date('2024-01-20T10:00:00Z'),
          endTime: new Date('2024-01-20T11:00:00Z'),
          status: 'AVAILABLE',
        } as any;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockEmptyDateSlot);

        // Act
        const result = await useCase.execute(emptyDateInput);

        // Assert
        expect(slotRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            providerId: 'provider-123',
            date: expect.any(Date),
            startTime: new Date('2024-01-20T10:00:00Z'),
            endTime: new Date('2024-01-20T11:00:00Z'),
            status: 'AVAILABLE',
          })
        );
        expect(result.date).toBeInstanceOf(Date);
        expect(isNaN(result.date.getTime())).toBe(true);
      });

      it('should handle invalid date strings', async () => {
        // Arrange
        const invalidDateInput = {
          providerId: 'provider-123',
          date: 'invalid-date',
          startTime: '2024-01-20T10:00:00Z',
          endTime: '2024-01-20T11:00:00Z',
        };

        const mockInvalidDateSlot = {
          id: 'mocked-uuid-1234',
          providerId: 'provider-123',
          date: new Date('invalid-date'),
          startTime: new Date('2024-01-20T10:00:00Z'),
          endTime: new Date('2024-01-20T11:00:00Z'),
          status: 'AVAILABLE',
        } as any;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockInvalidDateSlot);

        // Act
        const result = await useCase.execute(invalidDateInput);

        // Assert
        expect(slotRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            providerId: 'provider-123',
            date: expect.any(Date),
            startTime: new Date('2024-01-20T10:00:00Z'),
            endTime: new Date('2024-01-20T11:00:00Z'),
            status: 'AVAILABLE',
          })
        );
        expect(result.date).toBeInstanceOf(Date);
        expect(isNaN(result.date.getTime())).toBe(true);
      });

      it('should handle special characters in provider ID', async () => {
        // Arrange
        const specialProviderInput = {
          providerId: 'provider-!@#$%',
          date: '2024-01-20',
          startTime: '2024-01-20T10:00:00Z',
          endTime: '2024-01-20T11:00:00Z',
        };

        const mockSpecialProviderSlot = {
          ...mockNewSlot,
          providerId: 'provider-!@#$%',
        } as unknown as Slot;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockSpecialProviderSlot);

        // Act
        const result = await useCase.execute(specialProviderInput);

        // Assert
        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          'provider-!@#$%',
          new Date(specialProviderInput.startTime),
          new Date(specialProviderInput.endTime)
        );
        expect(result.providerId).toBe('provider-!@#$%');
      });

      it('should handle very long input strings', async () => {
        // Arrange
        const longString = 'a'.repeat(1000);
        const longInput: CreateSlotDto = {
          providerId: longString,
          date: '2024-01-20',
          startTime: '2024-01-20T10:00:00Z',
          endTime: '2024-01-20T11:00:00Z',
        };

        const mockLongSlot = {
          ...mockNewSlot,
          providerId: longString,
        } as unknown as Slot;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockLongSlot);

        // Act
        const result = await useCase.execute(longInput);

        // Assert
        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          longString,
          new Date(longInput.startTime),
          new Date(longInput.endTime)
        );
        expect(result.providerId).toBe(longString);
      });
    });

    describe('Repository Interactions', () => {
      it('should call repositories in correct order', async () => {
        // Arrange
        const callOrder: string[] = [];
        
        slotRepository.checkOverlap.mockImplementation(async () => {
          callOrder.push('checkOverlap');
          return false;
        });
        
        slotRepository.create.mockImplementation(async () => {
          callOrder.push('create');
          return mockNewSlot;
        });

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(callOrder).toEqual(['checkOverlap', 'create']);
      });

      it('should pass correct parameters to checkOverlap', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockNewSlot);

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(slotRepository.checkOverlap).toHaveBeenCalledWith(
          validInput.providerId,
          new Date(validInput.startTime),
          new Date(validInput.endTime)
        );
      });

      it('should pass correct slot to create method', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockNewSlot);

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(slotRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            providerId: validInput.providerId,
            date: new Date(validInput.date),
            startTime: new Date(validInput.startTime),
            endTime: new Date(validInput.endTime),
          })
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent slot creation attempts gracefully', async () => {
        // Arrange
        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockNewSlot);

        // Act - Simulate concurrent calls
        const promises = [
          useCase.execute(validInput),
          useCase.execute(validInput),
          useCase.execute(validInput),
        ];

        // Assert
        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);
        expect(slotRepository.checkOverlap).toHaveBeenCalledTimes(3);
        expect(slotRepository.create).toHaveBeenCalledTimes(3);
      });

      it('should create slots with different UUIDs for different calls', async () => {
        // Arrange
        const uuid = require('uuid');
        (uuid.v4 as jest.Mock)
          .mockReturnValueOnce('uuid-1')
          .mockReturnValueOnce('uuid-2');

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockImplementation((slot) => Promise.resolve(slot));

        // Act
        const result1 = await useCase.execute(validInput);
        const result2 = await useCase.execute({
          ...validInput,
          startTime: '2024-01-20T12:00:00Z',
          endTime: '2024-01-20T13:00:00Z',
        });

        // Assert
        expect(result1.id).toBe('uuid-1');
        expect(result2.id).toBe('uuid-2');
      });

      it('should handle same start and end time', async () => {
        // Arrange
        const sameTimeInput: CreateSlotDto = {
          providerId: 'provider-123',
          date: '2024-01-20',
          startTime: '2024-01-20T10:00:00Z',
          endTime: '2024-01-20T10:00:00Z',
        };

        const mockSameTimeSlot = {
          ...mockNewSlot,
          startTime: new Date('2024-01-20T10:00:00Z'),
          endTime: new Date('2024-01-20T10:00:00Z'),
        } as unknown as Slot;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockSameTimeSlot);

        // Act
        const result = await useCase.execute(sameTimeInput);

        // Assert
        expect(result.startTime).toEqual(new Date('2024-01-20T10:00:00Z'));
        expect(result.endTime).toEqual(new Date('2024-01-20T10:00:00Z'));
      });

      it('should handle end time before start time', async () => {
        // Arrange
        const reversedTimeInput: CreateSlotDto = {
          providerId: 'provider-123',
          date: '2024-01-20',
          startTime: '2024-01-20T11:00:00Z',
          endTime: '2024-01-20T10:00:00Z',
        };

        const mockReversedTimeSlot = {
          ...mockNewSlot,
          startTime: new Date('2024-01-20T11:00:00Z'),
          endTime: new Date('2024-01-20T10:00:00Z'),
        } as unknown as Slot;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockReversedTimeSlot);

        // Act
        const result = await useCase.execute(reversedTimeInput);

        // Assert
        expect(result.startTime).toEqual(new Date('2024-01-20T11:00:00Z'));
        expect(result.endTime).toEqual(new Date('2024-01-20T10:00:00Z'));
      });

      it('should handle dates in different timezones', async () => {
        // Arrange
        const timezoneInput: CreateSlotDto = {
          providerId: 'provider-123',
          date: '2024-01-20',
          startTime: '2024-01-20T10:00:00+05:00',
          endTime: '2024-01-20T11:00:00+05:00',
        };

        const mockTimezoneSlot = {
          ...mockNewSlot,
          startTime: new Date('2024-01-20T10:00:00+05:00'),
          endTime: new Date('2024-01-20T11:00:00+05:00'),
        } as unknown as Slot;

        slotRepository.checkOverlap.mockResolvedValue(false);
        slotRepository.create.mockResolvedValue(mockTimezoneSlot);

        // Act
        const result = await useCase.execute(timezoneInput);

        // Assert
        expect(result.startTime).toEqual(new Date('2024-01-20T10:00:00+05:00'));
        expect(result.endTime).toEqual(new Date('2024-01-20T11:00:00+05:00'));
      });
    });
  });
});
