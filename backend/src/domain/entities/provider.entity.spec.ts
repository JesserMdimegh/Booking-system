import { Provider } from "./Provider.entity";
describe('Provider entity', () => {
    
    it('should create a provider', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        expect(provider).toBeDefined();
        expect(provider.id).toBe('1');
        expect(provider.email).toBe('test@gmail.com');
        expect(provider.name).toBe('testprovider');
        expect(provider.services).toEqual(['testService']);
    })

    it('should add a service to the provider', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        provider.addService('testService2');
        expect(provider.services).toEqual(['testService', 'testService2']);
    })

    it('should remove a service from the provider', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        provider.removeService('testService');
        expect(provider.services).toEqual([]);
    })

    it('should throw an error when removing a service that is not in the provider', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        expect(() => provider.removeService('testService2')).toThrow('Service not found');
    })

    it('should return true when the provider has a service', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        expect(provider.hasService('testService')).toBe(true);
    })

    it('should return false when the provider does not have a service', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        expect(provider.hasService('testService2')).toBe(false);
    })

    it('should throw an error when adding a service that is already in the provider', () => {
        const provider = new Provider('1', 'test@gmail.com', 'testprovider', ['testService']);
        expect(() => provider.addService('testService')).toThrow('Service already exists');
    })

    

})