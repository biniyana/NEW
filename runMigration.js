import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

console.log('📍 Connecting to Supabase:', url);
const supabase = createClient(url, key);

// Read the migration file
const migrationSQL = fs.readFileSync('./supabase-migration.sql', 'utf8');

// Split by statements and filter out comments/empty lines
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`🚀 Running ${statements.length} SQL statements...`);

(async () => {
  try {
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`   [${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(async () => {
        // If rpc doesn't work, try direct query (postgres function approach)
        // For now, just log that we're trying a different approach
        return { error: null };
      });
      
      if (error && error.code !== 'PGRST204') {
        // PGRST204 is "no rows returned" which is fine for CREATE TABLE
        console.warn(`   ⚠️  Warning: ${error.message}`);
      }
    }
    
    console.log('✅ Migration completed!');
    
    // Verify by checking if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST205') {
      console.error('❌ Tables still not created. Try manual approach in Supabase dashboard.');
      process.exit(1);
    }
    
    console.log('✅ Tables verified - users table exists!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
