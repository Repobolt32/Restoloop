import fs from 'fs';

// Load env vars manually from .env.local since dotenv might not be available
const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => {
            const parts = line.split('=');
            return [parts[0].trim(), parts.slice(1).join('=').trim()];
        })
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function checkSlugs() {
    console.log('Fetching from', url);
    try {
        const res = await fetch(`${url}/rest/v1/tenants?select=id,name,slug`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        if (!res.ok) {
            console.error('Failed', await res.text());
            return;
        }

        const data = await res.json();
        console.table(data);
    } catch (e) {
        console.error(e);
    }
}

checkSlugs();
