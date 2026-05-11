import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const DETAILING_VEHICLE_TYPES = ['Passenger Car', 'Multipurpose Passenger Vehicle', 'Truck'];
const MODEL_YEAR = 2025;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 300;

const OUT_DIR = join(process.cwd(), 'static/vehicle-data');
const MODELS_DIR = join(OUT_DIR, 'models');

function makeToFilename(make: string): string {
    return make.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchMakes(): Promise<string[]> {
    const makeMap = new Map<number, string>();

    for (const vehicleType of DETAILING_VEHICLE_TYPES) {
        const res = await fetch(
            `${VPIC_BASE_URL}/GetMakesForVehicleType/${encodeURIComponent(vehicleType)}?format=json`
        );
        if (!res.ok) throw new Error(`Failed to fetch makes for type "${vehicleType}": ${res.status}`);
        const data: { Results: { MakeId: number; MakeName: string }[] } = await res.json();
        for (const make of data.Results) {
            makeMap.set(make.MakeId, make.MakeName);
        }
    }

    return Array.from(makeMap.values()).sort((a, b) => a.localeCompare(b));
}

async function fetchModels(make: string): Promise<string[]> {
    const res = await fetch(
        `${VPIC_BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${MODEL_YEAR}?format=json`
    );
    if (!res.ok) throw new Error(`Failed to fetch models for "${make}": ${res.status}`);
    const data: { Results: { Model_Name: string }[] } = await res.json();
    return [...new Set(data.Results.map(m => m.Model_Name))].sort((a, b) => a.localeCompare(b));
}

async function processBatch(makes: string[], batchIndex: number, total: number) {
    await Promise.all(
        makes.map(async (make) => {
            try {
                const models = await fetchModels(make);
                const filename = makeToFilename(make);
                writeFileSync(join(MODELS_DIR, `${filename}.json`), JSON.stringify(models));
                process.stdout.write(`  ✓ ${make} (${models.length} models)\n`);
            } catch (err) {
                process.stdout.write(`  ✗ ${make}: ${err instanceof Error ? err.message : err}\n`);
            }
        })
    );
}

async function main() {
    mkdirSync(MODELS_DIR, { recursive: true });

    console.log('Fetching makes...');
    const makes = await fetchMakes();
    console.log(`Found ${makes.length} makes. Writing makes.json...`);
    writeFileSync(join(OUT_DIR, 'makes.json'), JSON.stringify(makes));

    console.log(`\nFetching models for ${MODEL_YEAR} (${BATCH_SIZE} at a time)...`);
    for (let i = 0; i < makes.length; i += BATCH_SIZE) {
        const batch = makes.slice(i, i + BATCH_SIZE);
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(makes.length / BATCH_SIZE)}`);
        await processBatch(batch, i, makes.length);
        if (i + BATCH_SIZE < makes.length) await sleep(BATCH_DELAY_MS);
    }

    console.log('\nDone.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});