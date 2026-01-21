import {Appointment} from './appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';


describe( 'Appointment entity', () => {
    it('should create an appointment with default status Confirmed ', () => {
        const appointment = new Appointment('1', '1', '1');
        expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
        expect(appointment.slotId).toBe('1');
        expect(appointment.clientId).toBe('1');

    })


    it('should cancel an appointment', () => {
        const appointment = new Appointment('1', '1', '1');
        appointment.cancel();
        expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
    })

    it('should throw an error when canceling an already cancelled appointment', () => {
        const appointment = new Appointment('1', '1', '1');
        appointment.cancel();
        expect(() => appointment.cancel()).toThrow('Appointment is already cancelled');
    })

    it('should reschedule an appointment', () => {
        const appointment = new Appointment('1', '1', '1');
        appointment.reschedule();
        expect(appointment.status).toBe(AppointmentStatus.RESCHEDULED);
    })
    
})