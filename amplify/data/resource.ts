import { a, type ClientSchema, defineData } from '@aws-amplify/backend';

const schema = a.schema({
    Customer: a
        .model({
            firstName: a.string(),
            lastName: a.string().required(),
            phoneNumber: a.phone().required(),
            email: a.email().required(),
            password: a.string().required(),
            appointments: a.hasMany('Appointment', 'customerId')
        })
        .authorization((allow) => [allow.guest()]),

    VehicleSpec: a
        .model({
            make: a.string().required(),
            model: a.string().required(),
            year: a.string().required(),
            appointments: a.hasMany('Appointment', 'vehicleId')
        })
        .authorization((allow) => [allow.guest()]),

    Appointment: a
        .model({
            customerId: a.id().required(),
            customer: a.belongsTo('Customer', 'customerId'),
            vehicleId: a.id().required(),
            vehicle: a.belongsTo('VehicleSpec', 'vehicleId'),
            date: a.datetime().required(),
            appointmentServices: a.hasMany('AppointmentService', 'appointmentId')
        })
        .authorization((allow) => [allow.guest()]),

    Service: a
        .model({
            name: a.string().required(),
            description: a.string().required(),
            price: a.float().required(),
            addon: a.boolean().required(),
            appointmentServices: a.hasMany('AppointmentService', 'serviceId')
        })
        .authorization((allow) => [allow.guest()]),

    AppointmentService: a
        .model({
            appointmentId: a.id().required(),
            appointment: a.belongsTo('Appointment', 'appointmentId'),
            serviceId: a.id().required(),
            service: a.belongsTo('Service', 'serviceId')
        })
        .authorization((allow) => [allow.guest()]),

    Session: a
        .model({
            sub: a.string().required(),
            email: a.string(),
            expiresAt: a.datetime().required(),
        })
        .authorization((allow) => [allow.guest()])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'identityPool'
    }
});