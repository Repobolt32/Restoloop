const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oggwcgygkwxywmjdnaef.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ3djZ3lna3d4eXdtamRuYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3Nzc0MywiZXhwIjoyMDg4NDUzNzQzfQ.mMfcUalFBuGlTfQeJffTc8QWEbivkhG-wCWpq_mqM2k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }
    if (data.users.length > 0) {
        console.log('USER_ID:', data.users[0].id);
        console.log('EMAIL:', data.users[0].email);
    } else {
        console.log('No users found.');
    }
}

main();
