import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedAllData() {
  try {
    console.log('🌱 Starting Full Seed Data Population...\n');

    // 1. Get or create users
    console.log('📝 Step 1: Ensuring users exist...');
    
    const household = {
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+63 917 123 4567",
      address: "123 Session Road, Baguio City",
      password: "password123",
      user_type: "household",
    };

    const junkshop = {
      name: "Caniezo Junkshop",
      email: "caniezojunkshop@gmail.com",
      phone: "+63 917 765 4321",
      address: "456 Burnham Park Area, Baguio City",
      password: "password123",
      user_type: "junkshop",
      latitude: 16.4023,
      longitude: 120.596,
    };

    // Fetch existing users
    let householdUser = (await supabase
      .from('users')
      .select('*')
      .eq('email', household.email)
      .single()).data;

    if (!householdUser) {
      const { data } = await supabase
        .from('users')
        .insert(household)
        .select()
        .single();
      householdUser = data;
      console.log('  ✅ Created household user:', householdUser.name);
    } else {
      console.log('  ✅ Household user exists:', householdUser.name);
    }

    let junkshopUser = (await supabase
      .from('users')
      .select('*')
      .eq('email', junkshop.email)
      .single()).data;

    if (!junkshopUser) {
      const { data } = await supabase
        .from('users')
        .insert(junkshop)
        .select()
        .single();
      junkshopUser = data;
      console.log('  ✅ Created junkshop user:', junkshopUser.name);
    } else {
      console.log('  ✅ Junkshop user exists:', junkshopUser.name);
    }

    // 2. Ensure items exist
    console.log('\n📦 Step 2: Ensuring items exist...');
    const existingItems = (await supabase
      .from('items')
      .select('id')
      .eq('seller_id', junkshopUser.id)
      .limit(1)).data;

    if (!existingItems || existingItems.length === 0) {
      const items = [
        {
          id: randomUUID(),
          title: "Plastic Bottles (50pcs)",
          category: "Plastic",
          price: "₱150",
          description: "Clean PET plastic bottles, various sizes",
          emoji: "🍾",
          seller_id: junkshopUser.id,
          seller_name: junkshopUser.name,
          status: "available",
        },
        {
          id: randomUUID(),
          title: "Newspapers Bundle",
          category: "Paper",
          price: "₱80",
          description: "Bundle of newspapers, approximately 10kg",
          emoji: "📰",
          seller_id: junkshopUser.id,
          seller_name: junkshopUser.name,
          status: "available",
        },
        {
          id: randomUUID(),
          title: "Aluminum Cans (30pcs)",
          category: "Metal",
          price: "₱120",
          description: "Crushed aluminum soda cans",
          emoji: "🥫",
          seller_id: junkshopUser.id,
          seller_name: junkshopUser.name,
          status: "available",
        },
      ];
      await supabase.from('items').insert(items);
      console.log(`  ✅ Created ${items.length} items`);
    } else {
      console.log('  ✅ Items already exist');
    }

    // Also ensure household users have a couple of marketplace items so
    // the frontend `/api/items` endpoint (which returns household items)
    // shows seeded listings. These are small seller-side listings owned by
    // the household user.
    const existingHouseholdItems = (await supabase
      .from('items')
      .select('id')
      .eq('seller_id', householdUser.id)
      .limit(1)).data;

    if (!existingHouseholdItems || existingHouseholdItems.length === 0) {
      const householdItems = [
        {
          id: randomUUID(),
          title: "Glass Bottles (Bundle)",
          category: "Glass",
          price: "₱60",
          description: "Assorted clean glass bottles",
          emoji: "🍾",
          seller_id: householdUser.id,
          seller_name: householdUser.name,
          status: "available",
        },
        {
          id: randomUUID(),
          title: "Cardboard Sheets (10kg)",
          category: "Paper",
          price: "₱65",
          description: "Flattened cardboard sheets for recycling",
          emoji: "📦",
          seller_id: householdUser.id,
          seller_name: householdUser.name,
          status: "available",
        },
      ];
      await supabase.from('items').insert(householdItems);
      console.log(`  ✅ Created ${householdItems.length} household items`);
    } else {
      console.log('  ✅ Household items already exist');
    }

    // 3. Seed requests
    console.log('\n📋 Step 3: Seeding requests...');
    const existingRequests = (await supabase
      .from('requests')
      .select('id')
      .eq('requester_id', householdUser.id)).data;

    if (!existingRequests || existingRequests.length === 0) {
      const requests = [
        {
          id: randomUUID(),
          type: "Collection",
          items: "Mixed recyclables - plastic bottles, newspapers, cardboard",
          status: "Pending",
          address: householdUser.address,
          requester_id: householdUser.id,
          requester_name: householdUser.name,
          date: new Date().toISOString().split("T")[0],
          time: "14:00",
        },
        {
          id: randomUUID(),
          type: "Collection",
          items: "Aluminum cans and glass bottles",
          status: "Completed",
          address: householdUser.address,
          requester_id: householdUser.id,
          requester_name: householdUser.name,
          responder_id: junkshopUser.id,
          responder_name: junkshopUser.name,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          time: "10:30",
        },
      ];
      await supabase.from('requests').insert(requests);
      console.log(`  ✅ Created ${requests.length} requests`);
    } else {
      console.log(`  ✅ Requests already exist (${existingRequests.length})`);
    }

    // 4. Seed rates
    console.log('\n💰 Step 4: Seeding market rates...');
    const existingRates = (await supabase
      .from('rates')
      .select('id')).data;

    if (!existingRates || existingRates.length === 0) {
      const rates = [
        {
          id: randomUUID(),
          material: "Plastic Bottles",
          price_per_kg: "₱12.50",
          unit: "kg",
          junkshop_id: junkshopUser.id,
          junkshop_name: junkshopUser.name,
        },
        {
          id: randomUUID(),
          material: "Newspapers",
          price_per_kg: "₱8.00",
          unit: "kg",
          junkshop_id: junkshopUser.id,
          junkshop_name: junkshopUser.name,
        },
        {
          id: randomUUID(),
          material: "Aluminum Cans",
          price_per_kg: "₱25.00",
          unit: "kg",
          junkshop_id: junkshopUser.id,
          junkshop_name: junkshopUser.name,
        },
        {
          id: randomUUID(),
          material: "Glass Bottles",
          price_per_kg: "₱5.00",
          unit: "kg",
          junkshop_id: junkshopUser.id,
          junkshop_name: junkshopUser.name,
        },
        {
          id: randomUUID(),
          material: "Cardboard",
          price_per_kg: "₱6.50",
          unit: "kg",
          junkshop_id: junkshopUser.id,
          junkshop_name: junkshopUser.name,
        },
      ];
      await supabase.from('rates').insert(rates);
      console.log(`  ✅ Created ${rates.length} market rates`);
    } else {
      console.log(`  ✅ Rates already exist (${existingRates.length})`);
    }

    // 5. Seed messages
    console.log('\n💬 Step 5: Seeding messages...');
    const existingMessages = (await supabase
      .from('messages')
      .select('id')).data;

    if (!existingMessages || existingMessages.length === 0) {
      const messages = [
        {
          id: randomUUID(),
          sender_id: householdUser.id,
          sender_name: householdUser.name,
          receiver_id: junkshopUser.id,
          receiver_name: junkshopUser.name,
          content: "Hi! I have some plastic bottles for collection. Are you available this week?",
          read: "true",
        },
        {
          id: randomUUID(),
          sender_id: junkshopUser.id,
          sender_name: junkshopUser.name,
          receiver_id: householdUser.id,
          receiver_name: householdUser.name,
          content: "Yes, we can collect this Friday afternoon. What's the approximate quantity?",
          read: "false",
        },
      ];
      await supabase.from('messages').insert(messages);
      console.log(`  ✅ Created ${messages.length} messages`);
    } else {
      console.log(`  ✅ Messages already exist (${existingMessages.length})`);
    }

    console.log('\n✅ ✅ ✅ Seed data population complete! ✅ ✅ ✅\n');
    console.log('Summary:');
    console.log(`  - Users: Household (${householdUser.name}) & Junkshop (${junkshopUser.name})`);
    console.log('  - Items: 3 marketplace listings');
    console.log('  - Requests: 2 collection requests (Pending & Completed)');
    console.log('  - Rates: 5 market rates');
    console.log('  - Messages: 2 chat messages');
    console.log('\nYou should now be able to see Household posts and Rate list in the app!');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

seedAllData();
