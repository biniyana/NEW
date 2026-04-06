import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function importChatbotConversations(csvFilePath) {
  const conversations = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Transform CSV row to match table structure
        const conversation = {
          id: row.id || randomUUID(), // Generate ID if not provided
          user_id: row.user_id,
          role: row.role,
          content: row.content,
          timestamp: row.timestamp || new Date().toISOString()
        };
        conversations.push(conversation);
      })
      .on('end', async () => {
        try {
          console.log(`Importing ${conversations.length} chatbot conversations...`);

          const { data, error } = await supabase
            .from('chatbot_conversations')
            .insert(conversations);

          if (error) {
            console.error('Error importing chatbot conversations:', error);
            reject(error);
          } else {
            console.log('✅ Successfully imported chatbot conversations!');
            console.log(`Imported ${conversations.length} records`);
            resolve(data);
          }
        } catch (err) {
          console.error('Import failed:', err);
          reject(err);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Usage example
// importChatbotConversations('./data/chatbot_conversations.csv')
//   .then(() => console.log('Import complete'))
//   .catch(err => console.error('Import failed:', err));

export { importChatbotConversations };