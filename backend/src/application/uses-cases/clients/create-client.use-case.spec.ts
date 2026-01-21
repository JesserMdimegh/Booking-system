// src/application/use-cases/clients/create-client.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateClientUseCase } from './create-client.use-case';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';
import { CreateClientDto } from '../../dto/create-client.dto';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let clientRepository: jest.Mocked<any>;

  // Mock repository
  const mockClientRepository = {
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
        CreateClientUseCase,
        {
          provide: CLIENT_REPOSITORY,
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateClientUseCase>(CreateClientUseCase);
    clientRepository = module.get(CLIENT_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput: CreateClientDto = {
      email: 'test@example.com',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St',
    };

    const mockExistingClient = {
      id: 'existing-client-123',
      email: 'test@example.com',
      name: 'Existing Client',
      phoneNumber: '+1234567890',
      address: '123 Existing St',
    } as Client;

    const mockNewClient = {
      id: 'mocked-uuid-1234',
      email: 'test@example.com',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St',
    } as Client;

    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should successfully create a client when email does not exist', async () => {
        // Arrange
        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockNewClient);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
        expect(clientRepository.findByEmail).toHaveBeenCalledTimes(1);

        expect(clientRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: validInput.email,
            name: validInput.name,
            phoneNumber: validInput.phoneNumber,
            address: validInput.address,
          })
        );
        expect(clientRepository.create).toHaveBeenCalledTimes(1);

        expect(result).toBeDefined();
        expect(result.id).toBe('mocked-uuid-1234');
        expect(result.email).toBe(validInput.email);
        expect(result.name).toBe(validInput.name);
      });

      it('should generate unique client ID using uuid', async () => {
        // Arrange
        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockNewClient);

        // Act
        const result = await useCase.execute(validInput);

        // Assert
        expect(result.id).toBe('mocked-uuid-1234');
      });

      it('should create client without optional fields', async () => {
        // Arrange
        const minimalInput: CreateClientDto = {
          email: 'minimal@example.com',
          name: 'Minimal Client',
        };

        const mockMinimalClient = {
          id: 'mocked-uuid-1234',
          email: 'minimal@example.com',
          name: 'Minimal Client',
          phoneNumber: undefined,
          address: undefined,
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockMinimalClient);

        // Act
        const result = await useCase.execute(minimalInput);

        // Assert
        expect(clientRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: 'minimal@example.com',
            name: 'Minimal Client',
            phoneNumber: undefined,
            address: undefined,
          })
        );
        expect(result.email).toBe('minimal@example.com');
        expect(result.name).toBe('Minimal Client');
      });
    });

    describe('Error Cases', () => {
      it('should throw ConflictException when client with email already exists', async () => {
        // Arrange
        clientRepository.findByEmail.mockResolvedValue(mockExistingClient);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          ConflictException
        );
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Client with this email already exists'
        );

        expect(clientRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
        expect(clientRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository errors from findByEmail', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        clientRepository.findByEmail.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Database connection failed'
        );

        expect(clientRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
        expect(clientRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository errors from create', async () => {
        // Arrange
        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockRejectedValue(
          new Error('Failed to create client')
        );

        // Act & Assert
        await expect(useCase.execute(validInput)).rejects.toThrow(
          'Failed to create client'
        );

        expect(clientRepository.findByEmail).toHaveBeenCalled();
        expect(clientRepository.create).toHaveBeenCalled();
      });
    });

    describe('Input Validation', () => {
      it('should handle empty email', async () => {
        // Arrange
        const emptyEmailInput = {
          email: '',
          name: 'Test Client',
        };

        const mockEmptyEmailClient = {
          id: 'mocked-uuid-1234',
          email: '',
          name: 'Dr. Test Provider',
          phoneNumber: undefined,
          address: undefined,
        } as any;

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockEmptyEmailClient);

        // Act
        const result = await useCase.execute(emptyEmailInput);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalledWith('');
        expect(result.email).toBe('');
      });

      it('should handle empty name', async () => {
        // Arrange
        const emptyNameInput = {
          email: 'test@example.com',
          name: '',
        };

        const mockEmptyNameClient = {
          ...mockNewClient,
          name: '',
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockEmptyNameClient);

        // Act
        const result = await useCase.execute(emptyNameInput);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalled();
        expect(result.name).toBe('');
      });

      it('should handle special characters in input', async () => {
        // Arrange
        const specialInput: CreateClientDto = {
          email: 'test+special@example.com',
          name: 'John O\'Connor-Doe',
          phoneNumber: '+1 (555) 123-4567',
          address: '123 Main St, Apt #4B, Springfield, IL',
        };

        const mockSpecialClient = {
          id: 'mocked-uuid-1234',
          email: 'test+special@example.com',
          name: "John O'Connor-Doe",
          phoneNumber: '+1 (555) 123-4567',
          address: '123 Main St, Apt #4B, Springfield, IL',
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockSpecialClient);

        // Act
        const result = await useCase.execute(specialInput);

        // Assert
        expect(result.email).toBe('test+special@example.com');
        expect(result.name).toBe("John O'Connor-Doe");
        expect(result.phoneNumber).toBe('+1 (555) 123-4567');
        expect(result.address).toBe('123 Main St, Apt #4B, Springfield, IL');
      });

      it('should handle very long input strings', async () => {
        // Arrange
        const longString = 'a'.repeat(1000);
        const longInput: CreateClientDto = {
          email: `${longString}@example.com`,
          name: longString,
          phoneNumber: longString,
          address: longString,
        };

        const mockLongClient = {
          id: 'mocked-uuid-1234',
          email: `${longString}@example.com`,
          name: longString,
          phoneNumber: longString,
          address: longString,
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockLongClient);

        // Act
        const result = await useCase.execute(longInput);

        // Assert
        expect(result.email).toBe(`${longString}@example.com`);
        expect(result.name).toBe(longString);
        expect(result.phoneNumber).toBe(longString);
        expect(result.address).toBe(longString);
      });
    });

    describe('Repository Interactions', () => {
      it('should call repositories in correct order', async () => {
        // Arrange
        const callOrder: string[] = [];
        
        clientRepository.findByEmail.mockImplementation(async () => {
          callOrder.push('findByEmail');
          return null;
        });
        
        clientRepository.create.mockImplementation(async () => {
          callOrder.push('create');
          return mockNewClient;
        });

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(callOrder).toEqual(['findByEmail', 'create']);
      });

      it('should pass correct client to create method', async () => {
        // Arrange
        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockNewClient);

        // Act
        await useCase.execute(validInput);

        // Assert
        expect(clientRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mocked-uuid-1234',
            email: validInput.email,
            name: validInput.name,
            phoneNumber: validInput.phoneNumber,
            address: validInput.address,
          })
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle concurrent client creation attempts gracefully', async () => {
        // Arrange
        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockNewClient);

        // Act - Simulate concurrent calls
        const promises = [
          useCase.execute(validInput),
          useCase.execute(validInput),
          useCase.execute(validInput),
        ];

        // Assert
        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);
        expect(clientRepository.findByEmail).toHaveBeenCalledTimes(3);
        expect(clientRepository.create).toHaveBeenCalledTimes(3);
      });

      it('should create clients with different UUIDs for different calls', async () => {
        // Arrange
        const uuid = require('uuid');
        (uuid.v4 as jest.Mock)
          .mockReturnValueOnce('uuid-1')
          .mockReturnValueOnce('uuid-2');

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockImplementation((client) => Promise.resolve(client));

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
          email: 'TEST@EXAMPLE.COM',
          name: 'Test Client',
        };

        const mockUpperCaseClient = {
          id: 'mocked-uuid-1234',
          email: 'TEST@EXAMPLE.COM',
          name: 'Dr. Test Provider',
          phoneNumber: undefined,
          address: undefined,
        } as any;

        clientRepository.findByEmail.mockResolvedValue(null);
        clientRepository.create.mockResolvedValue(mockUpperCaseClient);

        // Act
        const result = await useCase.execute(upperCaseEmailInput);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
        expect(result.email).toBe('TEST@EXAMPLE.COM');
      });
    });
  });
});
