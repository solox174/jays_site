// Run with: npx tsx scripts/seed.ts
// Requires amplify sandbox to be running and amplify_outputs.json to be present.
// Safe to run once on a fresh table. Does not check for existing records.

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import {ServiceType} from "../src/lib/types";

Amplify.configure(outputs);
const client = generateClient<Schema>();

type VehicleCategory = 'coupe' | 'sedan' | 'van' | 'suv' | 'jeep' | 'truck';
type Prices = Partial<Record<VehicleCategory, number>>;

function flat(price: number): Prices {
    return { coupe: price, sedan: price, van: price, suv: price, jeep: price, truck: price };
}

const services: { name: string; description: string; serviceType: ServiceType; prices: Prices }[] = [
    {
        name: 'Basic Wash',
        description: 'Foam cannon, trash removal, vacuum and wipe down.',
        serviceType: ServiceType.FULL,
        prices: { coupe: 120, sedan: 140, van: 140, suv: 200, jeep: 120, truck: 200 }
    },
    {
        name: 'Premium Wash',
        description: 'Foam cannon, clay bar, trash removal, vacuum, shampoo, steam clean, UV protection on all plastics and rubbers.',
        serviceType: ServiceType.FULL,
        prices: { coupe: 150, sedan: 160, van: 180, suv: 250, jeep: 150, truck: 250 }
    },
    {
        name: 'Gold Wash',
        description: 'Foam cannon, clay bar, vacuum, trash removal, steam clean, extraction, shampoo, and UV protection on all plastics and rubber.',
        serviceType: ServiceType.FULL,
        prices: { coupe: 180, sedan: 180, van: 200, suv: 300, jeep: 180, truck: 300 }
    },
    {
        name: 'Interior Only',
        description: 'Vacuum, trash removal, wipe down, UV protection on all plastics and rubber.',
        serviceType: ServiceType.INTERIOR,
        // TODO: confirm van price with Jay
        prices: { coupe: 90, sedan: 100, suv: 110, jeep: 80, truck: 110 }
    },
    {
        name: 'Steam Clean',
        description: 'Full interior steam clean.',
        serviceType: ServiceType.INTERIOR,
        prices: flat(40)
    },
    {
        name: 'Shampoo',
        description: 'Interior shampoo treatment.',
        serviceType: ServiceType.INTERIOR,
        prices: { coupe: 50, sedan: 50, van: 50, suv: 70, jeep: 50, truck: 80 }
    },
    {
        name: 'Wax',
        description: 'Exterior wax protection.',
        serviceType: ServiceType.TREATMENT,
        prices: flat(60)
    },
    {
        name: 'Clay Bar',
        description: 'Paint decontamination clay bar treatment.',
        serviceType: ServiceType.TREATMENT,
        prices: flat(40)
    },
    {
        name: 'Ceramic Coating',
        description: 'Long-lasting ceramic protection for gloss, hydrophobic behavior, and easier maintenance.',
        serviceType: ServiceType.TREATMENT,
        prices: { coupe: 200, sedan: 200, van: 300, suv: 400, jeep: 300, truck: 400 }
    }
];

async function seed() {
    console.log(`Seeding ${services.length} services...\n`);

    for (const service of services) {
        const { data: serviceModel, errors } = await client.models.Service.create({
            name: service.name,
            description: service.description,
            serviceType: service.serviceType,
        });

        if (errors?.length || !serviceModel?.id) {
            console.error(`FAILED: ${service.name}`, errors);
            continue;
        }

        console.log(`+ ${service.name} (${serviceModel.id})`);

        for (const [category, price] of Object.entries(service.prices) as [VehicleCategory, number][]) {
            const { errors: priceErrors } = await client.models.ServicePrice.create({
                serviceId: serviceModel.id,
                vehicleCategory: category,
                price
            });

            if (priceErrors?.length) {
                console.error(`  FAILED price ${category}:`, priceErrors);
            } else {
                console.log(`  ${category}: $${price}`);
            }
        }
    }

    console.log('\nDone.');
}

seed().catch(console.error);