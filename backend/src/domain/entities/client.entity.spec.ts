import { Client } from './client.entity';

describe('Client entity', () => {
    it('should create a client', () => {
        const client = new Client('1', 'test@gmail.com', 'testuser', '20 256 256', 'Tunis');
        expect(client).toBeDefined();
        expect(client.id).toBe('1');
        expect(client.email).toBe('test@gmail.com');
        expect(client.name).toBe('testuser');
        expect(client.phoneNumber).toBe('20 256 256');
        expect(client.address).toBe('Tunis');
    })
    it('should update contact info',()=>
    {
        const client = new Client('1', 'test@gmail.com', 'testuser', '20 256 300', 'Nabeul');
        client.updateContactInfo('20 256 256', 'Tunis');
        expect(client.phoneNumber).toBe('20 256 256');
        expect(client.address).toBe('Tunis');
    })


    
})