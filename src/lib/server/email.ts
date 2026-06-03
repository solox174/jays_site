import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: 'us-east-1' });

export async function sendEmail(customerEmail: string): Promise<void> {
    const input = {
        Source:"thatslowaudi@gmail.com",
        Destination: {
            ToAddresses:[customerEmail],
        },
        Message: {
            Subject: {
                Data: "Test Email",
                Charset: "UTF-8"
            },
            Body:{
                Text: {
                    Data: "This is a test email from Jay's Auto Detailing!",
                    Charset: "UTF-8"
                }

            }
        }
    }
    const command = new SendEmailCommand(input);
    await sesClient.send(command);

}