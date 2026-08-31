import { a, type ClientSchema, defineData } from '@aws-amplify/backend';

const schema = a.schema({
    VehicleCategory: a.enum(['coupe', 'sedan', 'van', 'suv', 'jeep', 'truck']),
    ServiceType: a.enum(['FULL', 'INTERIOR', 'TREATMENT']),
    // Not a boolean: same cost today, avoids a real migration if a third role type is
    // ever needed (this app is a reusable template — see docs/project_intent).
    UserRole: a.enum(['customer', 'admin']),

    Customer: a
        .model({
            firstName: a.string(),
            lastName: a.string().required(),
            phoneNumber: a.phone().required(),
            email: a.email().required(),
            password: a.string().required(),
            // Toggled directly in the Amplify Data console — no in-app role-management
            // UI. See src/routes/admin/+layout.server.ts for how this gates /admin/*.
            // Optional, not required+default: RefType (enum refs) has no .default() —
            // customerRepository.ts's toCustomer() treats a missing role as 'customer'
            // uniformly for both pre-existing rows and newly created ones.
            role: a.ref('UserRole'),
            appointments: a.hasMany('Appointment', 'customerId')
        })
        .authorization((allow) => [allow.publicApiKey()]),

    VehicleSpec: a
        .model({
            year: a.string().required(),
            make: a.string().required(),
            model: a.string().required(),
            appointments: a.hasMany('Appointment', 'vehicleId')
        })
        .authorization((allow) => [allow.publicApiKey()]),

    Appointment: a
        .model({
            customerId: a.id().required(),
            vehicleId: a.id().required(),
            date: a.datetime().required(),
            customer: a.belongsTo('Customer', 'customerId'),
            vehicle: a.belongsTo('VehicleSpec', 'vehicleId'),
            appointmentServices: a.hasMany('AppointmentService', 'appointmentId')
        })
        .authorization((allow) => [allow.publicApiKey()]),

    Service: a
        .model({
            name: a.string().required(),
            description: a.string().required(),
            serviceType: a.ref('ServiceType').required(),
            prices: a.hasMany('ServicePrice', 'serviceId'),
            appointmentServices: a.hasMany('AppointmentService', 'serviceId')
        })
        .authorization((allow) => [allow.publicApiKey()]),

    ServicePrice: a
        .model({
            serviceId: a.id().required(),
            vehicleCategory: a.ref('VehicleCategory').required(),
            price: a.float().required(),
            service: a.belongsTo('Service', 'serviceId'),
        })
        .authorization((allow) => [allow.publicApiKey()]),

    AppointmentService: a
        .model({
            appointmentId: a.id().required(),
            serviceId: a.id().required(),
            appointment: a.belongsTo('Appointment', 'appointmentId'),
            service: a.belongsTo('Service', 'serviceId')
        })
        .authorization((allow) => [allow.publicApiKey()]),

    Session: a
        .model({
            sub: a.string().required(),
            email: a.string(),
            expiresAt: a.datetime().required(),
        })
        .authorization((allow) => [allow.publicApiKey()]),

    // Single-row cache of the last successful Google Places API response, shared across
    // all server instances (a per-process in-memory cache wouldn't be, under serverless
    // SSR) so the paid Places API is called at most once per TTL window regardless of
    // traffic. See $lib/server/reviews/withCache.ts.
    GoogleReviewsCache: a
        .model({
            payload: a.string().required(),
            fetchedAt: a.datetime().required(),
        })
        .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'apiKey',
        apiKeyAuthorizationMode: {
            expiresInDays: 365,
        },
    },
});