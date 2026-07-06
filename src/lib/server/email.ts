import {SESClient, SendEmailCommand} from '@aws-sdk/client-ses';
import {appointmentRepository} from '$lib/server/repository/amplify/appointmentRepository';
import {customerRepository} from '$lib/server/repository/amplify/customerRepository';
import {vehicleRepository} from '$lib/server/repository/amplify/vehicleRepository';

const sesClient = new SESClient({ region: 'us-east-1' });

async function getAppointmentEmailData(appointmentId: string) {
    const appointment = await appointmentRepository.getById(appointmentId, true);

    let customer;
    if (appointment?.customerId) {
        customer = await customerRepository.getById(appointment?.customerId, false);
    }

    let vehicle;
    if (appointment?.vehicleId) {
        vehicle = await vehicleRepository.getById(appointment?.vehicleId, false);
    }

    const services = await appointmentRepository.getServices(appointmentId);

    const formattedDate = appointment ? new Date(appointment.date).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
    }) : '';

    const servicesText = services
        .map(s => s.name)
        .join('\n');

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
    // TODO: (email notifications) Email should contain selected services and price.
    const { appointment, customer, vehicle, formattedDate, servicesText } = await getAppointmentEmailData(appointmentId);
    if (appointment) {

        const body = `
Hi ${customer?.firstName},

Thanks for booking with Jay's Auto Detailing! Your appointment has been confirmed.

Here are your appointment details:

Date & Time: ${formattedDate}

Vehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}

Services:
${servicesText}

If you have any questions or need to reschedule, feel free to reach out.

We'll see you soon!
Jay's Auto Detailing
`;
        const subject = 'Your appointment is confirmed - Jays Auto Detailing';
        return sendEmail(email, body, subject);
    }
}

export async function sendEmail(email: string, body: string, subject: string): Promise<void> {
    const input = {
        Source:"thatslowaudi@gmail.com",
        Destination: {
            ToAddresses:[email],
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: "UTF-8"
            },
            Body:{
                Text: {
                    Data: body,
                    Charset: "UTF-8"
                }

            }
        }
    }
    const command = new SendEmailCommand(input);
    await sesClient.send(command);
}
