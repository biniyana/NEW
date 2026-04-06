import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function diagnose() {
  try {
    console.log('🔍 Detailed Supabase Diagnostic\n');

    // Check requests
    const { data: requests, error: requestsError, count: requestsCount } = await supabase
      .from('requests')
      .select('id, type, status', { count: 'exact' });
    
    console.log('📋 Requests:');
    if (requestsError) {
      console.log('  ❌ Error:', requestsError.message);
    } else {
      console.log(`  ✅ Count: ${requestsCount}`);
      if (requests) {
        requests.slice(0, 3).forEach(r => console.log(`    - ${r.type} (${r.status})`));
      }
    }

    // Check rates
    const { data: rates, error: ratesError, count: ratesCount } = await supabase
      .from('rates')
      .select('id, material, price_per_kg', { count: 'exact' });
    
    console.log('\n💰 Rates:');
    if (ratesError) {
      console.log('  ❌ Error:', ratesError.message);
    } else {
      console.log(`  ✅ Count: ${ratesCount}`);
      if (rates && rates.length > 0) {
        rates.slice(0, 5).forEach(r => console.log(`    - ${r.material}: ${r.price_per_kg}`));
      } else {
        console.log('  (No rates found)');
      }
    }

    // Check messages
    const { data: messages, error: messagesError, count: messagesCount } = await supabase
      .from('messages')
      .select('id, sender_name, content', { count: 'exact' });
    
    console.log('\n💬 Messages:');
    if (messagesError) {
      console.log('  ❌ Error:', messagesError.message);
    } else {
      console.log(`  ✅ Count: ${messagesCount}`);
      if (messages) {
        messages.slice(0, 2).forEach(m => console.log(`    - From ${m.sender_name}: "${m.content.substring(0, 50)}..."`));
      }
    }

    console.log('\n✅ Diagnostic complete!\n');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

diagnose();
