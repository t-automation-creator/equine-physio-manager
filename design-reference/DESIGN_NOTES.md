# Design Reference Analysis - CVS Health App Style

## Color Palette

### Primary Colors
- **Primary Red**: #CC0000 (CVS Red) - Used for logo, active icons, important actions
- **Primary Blue**: #0066CC - Used for primary CTA buttons (Continue, Search)
- **Success Green**: #00875A - Used for toggle switches, checkmarks, availability indicators

### Neutral Colors
- **Background**: #FFFFFF (Pure white) and #F5F5F5 (Light gray sections)
- **Card Background**: #FFFFFF
- **Text Primary**: #1A1A1A (Near black)
- **Text Secondary**: #666666 (Medium gray)
- **Text Muted**: #999999 (Light gray)
- **Border**: #E5E5E5 (Very light gray)
- **Divider**: #F0F0F0

### Accent Colors (Promotional Cards)
- **Pink**: #FFE4EC
- **Green**: #D4F5E9
- **Yellow**: #FFF8E1

## Typography

### Font Weights
- **Bold (700)**: Page titles, card headings, prices
- **Semibold (600)**: Section headers, button text
- **Medium (500)**: Navigation labels, form labels
- **Regular (400)**: Body text, descriptions

### Font Sizes
- **Page Title**: 24-28px
- **Section Header**: 18-20px
- **Card Title**: 16-18px
- **Body Text**: 14-16px
- **Caption/Label**: 12-14px
- **Small Text**: 11-12px

## Component Styles

### Cards
- Background: White (#FFFFFF)
- Border-radius: 12-16px (rounded-xl to rounded-2xl)
- Shadow: Very subtle or none (border-based separation)
- Border: 1px solid #E5E5E5
- Padding: 16-20px

### Buttons
- **Primary CTA**: 
  - Background: #0066CC (Blue)
  - Text: White
  - Border-radius: 24px (fully rounded/pill shape)
  - Height: 48-52px
  - Full width on mobile

- **Secondary/Outline**:
  - Background: Transparent
  - Border: 1px solid #E5E5E5
  - Text: #1A1A1A
  - Border-radius: 24px

- **Pill/Tag Buttons**:
  - Background: White
  - Border: 1px solid #E5E5E5
  - Border-radius: 20px
  - Padding: 8px 16px

### Form Inputs
- Border: 1px solid #E5E5E5
- Border-radius: 8px
- Height: 48-52px
- Padding: 12px 16px
- Focus: Border color changes to primary
- Label: Above input, medium weight

### Navigation

#### Bottom Navigation Bar
- Background: White
- Border-top: 1px solid #E5E5E5
- Height: ~60px
- Items: 5 icons with labels
- Active state: Red icon (#CC0000)
- Inactive state: Gray icon (#666666)
- Active indicator: Pill background on active item (optional)

#### Top Header
- Background: White
- Height: ~56px
- Left: User icon or back arrow
- Center: Page title (when applicable)
- Right: Notification bell, cart icon

### List Items
- Background: White
- Padding: 16px
- Border-bottom: 1px solid #F0F0F0
- Chevron right arrow for navigation
- Icon on left side (optional)

### Toggle Switches
- Track: #E5E5E5 (off), #00875A (on)
- Thumb: White
- Size: 51x31px (iOS standard)

### Step Indicators
- Active: Filled circle with number (Red #CC0000)
- Inactive: Outlined circle with number
- Size: 32px diameter

### Search Bar
- Background: #F5F5F5 or White with border
- Border-radius: 8px
- Height: 44-48px
- Search icon on left
- Barcode scanner icon on right (optional)

## Layout Patterns

### Page Structure
1. Header (fixed top)
2. Search bar (if applicable)
3. Quick action pills/tabs
4. Content sections
5. Bottom navigation (fixed bottom)

### Spacing
- Page padding: 16px horizontal
- Section gap: 24px
- Card gap: 12-16px
- Element gap within cards: 12-16px

### Safe Areas
- Top: Account for status bar
- Bottom: Account for home indicator + nav bar

## Interaction Patterns

### Transitions
- Smooth slide animations for page transitions
- Fade for modals and overlays
- Spring animation for toggles

### Feedback
- Subtle press states (opacity or background change)
- Loading spinners for async actions
- Success checkmarks for completed actions

## Adapting for EquiPhysio

### Color Mapping
- CVS Red → EquiPhysio Red (#DC2626 or similar)
- Blue CTA → Keep blue (#0066CC) or use brand color
- Green accents → Keep green (#00875A) for success states

### Navigation Items
- Home (heart icon → home icon)
- Appointments (calendar)
- Clients (users)
- Yards (building)
- Invoices (file-text)

### Key Screens to Redesign
1. Home/Today view
2. Client list
3. Client detail
4. New client form
5. Appointment list
6. New appointment form
7. Treatment entry
8. Invoice views
9. Profile/Settings
