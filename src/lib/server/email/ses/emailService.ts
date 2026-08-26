import {SESClient, SendEmailCommand} from '@aws-sdk/client-ses';
import {emailConfig} from '../config';
import type {EmailService} from '../types';

const sesClient = new SESClient({region: 'us-east-1'});

export const sesEmailService: EmailService = {
    async send(to: string, subject: string, body: string): Promise<void> {
        await sesClient.send(new SendEmailCommand({
            Source: emailConfig.fromAddress,
            Destination: {ToAddresses: [to]},
            Message: {
                Subject: {Data: subject, Charset: 'UTF-8'},
                Body: {Text: {Data: body, Charset: 'UTF-8'}}
            }
        }));
    }
};
