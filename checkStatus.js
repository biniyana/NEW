import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function finalCheck() {
  try {
    console.log('✅ FINAL SEEDING STATUS\n');
    console.log('=======================\n');

    const { data: users, count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    console.log(`✅ Users: ${usersCount || 0}`);
    if (users) {
      users.forEach(u => console.log(`   - ${u.name}`));
    }

    const { data: items, count: itemsCount } = await supabase
      .from('items')
      .select('*', { count: 'exact' });
    console.log(`\n✅ Items: ${itemsCount || 0}`);
    if (items) {
      items.forEach(i => console.log(`   - ${i.title}`));
    }

    const { data: requests, count: requestsCount } = await supabase
      .from('requests')
      .select('*', { count: 'exact' });
    console.log(`\n✅ Household Posts/Requests: ${requestsCount || 0}`);
    if (requests) {
      requests.forEach(r => console.log(`   - ${r.type}: "${r.items.substring(0, 40)}..." (${r.status})`));
    }

    const { data: messages, count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact' });
    console.log(`\n✅ Messages/Chat: ${messagesCount || 0}`);
    if (messages) {
      messages.forEach(m => console.log(`   - ${m.sender_name}: "${m.content.substring(0, 40)}..."`));
    }

    // Check rates
    const { data: rates, error: ratesError, count: ratesCount } = await supabase
      .from('rates')
      .select('*', { count: 'exact' });
    
    if (ratesError && ratesError.message.includes('does not exist')) {
      console.log('\n❌ Market Rates/Prices: TABLE DOES NOT EXIST YET');
      console.log('\n   ACTION REQUIRED:');
      console.log('   1. Open: https://supabase.com/dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Run this SQL:');
      console.log('');
      console.log('   CREATE TABLE IF NOT EXISTS rates (');
      console.log('     id VARCHAR PRIMARY KEY,');
      console.log('     material TEXT NOT NULL,');
      console.log('     price_per_kg TEXT NOT NULL,');
      console.log('     unit TEXT DEFAULT "kg",');
      console.log('     junkshop_id VARCHAR NOT NULL,');
      console.log('     junkshop_name TEXT NOT NULL,');
      console.log('     created_at TIMESTAMP DEFAULT NOW()');
      console.log('   );');
      console.log('   CREATE INDEX idx_rates_junkshop_id ON rates(junkshop_id);');
      console.log('');
      console.log('   4. After table creation, run: node seedAll.js');
    } else if (ratesError) {
      console.log(`\n⚠️  Rates Error: ${ratesError.message}`);
    } else {
      console.log(`\n✅ Market Rates/Prices: ${ratesCount || 0}`);
      if (rates) {
        rates.forEach(r => console.log(`   - ${r.material}: ${r.price_per_kg} per ${r.unit}`));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ SEEDING STATUS SUMMARY');
    console.log('='.repeat(50));
    console.log(`
Your app now has:
- ${usersCount || 0}/2 Users ✅
- ${itemsCount || 0}/3 Items ✅  
- ${requestsCount || 0}/2 Household Posts ✅
- ${messagesCount || 0}/2 Chat Messages ✅
- ${ratesCount || 0}/5 Market Rates ${ratesCount > 0 ? '✅' : '❌ (Create table first)'}

You can now see:
${requestsCount > 0 ? '✅ Household posts' : '❌ Household posts'}
${ratesCount > 0 ? '✅ Rate list' : '❌ Rate list'}
✅ Marketplace items
✅ Chat messages
${usersCount > 0 ? '✅ User profiles' : '❌ User profiles'}
    `);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

finalCheck();
