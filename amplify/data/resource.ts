import { a, type ClientSchema, defineData } from '@aws-amplify/backend';

const schema = a.schema({
    VehicleCategory: a.enum(['coupe', 'sedan', 'van', 'suv', 'jeep', 'truck']),


    Customer: a
        .model({
            firstName: a.string(),
            lastName: a.string().required(),
            phoneNumber: a.phone().required(),
            email: a.email().required(),
            password: a.string().required(),
            appointments: a.hasMany('Appointment', 'customerId')
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live,

    VehicleSpec: a
        .model({
            make: a.string().required(),
            model: a.string().required(),
            year: a.string().required(),
            appointments: a.hasMany('Appointment', 'vehicleId')
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live,

    Appointment: a
        .model({
            customerId: a.id().required(),
            customer: a.belongsTo('Customer', 'customerId'),
            vehicleId: a.id().required(),
            vehicle: a.belongsTo('VehicleSpec', 'vehicleId'),
            date: a.datetime().required(),
            appointmentServices: a.hasMany('AppointmentService', 'appointmentId')
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live,

    Service: a
        .model({
            name: a.string().required(),
            description: a.string().required(),
            isPackage: a.boolean().required(),
            prices: a.hasMany('ServicePrice', 'serviceId'),
            appointmentServices: a.hasMany('AppointmentService', 'serviceId')
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live,

    ServicePrice: a
        .model({
            serviceId: a.id().required(),
            service: a.belongsTo('Service', 'serviceId'),
            vehicleCategory: a.ref('VehicleCategory').required(),
            price: a.float().required()
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live,

    AppointmentService: a
        .model({
            appointmentId: a.id().required(),
            appointment: a.belongsTo('Appointment', 'appointmentId'),
            serviceId: a.id().required(),
            service: a.belongsTo('Service', 'serviceId')
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live,

    Session: a
        .model({
            sub: a.string().required(),
            email: a.string(),
            expiresAt: a.datetime().required(),
        })
        .authorization((allow) => [allow.guest()]), // TODO: replace with allow.authenticated() once auth is live
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'identityPool'
    }
});