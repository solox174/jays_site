import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: 'us-east-1' });

export async function appointmentNotificationEmail(email: string): Promise<void> {
    // TODO: use string template to create HTML body with the appointment details, get the email to send HTML
    //       use email should contain vehicle,selected services and appointment time
    const body = '';
    const subject = '';
    return sendEmail(email, body, subject);
}

export async function appointmentConfirmationEmail(email: string): Promise<void> {
    // TODO: Email should contain selected services and price.
    const body = '';
    const subject = '';
    return sendEmail(email, body, subject);
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
