# 🔧 MANUAL SETUP REQUIRED: Create Rates Table in Supabase

## Steps to Complete:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: **gihjiwpvlmkrkdydjnfc**
3. Click on **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy and Paste This SQL

```sql
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rates_junkshop_id ON rates(junkshop_id);
CREATE INDEX IF NOT EXISTS idx_rates_seller_id ON rates(seller_id);
```

### Step 3: Click **Run** Button
Wait for confirmation: `✅ PostgreSQL function created successfully`

### Step 4: Verify & Seed Data
After the table is created, run this command in your terminal:
```bash
node seedAll.js
```

This will populate the rates table with 5 market rates for:
- Plastic Bottles: ₱12.50/kg
- Newspapers: ₱8.00/kg
- Aluminum Cans: ₱25.00/kg
- Glass Bottles: ₱5.00/kg
- Cardboard: ₱6.50/kg

---

## Summary of Seeded Data

Once complete, your app will have:

✅ **Users (2)**
- Maria Santos (Household)
- Caniezo Junkshop (Business)

✅ **Household Posts/Requests (2)**
- Pending: "Mixed recyclables - plastic bottles, newspapers, cardboard"
- Completed: "Aluminum cans and glass bottles"

✅ **Rates/Market List (5)**
- Plastic Bottles: ₱12.50/kg
- Newspapers: ₱8.00/kg
- Aluminum Cans: ₱25.00/kg
- Glass Bottles: ₱5.00/kg
- Cardboard: ₱6.50/kg

✅ **Items/Marketplace (3)**
- Plastic Bottles (50pcs)
- Newspapers Bundle
- Aluminum Cans (30pcs)

✅ **Messages/Chat (2)**
- Conversation between Maria Santos and Caniezo Junkshop

---

## Need more data?

Run the enhanced seed script which automatically creates requests, rates, and messages:
```bash
node seedAll.js
```

This is idempotent and won't duplicate data - it checks what exists first.
