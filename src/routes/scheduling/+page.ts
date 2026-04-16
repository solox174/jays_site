import type { PageLoad } from './$types';
import type { Schema } from '../../../amplify/data/resource';
// import { amplifyClient } from '$lib/api/amplifyClient';

export const load: PageLoad = () => {
    const fakeAppointmentsPromise = Promise.resolve<Schema['Appointment']['createType'][]>([
        {
            id: 'appt-001',
            customerId: 'customer-001',
            vehicleId: 'vehicle-001',
            date: new Date(Date.now()).toISOString()
        }
    ]);

    const fakeServicesPromise = Promise.resolve<Schema['Service']['createType'][]>([
        {
            id: 'basic-wash',
            name: 'Basic Wash',
            description: 'Exterior hand wash, wheel rinse, towel dry, and basic glass cleanup.',
            price: 25,
            addon: false
        },
        {
            id: 'full-wash',
            name: 'Full Wash',
            description: 'Exterior wash, wheels and tires cleaned, spray protectant, door jamb wipe-down, and glass.',
            price: 45,
            addon: false
        },
        {
            id: 'full-detail',
            name: 'Full Detail',
            description: 'Comprehensive interior and exterior detail including vacuum, wipe-down, wash, and finishing touches.',
            price: 180,
            addon: false
        },
        {
            id: 'ceramic-coating',
            name: 'Ceramic Coating',
            description: 'Paint prep and long-lasting ceramic protection for gloss, hydrophobic behavior, and easier maintenance.',
            price: 650,
            addon: true
        }
    ]);

    const dataPromise = Promise.all([fakeAppointmentsPromise, fakeServicesPromise]).then(
        ([appointments, backendServices]) => {
            const services: Schema['Service']['createType'][] = backendServices.map((service) => ({
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.price,
                addon: service.addon
            }));

            return {
                appointments,
                services
            };
        }
    );

    return {
        deferred: {
            data: dataPromise
        }
    };
};