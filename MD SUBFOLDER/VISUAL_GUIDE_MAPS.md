# Visual Guide: Map Features

## User Interface Overview

### 1. Junkshop Registration with Map Pinning

```
┌─────────────────────────────────────────────────┐
│                 Join Waiz                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Account Type:  [Household]  [✓ Junkshop]     │
│                                                 │
│  Full Name:      [_________________]           │
│  Email:          [_________________]           │
│  Phone:          [_________________]           │
│  Address:        [_________________]           │
│  Password:       [_________________]           │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │     📍 Pin Your Junkshop Location       │  │ ← NEW!
│  │                                          │  │
│  │  ┌──────────────────────────────────┐   │  │
│  │  │                                  │   │  │
│  │  │   [Interactive Map Here]    ◯    │   │  │ ← Click to pin
│  │  │                                  │   │  │
│  │  └──────────────────────────────────┘   │  │
│  │                                          │  │
│  │  [📍 Use Current GPS Location]           │  │ ← NEW!
│  │                                          │  │
│  │  Latitude:  [16.4023045]  (Read-only)   │  │
│  │  Longitude: [120.5960123]  (Read-only)  │  │
│  │                                          │  │
│  │  ✓ Location pinned: 16.4023045...       │  │ ← Confirmation
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [         Sign Up         ]                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2. Junkshop Profile Page

```
┌──────────────────────────────────────────────────────────┐
│ Profile                                   [Edit Profile] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌──────────────────────────────┐  │
│  │                │  │ Account Information          │  │
│  │   [Avatar]     │  ├──────────────────────────────┤  │
│  │     "JS"       │  │ 👤 Full Name                │  │
│  │                │  │   EcoRecycle Baguio          │  │
│  │  JunkshopName  │  │                              │  │
│  │                │  │ ✉️  Email                   │  │
│  │  🏪 Junkshop   │  │    info@ecorecycle.com      │  │
│  │                │  │                              │  │
│  └────────────────┘  │ 📞 Phone                    │  │
│                      │    +63 (0)2 1234 5001       │  │
│                      │                              │  │
│                      │ 📍 Address                  │  │
│                      │    23 Session Road, BGC     │  │
│                      └──────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📍 Location                                    │   │ ← NEW!
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │                                           │ │   │
│  │  │   [Interactive Map with Marker]  ◯        │ │   │
│  │  │                                           │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  │                                                 │   │
│  │  Latitude:  16.4023045    Longitude: 120.5960 │   │
│  │                                                 │   │
│  │  [📞 Call] [✉️ Email] [🗺️ Get Directions]     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 3. Junkshop Locator - List View

```
┌────────────────────────────────────────────────────────┐
│ Junk Shop Locator                 [List View][Map View]│ ← Toggle!
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Search & Filter                                  │  │
│ │ [Search junkshop name or address...]            │  │
│ │ Material: [All][Plastic][Metal]...[Found: 6]   │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ EcoRecycle Baguio                    ⭐ 4.8    │  │
│ │ 📍 23 Session Road, Baguio City  2.5 km away  │  │
│ │                                                  │  │
│ │ ⏰ 8:00 AM - 6:00 PM   📞 +63 (0)2 1234 5001   │  │
│ │                                                  │  │
│ │ Materials: [Plastic][Metal][Glass][Cardboard]  │  │
│ │                                                  │  │
│ │ [🗺️ Get Directions] [📞 Call]          ← NEW! │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ GreenWaste Solutions                 ⭐ 4.5    │  │
│ │ 📍 Camp 5 Road, Baguio City      3.2 km away   │  │
│ │ [Details...]                                     │  │
│ │ [🗺️ Get Directions] [📞 Call]                   │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ... more shops ...                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 4. Junkshop Locator - Map View

```
┌────────────────────────────────────────────────────────┐
│ Junk Shop Locator             [List View][✓ Map View]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Junkshops on Map (6)                            │  │ ← NEW!
│ ├──────────────────────────────────────────────────┤  │
│ │                                                  │  │
│ │  ┌────────────────────────────────────────────┐ │  │
│ │  │         🗺️  INTERACTIVE MAP        │ - + │ │  │
│ │  │                                            │ │  │
│ │  │      ◯ (User Location - Blue)              │ │  │
│ │  │    [5km radius circle]                     │ │  │
│ │  │                                            │ │  │
│ │  │      ◉ ◉ ◉ (Junkshops - Red)              │ │  │
│ │  │      ◉ ◉ ◉                                │ │  │
│ │  │                                            │ │  │
│ │  │  Click markers to view details             │ │  │
│ │  │                                            │ │  │
│ │  └────────────────────────────────────────────┘ │  │
│ │                                                  │  │
│ │  [Click on markers to view details]             │  │
│ │                                                  │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│  💡 Tip: Click "Get Directions" to navigate.         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 5. Shop Detail Modal (from List or Map View)

```
┌────────────────────────────────────────┐
│ EcoRecycle Baguio          ⭐ 4.8      │ ← Rating
├────────────────────────────────────────┤
│ 23 Session Road, Baguio City          │
│                                        │
│ 📞 Contact                             │
│    +63 (0)2 1234 5001                 │
│                                        │
│ ⏰ Operating Hours                     │
│    8:00 AM - 6:00 PM                  │
│                                        │
│ 📍 Location                            │
│    23 Session Road, Baguio City       │
│    2.5 km from your location          │
│                                        │
│ Materials Accepted                     │
│ [Plastic][Metal][Glass][Cardboard]   │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ [🗺️ Get Directions] [📞 Call Now] ││ ← NEW!
│ └────────────────────────────────────┘│
│                                        │
└────────────────────────────────────────┘
      Click GetDirections
         ↓
    [Google Maps Opens]
    "Navigate to EcoRecycle"
    Est. time: 5 minutes
    Distance: 2.5 km
```

---

## Component Interaction Flow

```
┌─────────────────┐
│  Signup Page    │
│  (Junkshop)     │
└────────┬────────┘
         │
         ├─→ [Account Type] → Junkshop
         │
         ├─→ [Form Fields] → name, email, phone, address, password
         │
         └─→ ┌──────────────────────┐
             │   MapPinner Init      │
             ├──────────────────────┤
             │ • Click on map → pin │
             │ • GPS button         │
             │ • Lat/Lng display    │
             └────────┬─────────────┘
                      │
                      └─→ latitude, longitude
                          │
                          └─→ Form Submit
                              │
                              └─→ [Backend Save]
                                  │
                                  └─→ Database

┌─────────────────┐
│  Profile Page   │
│  (Junkshop)     │
└────────┬────────┘
         │
         ├─→ ┌──────────────────────┐
         │   │ JunkshopProfile      │
         │   ├──────────────────────┤
         │   │ • Show map with mark │
         │   │ • Show coordinates   │
         │   │ • Call/Email/Dir btns│
         │   └──────────────────────┘
         │
         └─→ [Edit Profile]
             │
             └─→ ┌──────────────────────┐
                 │   MapPinner Update   │
                 ├──────────────────────┤
                 │ • Modify location    │
                 │ • Save changes       │
                 └──────────────────────┘

┌─────────────────────┐
│  Locator Page       │
│  (Household)        │
└────────┬────────────┘
         │
         ├─→ [Toggle] → List View (default)
         │   │
         │   └─→ Show shops as cards
         │       │
         │       └─→ Click "Get Directions"
         │           │
         │           └─→ ┌────────────────────────┐
         │               │ GetDirectionsButton    │
         │               ├────────────────────────┤
         │               │ Opens Google Maps      │
         │               │ with navigation to     │
         │               │ junkshop coordinates   │
         │               └────────────────────────┘
         │
         └─→ [Toggle] → Map View (new!)
             │
             └─→ MapContainer with:
                 ├─ User location (blue marker)
                 ├─ 5km radius circle
                 ├─ All junkshops (red markers)
                 │
                 └─→ Click marker/card
                     │
                     └─→ Show details modal
                         │
                         └─→ "Get Directions"
                             │
                             └─→ Google Maps
```

---

## Data Flow: Location Information

```
┌──────────────────┐
│  GPS Coordinates │
│  (Browser)       │
└────────┬─────────┘
         │
         ├─→ [MapPinner]
         │   │
         │   └─→ Latitude: 16.4023045
         │       Longitude: 120.5960123
         │
         ├─→ [Form State]
         │   │
         │   └─→ formData.latitude
         │       formData.longitude
         │
         ├─→ [API Request]
         │   │
         │   └─→ POST /api/auth/signup
         │       {
         │         name, email, phone,
         │         address, password,
         │         latitude,    ← NEW
         │         longitude    ← NEW
         │       }
         │
         └─→ [Database]
             │
             └─→ users.latitude
                 users.longitude
                 │
                 ├─→ [Profile Retrieve]
                 │   │
                 │   └─→ [JunkshopProfile]
                 │       Shows map with marker
                 │
                 └─→ [Locator Retrieve]
                     │
                     └─→ [Locator Page]
                         Shows on map
```

---

## Component Tree

```
App
│
├─ Signup Page
│  └─ MapPinner ← NEW
│     ├─ MapContainer
│     ├─ TileLayer
│     ├─ Marker
│     └─ (GPS, coordinates)
│
├─ Profile Page
│  ├─ JunkshopProfile ← NEW (if junkshop)
│  │  ├─ MapContainer
│  │  ├─ TileLayer
│  │  ├─ Marker
│  │  ├─ GetDirectionsButton ← NEW
│  │  └─ (Contact buttons)
│  │
│  └─ MapPinner ← NEW (in edit mode)
│     └─ (Same as signup)
│
└─ Locator Page
   ├─ [List View / Map View Toggle]
   │
   ├─ List View
   │  ├─ Shop Cards
   │  │  ├─ GetDirectionsButton ← NEW
   │  │  └─ Call button
   │  │
   │  └─ Detail Modal
   │     ├─ GetDirectionsButton ← NEW
   │     └─ Call button
   │
   └─ Map View ← NEW
      ├─ MapContainer
      ├─ TileLayer
      ├─ User Location Marker (Blue)
      ├─ Junkshop Markers (Red) × N
      └─ Click handlers
         └─ Show detail modal
```

---

## Icon Legend

| Icon | Meaning |
|------|---------|
| 📍 | Location / Pin |
| 🗺️ | Map / Directions |
| 📞 | Phone / Call |
| ✉️ | Email |
| ⏰ | Time / Hours |
| ⭐ | Rating |
| ◯ | User location (blue marker) |
| ◉ | Junkshop (red marker) |
| ✓ | Confirmed / Done |
| ← NEW! | New feature |

---

## Mobile Responsive Layouts

### Mobile (< 640px)
```
┌─────────────┐
│ [Map View]  │  ← Stacked vertically
│             │
│ ┌─────────┐ │
│ │   Map   │ │  300px height
│ │ (300px) │ │
│ └─────────┘ │
│             │
│ [Details]   │
│ ┌─────────┐ │
│ │ Name    │ │
│ │ Rating  │ │
│ │ Address │ │
│ └─────────┘ │
│             │
│ ┌─────────┐ │
│ │[Button] │ │
│ └─────────┘ │
│             │
└─────────────┘
```

### Tablet (640-1024px)
```
┌────────────────────────┐
│   Two Column Layout    │
├────────────┬───────────┤
│   Map      │ Details   │
│  (400px)   │ • Name    │
│            │ • Rating  │
│            │ • Address │
│            │ • Buttons │
└────────────┴───────────┘
```

### Desktop (> 1024px)
```
┌──────────────────────────────────────┐
│      Three Column or Full Width      │
├──────────────┬──────────┬────────────┤
│ Details      │ Map      │ Info       │
│ • Name       │ (500px)  │ • Hours    │
│ • Rating     │          │ • Materials│
│ • Address    │          │ • Stats    │
├──────────────┴──────────┴────────────┤
│     Buttons (Full Width or Side)     │
└──────────────────────────────────────┘
```

---

## Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| User Marker | 🔵 Blue | Your location |
| Junkshop Marker | 🔴 Red | Shop locations |
| Radius Circle | 🟢 Light Green | Search area (5km) |
| Button Primary | Primary | Get Directions |
| Button Secondary | Outline | Call, Email |
| Confirmation | Green | Location pinned |
| Warning | Yellow | Location not set |
| Info | Blue | Location detected |

---

## Summary

This visual guide shows how users interact with the new map features across all components. The implementation is clean, intuitive, and mobile-responsive.

**Key Improvements:**
- Easy location pinning for junkshops
- Visual map browsing for households
- One-click Google Maps navigation
- Responsive across all devices
- Clear visual feedback

---

End of Visual Guide ✓
