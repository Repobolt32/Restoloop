const URL = 'https://oggwcgygkwxywmjdnaef.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ3djZ3lna3d4eXdtamRuYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3Nzc0MywiZXhwIjoyMDg4NDUzNzQzfQ.mMfcUalFBuGlTfQeJffTc8QWEbivkhG-wCWpq_mqM2k';

async function purge() {
    const phone = '%2B917542011085';

    // 1. Check if it exists
    let res = await fetch(`${URL}/rest/v1/customers?phone=eq.${phone}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    let data = await res.json();
    console.log("Found records before delete:", data.length);

    if (data.length > 0) {
        // 2. Delete it
        let delRes = await fetch(`${URL}/rest/v1/customers?phone=eq.${phone}`, {
            method: 'DELETE',
            headers: {
                apikey: KEY,
                Authorization: `Bearer ${KEY}`,
                'Prefer': 'return=representation'
            }
        });
        let delData = await delRes.json();
        console.log("Deleted records:", delData.length);
    }
}
purge();
