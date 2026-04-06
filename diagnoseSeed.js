import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

console.log('🔍 Supabase Diagnostic Check');
console.log('=============================\n');
console.log('URL:', url);
console.log('KEY:', key ? key.substring(0, 30) + '...' : 'MISSING');

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function diagnose() {
  try {
    // Check if users table exists and has data
    console.log('\n📋 Checking tables...\n');
    
    const tables = ['users', 'items', 'requests', 'messages', 'rates', 'reviews', 'chatbot_conversations'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: TABLE NOT FOUND`);
        } else {
          console.log(`✅ ${table}: Exists (${count || 0} rows)`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ERROR - ${e.message}`);
      }
    }

    // Check users data in detail
    console.log('\n👥 Users in Database:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, userType');
    
    if (usersError) {
      console.log('❌ Could not fetch users:', usersError.message);
    } else if (users && users.length > 0) {
      users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.userType}]`));
    } else {
      console.log('  (No users found)');
    }

    // Check items data
    console.log('\n📦 Items in Database:');
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, title, category, sellerId');
    
    if (itemsError) {
      console.log('❌ Could not fetch items:', itemsError.message);
    } else if (items && items.length > 0) {
      items.forEach(i => console.log(`  - ${i.title} (${i.category})`));
    } else {
      console.log('  (No items found)');
    }

    // Check requests data
    console.log('\n📩 Requests in Database:');
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select('id, type, status, requesterId');
    
    if (requestsError) {
      console.log('❌ Could not fetch requests:', requestsError.message);
    } else if (requests && requests.length > 0) {
      requests.forEach(r => console.log(`  - ${r.type} (${r.status})`));
    } else {
      console.log('  (No requests found)');
    }

    console.log('\n✅ Diagnostic complete!\n');
  } catch (e) {
    console.error('❌ Diagnostic failed:', e.message);
    process.exit(1);
  }
}

diagnose();
