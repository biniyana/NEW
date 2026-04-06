-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  password TEXT NOT NULL,
  user_type TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  image_urls TEXT,
  emoji TEXT DEFAULT '📦',
  seller_id VARCHAR NOT NULL,
  seller_name TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id VARCHAR PRIMARY KEY,
  type TEXT NOT NULL,
  items TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  address TEXT NOT NULL,
  requester_id VARCHAR NOT NULL,
  requester_name TEXT NOT NULL,
  responder_id VARCHAR,
  responder_name TEXT,
  date TEXT NOT NULL,
  time TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR PRIMARY KEY,
  sender_id VARCHAR NOT NULL,
  sender_name TEXT NOT NULL,
  receiver_id VARCHAR NOT NULL,
  receiver_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  read TEXT DEFAULT 'false'
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR PRIMARY KEY,
  reviewer_id VARCHAR NOT NULL,
  reviewer_name TEXT NOT NULL,
  target_id VARCHAR NOT NULL,
  target_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create chatbot_conversations table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create rates table (market pricing for recyclables)
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
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (junkshop_id) REFERENCES users(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_responder_id ON requests(responder_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_rates_junkshop_id ON rates(junkshop_id);
CREATE INDEX IF NOT EXISTS idx_rates_seller_id ON rates(seller_id);
