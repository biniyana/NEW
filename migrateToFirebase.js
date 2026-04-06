import { createClient } from "@supabase/supabase-js";
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

async function migrateData() {
  console.log('Starting data migration from Supabase to Firebase...');

  try {
    // Migrate users
    console.log('Migrating users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      for (const user of users || []) {
        await db.collection('users').doc(user.id).set({
          ...user,
          createdAt: user.created_at ? admin.firestore.Timestamp.fromDate(new Date(user.created_at)) : admin.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log(`Migrated ${users?.length || 0} users`);
    }

    // Migrate items
    console.log('Migrating items...');
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*');

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
    } else {
      for (const item of items || []) {
        await db.collection('items').doc(item.id).set({
          ...item,
          createdAt: item.created_at ? admin.firestore.Timestamp.fromDate(new Date(item.created_at)) : admin.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log(`Migrated ${items?.length || 0} items`);
    }

    // Migrate requests
    console.log('Migrating requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select('*');

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
    } else {
      for (const request of requests || []) {
        await db.collection('requests').doc(request.id).set({
          ...request,
          createdAt: request.created_at ? admin.firestore.Timestamp.fromDate(new Date(request.created_at)) : admin.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log(`Migrated ${requests?.length || 0} requests`);
    }

    // Migrate messages
    console.log('Migrating messages...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    } else {
      for (const message of messages || []) {
        await db.collection('messages').doc(message.id).set({
          ...message,
          timestamp: message.timestamp ? admin.firestore.Timestamp.fromDate(new Date(message.timestamp)) : admin.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log(`Migrated ${messages?.length || 0} messages`);
    }

    // Migrate chatbot conversations
    console.log('Migrating chatbot conversations...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('chatbot_conversations')
      .select('*');

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
    } else {
      for (const conversation of conversations || []) {
        await db.collection('chatbotConversations').doc(conversation.id).set({
          ...conversation,
          timestamp: conversation.timestamp ? admin.firestore.Timestamp.fromDate(new Date(conversation.timestamp)) : admin.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log(`Migrated ${conversations?.length || 0} chatbot conversations`);
    }

    // Migrate rates
    console.log('Migrating rates...');
    const { data: rates, error: ratesError } = await supabase
      .from('rates')
      .select('*');

    if (ratesError) {
      console.error('Error fetching rates:', ratesError);
    } else {
      for (const rate of rates || []) {
        await db.collection('rates').doc(rate.id).set({
          ...rate,
          createdAt: rate.created_at ? admin.firestore.Timestamp.fromDate(new Date(rate.created_at)) : admin.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log(`Migrated ${rates?.length || 0} rates`);
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData().then(() => {
  console.log('Migration script finished.');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});