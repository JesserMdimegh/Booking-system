import { Slot } from "./slot.entity";
import { SlotStatus } from "../enums/slot-status.enum";
describe('Slot entity', () => {

    it('should create a slot ',()=>{
        const slot = new Slot('1', '1', new Date(), new Date(), new Date());
        expect(slot).toBeDefined();
        expect(slot.status).toBe(SlotStatus.AVAILABLE);
        expect(slot.providerId).toBe('1');
    })
    it('should book a slot',()=>{
        const slot = new Slot('1', '1', new Date(), new Date(), new Date());
        slot.book();
        expect(slot.status).toBe(SlotStatus.BOOKED);
    })
    it('should release a slot', () => {
    const slot = new Slot('1', 'provider-1', new Date(), new Date(), new Date());

    // Arrange: slot must be booked first
    slot.book();

    // Act
    slot.release();

    // Assert
    expect(slot.status).toBe(SlotStatus.AVAILABLE);
  });
    it('should throw an error when booking an already booked slot',()=>{
        const slot = new Slot('1', '1', new Date(), new Date(), new Date());
        slot.book();
        expect(() => slot.book()).toThrow('Slot is already booked');
    })
    it('should throw an error when releasing an already released slot', () => {
    const slot = new Slot('1', 'provider-1', new Date(), new Date(), new Date());

    // First release is invalid already
    expect(() => slot.release()).toThrow('Slot is already available');
  });
    
})