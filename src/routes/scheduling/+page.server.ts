import { appointmentClient } from "$lib/server/service/appointment";
import { get } from "svelte/store";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
    return { appointments: get(appointmentClient).getAppointments() };
}
