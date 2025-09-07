const fs = require('fs');
const path = require('path');

const PLACES_FILE = path.join(__dirname, 'lunch_places.json');

async function main() {
    const postUrl = process.env.SLACK_WEBHOOK_URL;
    if (!postUrl) {
        console.error('SLACK_WEBHOOK_URL environment variable missing');
        process.exit(1);
    }

    // 1. Read lunch places
    let places = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf-8'));

    // 2. find the next place to suggest:
    // first, try places that are new and don't have a timestamp
    let placeToSuggest = places.find(p => !p.lastSuggested);
    if (!placeToSuggest) {
        // take the place that was suggestested the longest time ago
        placeToSuggest = places.sort((a, b) => new Date(a.lastSuggested) - new Date(b.lastSuggested))[0];
    }

    // 3. Post to URL
    try {
        const res = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(placeToSuggest)
        });
        if (!res.ok) {
            console.log(await res.json())
            throw new Error(`HTTP error: ${res.status}`);
        }
        console.log('Posted lunch place:', placeToSuggest.name);
    } catch (err) {
        console.error('Error posting to URL:', err);
        process.exit(1);
    }

    // 4. Update lastSuggested
    placeToSuggest.lastSuggested = new Date().toISOString();

    // 5. Save back to file
    fs.writeFileSync(PLACES_FILE, JSON.stringify(places, null, 2));

}

main();
