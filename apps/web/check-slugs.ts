import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching tenants...');
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug');

    if (error) {
        console.error('Error fetching tenants:', error);
        process.exit(1);
    }

    console.log('Tenants:');
    console.table(data);
}

main();
