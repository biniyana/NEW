# Dummy Accounts & Seed Data Setup

This guide explains how to enable and use the automatically-generated dummy accounts for end-to-end testing of the Waiz platform.

## Overview

The application includes a **seeder** that automatically generates 4 dummy accounts:
- **2 Household Accounts** (users who want to recycle items)
- **2 Junkshop Accounts** (recycling businesses)

All dummy accounts are created with **realistic test data** including:
- Full names and contact information
- Email addresses and phone numbers
- Addresses and GPS coordinates (for junkshops)
- Pre-created marketplace listings, collection requests, and messages
- Market rates for recyclables

---

## Enabling Seed Data

### Method 1: Environment Variable (Recommended for Development)

Add this to your `.env` file:

```bash
SEED_DATA=true
```

Then restart the dev server:

```bash
npm run dev
```

The dummy data will be loaded **automatically** when the app starts. This is useful for:
- Local development
- Integration testing
- Demo presentations

### Method 2: Re-seeding During Runtime (Optional)

If you want to reset seed data while the server is running, you can manually call:

```bash
# This will re-populate the in-memory storage with seed data
# (Requires server restart to fully reset)
```

---

## Dummy Accounts

### Household Accounts

#### Account 1: Maria Santos
- **User Type:** Household (Individual Recycler)
- **Email:** `maria@example.com`
- **Password:** `password123`
- **Phone:** `+63 917 123 4567`
- **Address:** `123 Session Road, Baguio City`
- **Pre-loaded Data:**
  - 3 items for sale (Glass Bottles, Cardboard, Plastic Containers)
  - 2 collection requests (1 Pending, 1 Completed)
  - Message conversation history with Caniezo Junkshop

#### Account 2: Juan Dela Cruz
- **User Type:** Household (Individual Recycler)
- **Email:** `juan@example.com`
- **Password:** `password123`
- **Phone:** `+63 917 987 6543`
- **Address:** `456 Eco Park Road, Baguio City`
- **Pre-loaded Data:**
  - 2 items for sale (Magazines, Plastic Bags)
  - 1 collection request (Accepted status with Green Valley Recycling)
  - Message conversation with junkshop

---

### Junkshop Accounts

#### Account 1: Caniezo Junkshop
- **User Type:** Junkshop (Business)
- **Email:** `caniezojunkshop@gmail.com`
- **Password:** `password123`
- **Phone:** `+63 917 765 4321`
- **Address:** `456 Burnham Park Area, Baguio City`
- **GPS Location:** 16.4023°N, 120.5960°E (Shows on map)
- **Pre-loaded Data:**
  - 3 items in inventory (Plastic Bottles, Newspapers, Aluminum Cans)
  - Custom market rates
  - Completed transaction with Maria Santos

#### Account 2: Green Valley Recycling
- **User Type:** Junkshop (Business)
- **Email:** `greenvalley@example.com`
- **Password:** `password123`
- **Phone:** `+63 917 555 9999`
- **Address:** `789 Camp John Hay, Baguio City`
- **GPS Location:** 16.3920°N, 120.5631°E (Shows on map)
- **Pre-loaded Data:**
  - 2 items in inventory (Copper Wire, Glass Bottles)
  - Custom market rates

---

## Testing End-to-End Scenarios

### Scenario 1: Household User Flow

**Objective:** Test a household user's complete experience

1. **Login as Maria Santos**
   - Email: `maria@example.com`
   - Password: `password123`
   - Verify dashboard loads with "Household" role

2. **View Marketplace**
   - See listings from junkshops and other households
   - Verify filters work (by category, price, seller)
   - Click on items to view details

3. **Create Collection Request**
   - Go to "Requests" → "New Collection Request"
   - Fill in items to collect: "Mixed recyclables - plastics, papers"
   - Set pickup date and time
   - Submit and verify confirmation

4. **Send Message to Junkshop**
   - Go to "Messages"
   - Start new conversation with junkshop
   - Send: "Hi, can you pick up my recyclables this week?"
   - Verify message appears and junkshop receives it

5. **View Rates**
   - Go to "Rates" page
   - See current market rates for materials
   - Verify rates from both junkshops display correctly

6. **Check Requests**
   - Verify pending requests appear
   - See completed past transactions

---

### Scenario 2: Junkshop User Flow

**Objective:** Test a junkshop's complete experience

1. **Login as Caniezo Junkshop**
   - Email: `caniezojunkshop@gmail.com`
   - Password: `password123`
   - Verify dashboard loads with "Junkshop" role

2. **View Junkshop Map**
   - Go to "Junkshop Locator"
   - Verify your location appears on the map (Burnham Park Area)
   - Verify other junkshops show correct locations

3. **Browse Incoming Requests**
   - Go to "Requests"
   - See collection requests from households
   - Verify request addresses, items, and dates

4. **Accept a Request**
   - Find a "Pending" request from Maria Santos
   - Click "Accept"
   - Verify status changes to "Accepted"

5. **Message a Household**
   - Go to "Messages"
   - View existing conversation with Maria
   - Send: "We can collect on Friday 2-4 PM. Acceptable?"

6. **View Marketplace Inventory**
   - See your 3 listed items (Bottles, Newspapers, Cans)
   - Each item has correct title, category, price, description

7. **Check Analytics** (if available)
   - View completed collections and transaction history

---

### Scenario 3: Messaging Between Accounts

**Objective:** Verify real-time communication

1. **Open two browser windows**
   - Window A: Logged in as household
   - Window B: Logged in as junkshop

2. **Send message from household (Window A)**
   - Compose message: "Are you available tomorrow?"
   - Send

3. **Verify message appears in junkshop view (Window B)**
   - Refresh Messages page
   - See the incoming message with timestamp
   - Verify sender name shows correctly

4. **Reply from junkshop (Window B)**
   - Type reply: "Yes, we can come at 3 PM"
   - Send

5. **Verify reply shows in household view (Window A)**
   - Refresh Messages
   - See the junkshop's response
   - Conversation history complete

---

### Scenario 4: Marketplace Browsing

**Objective:** Verify marketplace functionality with seed data

1. **Login as any household user**
   - Email: `maria@example.com`
   - Go to "Marketplace"

2. **Browse All Items**
   - Should see 10 items total (from junkshops and households)
   - Each item displays:
     - Title
     - Category badge
     - Price
     - Seller name
     - Description

3. **Filter by Category**
   - Select "Plastic" → See 4 items
   - Select "Paper" → See 3 items
   - Select "Metal" → See 2 items

4. **Sort by Price**
   - View lowest to highest or highest to lowest
   - Verify prices display correctly

5. **Click Item to View Details**
   - See full description
   - Contact seller button available
   - Check "Similar items" section

---

### Scenario 5: Analytics & Reporting (Junkshop)

**Objective:** Test analytics features with seed data

1. **Login as Caniezo Junkshop**
   - Email: `caniezojunkshop@gmail.com`

2. **View Collections Dashboard**
   - See completed collections count
   - View recent transactions (2 shown in seed: 1 completed, 1 pending)

3. **Check Request History**
   - Filter by status: Pending, Accepted, Completed
   - Verify request timeline displays

---

## Troubleshooting

### Issue: No dummy accounts appear after restart

**Solution:**
1. Check that `SEED_DATA=true` is in your `.env`
2. Verify dev server logs show seed data loading
3. Clear browser cache/localStorage
4. Restart the dev server: `npm run dev`

### Issue: Seed data doesn't persist after server restart

**This is expected behavior.** MemStorage is in-memory only:
- Seed data loads fresh on each server start
- Perfect for testing; no persistent state to clean up
- For persistent storage, enable `PERSIST_MEM_STORAGE=true` (stores in data/memstorage.json)


### Issue: Can't login with dummy accounts

**Solution:**
- Verify email matches exactly: `maria@example.com` (lowercase)
- Verify password: `password123` (case-sensitive)
- Check browser console for errors
- Ensure `/api/auth/me` endpoint responds with user data

### Issue: Messages not appearing between accounts

**Solution:**
- Refresh the page to see new messages
- Verify both users are logged in (cookies/session active)
- Check browser console for network errors
- Try logging out and back in

---

## Extending Seed Data

To add more test accounts or data, edit `server/storage.ts` in the `seedData()` method:

```typescript
async seedData(): Promise<void> {
  // Add your custom household user here
  const myAccount: User = {
    id: "custom-user",
    name: "Your Name",
    email: "your@example.com",
    phone: "+63 900 000 0000",
    address: "Your Address, Baguio City",
    password: "your-password",
    userType: "household", // or "junkshop"
    latitude: null,
    longitude: null,
    createdAt: new Date(),
  };
  this.users.set(myAccount.id, myAccount);

  // Add items, requests, messages, rates as needed
  // ...
}
```

Then restart the server: `npm run dev`

---

## Cleanup

To stop using seed data:

1. **Remove from `.env`:**
   ```bash
   # Remove or comment out:
   # SEED_DATA=true
   ```

2. **Restart server:**
   ```bash
   npm run dev
   ```

The next server start will have **no dummy accounts**.

---

## Database Persistence

If you want seed data to **persist across server restarts**, enable file-based storage:

```bash
# In .env:
PERSIST_MEM_STORAGE=true
```

This saves data to `data/memstorage.json` and loads it on restart. Data persists until manually deleted.

To reset persisted data:
1. Delete `data/memstorage.json`
2. Restart the server

---

## Production Notes

**⚠️ IMPORTANT:**
- Never enable `SEED_DATA=true` in production
- Seed data is development-only for testing
- Production uses Firebase (configured via `FIREBASE_SERVICE_ACCOUNT_KEY`) for persistent database
- Seed data only affects the runtime memory storage, not production databases


---

## Quick Reference: Login Credentials

| Name | Role | Email | Password |
|------|------|-------|----------|
| Maria Santos | Household | `maria@example.com` | `password123` |
| Juan Dela Cruz | Household | `juan@example.com` | `password123` |
| Caniezo Junkshop | Junkshop | `caniezojunkshop@gmail.com` | `password123` |
| Green Valley Recycling | Junkshop | `greenvalley@example.com` | `password123` |

---

## Next Steps

1. ✅ Set `SEED_DATA=true` in `.env`
2. ✅ Run `npm run dev`
3. ✅ Open http://localhost:5000 in browser
4. ✅ Login with any dummy account from the table above
5. ✅ Follow the scenario tests to verify functionality
6. ✅ Report any issues or bugs found

---

**Last Updated:** February 2026  
**Status:** ✅ Complete & Ready for Testing
