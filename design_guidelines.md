# Design Guidelines for Riphah School Social Media Portal

## Design Approach
**Reference-Based Approach** inspired by modern education platforms like Canvas and Schoology, combined with social media management tools like Hootsuite. This creates a familiar, trustworthy interface that balances academic professionalism with social media engagement.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Deep Blue: 220 85% 25% (from logo - professional, trustworthy)
- Clean White: 0 0% 98% (bright, clean backgrounds)

**Supporting Colors:**
- Light Blue: 220 45% 95% (subtle backgrounds, cards)
- Success Green: 142 76% 36% (approved posts)
- Warning Orange: 38 92% 50% (pending posts)
- Error Red: 0 84% 60% (rejected posts)

**Dark Mode:**
- Background: 220 13% 8%
- Cards: 220 13% 12%
- Text: 220 15% 95%

### B. Typography
**Primary Font:** Inter (Google Fonts)
- Headings: 600-700 weight
- Body: 400-500 weight
- Captions: 400 weight, smaller sizes

**Hierarchy:**
- Page titles: text-3xl font-bold
- Section headers: text-xl font-semibold
- Body text: text-base font-normal
- Captions: text-sm text-gray-600

### C. Layout System
**Spacing System:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section margins: mb-8, mt-12
- Card spacing: gap-4, gap-6
- Container max-width: max-w-6xl

### D. Component Library

**Navigation:**
- Clean header with logo (left), navigation links (center), user menu (right)
- Sticky navigation with subtle shadow on scroll
- Mobile: Collapsible hamburger menu

**Cards:**
- Rounded corners: rounded-lg
- Subtle shadows: shadow-sm, hover:shadow-md
- White backgrounds with border: border border-gray-200

**Forms:**
- Generous padding and spacing
- Clear labels above inputs
- Rounded inputs: rounded-md
- Focus states with blue ring
- Drag-and-drop upload areas with dashed borders

**Buttons:**
- Primary: Blue background, white text, rounded-md
- Secondary: White background, blue border and text
- Success/Danger: Contextual colors for approve/reject actions
- Icon buttons for quick actions

**Status Indicators:**
- Badge-style status pills with appropriate colors
- Clear icons (checkmark, clock, x) with status text
- Subtle background colors matching status

**Data Display:**
- Clean tables with alternating row colors
- Card-based post previews with thumbnails
- Timeline view for post history

**Dashboard Layout:**
- Sidebar navigation (collapsible on mobile)
- Main content area with breadcrumbs
- Quick stats cards at top
- Filterable post grid/list view

### E. Animations
Minimal, purposeful animations only:
- Smooth hover transitions (0.2s ease)
- Modal/dropdown enter/exit animations
- Button click feedback
- No auto-playing or distracting animations

## User Experience Priorities

**Easy Account Creation:**
- Prominent "Sign Up" button on homepage
- One-click social login options (Google, GitHub)
- Minimal required fields
- Clear role selection during registration

**Intuitive Post Submission:**
- Single-page form with clear steps
- Drag-and-drop image upload with preview
- Real-time character counting for captions
- Auto-save draft functionality

**Efficient Admin Workflow:**
- Dashboard with pending posts prominently displayed
- Quick approve/reject buttons with confirmation
- Bulk action capabilities
- Clear post details in expandable cards

**Mobile Optimization:**
- Touch-friendly button sizes (min 44px)
- Responsive grid layouts
- Swipe gestures for mobile actions
- Optimized image handling for mobile uploads

## Images
**Logo Placement:** Riphah School logo in header (left side, ~40px height)
**No Hero Image:** Focus on functional dashboard layout rather than marketing imagery
**Post Thumbnails:** Small preview images in post cards (80x80px)
**Upload Previews:** Full-size image previews in submission forms
**Empty States:** Simple illustrations for empty post lists, pending approvals

This design creates a professional, easy-to-use portal that reflects the academic institution's credibility while making social media management accessible to all users.