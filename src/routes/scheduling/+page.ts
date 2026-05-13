import type { PageLoad } from './$types';
import { amplifyClient } from '../../lib/client/amplifyClient';

export const load: PageLoad = () => {
    const dataPromise = Promise.all([
        amplifyClient.models.Appointment.list(),
        amplifyClient.models.Service.list(),
        amplifyClient.models.ServicePrice.list()
    ]).then(([appointmentsResult, servicesResult, servicePricesResult]) => ({
        appointments: appointmentsResult.data,
        services: servicesResult.data,
        servicePrices: servicePricesResult.data
    }));

    return {
        deferred: {
            data: dataPromise
        }
    };
};