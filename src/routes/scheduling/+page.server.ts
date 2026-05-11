import type { Actions } from './$types';

// TODO: use `@aws-sdk/client-sns` to send SMS with appointment details to Jay
// TODO: Add UI feedback to customer on error
export const actions = {
    default: async ({request}) => {
        let x = await request.formData()
        let i = 0;
    }
} satisfies Actions;