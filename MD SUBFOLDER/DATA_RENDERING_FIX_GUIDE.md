# 🔧 Data Rendering Historical Fix Guide

**⚠️ Note:** This document describes historical fixes for Supabase database mapping. Supabase has been completely removed from the project.

## Migration to Firebase

The project has been refactored to remove all Supabase dependencies and now uses:
- **Primary:** Firebase Firestore (for production)
- **Development:** MemStorage (in-memory with optional persistence)
- ~~Supabase~~ - **REMOVED**

## Current Storage Architecture

### Development Setup
```bash
# Enable seed data for testing
echo "SEED_DATA=true" >> .env
npm run dev
```

### Production Setup
Configure Firebase via environment:
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
npm run build && npm start
```

## Testing Data Rendering


### Step 1: Start the Server
```bash
npm run dev
```
Server should run on `http://localhost:5005` (or PORT specified in .env)

### Step 2: Enable Seed Data
The application uses seed data for development testing. When starting with `SEED_DATA=true`:
- 4 demo accounts are automatically created
- Fake listings, requests, and messages are generated
- Ready for immediate testing

### Step 3: Log In as Household User
Credentials (when seed data enabled):
- **Email:** `maria@example.com`
- **Password:** `password123`

### Step 4: Verify Data
Navigate through:
- ✅ Requests page - See collection requests
- ✅ Marketplace page - See item listings
- ✅ Rates page - See market prices
- ✅ Messages - See conversations

---

## Expected Results

### Data Should Display
✅ **Requests Page** - Collection requests visible
✅ **Marketplace** - Item listings from other users
✅ **Rates** - Market prices for recyclables
✅ **Messages** - Conversations with other users

### If Data Is Missing
1. Verify `SEED_DATA=true` is set in `.env`
2. Check server logs don't show Firebase/initialization errors
3. Restart the server: `npm run dev`
4. Clear browser cache and refresh


✅ **Chat/Messages** - 2 messages in conversation history

### Junkshop User (Caniezo Junkshop) Should See:
✅ **Requests Page** - All collection requests (not filtered by user)
✅ **Rates Page** - Can edit their own rates + see 5 market rates
✅ **Junkshops View** - See themselves in junkshop list

---

## Debugging Checklist

### ❌ Data Still Not Showing?

**Check 1: Are API calls happening?**
```
Look for: "🔍 [Frontend] Fetching requests from /api/requests..."
If NOT seen → Check network tab in DevTools, look for failed requests
```

**Check 2: Is backend returning data?**
```
Look for: "✅ [GET /api/requests] Returning X requests"
If NOT seen → Backend might not be running or there's an error
```

**Check 3: Does user ID match?**
```
Compare in console:
- currentUser.id (from localStorage)
- request.requesterId (from API response)
They MUST match for filtering to work
```

**Check 4: Is filtering happening?**
```
Look for: "🔎 [Filter] Request..."
If ALL show "→ HIDE" → IDs don't match
If SOME show "→ SHOW" → Those should display
```

### ✅ All Data Showing?

1. **Household Posts visible** → Filter is working ✅
2. **Rate list populated** → mapRate function working ✅
3. **Messages displayed** → Data flow working ✅

---

## Technical Details of Fixes

### Fix 1: Rate Mapping Function
```typescript
private mapRate(data: any): Rate | undefined {
  if (!data) return undefined;
  return {
    ...data,
    sellerId: data.seller_id || data.junkshop_id,  // Support both naming conventions
    createdAt: data.created_at ? new Date(data.created_at) : null,
  };
}
```

This ensures database snake_case fields are converted to TypeScript camelCase.

### Fix 2: Rates Query with Fallback
```typescript
async getRates(sellerId?: string): Promise<Rate[]> {
  let q = db().from("rates").select("*");
  if (sellerId) {
    // Check both seller_id and junkshop_id for backwards compatibility
    q = q.or(`seller_id.eq.${sellerId},junkshop_id.eq.${sellerId}`) as any;
  }
  const { data, error } = await q;
  if (error) {
    console.error("❌ [getRates] Database error:", error.message);
    return [];
  }
  return (data || []).map((d: any) => this.mapRate(d)!);
}
```

This handles both field naming conventions while fixing the mapping issue.

---

## If Issues Persist

1. **Clear browser cache:** Press `Ctrl+Shift+Delete`
2. **Re-login:** Log out and log back in
3. **Restart server:** Stop `npm run dev` and run again
4. **Check Supabase directly:**
   ```bash
   node checkStatus.js
   ```
   Verify data exists in Supabase

5. **Check RLS policies:** 
   - Go to Supabase Dashboard
   - Tables → requests/rates
   - Check RLS Policy allows SELECT for authenticated users

---

## Files Modified

1. ✅ `server/routes.ts` - Added debugging logs to API endpoints
2. ✅ `server/supabaseStorage.ts` - Fixed rates mapping and queries
3. ✅ `client/src/pages/requests.tsx` - Added debugging logs
4. ✅ `client/src/pages/rates.tsx` - Added debugging logs

## Next Steps

After you login and check the browser console:
1. Share the console log output
2. Note which data appears/doesn't appear
3. Compare user IDs (localStorage vs API response)
4. If still not working, we can investigate further

---

## Quick Verification Command

Once the server is running, test the API directly:
```powershell
# Get all requests
Invoke-WebRequest -Uri "http://localhost:5004/api/requests" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content

# Get rates
Invoke-WebRequest -Uri "http://localhost:5004/api/rates" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

Response should show data with BOTH snake_case (sender_id) AND camelCase (senderId) fields.
