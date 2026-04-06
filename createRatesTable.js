import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

async function createRatesTable() {
  try {
    console.log('📊 Creating rates table in Supabase...\n');

    const sql = `
      CREATE TABLE IF NOT EXISTS rates (
        id VARCHAR PRIMARY KEY,
        material TEXT NOT NULL,
        price_per_kg TEXT NOT NULL,
        unit TEXT DEFAULT 'kg',
        icon TEXT DEFAULT '📦',
        category TEXT,
        junkshop_id VARCHAR NOT NULL,
        junkshop_name TEXT NOT NULL,
        seller_id VARCHAR,
        seller_name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_rates_junkshop_id ON rates(junkshop_id);
      CREATE INDEX IF NOT EXISTS idx_rates_seller_id ON rates(seller_id);
    `;

    // Use Supabase RPC or direct query (if available via admin API)
    // For now, we'll try via auth-as-admin by creating raw query
    const { data, error } = await supabase.rpc('exec', { sql });
    
    if (error && error.message.includes('function')) {
      console.warn('⚠️  Direct SQL RPC not available, trying alternative method...\n');
      
      // Try creating via regular API by inserting placeholder and checking schema
      const { error: checkError } = await supabase
        .from('rates')
        .select('count(*)', { count: 'exact', head: true });
      
      if (checkError && checkError.message.includes('does not exist')) {
        console.log('❌ Rates table still does not exist.');
        console.log('\n⚠️  MANUAL ACTION REQUIRED:');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log('');
        console.log(sql);
        console.log('');
        process.exit(1);
      }
    } else if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Rates table created successfully!');
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

createRatesTable();
