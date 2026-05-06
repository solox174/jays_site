import type { Actions } from './$types';

export const actions = {
    default: async ({request}) => {
        let x = await request.formData()
        let i = 0;
    }
} satisfies Actions;