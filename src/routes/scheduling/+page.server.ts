import type { Actions } from './$types';

// TODO: use `@aws-sdk/client-ses` to send email with appointment details to Jay and confirmation email to customer
// TODO: Add UI feedback to customer on error
// TODO: ADD appointment confirmation message to confirm appointment "Your appointment is confirmed for May 20th at 10AM"
export const actions = {
    default: async ({request}) => {
        let x = await request.formData()
        let i = 0;
    }
} satisfies Actions;