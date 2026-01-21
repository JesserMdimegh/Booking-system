import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdminService } from './keycloak-admin.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KeycloakAdminService', () => {
    let service: KeycloakAdminService;

    beforeEach(async () => {
        process.env.KEYCLOAK_URL = 'http://keycloak';
        process.env.KEYCLOAK_REALM = 'test-realm';
        process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'admin-cli';
        process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';

        const module: TestingModule = await Test.createTestingModule({
            providers: [KeycloakAdminService],
        }).compile();

        service = module.get<KeycloakAdminService>(KeycloakAdminService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

   
    it('should return admin token', async () => {
        mockedAxios.post.mockResolvedValue({
            data: { access_token: 'mock-token' },
        });

        const token = await service.getAdminToken();

        expect(token).toBe('mock-token');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/protocol/openid-connect/token'),
            expect.any(URLSearchParams),
            expect.any(Object)
        );
    });

    it('should throw HttpException when user creation fails', async () => {
        jest.spyOn(service, 'getAdminToken').mockResolvedValue('token');

        mockedAxios.post.mockRejectedValue({
            response: { status: 409, data: 'User exists' },
        });

        await expect(
            service.createUser({
                username: 'john',
                email: 'john@test.com',
                password: '123456',
            })
        ).rejects.toThrow();
    });


    it('should create user and set password', async () => {
        jest.spyOn(service, 'getAdminToken').mockResolvedValue('token');

        mockedAxios.post.mockResolvedValueOnce({}); // create user
        mockedAxios.get.mockResolvedValueOnce({
            data: [{ id: 'user-id' }],
        });
        mockedAxios.put.mockResolvedValueOnce({}); // reset password

        await service.createUser({
            username: 'john',
            email: 'john@test.com',
            password: '123456',
        });

        expect(mockedAxios.post).toHaveBeenCalled();
        expect(mockedAxios.put).toHaveBeenCalled();
    });


});
