import { generateClient } from "aws-amplify/data";
import type { Schema } from "$lib/../../amplify/data/resource";
import { readable } from "svelte/store";

class AppointmentClient {
    client: ReturnType<typeof generateClient<Schema>>;

    constructor() {
        this.client = generateClient<Schema>();
    }
    async getAppointments() {
        return this.client.models.Appointment.list();
    }
}

let appointmentClient = readable(new AppointmentClient());

export { appointmentClient };