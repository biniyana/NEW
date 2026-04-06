import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
console.log('URL', url);
console.log('KEY', key && key.substring(0, 20) + '...');

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase.from('users').select('*').limit(1);
if (error) {
  console.error('error', error);
  process.exit(1);
}
console.log('success', data);
