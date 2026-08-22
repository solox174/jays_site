// Looks up a business's Google Place ID by name, for setting GOOGLE_PLACE_ID in .env.
// Run with: GOOGLE_PLACES_API_KEY=<key> npx tsx scripts/findGooglePlaceId.ts "<business name>"

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const query = process.argv[2];

if (!apiKey) {
    console.error('Set GOOGLE_PLACES_API_KEY in the environment before running this script.');
    process.exit(1);
}

if (!query) {
    console.error('Usage: GOOGLE_PLACES_API_KEY=<key> npx tsx scripts/findGooglePlaceId.ts "<business name>"');
    process.exit(1);
}

const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
    },
    body: JSON.stringify({textQuery: query})
});

if (!response.ok) {
    console.error(`Places Text Search failed: ${response.status} ${await response.text()}`);
    process.exit(1);
}

const data: {places?: {id: string; displayName: {text: string}; formattedAddress: string}[]} =
    await response.json();

if (!data.places || data.places.length === 0) {
    console.error(`No places found for "${query}".`);
    process.exit(1);
}

console.log(`Matches for "${query}":\n`);
for (const place of data.places) {
    console.log(`  ${place.displayName.text}`);
    console.log(`    ${place.formattedAddress}`);
    console.log(`    GOOGLE_PLACE_ID=${place.id}\n`);
}
