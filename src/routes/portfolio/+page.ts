import type {PageLoad} from './$types';
import {getPortfolio} from '$lib/portfolio';

export const load: PageLoad = async ({fetch}) => ({
    pairs: await getPortfolio(fetch)
});