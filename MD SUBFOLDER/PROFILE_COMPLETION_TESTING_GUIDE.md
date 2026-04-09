# Quick Reference: Testing Profile Completeness

## 🚀 Quick Start Testing

### Prerequisites
```bash
# Ensure dev server is running
npm run dev

# In a new terminal, check TypeScript
npm run check
```

### Test 1: Complete Google OAuth Flow (Recommended First Test)
```
1. Open http://localhost:5000/ (Landing Page)
2. Click "Continue with Google" button
3. ✅ Redirects to Google Login
4. Log in with your Google account
5. ✅ Google redirects back to /auth-callback
6. ✅ Loading spinner appears: "Completing sign in..."
7. If NEW Google user (no profile):
   → ✅ Redirects to /complete-profile form
8. If EXISTING Google user (has profile):
   → ✅ Redirects to /dashboard
```

### Test 2: Completing Profile Form
```
1. From /complete-profile page:
2. See read-only fields:
   - Name (pre-filled from OAuth)
   - Email (pre-filled from OAuth)
3. Fill REQUIRED fields:
   - Phone Number: "09171234567"
   - Address: "123 Main St, Baguio City"
4. Select User Type:
   - Household (default)
   - OR Junkshop
5. Click "Complete Profile" button
6. ✅ Toast: "Profile Complete! Redirecting..."
7. ✅ Redirects to /dashboard
8. ✅ Dashboard displays normal interface
```

### Test 3: Dashboard Route Guard (No Profile)
```
1. Edit localStorage in DevTools:
   - Press F12 → Application → localStorage
   - Modify 'user' object, set profileComplete: false
2. Refresh /dashboard
3. ✅ Should redirect to /complete-profile
4. Complete the profile again
```

### Test 4: Dashboard Route Guard (Complete Profile)
```
1. Login with complete profile
2. Refresh /dashboard
3. ✅ Should load normally (no redirect)
4. Dashboard content displays
```

### Test 5: Unauthenticated Access
```
1. Clear localStorage (DevTools → Application → Clear storage)
2. Navigate to /dashboard directly
3. ✅ Should redirect to /login
4. No access to protected routes
```

### Test 6: PATCH /api/users Endpoint
```bash
# Manual API test using curl:
curl -X PATCH http://localhost:5000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09171234567",
    "address": "123 Main St, Baguio",
    "userType": "household"
  }'

# Expected Response (200):
{
  "id": "...",
  "name": "...",
  "email": "...",
  "phone": "09171234567",
  "address": "123 Main St, Baguio",
  "userType": "household",
  "createdAt": "...",
  "profileComplete": true
}
```

## 🔍 Debugging Checklist

### Browser Console
```javascript
// Check localStorage
localStorage.getItem('user')  // Should show user object with profileComplete

// Check if user object is valid
JSON.parse(localStorage.getItem('user'))
  .profileComplete  // Should be true or false

// Clear cache if needed
localStorage.removeItem('user')
```

### Network Requests (DevTools → Network)
```
1. POST /auth/google
   Status: 302 (Redirect to Google)

2. GET /auth/google/callback?code=...&state=...
   Status: 302 (Redirect to /auth-callback)

3. GET /api/auth/me
   Status: 200
   Response includes: profileComplete field

4. PATCH /api/users/{id}
   Status: 200
   Response: updated user object
```

### Server Logs
```
Look for messages like:
✅ Google OAuth strategy registered
ℹ️ Ensure this exact URL is added to Google Cloud Console...
✅ /auth/google initiated
ℹ️ Google OAuth successful for user: xxx — redirecting to auth-callback
✅ Profile complete (or incomplete), computed profileComplete: true/false
```

## 🐛 Common Issues & Solutions

### Issue 1: Infinite Redirect Loop
**Symptom**: Page redirects between /complete-profile and /dashboard forever
**Solution**:
```javascript
// Check dashboard route guard logic (lines 25-68 in dashboard.tsx)
// Ensure profileComplete check exits before setting currentUser
// Check that /api/auth/me returns a profileComplete: false
```

### Issue 2: Google OAuth Returns 404
**Symptom**: Clicking "Continue with Google" gives 404
**Solution**:
```bash
# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $GOOGLE_CALLBACK_URL

# If empty, set them:
export GOOGLE_CLIENT_ID=your-id
export GOOGLE_CLIENT_SECRET=your-secret
export GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
# OR
export CLIENT_BASE_URL=http://localhost:5000

# Restart dev server
npm run dev
```

### Issue 3: Auth Callback Shows Spinner Forever
**Symptom**: /auth-callback loads but never redirects
**Solution**:
```javascript
// Open DevTools console, check for errors
// Common causes:
// 1. /api/auth/me returns 401 → check session is created
// 2. Network error → check CORS headers
// 3. profileComplete field missing → check server returns it

// Test manually:
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(u => console.log('profileComplete:', u.profileComplete))
```

### Issue 4: Form Validation Fails
**Symptom**: Can't submit /complete-profile form
**Solution**:
```javascript
// Check required fields:
// - phone must be non-empty string
// - address must be non-empty string
// - userType must be selected (household or junkshop)

// Test validation:
const formData = {
  phone: "09171234567",
  address: "123 Main St, Baguio",
  userType: "household"
};
// All must be truthy, non-empty strings
```

### Issue 5: localStorage Data Lost on Page Refresh
**Symptom**: Page refresh clears user data
**Solution**:
```javascript
// This is by design - Dashboard has fallback:
// 1. Check localStorage
// 2. If not found, fetch from /api/auth/me
// 3. Re-populate localStorage

// To test session persistence:
// 1. Complete profile and dashboard loads
// 2. Refresh page
// 3. Dashboard should still load (session in cookies)
// 4. localStorage is repopulated from server
```

## 📊 Expected Test Results

| Flow | Expected Behavior | Status |
|------|-------------------|--------|
| Google OAuth → /auth-callback → complete-profile | ✅ Spinner loads, form appears | Test 1 |
| Fill form + submit | ✅ Toast shows, redirect to /dashboard | Test 2 |
| Profile already complete | ✅ Direct to /dashboard (no form) | Test 2 |
| Set profileComplete: false | ✅ Redirects to /complete-profile | Test 3 |
| Refresh with complete profile | ✅ Dashboard loads normally | Test 4 |
| No auth cookie | ✅ Redirects to /login | Test 5 |
| PATCH /api/users | ✅ Returns 200 with updated user | Test 6 |

## 🔐 Security Testing

```
1. Try to bypass /complete-profile:
   - Navigate directly to /dashboard with incomplete profile
   - ✅ Should redirect to /complete-profile

2. Try to tamper with localStorage:
   - Edit profileComplete: true manually
   - Refresh /dashboard
   - ✅ Server re-checks, redirects if truly incomplete

3. Try to submit form with missing fields:
   - Click submit without phone
   - ✅ Toast error: "Phone number is required"
   - Form stays visible, not submitted

4. Try to access protected routes without auth:
   - Clear all localStorage + cookies
   - Navigate to /dashboard
   - ✅ Redirects to /login
```

## 📝 Rollback Checklist (If Needed)

If you need to revert these changes:
```bash
git checkout client/src/App.tsx
git checkout server/routes.ts
git checkout client/src/pages/dashboard.tsx
rm client/src/pages/auth-callback.tsx
rm client/src/pages/complete-profile.tsx
```

## ✅ Sign-Off Checklist

- [ ] TypeScript compilation passes (`npm run check`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] Google OAuth flow completes (Test 1)
- [ ] Profile completion form works (Test 2)
- [ ] Route guards prevent access (Test 3-5)
- [ ] API endpoints return correct data (Test 6)
- [ ] No infinite redirect loops
- [ ] Error handling shows appropriate messages
- [ ] localStorage persists correctly
- [ ] Session cookies work correctly

---

## 📞 Support

For issues or questions:
1. Check server logs for Passport authentication errors
2. Check browser console for client-side errors
3. Verify environment variables are set correctly
4. Clear browser cache and localStorage if stuck
5. Restart dev server if changes not reflected

**Last Updated**: 2024
**Implementation Status**: ✅ Complete
