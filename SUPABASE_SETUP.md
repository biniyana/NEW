# Supabase Setup Instructions for Waiz

Your Waiz application is now configured to use Supabase as the database backend!

## Step 1: Create Tables in Supabase

1. Go to your Supabase project dashboard at https://supabase.com
2. Navigate to the **SQL Editor** section (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-migration.sql` from this project
5. Paste it into the SQL editor
6. Click **Run** to create all the tables

The SQL will automatically create:
- `users` table
- `items` table (marketplace listings)
- `requests` table (collection requests)
- `messages` table (chat)
- `reviews` table
- `chatbot_conversations` table

## Step 2: Verify Your Credentials

Make sure your Supabase credentials are set in your Replit Secrets:
- `SUPABASE_URL` = https://hvmxemapjumrwcoyaduh.supabase.co
- `SUPABASE_KEY` = Your anon public key

These should already be set if you followed the setup steps.

## Step 3: Test the App

Once the tables are created:

1. Refresh your app
2. Try signing up with a test account
3. Create a marketplace listing (if junkshop)
4. Test all features

## Important Notes

⚠️ **Security**: The API key you used is now exposed in the chat history. You should:
1. Go to Supabase → Project Settings → API
2. Click the rotate icon next to your anon key
3. Generate a new key
4. Update your Replit Secrets with the new key

## Troubleshooting

If you get "table not found" errors:
- Make sure you ran the SQL migration in Supabase
- Check that the table names match (users, items, requests, messages, reviews, chatbot_conversations)

If data isn't persisting:
- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Check Supabase network tab for any errors

## Switching Back to In-Memory Storage

If you want to go back to the in-memory storage (for testing), just remove the SUPABASE_URL and SUPABASE_KEY from your secrets and restart the app.
