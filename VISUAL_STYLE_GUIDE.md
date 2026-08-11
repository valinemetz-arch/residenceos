# Paseo de Caballo - Visual Style Guide

## Brand Identity

### Logo
The Paseo de Caballo logo features:
- Elegant landscape/map motif representing property and land
- Sage green mountain ranges suggesting trust and growth
- Warm tan rolling hills creating approachability
- Earth brown paths showing direction and guidance
- Located at `/public/paseo-logo.svg`

**Usage Sizes**:
- Header: 40x40px or 48x48px
- Login page: 96x96px
- Footer: 32x32px

---

## Color System

### Primary Color - Sage Green
**Main**: `#2D5016` (RGB: 45, 80, 22)
- Used for primary buttons, headers, active navigation, links
- Creates strong brand presence
- Inspires trust and growth

**Light Variant**: `#3D6B1F` - Hover states on darker backgrounds
**Dark Variant**: `#1F3810` - Pressed states, high contrast text

```
████████ #2D5016 - Main (Primary buttons, headers)
████████ #3D6B1F - Light (Hover states)
████████ #1F3810 - Dark (Pressed states)
```

### Secondary Color - Warm Tan
**Main**: `#C9A876` (RGB: 201, 168, 118)
- Used for secondary buttons, alternative actions
- Creates warm, approachable feeling
- Works as primary in dark mode

**Light Variant**: `#D9B896` - Hover states
**Dark Variant**: `#A88860` - Pressed states

```
████████ #C9A876 - Main (Secondary buttons)
████████ #D9B896 - Light (Hover states)
████████ #A88860 - Dark (Pressed states)
```

### Accent Color - Earth Brown
**Main**: `#8B6F47` (RGB: 139, 111, 71)
- Used for tertiary elements, subtle highlights
- Adds depth and sophistication
- Complements both primary and secondary

```
████████ #8B6F47 - Earth Brown (Accents & details)
```

### Neutral Palette
**Background Colors**:
```
████████ #FAFAF8 - Light Cream (Primary background)
████████ #F5F3F0 - Off-white (Cards, containers)
████████ #FFFFFF - Pure White (Modals, overlays)
████████ #2D2D2D - Dark Charcoal (Dark mode background)
```

**Text Colors**:
```
████████ #1F1F1F - Charcoal (Primary text, headings)
████████ #5A5A5A - Dark Gray (Secondary text, metadata)
████████ #8A8A8A - Gray (Disabled text, placeholders)
```

### Semantic Colors
```
████████ #2D7D3B - Success Green (✓ Success states)
████████ #C97D2D - Warning Orange (⚠ Warning states)
████████ #8B3A3A - Error Red (✗ Error states)
████████ #2D5B7D - Info Blue (ℹ Information)
```

---

## Typography

### Font Family
**"Paseo de Caballo" uses system fonts:**
```
system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

Benefits:
- Modern and clean
- Optimized for readability
- Fast loading (no external requests)
- Native rendering on all platforms
- Accessible to all users

### Type Scale

```
H1 - 36px (2.25rem)  │ Page Titles & Major Headings
H2 - 30px (1.875rem) │ Section Headings
H3 - 24px (1.5rem)   │ Subsections
H4 - 20px (1.25rem)  │ Minor Headings
H5 - 18px (1.125rem) │ Emphasis text
H6 - 16px (1rem)     │ Label-level text
    ──────────────────
Body - 16px (1rem)   │ Standard content
Small - 14px (0.875) │ Secondary content
Cap - 12px (0.75rem) │ Captions & metadata
```

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Subtle emphasis, captions |
| Regular | 400 | Body text, paragraphs |
| Medium | 500 | Metadata, small labels |
| Semibold | 600 | Subheadings, form labels |
| Bold | 700 | Headings, buttons |
| Extrabold | 800 | Large headings, emphasis |

---

## Component Examples

### Primary Button
```
┌─────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  ▓ Sign In            ▓ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────┘
Color: #2D5016 (Sage Green)
Hover: #1F3810 (Darker Green)
Text: White
Padding: 12px 24px
Radius: 8px (0.5rem)
Shadow: 0 4px 6px rgba(0,0,0,0.1)
```

### Secondary Button
```
┌─────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░ Cancel              ░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────┘
Color: #C9A876 (Warm Tan)
Hover: #A88860 (Darker Tan)
Text: #1F1F1F (Charcoal)
Padding: 12px 24px
Radius: 8px (0.5rem)
```

### Form Input
```
┌─────────────────────────┐
│ ○ Email Address       │
│ ┌─────────────────────┐ │
│ │ name@example.com    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
Border: 2px solid #F5F3F0
Focus Border: 2px solid #2D5016
Focus Ring: 3px rgba(45,80,22,0.2)
Background: #FAFAF8
Padding: 12px 16px
Radius: 8px (0.5rem)
```

### Card
```
┌──────────────────────────────┐
│                              │
│  Dashboard                   │
│  Welcome to ResidenceOS      │
│                              │
│  Total Spaces:        12    │
│  Active Tasks:         8    │
│                              │
│ ┌──────────────────────────┐ │
│ │ View Details →          │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
Background: #F5F3F0 (Off-white)
Border: 1px solid #F5F3F0
Radius: 16px (1rem)
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover Shadow: 0 4px 6px rgba(0,0,0,0.1)
Hover Border: 1px solid #2D5016
Padding: 24px
```

### Navigation
```
┌────────────────────────────────────────┐
│ [Logo] Paseo OS                        │
│                                        │
│ ▪ Dashboard  Spaces  Assets  Tasks    │
│                                        │
└────────────────────────────────────────┘
Active: #2D5016 text + #F5F3F0 background
Hover: #2D5016 text + #F5F3F0 background
Default: #5A5A5A text
Height: 80px
```

---

## Spacing System

Based on 4px base unit (0.25rem):

```
Extra Small:  4px  ▬▬
Small:        8px  ▬▬▬▬
Base:        12px  ▬▬▬▬▬▬
Standard:    16px  ▬▬▬▬▬▬▬▬  ← Most common
Large:       24px  ▬▬▬▬▬▬▬▬▬▬▬▬
Extra Large: 32px  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Huge:        48px  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
```

**Spacing Rules**:
- Use between elements: 16px (standard)
- Use between sections: 24-32px (larger)
- Use inside components: 8-12px (tighter)
- Padding on cards: 24px
- Padding on buttons: 12px vertical, 16px horizontal

---

## Border Radius System

```
No Radius:    0px        (for specific lines)
Small:        4px        (0.25rem)  - Input borders
Standard:     8px        (0.5rem)   - Buttons, inputs
Medium:      12px        (0.75rem)  - Moderate elements
Large:       16px        (1rem)     - Cards, containers ← Most common
Extra Large: 24px        (1.5rem)   - Large components
Full:     9999px        - Pill buttons, circles
```

**Common Usage**:
- Buttons: 8px
- Inputs: 8px
- Cards: 16px
- Modals: 16px
- Pills/Badges: 9999px

---

## Shadow System

### Subtle (Resting State)
```
SM: 0 1px 2px rgba(0,0,0,0.05)
    Used on: Quiet cards, muted elements
```

### Standard (Hover State)
```
MD: 0 4px 6px rgba(0,0,0,0.1)
    Used on: Cards on hover, buttons on hover
```

### Elevated
```
LG: 0 10px 15px rgba(0,0,0,0.1)
    Used on: Elevated panels, popovers
```

### High Elevation
```
XL: 0 20px 25px rgba(0,0,0,0.1)
    Used on: Modals, overlays, top-level elements
```

---

## Interaction States

### Button States

**Default**
```
Background: #2D5016
Text: White
Cursor: pointer
```

**Hover**
```
Background: #1F3810 (darker)
Shadow: Increase to MD
Cursor: pointer
Transform: Subtle lift (via shadow)
```

**Focus**
```
Outline: None
Ring: 3px solid rgba(45,80,22,0.2)
Ring Offset: 2px
```

**Pressed**
```
Background: #142605 (darkest)
Shadow: Decrease to SM
Transform: Slight scale-down
```

**Disabled**
```
Opacity: 50%
Cursor: not-allowed
No hover effects
```

### Form Input States

**Default**
```
Border: 2px solid #F5F3F0
Background: #FAFAF8
Color: #1F1F1F
```

**Hover**
```
Border: 2px solid #F5F3F0 (no change, just info)
Cursor: text
```

**Focus**
```
Border: 2px solid #2D5016
Ring: 3px rgba(45,80,22,0.2)
Background: White
Shadow: None
```

**Filled**
```
Border: 2px solid #2D5016
Has value indicator
```

**Error**
```
Border: 2px solid #8B3A3A
Ring: 3px rgba(139,58,58,0.2)
Message: #8B3A3A text below
```

**Disabled**
```
Border: 2px solid #F5F3F0
Background: #F5F3F0
Opacity: 50%
Cursor: not-allowed
```

---

## Dark Mode Adjustments

### Background Colors
```
Light Mode:  #FAFAF8 (Light Cream)
Dark Mode:   #2D2D2D (Dark Charcoal)
```

### Text Colors
```
Light Mode:  #1F1F1F (Charcoal)
Dark Mode:   #FAFAF8 (Light Cream)
```

### Primary Color
```
Light Mode:  #2D5016 (Sage Green)
Dark Mode:   #C9A876 (Warm Tan) - Lighter for contrast
```

### Card Backgrounds
```
Light Mode:  #F5F3F0 (Off-white)
Dark Mode:   #1F1F1F (Very Dark)
```

### Borders
```
Light Mode:  #F5F3F0 (Subtle light)
Dark Mode:   #2D2D2D (Subtle dark)
```

---

## Accessibility

### Color Contrast
```
Primary text (#1F1F1F) on Light (#FAFAF8):
Ratio: 18.5:1 ✓ Excellent

Primary button text (White) on Primary (#2D5016):
Ratio: 7.2:1 ✓ AAA Compliant

Secondary button text (#1F1F1F) on Secondary (#C9A876):
Ratio: 5.1:1 ✓ AA Compliant
```

### Focus Indicators
```
Ring Style: Solid 3px
Ring Color: rgba(45,80,22,0.2) with border
Visibility: High contrast
Visible at: All zoom levels
```

### Motion
```
Transitions: 250ms cubic-bezier(0.4, 0, 0.2, 1)
Respects: prefers-reduced-motion
No: Unexpected auto-play
```

---

## Real-World Examples

### Login Page
- Hero with logo (96x96px)
- Branded input fields
- Primary green button
- Dark/light gradient background
- Professional warm aesthetic

### Dashboard
- Branded welcome header
- Color-coded stat cards
- Navigation with logo
- Footer with branding
- Quick action buttons in primary

### Navigation
- Logo at 40x40px
- Sage green active states
- Warm tan hover effects
- Clean hierarchy

### Footer
- Logo at 32x32px
- Organized link sections
- Sage green link text on hover
- Copyright with year
- Social link placeholders

---

## Do's and Don'ts

### ✅ DO
- Use sage green (#2D5016) for primary actions
- Use warm tan (#C9A876) for secondary options
- Maintain proper spacing between elements
- Use system fonts for clean appearance
- Include focus states on interactive elements
- Support both light and dark modes
- Use semantic colors for status (green/yellow/red)

### ❌ DON'T
- Use pure white (#FFFFFF) as primary background
- Forget focus states on buttons and inputs
- Use custom fonts without good reason
- Rely on color alone to communicate
- Create new colors outside the palette
- Ignore dark mode users
- Use harsh shadows on everything

---

## Implementation Checklist

When building new features:
- [ ] Choose colors from established palette
- [ ] Use system fonts (no custom web fonts)
- [ ] Apply proper spacing (multiples of 4px)
- [ ] Add border radius (minimum 8px for interactive)
- [ ] Include hover states
- [ ] Include focus states (ring, not outline)
- [ ] Test in dark mode
- [ ] Verify color contrast (WCAG AA minimum)
- [ ] Check responsive on mobile
- [ ] Use semantic HTML for accessibility

---

## Quick Reference

**Primary Action**: Use sage green (#2D5016)
**Secondary Action**: Use warm tan (#C9A876)
**Accent/Detail**: Use earth brown (#8B6F47)
**Background**: Use light cream (#FAFAF8)
**Cards**: Use off-white (#F5F3F0)
**Text**: Use charcoal (#1F1F1F)
**Focus Ring**: Use primary color at 20% opacity

---

**This visual style guide ensures consistency across all Paseo de Caballo property applications.**

Last Updated: 2026-08-11
