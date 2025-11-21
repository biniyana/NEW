# Waiz Eco-Marketplace Design Guidelines

## Design Approach
**Reference-Based**: Draw inspiration from modern marketplace platforms (Airbnb, Facebook Marketplace) combined with eco-conscious design principles similar to sustainable brands. Create a trustworthy, community-focused platform with emphasis on simplicity and accessibility.

## Core Design Principles
- **Trust & Transparency**: Clear pricing, verified users, straightforward interactions
- **Community-First**: Emphasize local Baguio connections and environmental impact
- **Efficiency**: Streamlined flows for listing items and requesting collections
- **Accessibility**: Simple enough for diverse user base (households to junkshop owners)

## Typography
**Font Family**: Inter (primary), with system fallbacks
**Hierarchy**:
- Hero headlines: 2.5rem (40px), bold
- Section headings: 1.5rem (24px), bold  
- Body text: 1rem (16px), regular
- Small text: 0.875rem (14px), regular
- Micro copy: 0.75rem (12px), regular

## Layout System
**Spacing**: Use Tailwind units of 4, 6, 8, 12, 16, 20 (p-4, m-6, gap-8, py-12, etc.)
**Container**: Max-width 6xl (1152px) for main content, 7xl for full-width sections
**Grid**: 3-column for features/items on desktop, single column on mobile

## Component Library

### Navigation
- Sticky header with logo (gradient circle + recycling emoji), site name, tagline
- Horizontal nav with text links and primary CTA button
- Mobile: Hamburger menu (when implemented)

### Hero Section
- **No image required** - Use bold typography and gradient accent elements
- Centered layout with large headline, subtitle, dual CTAs (primary + secondary outlined)
- Generous vertical padding (py-20)

### Cards
- White surface with subtle shadow
- Rounded corners (rounded-lg)
- Hover lift effect (translateY -2px)
- Icon/emoji + title + description layout for features
- Image/emoji + title + price + metadata for marketplace items

### Forms
- Full-width input fields with labels
- Rounded inputs with border
- Primary button for submit
- Clear error/success states

### Chat Interface
- Slide-in panel from right
- Message bubbles with max-width 80%
- Sender/receiver differentiation via alignment
- Sticky input at bottom

### Dashboard
- Tab navigation for different sections (Listings, Requests, Messages)
- Data tables/cards for transaction history
- Status badges for request states (Pending, Completed)
- Action buttons within cards

### Lists & Tables
- Rate list: Icon + material name + price in structured rows
- Item cards: Grid layout with consistent spacing
- Request cards: Timeline-style with status indicators

## Interactions
- **Minimal animations**: Fade-in for page transitions (0.3s)
- Hover states: Opacity change (0.9) and subtle lift on cards
- Button states: Slight opacity reduction on hover
- Smooth scroll behavior for anchor links

## Sections Structure

**Landing Page**:
1. Header (sticky)
2. Hero (centered, dual CTAs)
3. Features Grid (3 cards: Households, Junkshops, Communication)
4. Footer (when added)

**Dashboard**:
1. Header with user info
2. Tab navigation
3. Content area (context-dependent: listings, requests, messages)
4. Floating chatbot toggle

**Marketplace**:
1. Filter bar (category pills)
2. Item grid (responsive columns)
3. Item cards (emoji/image, title, price, seller, action button)

## Images
**No hero image required** - This platform focuses on functionality and community trust over visual appeal. Use emoji icons (♻️🏠🏪💬📦) and gradient backgrounds for visual interest. If images are added later, use them for:
- Item listings (user-uploaded photos of recyclables)
- Junkshop profile photos
- Optional: Small background pattern/texture on hero section

## Platform-Specific Elements
- **Chatbot**: Floating button (bottom-right) that opens slide-in chat panel
- **Rate List**: Clean table/card layout showing current recyclable prices
- **Category Pills**: Horizontal scrollable filter for item categories (Plastic, Paper, Metal, Glass)
- **User Type Badges**: Visual distinction between Household and Junkshop accounts
- **Status Indicators**: Color-coded badges for request states

## Accessibility
- Consistent form input styling across all forms
- Clear focus states on interactive elements
- Sufficient color contrast (dark text on light backgrounds)
- Descriptive button labels ("Get Started" vs "Click Here")