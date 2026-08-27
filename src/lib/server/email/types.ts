export interface EmailService {
    send(to: string, subject: string, body: string, from?: string): Promise<void>;
}
