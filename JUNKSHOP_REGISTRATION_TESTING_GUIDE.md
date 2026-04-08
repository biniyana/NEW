# Junkshop Registration & Search Testing Guide

This guide helps verify that junkshops are automatically saved and searchable by household users.

## How It Works

1. **Junkshop signs up** → Firebase Auth creates account
2. **Junkshop completes profile** (name, phone, address, location coordinates)
3. **Backend syncs the profile** → Saved to persistent storage via `/api/auth/profile`
4. **Household user searches** → Can find the junkshop via Dashboard or Junkshop Locator

## Testing Steps

### Step 1: Open Developer Console
- Press `F12` or `Ctrl+Shift+I` (or Cmd+Option+I on Mac)
- Go to **Console** tab
- Keep this open while testing

### Step 2: Sign Up as a Junkshop

1. Go to signup page
2. Create account with:
   - Email: `junkshop@example.com` (unique email)
   - Password: any password

3. **Complete Profile Page** - Look for these logs:
   ```
   📤 [complete-profile] Syncing profile to backend: {...}
   📊 [complete-profile] Sync response status: 200
   ✅ [complete-profile] Profile synced successfully: {...}
   🎉 [complete-profile] Profile mutation success. User saved: {...}
   ```

4. Fill in:
   - Name: `Hezii Junkshop` (or your junkshop name)
   - Phone: any phone number
   - Address: any address
   - **Location: Click "Pin Location" and set coordinates on the map**
   - Account Type: **Select "Junkshop"**

5. **Submit Profile** and watch the console logs

### Step 3: Verify Junkshop Was Saved

#### Option A: Check Browser Storage
1. Open DevTools → **Application** tab
2. Look for `data/memstorage.json` file in file system
3. The file should contain your junkshop data

#### Option B: Check Server API Response
1. Open a new **Browser Tab**
2. Go to: `http://localhost:5004/api/debug/junkshops`
3. You should see:
   ```json
   {
     "totalUsers": 1,
     "junkshops": [
       {
         "id": "...",
         "name": "Hezii Junkshop",
         "email": "junkshop@example.com",
         "phone": "...",
         "address": "...",
         "userType": "junkshop",
         "latitude": "...",
         "longitude": "..."
       }
     ]
   }
   ```

#### Option C: Check All Users
1. Go to: `http://localhost:5004/api/users`
2. Look for your junkshop in the JSON list

### Step 4: Log In as Household & Search

1. **Create a household account** or use an existing one
2. Go to **Dashboard** → **Map** section
   - You should see your junkshop marker on the map
   - It should show "All Junkshops" (not filtered by distance)

3. Go to **Junkshop Locator** page
   - Search for your junkshop name
   - It should appear in the list
   - You should see it on the map

## Troubleshooting

### Junkshop Not Showing Up?

1. **Check Console Logs** (F12 → Console)
   - Look for the sync logs mentioned above
   - Check for any `❌` errors

2. **Check Server Logs**
   - Run `npm run dev` and watch terminal output
   - Look for logs like:
     ```
     📝 [/api/auth/profile] Syncing user profile: {...}
     ✅ [/api/auth/profile] User profile synced successfully: {...}
     ```

3. **Verify Location Coordinates**
   - Junkshops MUST have latitude and longitude set
   - If not provided, the junkshop won't show up
   - Click "Pin Location" on the profile page

4. **Clear Browser Storage**
   - If you have old data: `localStorage.clear()` in console
   - Close and reopen the browser

5. **Check Data File**
   - If using MemStorage (PERSIST_MEM_STORAGE=true):
   - Check `data/memstorage.json` in project root
   - The file should contain your junkshop data

### Expected Behavior

✅ Junkshop profile saves to Firebase Realtime Database
✅ Profile syncs to backend storage (`/api/auth/profile`)
✅ Data persists in `data/memstorage.json` (if PERSIST_MEM_STORAGE=true)
✅ `/api/users` returns all registered users including junkshops
✅ Household users can see and search for junkshops

## Console Log Reference

| Log | Meaning |
|-----|---------|
| `📤 [complete-profile] Syncing profile to backend` | Profile is being sent to server |
| `📊 [complete-profile] Sync response status: 200` | Server received the request |
| `✅ [complete-profile] Profile synced successfully` | Junkshop was saved successfully |
| `❌ Failed to sync user to backend storage` | Sync failed - check error message |
| `📝 [/api/auth/profile] Syncing user profile` | Server received profile sync request |
| `✅ [/api/auth/profile] User profile synced successfully` | Server saved the profile |
| `🔍 [/api/debug/junkshops]` | Total users and junkshop count shown |

## Environment Variables

Make sure these are set in `.env`:

```env
PERSIST_MEM_STORAGE=true       # Save data to disk
SEED_DATA=false                # Don't create dummy accounts
```

## If Still Not Working

1. Check that `PERSIST_MEM_STORAGE=true` in `.env`
2. Delete `data/memstorage.json` and restart server
3. Check server logs for any errors
4. Make sure coordinates are being sent correctly
5. Verify junkshop's `userType` is set to `"junkshop"` (not `"household"`)
