# Paseo de Caballo Design System

## Overview

This is a complete, production-ready design system for ResidenceOS branded with Paseo de Caballo styling. The system is built on earthy, natural colors with a modern, clean aesthetic that conveys professionalism, warmth, and trustworthiness.

---

## Brand Colors

### Primary Color: Sage Green
- **Main**: `#2D5016` - The signature sage green used for primary actions, headers, and brand identity
- **Light**: `#3D6B1F` - Lighter variant for hover states and secondary emphasis
- **Lighter**: `#4D7F2B` - Even lighter for subtle backgrounds
- **Dark**: `#1F3810` - Darker variant for pressed states and high contrast
- **Darker**: `#142605` - Darkest variant for text on light backgrounds

### Secondary Color: Warm Tan
- **Main**: `#C9A876` - The warm tan used for secondary actions and accents
- **Light**: `#D9B896` - Lighter variant for hover states
- **Lighter**: `#E9C8B6` - Lightest variant for backgrounds
- **Dark**: `#A88860` - Darker variant for pressed states

### Accent Color: Earth Brown
- **Main**: `#8B6F47` - Deep, earthy brown used for highlights and tertiary elements

### Neutral Colors
- **Cream**: `#F5F3F0` - Off-white, used for card backgrounds and subtle borders
- **Light**: `#FAFAF8` - Very light cream, primary background
- **Lighter**: `#FEFDFB` - Almost white for high contrast backgrounds
- **Gray**: `#8A8A8A` - Medium gray for secondary text
- **Dark Gray**: `#5A5A5A` - Darker gray for muted text
- **Charcoal**: `#1F1F1F` - Dark charcoal for primary text
- **Black**: `#0A0A0A` - Pure black for maximum contrast

### Semantic Colors
- **Success**: `#2D7D3B` - Sustainable green for success states
- **Warning**: `#C97D2D` - Earthy orange for warnings
- **Error**: `#8B3A3A` - Deep red for errors
- **Info**: `#2D5B7D` - Soft blue for information

---

## Design Tokens

### Typography

#### Font Families
- **Sans Serif**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - Modern, clean, system-native fonts for optimal readability
- **Monospace**: `"Courier New", monospace`
  - Used for code and technical content

#### Font Sizes
```
xs:   0.75rem  (12px)
sm:   0.875rem (14px)
base: 1rem     (16px)
lg:   1.125rem (18px)
xl:   1.25rem  (20px)
2xl:  1.5rem   (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem  (36px)
5xl:  3rem     (48px)
```

#### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

#### Heading Styles
- **H1**: 36px (2.25rem), 700 weight, -0.02em tracking
- **H2**: 30px (1.875rem), 700 weight, -0.01em tracking
- **H3**: 24px (1.5rem), 600 weight
- **H4**: 20px (1.25rem), 600 weight
- **H5**: 18px (1.125rem), 600 weight
- **H6**: 16px (1rem), 600 weight

### Spacing
All spacing follows a 4px base unit (0.25rem):
```
0.25rem  (4px)
0.5rem   (8px)
0.75rem  (12px)
1rem     (16px)
1.5rem   (24px)
2rem     (32px)
3rem     (48px)
4rem     (64px)
5rem     (80px)
6rem     (96px)
```

### Border Radius
```
0.25rem (4px)   - sm (small, subtle)
0.5rem  (8px)   - base (standard inputs)
0.75rem (12px)  - md (medium elements)
1rem    (16px)  - lg (large cards)
1.5rem  (24px)  - xl (very large components)
9999px          - full (pill buttons)
```

### Shadows
- **SM**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` - Subtle elevation
- **MD**: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` - Standard elevation
- **LG**: `0 10px 15px -3px rgba(0, 0, 0, 0.1)` - Higher elevation
- **XL**: `0 20px 25px -5px rgba(0, 0, 0, 0.1)` - High elevation

### Transitions
- **Fast**: 150ms cubic-bezier(0.4, 0, 0.2, 1) - Quick interactions
- **Base**: 250ms cubic-bezier(0.4, 0, 0.2, 1) - Standard transitions
- **Slow**: 350ms cubic-bezier(0.4, 0, 0.2, 1) - Emphasis transitions

---

## Component Styles

### Buttons

#### Primary Button
```tsx
className="bg-[#2D5016] text-white hover:bg-[#1F3810] 
           transition-colors rounded-lg font-medium py-2 px-4
           shadow-md hover:shadow-lg"
```
Used for main actions and calls-to-action.

#### Secondary Button
```tsx
className="bg-[#C9A876] text-[#1F1F1F] hover:bg-[#A88860] 
           transition-colors rounded-lg font-medium py-2 px-4"
```
Used for secondary actions and alternatives.

#### Outline Button
```tsx
className="border-2 border-[#2D5016] text-[#2D5016] 
           hover:bg-[#F5F3F0] transition-colors rounded-lg 
           font-medium py-2 px-4"
```
Used for less prominent actions.

#### Ghost Button
```tsx
className="text-[#2D5016] hover:bg-[#F5F3F0] 
           transition-colors rounded-lg font-medium py-2 px-4"
```
Used for tertiary actions and navigation.

### Input Fields
```tsx
className="w-full px-4 py-3 rounded-lg border-2 border-[#F5F3F0] 
           bg-[#FAFAF8] text-[#1F1F1F] font-medium
           focus:outline-none focus:border-[#2D5016] 
           focus:ring-3 focus:ring-[#2D5016]/20"
```

Focus states use a subtle ring with the primary color at 20% opacity.

### Cards
```tsx
className="rounded-2xl border border-[#F5F3F0] 
           bg-[#F5F3F0] p-6 shadow-sm hover:shadow-md 
           transition-all duration-200"
```

Cards use a subtle border, light background, and smooth shadow transition on hover.

### Badges
```tsx
// Primary
className="inline-block px-3 py-1 rounded-full 
           bg-[#2D5016] text-white text-sm font-medium"

// Secondary
className="inline-block px-3 py-1 rounded-full 
           bg-[#C9A876] text-[#1F1F1F] text-sm font-medium"

// Success
className="inline-block px-3 py-1 rounded-full 
           bg-[#2D7D3B] text-white text-sm font-medium"
```

### Navigation Links
```tsx
// Active state
className="text-[#2D5016] bg-[#F5F3F0] rounded-lg px-3 py-2"

// Hover state
className="text-[#2D5016] hover:bg-[#F5F3F0] rounded-lg px-3 py-2"

// Default state
className="text-[#5A5A5A] hover:text-[#2D5016] rounded-lg px-3 py-2"
```

---

## Color Palette in Context

### Background Colors
- **Primary Background**: `#FAFAF8` (Light cream) - Used for body backgrounds
- **Secondary Background**: `#F5F3F0` (Off-white) - Used for cards and containers
- **Tertiary Background**: `#FFFFFF` (Pure white) - Used for modals and overlays

### Text Colors
- **Primary Text**: `#1F1F1F` (Charcoal) - Main body text and headings
- **Secondary Text**: `#5A5A5A` (Dark gray) - Muted text and metadata
- **Tertiary Text**: `#8A8A8A` (Gray) - Disabled text and placeholders
- **Inverse Text**: `#FFFFFF` (White) - Text on primary colored backgrounds

### Border Colors
- **Primary Borders**: `#2D5016` (Sage green) - Important borders
- **Secondary Borders**: `#C9A876` (Warm tan) - Secondary emphasis
- **Light Borders**: `#F5F3F0` (Off-white) - Subtle dividers

---

## Dark Mode

The design system fully supports dark mode with adjusted colors:

### Dark Mode Adjustments
- **Background**: Changes from light cream to dark charcoal (`#2D2D2D`)
- **Primary Text**: Changes from charcoal to light cream
- **Primary Color**: Shifts to lighter tan (`#C9A876`) for better contrast
- **Secondary Colors**: Adjusted for readability in dark context
- **Shadows**: Reduced opacity for dark backgrounds

---

## Files Included

### 1. **Design Tokens** (`/lib/design-tokens.ts`)
Comprehensive TypeScript file with all design tokens organized by category:
- Colors (primary, secondary, neutral, semantic)
- Typography (families, sizes, weights, presets)
- Spacing
- Border radius
- Shadows
- Transitions
- Brand utilities (pre-built utility classes)

### 2. **Global Styles** (`/app/globals.css`)
Foundation CSS with:
- CSS custom properties for all design tokens
- Global typography rules (headings, paragraphs, links)
- Form element styling
- Button styles (.btn-primary, .btn-secondary, etc.)
- Card styles
- Badge styles
- Utility classes (.text-primary, .bg-primary, .border-primary, etc.)
- Custom scrollbar styling
- Responsive media queries for dark mode

### 3. **Logo SVG** (`/public/paseo-logo.svg`)
Scalable vector logo featuring:
- "Paseo de Caballo" wordmark with integrated landscape/map element
- Earthy color palette matching the design system
- Landscape motifs (mountains, hills, paths)
- Decorative elements (compass markers, trees)
- Works at any size without quality loss

### 4. **Header Component** (`/app/components/Header.tsx`)
Branded header with:
- Logo image and brand name
- Proper sizing and spacing
- Hover effects
- Dark mode support

### 5. **Navigation Component** (`/app/components/Navigation.tsx`)
Updated navigation with:
- Logo integration
- Branded link styling
- Active state indicators
- Dark mode support
- Responsive design

### 6. **Footer Component** (`/app/components/Footer.tsx`)
Professional footer with:
- Brand logo and tagline
- Quick links to main features
- Resource and company information
- Social links placeholder
- Copyright information
- Dark mode support

### 7. **Updated Layout** (`/app/app/layout.tsx`)
Root layout integration with:
- Updated background and text colors
- Footer component included
- Proper color transitions for dark mode

### 8. **Redesigned Login Page** (`/app/page.tsx`)
Branded login experience with:
- Paseo de Caballo logo
- Branded hero section
- Styled input fields with focus states
- Primary action button
- Decorative gradient backgrounds
- Dark mode support
- Professional, warm aesthetic

### 9. **Updated Dashboard** (`/app/components/Dashboard.tsx`)
Dashboard redesign with:
- Branded welcome header
- Color-coded stat cards (primary, secondary, accent)
- Improved typography and spacing
- Quick start guide
- Dark mode support

---

## Usage Guidelines

### Color Usage
1. **Primary (Sage Green)** - Use for main actions, primary buttons, active states, and brand identity
2. **Secondary (Warm Tan)** - Use for secondary actions, alternative buttons, and accents
3. **Accent (Earth Brown)** - Use for tertiary elements, highlights, and fine details
4. **Neutral Colors** - Use for text, backgrounds, and dividers based on hierarchy

### Typography Usage
1. **H1** - Page titles and major section headings
2. **H2** - Section headings and subsections
3. **H3-H6** - Progressive hierarchy for smaller headings
4. **Body** - All paragraph text and content
5. **Captions** - Metadata, timestamps, and small text

### Spacing Guidelines
1. Use spacing increments (4px base unit) for consistency
2. Use larger spacing between sections
3. Use smaller spacing within component groups
4. Maintain visual hierarchy through spacing relationships

### Shadow Usage
1. **SM** - Subtle cards and buttons at rest
2. **MD** - Cards and elements on hover
3. **LG** - Elevated panels and modals
4. **XL** - High-importance modals and overlays

---

## Accessibility

The design system includes:
- High contrast text (WCAG AA compliant)
- Focus states on all interactive elements (visible rings)
- Semantic HTML structure
- Proper heading hierarchy
- Color is not the only means of communication (icons, text, patterns)
- Dark mode support for reduced eye strain
- Readable font sizes and line heights

---

## Implementation Notes

### CSS Variables
All colors and tokens are available as CSS variables:
```css
--color-primary: #2D5016
--color-secondary: #C9A876
--color-accent: #8B6F47
/* ... and many more */
```

### Tailwind Integration
The system works seamlessly with Tailwind CSS using inline color values:
```tsx
className="bg-[#2D5016] text-white hover:bg-[#1F3810]"
```

### Dark Mode
Toggle dark mode by adding the `dark` class to the `<html>` element:
```html
<html class="dark">
```

The system automatically adjusts colors using CSS media queries and custom properties.

---

## Color Reference Card

| Purpose | Color | Hex | RGB |
|---------|-------|-----|-----|
| Primary Brand | Sage Green | #2D5016 | 45, 80, 22 |
| Secondary Brand | Warm Tan | #C9A876 | 201, 168, 118 |
| Accent | Earth Brown | #8B6F47 | 139, 111, 71 |
| Background | Light Cream | #FAFAF8 | 250, 250, 248 |
| Secondary BG | Off-white | #F5F3F0 | 245, 243, 240 |
| Primary Text | Charcoal | #1F1F1F | 31, 31, 31 |
| Secondary Text | Dark Gray | #5A5A5A | 90, 90, 90 |
| Success | Green | #2D7D3B | 45, 125, 59 |
| Warning | Orange | #C97D2D | 201, 125, 45 |
| Error | Red | #8B3A3A | 139, 58, 58 |

---

## Maintenance

This design system is production-ready and should be:
1. **Version controlled** - Track changes to the design tokens
2. **Documented** - Keep this guide updated as the system evolves
3. **Reviewed** - Have design and engineering review style changes
4. **Tested** - Verify colors and styles across browsers and devices
5. **Communicated** - Share updates with the team

---

## Contact & Support

For questions about the design system or brand guidelines, refer to the Paseo de Caballo branding documentation or contact the design team.

---

**Last Updated**: 2026-08-11  
**Design System Version**: 1.0.0  
**Brand**: Paseo de Caballo  
**Product**: ResidenceOS
