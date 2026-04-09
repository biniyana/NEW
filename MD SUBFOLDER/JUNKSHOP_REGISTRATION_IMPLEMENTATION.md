# Junkshop Registration & Search - Complete Implementation

## Overview

All junkshops that register through the signup page are automatically saved to the system and instantly become searchable by household users.

## How It Works

### 1. Junkshop Registration Flow

```
Junkshop Sign Up
    ↓
Create Firebase Auth Account
    ↓
Complete Profile (name, phone, address, coordinates, select "Junkshop")
    ↓
Save to Firebase Realtime Database (client)
    ↓
Sync to Backend Storage via /api/auth/profile (POST)
    ↓
Saved to persistent storage (data/memstorage.json)
    ↓
✅ Searchable by household users
```

### 2. Household Search Flow

```
Household User Views Dashboard / Junkshop Locator
    ↓
Fetch from /api/users
    ↓
Filter for userType === "junkshop"
    ↓
Display on map and in search results
    ↓
✅ Junkshop appears immediately
```

## Key Components

### Backend Endpoints

#### `/api/auth/profile` (POST)
- **Purpose**: Sync user profile from Firebase to backend storage
- **Called by**: `complete-profile.tsx` after saving to Firebase
- **Saves**: User data including coordinates for junkshops
- **Response**: Synced user object

#### `/api/users` (GET)
- **Purpose**: Get all registered users (household + junkshop)
- **Called by**: Dashboard, junkslop-locator, junkshops map
- **Returns**: Array of all users (passwords removed)

#### `/api/debug/junkshops` (GET) - Debug Endpoint
- **Purpose**: Verify junkshops are registered (for troubleshooting)
- **Returns**: Total users count and list of all junkshops

#### `/api/junkshops` (GET)
- **Purpose**: Get all junkshops with optional search
- **Params**: `?q=searchterm` for filtering by name/address
- **Returns**: Junkshops with their rates

### Storage Layer

#### `storage.ts` - IStorage Interface
- Added: `createOrUpdateUser(id: string, data: Partial<User>)` method
- Allows creating/updating users with specific Firebase UID
- Persists to `data/memstorage.json` when `PERSIST_MEM_STORAGE=true`

#### `firebaseStorage.ts` - Firebase Implementation
- Supports `createOrUpdateUser()` for Firestore
- Uses Firestore collection: `users`
- Merges user data to preserve existing fields

### Frontend Components

#### `complete-profile.tsx` - Profile Completion
**Key Changes:**
1. Saves profile to Firebase Realtime Database
2. **Immediately calls** `/api/auth/profile` to sync to backend
3. Includes detailed console logging for debugging
4. Waits for sync to complete before redirecting

**Code Flow:**
```typescript
// 1. Save to Firebase
await set(userRef, userData);

// 2. Sync to backend
const response = await fetch("/api/auth/profile", {
  method: "POST",
  body: JSON.stringify(profileData)
});

// 3. Log results and continue
console.log('✅ Profile synced successfully');
```

#### `junkshop-locator.tsx` - Search & Map Display
- Fetches all users from `/api/users`
- Filters for `userType === "junkshop"`
- Displays on map with marker pins
- Supports search by name and address

#### `JunkshopsMap.tsx` - Map Component
- Shows junkshop markers with locations
- `showAll` prop shows all junkshops (household view)
- Without `showAll`, filters by 5km radius

### Environment Configuration

```env
# Enable persistent storage (saves to disk)
PERSIST_MEM_STORAGE=true

# Disable dummy accounts
SEED_DATA=false

# Firebase project (used for client-side auth)
FIREBASE_PROJECT_ID=waiz-app-f11f1
```

## Data Persistence

### In-Memory Storage (MemStorage)
- **File**: `data/memstorage.json` (created when `PERSIST_MEM_STORAGE=true`)
- **Contents**: All users, items, requests, messages, rates
- **Autosave**: Every 5 seconds
- **On Exit**: Saves on process exit

**Example Structure:**
```json
{
  "users": [
    {
      "id": "firebase-uid-123",
      "name": "Hezii Junkshop",
      "email": "hezii@example.com",
      "phone": "+63-123-456-7890",
      "address": "123 Main St, Baguio",
      "userType": "junkshop",
      "latitude": "16.4023",
      "longitude": "120.5960",
      "password": "firebase-auth",
      "profileComplete": true,
      "createdAt": "2026-04-08T10:30:00.000Z"
    }
  ],
  "items": [],
  "requests": [],
  "messages": [],
  "rates": []
}
```

## Console Logging for Debugging

### Client-Side Logs (Browser Console)

```
📤 [complete-profile] Syncing profile to backend: {...}
📊 [complete-profile] Sync response status: 200
✅ [complete-profile] Profile synced successfully: {...}
🎉 [complete-profile] Profile mutation success. User saved: {...}
```

### Server-Side Logs (Terminal)

```
📝 [/api/auth/profile] Syncing user profile: {...}
✅ [/api/auth/profile] User profile synced successfully: {...}
🔍 [/api/debug/junkshops] Total users: 1 Junkshops: 1
```

## Testing the Feature

See [JUNKSHOP_REGISTRATION_TESTING_GUIDE.md](./JUNKSHOP_REGISTRATION_TESTING_GUIDE.md) for detailed testing instructions.

### Quick Test
1. Sign up as junkshop with name "Test Junkshop"
2. Complete profile with coordinates
3. Open `/api/debug/junkshops` in browser
4. Should see your junkshop listed
5. Sign up as household user
6. Open Dashboard or Junkshop Locator
7. Should see "Test Junkshop" on the map

## Important Notes

### Location Coordinates
- ⚠️ **Required** for junkshops to appear on map
- Must be set during profile completion
- Use "Pin Location" button to mark location on map
- Saved as strings in database (e.g., "16.4023", "120.5960")

### Search Functionality
- Filters by name and address
- Works on junkshop-locator page
- Case-insensitive search
- Real-time filtering

### Household User View
- Junkshops map shows **all** junkshops (not filtered by distance)
- Earlier implementation had 5km radius filter (removed for household)
- Junkshop users still see radius-based filtering

## Files Modified

### Backend
- `server/routes.ts` - Added `/api/auth/profile` endpoint and `/api/debug/junkshops`
- `server/storage.ts` - Added `createOrUpdateUser()` interface and MemStorage implementation
- `server/firebaseStorage.ts` - Added `createOrUpdateUser()` for Firebase

### Frontend
- `client/src/pages/complete-profile.tsx` - Added profile sync to backend
- `client/src/components/JunkshopsMap.tsx` - Added `showAll` prop for household view
- `client/src/pages/dashboard.tsx` - Pass `showAll={isHousehold}` to map

### Configuration
- `.env` - Set `PERSIST_MEM_STORAGE=true`, `SEED_DATA=false`

## Troubleshooting

### Junkshop Not Showing?
1. Check browser console (F12) for sync logs
2. Verify coordinates were set (look for latitude/longitude in sync logs)
3. Check `/api/debug/junkshops` endpoint
4. Delete `data/memstorage.json` and restart server

### Profile Sync Failed?
1. Check server logs for `/api/auth/profile` errors
2. Verify all required fields (name, phone, address, coordinates)
3. Check network tab (F12 → Network) for failed requests
4. Review console error messages

### Data Not Persisting?
1. Check `PERSIST_MEM_STORAGE=true` in `.env`
2. Verify `data/memstorage.json` exists and is readable
3. Check file permissions in `data/` directory
4. Check for errors in server logs

## Future Enhancements

- [ ] Implement Firebase Firestore persistence (instead of MemStorage)
- [ ] Add junkshop verification/approval workflow
- [ ] Add business hours and service areas
- [ ] Implement junkshop rating system
- [ ] Add photo gallery for junkshops
