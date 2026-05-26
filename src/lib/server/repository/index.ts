import {customerRepository} from './amplify/customerRepository';
import {appointmentRepository} from './amplify/appointmentRepository';
import {vehicleRepository} from './amplify/vehicleRepository';
import {serviceRepository} from './amplify/serviceRepository';
import {appointmentServiceRepository} from './amplify/appointmentServiceRepository';

// To swap backends: replace these imports with a different implementation folder
// (e.g. './postgres/customerRepository') — no other files need to change.
export const repositories = {
    customers: customerRepository,
    appointments: appointmentRepository,
    vehicles: vehicleRepository,
    services: serviceRepository,
    appointmentServices: appointmentServiceRepository
};