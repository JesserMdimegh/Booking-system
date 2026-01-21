// src/application/use-cases/providers/create-provider.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateProviderUseCase } from './create-provider.use-case';
import { PROVIDER_REPOSITORY } from '../../../domain/repositories/provider.repository';
import { Provider } from '../../../domain/entities/Provider.entity';
import { CreateProviderDto } from '../../dto/create-provider.dto';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('CreateProviderUseCase', () => {
  let useCase: CreateProviderUseCase;
  let providerRepository: jest.Mocked<any>;

  // Mock repository
  const mockProviderRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProviderUseCase,
        {
          provide: PROVIDER_REPOSITORY,
          useValue: mockProviderRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateProviderUseCase>(CreateProviderUseCase);
    providerRepository = module.get(PROVIDER_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput: CreateProviderDto = {
      email: 'provider@example.com',
      name: 'Dr. John Smith',
      services: ['General Practice', 'Cardiology'],
    };

    const mockExistingProvider = new Provider(
      'existing-provider-123',
      'provider@example.com',
      'Dr. Existing Provider',
      ['General Practice']
    );

        const mockNewProvider = new Provider(
          'mocked-uuid-1234',
          'provider@example.com',
          'Dr. John Smith',
          ['General Practice', 'Cardiology']
        );

    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should successfully create a provider when email does not exist', async () => {
        // Arrange
        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockNewProvider);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(providerRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
        expect(providerRepository.findByEmail).toHaveBeenCalledTimes(1);

        expect(providerRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: validInput.email,
            name: validInput.name,
            services: validInput.services,
          })
        );
        expect(providerRepository.create).toHaveBeenCalledTimes(1);

        expect(result).toBeInstanceOf(Provider);
        expect(result.id).toBe('mocked-uuid-1234');
        expect(result.email).toBe(validInput.email);
        expect(result.name).toBe(validInput.name);
        expect(result.services).toEqual(validInput.services);
      });

      it('should generate unique provider ID using uuid', async () => {
        // Arrange
        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockNewProvider);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(result.id).toBe('mocked-uuid-1234');
      });

      it('should create provider with empty services array when services not provided', async () => {
        // Arrange
        const minimalInput: CreateProviderDto = {
          email: 'minimal@example.com',
          name: 'Dr. Minimal Provider',
        };

        const mockMinimalProvider = new Provider(
          'mocked-uuid-1234',
          'minimal@example.com',
          'Dr. Minimal Provider',
          []
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockMinimalProvider);

        // Act
        const result = await useCase.execute(minimalInput);

        // Assert
        expect(providerRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: 'minimal@example.com',
            name: 'Dr. Minimal Provider',
            services: [],
          })
        );
        expect(result.services).toEqual([]);
      });

      it('should create provider with empty services array when services is null', async () => {
        // Arrange
        const nullServicesInput: CreateProviderDto = {
          email: 'nullservices@example.com',
          name: 'Dr. Null Services',
          services: undefined,
        };

        const mockNullServicesProvider = new Provider(
          'mocked-uuid-1234',
          'nullservices@example.com',
          'Dr. Null Services',
          []
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockNullServicesProvider);

        // Act
        const result = await useCase.execute(nullServicesInput);

        // Assert
        expect(providerRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: 'nullservices@example.com',
            name: 'Dr. Null Services',
            services: [],
          })
        );
        expect(result.services).toEqual([]);
      });
    });

    describe('Error Cases', () => {
      it('should throw ConflictException when provider with email already exists', async () => {
        // Arrange
        providerRepository.findByEmail.mockResolvedValue(mockExistingProvider);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          ConflictException
        );
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Provider with this email already exists'
        );

        expect(providerRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
        expect(providerRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository errors from findByEmail', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        providerRepository.findByEmail.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Database connection failed'
        );

        expect(providerRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
        expect(providerRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository errors from create', async () => {
        // Arrange
        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockRejectedValue(
          new Error('Failed to create provider')
        );

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Failed to create provider'
        );

        expect(providerRepository.findByEmail).toHaveBeenCalled();
        expect(providerRepository.create).toHaveBeenCalled();
      });
    });

    describe('Input Validation', () => {
      it('should handle empty email', async () => {
        // Arrange
        const emptyEmailInput = {
          email: '',
          name: 'Dr. Test Provider',
        };

        const mockEmptyEmailProvider = new Provider(
          'mocked-uuid-1234',
          '',
          'Dr. Test Provider',
          []
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockEmptyEmailProvider);

        // Act
        const result = await useCase.execute(emptyEmailInput);

        // Assert
        expect(providerRepository.findByEmail).toHaveBeenCalledWith('');
        expect(result.email).toBe('');
      });

      it('should handle empty name', async () => {
        // Arrange
        const emptyNameInput = {
          email: 'provider@example.com',
          name: '',
        };

        const mockEmptyNameProvider = new Provider(
          'mocked-uuid-1234',
          'provider@example.com',
          '',
          []
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockEmptyNameProvider);

        // Act
        const result = await useCase.execute(emptyNameInput);

        // Assert
        expect(providerRepository.findByEmail).toHaveBeenCalled();
        expect(result.name).toBe('');
      });

      it('should handle special characters in input', async () => {
        // Arrange
        const specialInput: CreateProviderDto = {
          email: 'dr.oconnor@example.com',
          name: 'Dr. O\'Connor-Smith',
          services: ['General Practice', 'Pediatrics', 'Mental Health'],
        };

        const mockSpecialProvider = new Provider(
          'mocked-uuid-1234',
          'dr.oconnor@example.com',
          "Dr. O'Connor-Smith",
          ['General Practice', 'Pediatrics', 'Mental Health']
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockSpecialProvider);

        // Act
        const result = await useCase.execute(specialInput);

        // Assert
        expect(result.email).toBe('dr.oconnor@example.com');
        expect(result.name).toBe("Dr. O'Connor-Smith");
        expect(result.services).toEqual(['General Practice', 'Pediatrics', 'Mental Health']);
      });

      it('should handle very long input strings', async () => {
        // Arrange
        const longString = 'a'.repeat(1000);
        const longInput: CreateProviderDto = {
          email: `${longString}@example.com`,
          name: longString,
          services: [longString],
        };

        const mockLongProvider = new Provider(
          'mocked-uuid-1234',
          `${longString}@example.com`,
          longString,
          [longString]
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockLongProvider);

        // Act
        const result = await useCase.execute(longInput);

        // Assert
        expect(result.email).toBe(`${longString}@example.com`);
        expect(result.name).toBe(longString);
        expect(result.services).toEqual([longString]);
      });

      it('should handle empty services array', async () => {
        // Arrange
        const emptyServicesInput: CreateProviderDto = {
          email: 'empty@example.com',
          name: 'Dr. Empty Services',
          services: [],
        };

        const mockEmptyServicesProvider = new Provider(
          'mocked-uuid-1234',
          'empty@example.com',
          'Dr. Empty Services',
          []
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockEmptyServicesProvider);

        // Act
        const result = await useCase.execute(emptyServicesInput);

        // Assert
        expect(result.services).toEqual([]);
      });
    });

    describe('Repository Interactions', () => {
      it('should call repositories in correct order', async () => {
        // Arrange
        const callOrder: string[] = [];
        
        providerRepository.findByEmail.mockImplementation(async () => {
          callOrder.push('findByEmail');
          return null;
        });
        
        providerRepository.create.mockImplementation(async () => {
          callOrder.push('create');
          return mockNewProvider;
        });

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(callOrder).toEqual(['findByEmail', 'create']);
      });

      it('should pass correct provider to create method', async () => {
        // Arrange
        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockNewProvider);

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(providerRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: validInput.email,
            name: validInput.name,
            services: validInput.services,
          })
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent provider creation attempts gracefully', async () => {
        // Arrange
        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockNewProvider);

        // Act - Simulate concurrent calls
        const promises = [
          useCase.execute(validInput),
          useCase.execute(validInput),
          useCase.execute(validInput),
        ];

        // Assert
        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);
        expect(providerRepository.findByEmail).toHaveBeenCalledTimes(3);
        expect(providerRepository.create).toHaveBeenCalledTimes(3);
      });

      it('should create providers with different UUIDs for different calls', async () => {
        // Arrange
        const uuid = require('uuid');
        (uuid.v4 as jest.Mock)
          .mockReturnValueOnce('uuid-1')
          .mockReturnValueOnce('uuid-2');

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockImplementation((provider) => Promise.resolve(provider));

        // Act
        const result1 = await useCase.execute(validInput);
        const result2 = await useCase.execute({
          ...validInput,
          email: 'different@example.com',
        });

        // Assert
        expect(result1.id).toBe('uuid-1');
        expect(result2.id).toBe('uuid-2');
      });

      it('should handle case-sensitive email comparison', async () => {
        // Arrange
        const upperCaseEmailInput = {
          email: 'PROVIDER@EXAMPLE.COM',
          name: 'Dr. Test Provider',
        };

        const mockUpperCaseProvider = new Provider(
          'mocked-uuid-1234',
          'PROVIDER@EXAMPLE.COM',
          'Dr. Test Provider',
          []
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockUpperCaseProvider);

        // Act
        const result = await useCase.execute(upperCaseEmailInput);

        // Assert
        expect(providerRepository.findByEmail).toHaveBeenCalledWith('PROVIDER@EXAMPLE.COM');
        expect(result.email).toBe('PROVIDER@EXAMPLE.COM');
      });

      it('should handle duplicate services in array', async () => {
        // Arrange
        const duplicateServicesInput: CreateProviderDto = {
          email: 'duplicate@example.com',
          name: 'Dr. Duplicate Services',
          services: ['General Practice', 'General Practice', 'Cardiology'],
        };

        const mockDuplicateServicesProvider = new Provider(
          'mocked-uuid-1234',
          'duplicate@example.com',
          'Dr. Duplicate Services',
          ['General Practice', 'General Practice', 'Cardiology']
        );

        providerRepository.findByEmail.mockResolvedValue(null);
        providerRepository.create.mockResolvedValue(mockDuplicateServicesProvider);

        // Act
        const result = await useCase.execute(duplicateServicesInput);

        // Assert
        expect(result.services).toEqual(['General Practice', 'General Practice', 'Cardiology']);
      });
    });
  });
});
