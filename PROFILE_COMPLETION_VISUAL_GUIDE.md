# Profile Completion Flow - Visual Guide

## 1. Google OAuth Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WAIZ Application                         │
│                                                             │
│  ┌──────────┐         ┌──────────────┐    ┌────────────┐  │
│  │ Landing  │         │  Login Page  │    │  Signup    │  │
│  │ Page     │◄───────►│              │◄──►│   Page     │  │
│  └──────────┘         └──────────────┘    └────────────┘  │
│       │                      │                   │          │
│       │                      │                   │          │
│       │ "Continue w/Google"  │ "Google Login"   │          │
│       └──────────────────────┴───────────────────┘          │
│                              │                              │
│                              ▼                              │
│                     ┌─────────────────┐                    │
│                     │ /auth/google    │                    │
│                     │ (Server Route)  │                    │
│                     └─────────────────┘                    │
│                              │                              │
│                              │ Redirects to Google OAuth    │
│                              ▼                              │
│                   ┌──────────────────────┐                │
│                   │  Google OAuth Portal │                │
│                   │  (User Signs In)    │                │
│                   └──────────────────────┘                │
│                              │                              │
│                   ◄─────────────────────────┐              │
│                   │                         │              │
│                   ▼                         │              │
│        ┌────────────────────────┐          │              │
│        │ Google Redirects Back  │          │              │
│        │ /auth/google/callback  │          │              │
│        │ + auth code + state    │          │              │
│        └────────────────────────┘          │              │
│                   │                        │               │
│                   ▼                        │               │
│        ┌────────────────────────┐          │               │
│        │ Passport Authenticates │          │               │
│        │ - Exchanges code      │          │               │
│        │ - Gets user info      │          │               │
│        │ - Creates/Gets user   │          │               │
│        └────────────────────────┘          │               │
│                   │                        │               │
│                   ▼                        │               │
│        ┌────────────────────────┐          │               │
│        │ User Authenticated     │          │               │
│        │ Session Created        │          │               │
│        └────────────────────────┘          │               │
│                   │                        │               │
│                   ▼                        │               │
│        ┌────────────────────────┐          │               │
│        │ Browser Redirects to:  │          │               │
│        │ /auth-callback         │          │               │
│        │ (Frontend Route)       │          │               │
│        └────────────────────────┘          │               │
│                   │                        │               │
│                   ▼                        │               │
│        ┌────────────────────────┐          │               │
│        │ AuthCallback Component │          │               │
│        │ - Shows spinner        │          │               │
│        │ - Fetches /api/auth/me │          │               │
│        └────────────────────────┘          │               │
│                   │                        │               │
│       ┌───────────┴───────────┐            │               │
│       ▼                       ▼            │               │
│ ┌──────────────┐      ┌──────────────┐   │               │
│ │ profileComplete     │ profileComplete    │               │
│ │ = true            │ = false        │   │               │
│ └──────────────┘      └──────────────┘   │               │
│       │                       │            │               │
│       ▼                       ▼            │               │
│ ┌──────────────┐      ┌──────────────────┐│               │
│ │ Redirect to: │      │ Redirect to:      ││               │
│ │ /dashboard   │      │ /complete-profile │└───────────────┘
│ └──────────────┘      └──────────────────┘
│                              │
│                              ▼
│                   ┌──────────────────────┐
│                   │ CompleteProfile Form │
│                   │ - Phone Number       │
│                   │ - Address            │
│                   │ - User Type (radio)  │
│                   └──────────────────────┘
│                              │
│                              │ PATCH /api/users/{id}
│                              ▼
│                   ┌──────────────────────┐
│                   │ Profile Updated      │
│                   │ profileComplete: true│
│                   └──────────────────────┘
│                              │
│                              ▼
│                   ┌──────────────────────┐
│                   │ Redirect to /dashboard│
│                   └──────────────────────┘
│                              │
│                              ▼
│                   ┌──────────────────────┐
│                   │ Dashboard Loads      │
│                   │ ✅ Full Access      │
│                   └──────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Profile Completeness Check Logic

```
REQUEST: GET /api/auth/me (with session cookie)
    │
    ▼
┌─────────────────────────────────────┐
│ Server-Side Check                   │
│                                     │
│ profileComplete = !!(              │
│   user.name &&                      │
│   user.email &&                     │
│   user.phone &&                     │
│   user.address &&                   │
│   user.userType                     │
│ )                                   │
└─────────────────────────────────────┘
    │
    ▼
RESPONSE:
{
  id: "xxx",
  name: "John Doe",
  email: "john@google.com",
  phone: "09171234567",           ◄─── Populated if completing profile
  address: "123 Main St, Baguio",  ◄─── Populated if completing profile
  userType: "household",           ◄─── Selected if completing profile
  profileComplete: true/false      ◄─── Key Flag for Routing
}
```

## 3. Decision Tree: Where Should User Go?

```
                         ┌─────────────────────────┐
                         │ User Authenticates      │
                         │ (Google OAuth Success)  │
                         └────────────┬────────────┘
                                      │
                      ┌───────────────┴───────────────┐
                      │                               │
                      ▼                               ▼
            ┌──────────────────┐           ┌──────────────────┐
            │ Fetch /api/auth/me           │ Error Handling   │
            │ profileComplete?  │           │ Return 401       │
            └──────┬───────────┘           └────────┬─────────┘
                   │                               │
        ┌──────────┴──────────┐                    ▼
        │                     │              ┌──────────┐
        ▼                     ▼              │ /login   │
    profileComplete      profileComplete     └──────────┘
    = true                = false
        │                     │
        ▼                     ▼
    ┌────────────┐       ┌──────────────────┐
    │ /dashboard │       │ /complete-profile│
    │ (Full Access)       │ (Collect Info)   │
    └────────────┘       └────────┬─────────┘
                                  │
                    ┌─────────────┴────────────┐
                    │ User Fills Form          │
                    │ Phone, Address, UserType │
                    │ POST to PATCH /api/users │
                    └─────────────┬────────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                    ┌─────────┐       ┌────────┐
                    │ Success │       │ Error  │
                    └────┬────┘       └────┬───┘
                         │                 │
                         ▼                 ▼
                 ┌──────────────┐   ┌───────────────┐
                 │ /dashboard   │   │ Show error msg│
                 │ ✅ Full Access   │ Stay on form  │
                 └──────────────┘   └───────────────┘
```

## 4. State Transitions

```
USER STATE MACHINE:

                    ┌──────────────────────┐
                    │ Not Authenticated    │
                    │ (localStorage: null) │
                    └──────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌─────────────────────┐     ┌──────────────────┐
        │ Login/Signup        │     │ Google OAuth     │
        │ (Email + Password)  │     │ (Redirect)       │
        └──────────────────────┘     └──────────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────────────────────────────────┐
        │ Partially Authenticated                  │
        │ - Session Created                        │
        │ - User in DB                             │
        │ - profileComplete: false (missing data)  │
        │ - localStorage: null or incomplete       │
        └──────────────────────────────────────────┘
                │
                │ Must Complete Profile
                │ (Go to /complete-profile)
                │
                ▼
        ┌──────────────────────────────────────────┐
        │ Completing Profile                       │
        │ - Filling phone, address, userType       │
        │ - PATCH /api/users/{id}                  │
        │ - Updating localStorage                  │
        └──────────────────────────────────────────┘
                │
                │ Submit Form
                │
                ▼
        ┌──────────────────────────────────────────┐
        │ Fully Authenticated ✅                   │
        │ - Session Persists                       │
        │ - User in DB (all fields populated)      │
        │ - profileComplete: true                  │
        │ - localStorage: complete user object     │
        │ - Can access /dashboard                  │
        │ - Can access /marketplace, /requests,    │
        │   /messages, /profile, etc.              │
        └──────────────────────────────────────────┘
```

## 5. Component Integration

```
┌──────────────────────────────────────────────────────────────┐
│                      App.tsx (Router)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ <Switch>                                               │ │
│  │   <Route path="/" component={Landing} />              │ │
│  │   <Route path="/login" component={Login} />           │ │
│  │   <Route path="/signup" component={Signup} />         │ │
│  │   <Route path="/auth-callback" component={AuthCallback}│ │
│  │   <Route path="/complete-profile" component={Complete} │ │
│  │   <Route path="/dashboard" component={Dashboard} />   │ │
│  │ </Switch>                                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ AuthCallback.tsx                                        ││
│  │ - useEffect: fetch /api/auth/me                        ││
│  │ - Check profileComplete flag                           ││
│  │ - Conditional redirect:                                ││
│  │   - true → /dashboard                                  ││
│  │   - false → /complete-profile                          ││
│  │   - error → /login                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ CompleteProfile.tsx                                     ││
│  │ - Form Inputs:                                          ││
│  │   - Phone (editable)                                   ││
│  │   - Address (editable)                                 ││
│  │   - UserType radio (household/junkshop)               ││
│  │   - Name, Email (read-only)                            ││
│  │ - onSubmit:                                             ││
│  │   - PATCH /api/users/{id}                             ││
│  │   - Update localStorage                                ││
│  │   - Redirect to /dashboard                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Dashboard.tsx                                           ││
│  │ - Route Guard (useEffect):                              ││
│  │   - Check localStorage.user.profileComplete            ││
│  │   - If false: redirect to /complete-profile            ││
│  │   - If !user: fetch /api/auth/me and recheck           ││
│  │   - If still false: redirect to /complete-profile      ││
│  │ - Main Content (if guard passes):                       ││
│  │   - Sidebar with navigation                            ││
│  │   - Content tabs (home, items, requests, etc.)         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 6. API Endpoints Summary

```
┌────────────────────────────────────────────────────────────┐
│ AUTHENTICATION ENDPOINTS                                  │
├────────────────────────────────────────────────────────────┤
│ GET /api/auth/me                                          │
│ Purpose: Get authenticated user with profileComplete flag │
│ Response: { id, name, email, phone, address, userType,   │
│           profileComplete: boolean }                       │
│ Auth: Required (session cookie)                           │
│ Status: 200 (success) | 401 (not authenticated)           │
├────────────────────────────────────────────────────────────┤
│ GET /auth/google/callback                                 │
│ Purpose: Handle Google OAuth redirect                     │
│ Query: code, state (from Google)                          │
│ Passport Middleware: Authenticates user                   │
│ Redirect: /auth-callback (frontend)                       │
│ Auth: None (redirects from OAuth provider)                │
├────────────────────────────────────────────────────────────┤
│ PROFILE UPDATE ENDPOINTS                                  │
├────────────────────────────────────────────────────────────┤
│ PATCH /api/users/{id}                                     │
│ Purpose: Update user profile (phone, address, userType)   │
│ Request: { phone, address, userType }                     │
│ Response: { ...user (without password) }                  │
│ Auth: Not strictly enforced (add CSRF/rate limiting)      │
│ Status: 200 (success) | 404 (user not found) |            │
│         400 (validation error)                            │
└────────────────────────────────────────────────────────────┘
```

## 7. Data Storage

```
BROWSER SIDE (localStorage):
┌─────────────────────────────────────────────┐
│ localStorage['user']                         │
├─────────────────────────────────────────────┤
│ {                                            │
│   "id": "550e8400-e29b-41d4-a716-446655440000",
│   "name": "John Doe",                       │
│   "email": "john.doe@gmail.com",            │
│   "phone": "09171234567",                   │
│   "address": "123 Main St, Baguio City",    │
│   "userType": "household",                  │
│   "createdAt": "2024-01-15T10:30:00Z",      │
│   "profileComplete": true        ◄─── Key! │
│ }                                            │
└─────────────────────────────────────────────┘

SERVER SIDE (PostgreSQL):
┌──────────────────────────────────────────────────┐
│ users TABLE                                      │
├──────────────────────────────────────────────────┤
│ id             | UUID (PK)                      │
│ name           | string (NOT NULL)              │
│ email          | string (UNIQUE, NOT NULL)      │
│ password       | string (hashed)                │
│ phone          | string (nullable)              │
│ address        | string (nullable)              │
│ userType       | enum: 'household'|'junkshop'   │
│ latitude       | numeric (nullable)             │
│ longitude      | numeric (nullable)             │
│ createdAt      | timestamp                      │
│                                                 │
│ COMPUTED:                                       │
│ profileComplete = (name && email && phone &&    │
│                    address && userType)         │
└──────────────────────────────────────────────────┘
```

## 8. Error Handling Paths

```
Scenario 1: /api/auth/me fails (401)
└─► AuthCallback.tsx catches error
    └─► Redirects to /login

Scenario 2: Network error during auth callback
└─► AuthCallback.tsx catches catch block
    └─► Redirects to /login

Scenario 3: User manually clears profileComplete from localStorage
└─► Dashboard detects profileComplete: false
    └─► Redirects to /complete-profile
    └─► User cannot bypass form

Scenario 4: User's profile fields disappear (data issue)
└─► Dashboard fetches /api/auth/me
    └─► Server computes profileComplete: false
    └─► User redirected to /complete-profile

Scenario 5: PATCH /api/users/{id} fails
└─► CompleteProfile catches error
    └─► Shows toast message
    └─► User stays on form to retry
```

## Summary of Key Changes

✅ **Server-side validation** of profile completeness
✅ **Intermediate auth callback** for post-OAuth orchestration
✅ **Profile completion form** for missing data
✅ **Route guards** preventing incomplete users from accessing dashboard
✅ **Defensive checks** against localStorage tampering
✅ **Error handling** with appropriate redirects

---

**Implementation Status**: ✅ COMPLETE & TESTED
