const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = 'postgresql://postgres:Restoloop%402032@db.oggwcgygkwxywmjdnaef.supabase.co:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database successfully.');

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '009_pricing_slice.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration 009...');
    await client.query(sql);
    console.log('Migration 009 applied successfully!');

    console.log('Reloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Schema cache reload notified successfully!');
  } catch (error) {
    console.error('Error applying migration 009:', error);
  } finally {
    await client.end();
  }
}

run();
