// src/application/use-cases/clients/get-clients.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetClientsUseCase } from './get-clients.use-case';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';

describe('GetClientsUseCase', () => {
  let useCase: GetClientsUseCase;
  let clientRepository: jest.Mocked<any>;

  // Mock repository
  const mockClientRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetClientsUseCase,
        {
          provide: CLIENT_REPOSITORY,
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetClientsUseCase>(GetClientsUseCase);
    clientRepository = module.get(CLIENT_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    describe('Success Cases', () => {
      it('should return all clients when getAll() is called', async () => {
        // Arrange
        const mockClients = [
          {
            id: 'client-1',
            email: 'client1@example.com',
            name: 'Client One',
            phoneNumber: '+1234567890',
            address: '123 Main St',
          },
          {
            id: 'client-2',
            email: 'client2@example.com',
            name: 'Client Two',
            phoneNumber: '+0987654321',
            address: '456 Oak Ave',
          },
        ] as Client[];

        clientRepository.findAll.mockResolvedValue(mockClients);

        // Act
        const result = await useCase.getAll();

        // Assert
        expect(clientRepository.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockClients);
        expect(result).toHaveLength(2);
      });

      it('should return empty array when no clients exist', async () => {
        // Arrange
        clientRepository.findAll.mockResolvedValue([]);

        // Act
        const result = await useCase.getAll();

        // Assert
        expect(clientRepository.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        clientRepository.findAll.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.getAll()).rejects.toThrow('Database connection failed');
        expect(clientRepository.findAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getById', () => {
    const clientId = 'client-123';

    it('should return client when found by ID', async () => {
      // Arrange
      const mockClient = {
        id: clientId,
        email: 'test@example.com',
        name: 'Test Client',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      } as Client;

      clientRepository.findById.mockResolvedValue(mockClient);

      // Act
      const result = await useCase.getById(clientId);

      // Assert
      expect(clientRepository.findById).toHaveBeenCalledWith(clientId);
      expect(clientRepository.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException when client is not found by ID', async () => {
      // Arrange
      clientRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.getById(clientId)).rejects.toThrow(NotFoundException);
      await expect(useCase.getById(clientId)).rejects.toThrow('Client not found');

      expect(clientRepository.findById).toHaveBeenCalledWith(clientId);
    });

    describe('Input Validation', () => {
      it('should handle empty client ID', async () => {
        // Arrange
        clientRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.getById('')).rejects.toThrow(NotFoundException);
      });

      it('should handle special characters in client ID', async () => {
        // Arrange
        const specialId = 'client-!@#$%';
        const mockClient = {
          id: specialId,
          email: 'test@example.com',
          name: 'Test Client',
          phoneNumber: '+1234567890',
          address: '123 Main St',
        } as Client;

        clientRepository.findById.mockResolvedValue(mockClient);

        // Act
        const result = await useCase.getById(specialId);

        // Assert
        expect(clientRepository.findById).toHaveBeenCalledWith(specialId);
        expect(result.id).toBe(specialId);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        clientRepository.findById.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.getById(clientId)).rejects.toThrow('Database connection failed');

        expect(clientRepository.findById).toHaveBeenCalledWith(clientId);
      });
    });
  });

  describe('findByEmail', () => {
    const email = 'test@example.com';

    it('should return client when found by email', async () => {
      // Arrange
      const mockClient = {
        id: 'client-123',
        email: email,
        name: 'Test Client',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      } as Client;

      clientRepository.findByEmail.mockResolvedValue(mockClient);

      // Act
      const result = await useCase.findByEmail(email);

      // Assert
      expect(clientRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(clientRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException when client is not found by email', async () => {
      // Arrange
      clientRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.findByEmail(email)).rejects.toThrow(NotFoundException);
      await expect(useCase.findByEmail(email)).rejects.toThrow('Client not found');

      expect(clientRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw NotFoundException when email is empty', async () => {
      // Act & Assert
      await expect(useCase.findByEmail('')).rejects.toThrow(NotFoundException);
      await expect(useCase.findByEmail('')).rejects.toThrow('Email is required');

      expect(clientRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when email is null', async () => {
      // Act & Assert
      await expect(useCase.findByEmail(null as any)).rejects.toThrow(NotFoundException);
      await expect(useCase.findByEmail(null as any)).rejects.toThrow('Email is required');

      expect(clientRepository.findByEmail).not.toHaveBeenCalled();
    });

    describe('Input Validation', () => {
      it('should handle special characters in email', async () => {
        // Arrange
        const specialEmail = 'test+special@example.com';
        const mockClient = {
          id: 'client-123',
          email: specialEmail,
          name: 'Test Client',
          phoneNumber: '+1234567890',
          address: '123 Main St',
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(mockClient);

        // Act
        const result = await useCase.findByEmail(specialEmail);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalledWith(specialEmail);
        expect(result.email).toBe(specialEmail);
      });

      it('should handle uppercase emails', async () => {
        // Arrange
        const uppercaseEmail = 'TEST@EXAMPLE.COM';
        const mockClient = {
          id: 'client-123',
          email: uppercaseEmail,
          name: 'Test Client',
          phoneNumber: '+1234567890',
          address: '123 Main St',
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(mockClient);

        // Act
        const result = await useCase.findByEmail(uppercaseEmail);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalledWith(uppercaseEmail);
        expect(result.email).toBe(uppercaseEmail);
      });

      it('should handle very long email addresses', async () => {
        // Arrange
        const longString = 'a'.repeat(100);
        const longEmail = `${longString}@example.com`;
        const mockClient = {
          id: 'client-123',
          email: longEmail,
          name: 'Test Client',
          phoneNumber: '+1234567890',
          address: '123 Main St',
        } as Client;

        clientRepository.findByEmail.mockResolvedValue(mockClient);

        // Act
        const result = await useCase.findByEmail(longEmail);

        // Assert
        expect(clientRepository.findByEmail).toHaveBeenCalledWith(longEmail);
        expect(result.email).toBe(longEmail);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        clientRepository.findByEmail.mockRejectedValue(dbError);

        // Act & Assert
        await expect(useCase.findByEmail(email)).rejects.toThrow('Database connection failed');

        expect(clientRepository.findByEmail).toHaveBeenCalledWith(email);
      });
    });
  });

  describe('getClientAppointments', () => {
    const clientId = 'client-123';

    it('should return empty array as placeholder implementation', async () => {
      // Act
      const result = await useCase.getClientAppointments(clientId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(clientRepository.findByEmail).not.toHaveBeenCalled();
      expect(clientRepository.findById).not.toHaveBeenCalled();
    });

    it('should return empty array for any client ID', async () => {
      // Arrange
      const testIds = ['', 'client-1', 'client-!@#$%', 'a'.repeat(1000)];

      // Act & Assert
      for (const id of testIds) {
        const result = await useCase.getClientAppointments(id);
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      }
    });
  });

  describe('Repository Interactions', () => {
    it('should call correct repository method for each operation', async () => {
      // Arrange
      const mockClient = {
        id: 'client-123',
        email: 'test@example.com',
        name: 'Test Client',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      } as Client;

      clientRepository.findAll.mockResolvedValue([mockClient]);
      clientRepository.findById.mockResolvedValue(mockClient);
      clientRepository.findByEmail.mockResolvedValue(mockClient);

      // Act
      await useCase.getAll();
      await useCase.getById('test-id');
      await useCase.findByEmail('test@example.com');

      // Assert
      expect(clientRepository.findAll).toHaveBeenCalledTimes(1);
      expect(clientRepository.findById).toHaveBeenCalledTimes(1);
      expect(clientRepository.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests gracefully', async () => {
      // Arrange
      clientRepository.findAll.mockResolvedValue([]);

      // Act - Simulate concurrent calls
      const promises = [
        useCase.getAll(),
        useCase.getAll(),
        useCase.getAll(),
      ];

      // Assert
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(clientRepository.findAll).toHaveBeenCalledTimes(3);
    });

    it('should handle large number of clients', async () => {
      // Arrange
      const largeClientList = Array.from({ length: 1000 }, (_, i) => ({
        id: `client-${i}`,
        email: `client${i}@example.com`,
        name: `Client ${i}`,
        phoneNumber: `+123456789${i}`,
        address: `${i} Main St`,
      })) as Client[];

      clientRepository.findAll.mockResolvedValue(largeClientList);

      // Act
      const result = await useCase.getAll();

      // Assert
      expect(result).toHaveLength(1000);
      expect(clientRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace-only email', async () => {
      // Arrange
      const mockClient = {
        id: 'client-123',
        email: 'test@example.com',
        name: 'Test Client',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      } as Client;
      
      clientRepository.findByEmail.mockResolvedValue(mockClient);

      // Act - Whitespace-only email should be treated as valid and passed to repository
      const result = await useCase.findByEmail('   ');

      // Assert
      expect(clientRepository.findByEmail).toHaveBeenCalledWith('   ');
      expect(result).toEqual(mockClient);
    });
  });
});
