import {emailService} from '$lib/server/email';
import {repositories} from '$lib/server/storage';
import {BUSINESS_TIMEZONE} from '$lib/shared/businessTime';
import {PUBLIC_BUSINESS_NAME, PUBLIC_BUSINESS_OWNER_PHONE} from '$env/static/public';

async function getAppointmentEmailData(appointmentId: string) {
    const appointment = await repositories.appointments.getById(appointmentId);

    let customer;
    if (appointment?.customerId) {
        customer = await repositories.customers.getById(appointment?.customerId);
    }

    let vehicle;
    if (appointment?.vehicleId) {
        vehicle = await repositories.vehicles.getById(appointment?.vehicleId);
    }

    const services = await repositories.appointments.getServices(appointmentId);

    // Without an explicit timeZone this reads whatever zone the Lambda happens to run
    // in (UTC), not the business's — the same class of bug fixed in scheduling.
    const formattedDate = appointment ? new Date(appointment.date).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: BUSINESS_TIMEZONE,
    }) : '';

    const servicesText = services.map(s => s.name).join('\n');

    return { appointment, customer, vehicle, services, formattedDate, servicesText };
}

export async function appointmentNotificationEmail(email: string, appointmentId: string): Promise<void> {
    const { appointment, customer, vehicle, formattedDate, servicesText } = await getAppointmentEmailData(appointmentId);
    if (appointment) {

        const body = `
Please reach out to the customer to confirm their appointment.
A new appointment has been booked with the following details:

Customer: ${customer?.firstName} ${customer?.lastName}
Phone: ${customer?.phoneNumber}
Email: ${customer?.email}

Vehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}

Services:
${servicesText}

Appointment Time: ${formattedDate}
`;
        const subject = 'New Appointment Booked';
        return sendEmail(email, body, subject);
    }
}

export async function appointmentConfirmationEmail(email: string, appointmentId: string): Promise<void> {
    const { appointment, customer, vehicle, formattedDate, servicesText } = await getAppointmentEmailData(appointmentId);
    if (appointment) {

        const body = `
Hi ${customer?.firstName},

Thanks for booking with ${PUBLIC_BUSINESS_NAME}! Your appointment has been confirmed.

Here are your appointment details:

Date & Time: ${formattedDate}

Vehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}

Services:
${servicesText}

If you have any questions or need to reschedule, feel free to reach out at ${PUBLIC_BUSINESS_OWNER_PHONE}.

We'll see you soon!
${PUBLIC_BUSINESS_NAME}
`;
        const subject = `Your appointment is confirmed - ${PUBLIC_BUSINESS_NAME}`;
        return sendEmail(email, body, subject);
    }
}

export async function sendEmail(email: string, body: string, subject: string): Promise<void> {
    await emailService.send(email, subject, body);
}
