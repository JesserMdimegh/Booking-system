import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProvidersController } from './providers.controller';
import { CreateProviderUseCase } from '../../application/uses-cases/providers/create-provider.use-case';
import { GetProvidersUseCase } from '../../application/uses-cases/providers/get-providers.use-case';
import { UpdateProviderUseCase } from '../../application/uses-cases/providers/update-provider.use-case';
import { Provider } from '../../domain/entities/Provider.entity';

describe('ProviderController', () => {
    let app: INestApplication;
    let createProviderUseCase: CreateProviderUseCase;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProvidersController],
            providers: [
                {
                    provide: CreateProviderUseCase,
                    useValue: {
                        execute: jest.fn(),
                    },
                },
                {
                    provide: GetProvidersUseCase,
                    useValue: {
                        getAll: jest.fn(),
                        getById: jest.fn(),
                        getByService: jest.fn(),
                        findByEmail: jest.fn(),
                        getProviderAppointments: jest.fn(),
                        getProviderSlots: jest.fn(),
                    },
                },
                {
                    provide: UpdateProviderUseCase,
                    useValue: {
                        execute: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        createProviderUseCase = module.get(CreateProviderUseCase);
    });


    it('POST /providers → should create provider', async () => {
        const dto = {
            email: 'test@test.com',
            name: 'Provider 1',
            services: ['cleaning'],
        };

        const mockProvider = new Provider('1', dto.email, dto.name, dto.services);
        jest.spyOn(createProviderUseCase, 'execute').mockResolvedValue(mockProvider);

        const response = await request(app.getHttpServer())
            .post('/providers')
            .send(dto)
            .expect(201);

        expect(response.body).toEqual({
            message: 'Provider created successfully',
            data: {
                id: '1',
                email: dto.email,
                name: dto.name,
                services: dto.services,
                role: 'PROVIDER',
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            }
        });
    });

    it('POST /providers → should return 400 if email missing', async () => {
  await request(app.getHttpServer())
    .post('/providers')
    .send({ name: 'Provider' })
    .expect(400);
});

it('GET /providers → should return providers list', async () => {
  const providers = [
    new Provider('1', 'provider-a@test.com', 'Provider A', ['cleaning']),
    new Provider('2', 'provider-b@test.com', 'Provider B', ['plumbing']),
  ];

  const getProvidersUseCase = app.get(GetProvidersUseCase);
  jest.spyOn(getProvidersUseCase, 'getAll').mockResolvedValue(providers);

  const response = await request(app.getHttpServer())
    .get('/providers')
    .expect(200);

  expect(response.body).toEqual({
    message: 'Providers retrieved successfully',
    data: [
      {
        id: '1',
        email: 'provider-a@test.com',
        name: 'Provider A',
        services: ['cleaning'],
        role: 'PROVIDER',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      },
      {
        id: '2',
        email: 'provider-b@test.com',
        name: 'Provider B',
        services: ['plumbing'],
        role: 'PROVIDER',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    ]
  });
});


});