const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    console.log('--- Matching Users ---');
    const targetUser = users.find(u => u.email === 'e2e-test@restoloop.com');
    if (targetUser) {
      console.log(`Email: e2e-test@restoloop.com, ID: ${targetUser.id}`);
      
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', targetUser.id);
      
      if (error) {
        console.error('Error fetching restaurants:', error);
      } else {
        console.log('\n--- Restaurants Owned by e2e-test ---');
        restaurants.forEach(r => {
          console.log(`ID: ${r.id}, Name: ${r.name}, Slug: ${r.slug}, Plan: ${r.plan}, Credits: ${r.credits}, Created At: ${r.created_at}`);
        });
      }
    } else {
      console.log('User e2e-test@restoloop.com not found in Auth!');
    }
  } catch (err) {
    console.error(err);
  }
}

check();
