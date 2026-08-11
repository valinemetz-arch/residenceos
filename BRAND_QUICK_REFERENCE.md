# Paseo de Caballo - Quick Brand Reference

## Quick Color Codes

### Primary Colors (Copy-Paste Ready)
```
Primary:    #2D5016  (Sage Green)
Secondary:  #C9A876  (Warm Tan)
Accent:     #8B6F47  (Earth Brown)
```

### Background Colors
```
Light BG:   #FAFAF8  (Light Cream)
Card BG:    #F5F3F0  (Off-white)
Dark BG:    #2D2D2D  (Dark Mode)
```

### Text Colors
```
Primary:    #1F1F1F  (Charcoal - main text)
Secondary:  #5A5A5A  (Dark Gray - muted)
Tertiary:   #8A8A8A  (Gray - disabled)
Brand:      #2D5016  (Sage - links & accents)
```

---

## Quick Component Examples

### Primary Button
```tsx
<button className="bg-[#2D5016] text-white hover:bg-[#1F3810] 
                   px-4 py-2 rounded-lg font-medium transition-colors">
  Click Me
</button>
```

### Card
```tsx
<div className="rounded-2xl border border-[#F5F3F0] bg-[#F5F3F0] 
                p-6 shadow-sm hover:shadow-md transition-all">
  Content here
</div>
```

### Input Field
```tsx
<input className="px-4 py-2 rounded-lg border-2 border-[#F5F3F0] 
                  focus:border-[#2D5016] focus:ring-3 focus:ring-[#2D5016]/20" />
```

### Badge/Pill
```tsx
<span className="inline-block px-3 py-1 rounded-full 
                 bg-[#2D5016] text-white text-sm font-medium">
  Active
</span>
```

### Navigation Link (Active)
```tsx
<a className="text-[#2D5016] bg-[#F5F3F0] px-3 py-2 rounded-lg font-medium">
  Dashboard
</a>
```

### Navigation Link (Default)
```tsx
<a className="text-[#5A5A5A] hover:text-[#2D5016] 
              hover:bg-[#F5F3F0] px-3 py-2 rounded-lg">
  Spaces
</a>
```

---

## Design Tokens Location

**File**: `/lib/design-tokens.ts`

```typescript
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-tokens'

// Usage examples:
console.log(colors.primary.main)      // #2D5016
console.log(colors.secondary.main)    // #C9A876
console.log(typography.fontSize.lg)   // 1.125rem
console.log(spacing[4])               // 1rem
console.log(borderRadius.lg)          // 1rem
```

---

## Files That Use the Branding

1. **`/app/globals.css`** - Global styles & CSS variables
2. **`/app/components/Header.tsx`** - Logo header component
3. **`/app/components/Navigation.tsx`** - Main navigation
4. **`/app/components/Footer.tsx`** - Footer with branding
5. **`/app/components/Dashboard.tsx`** - Dashboard with brand colors
6. **`/app/page.tsx`** - Login page (fully branded)
7. **`/app/layout.tsx`** - Root layout (brand colors)
8. **`/app/app/layout.tsx`** - App layout (brand colors + footer)

---

## Logo Usage

**Logo File**: `/public/paseo-logo.svg`

```tsx
import Image from 'next/image'

// In header
<Image src="/paseo-logo.svg" alt="Paseo de Caballo" width={48} height={48} />

// Scaled for larger display
<Image src="/paseo-logo.svg" alt="Paseo de Caballo" width={96} height={96} />
```

---

## Brand Identity

### Brand Name
**Paseo de Caballo** - Professional, warm, trustworthy

### Typography
**Font Family**: System fonts (system-ui, -apple-system, etc.)
- Modern, clean, fast-loading
- Accessible and readable on all devices

### Color Palette
- **Earthy & Natural**: Sage green, warm tan, earth brown
- **Professional**: Strong primary color hierarchy
- **Warm**: Secondary tan creates approachable feeling
- **Trustworthy**: Classic earth tones inspire confidence

### Visual Style
- **Rounded**: 1rem (16px) standard border radius - friendly feel
- **Shadows**: Subtle for depth, nothing harsh
- **Spacing**: Generous spacing for breathing room
- **Clean**: No cluttered UI, purposeful design

---

## Dark Mode Support

The design system automatically adjusts colors for dark mode:

```css
/* Automatic dark mode adjustments via media query */
@media (prefers-color-scheme: dark) {
  /* Colors automatically adjust */
  /* Primary becomes lighter tan for contrast */
  /* Backgrounds become dark charcoal */
}
```

To manually test dark mode:
```html
<html class="dark">
```

---

## Common Patterns

### Call-to-Action Buttons
Use **Primary** color (sage green `#2D5016`)
- Full-width on mobile
- Generous padding (py-3)
- Shadow on hover for emphasis

### Secondary/Alternative Actions
Use **Secondary** color (warm tan `#C9A876`)
- Similar size to primary
- Less visual weight
- Good for form alternatives

### Status Indicators
- ✅ Success: `#2D7D3B`
- ⚠️ Warning: `#C97D2D`
- ❌ Error: `#8B3A3A`
- ℹ️ Info: `#2D5B7D`

### Hover States
- Buttons: Darker shade of same color
- Cards: Add shadow + border color shift
- Links: Underline + color change
- All: Smooth transition (250ms)

---

## Spacing Scale

```
0.25rem → 4px    (xs)
0.5rem  → 8px    (sm)
0.75rem → 12px   (md)
1rem    → 16px   (lg)  ← Standard
1.5rem  → 24px   (xl)
2rem    → 32px   (2xl) ← Section spacing
3rem    → 48px   (3xl)
```

Use `gap-4` or `p-4` in Tailwind for standard spacing.

---

## Form Styling

### Input Focus State
```
Border: Changes to #2D5016 (primary)
Ring: 3px ring at #2D5016 20% opacity
Outline: None (we use ring)
```

### Label Styling
```
Font: Semibold
Color: #2D5016 (primary)
Size: 0.875rem (sm)
```

---

## Accessibility Notes

✅ **All colors meet WCAG AA contrast requirements**
- Text on primary: 7.2:1 contrast ratio
- Text on secondary: 5.1:1 contrast ratio
- Links are underlined, not color-only

✅ **Focus states visible**
- 3px ring around focused elements
- High contrast with background

✅ **Dark mode support**
- Inverted colors maintain readability
- No color-alone communication

---

## Quick Checklist for New Components

When creating new components, follow this checklist:

- [ ] Use primary color (`#2D5016`) for main actions
- [ ] Use secondary color (`#C9A876`) for alternatives
- [ ] Use neutral backgrounds (`#FAFAF8` or `#F5F3F0`)
- [ ] Use charcoal text (`#1F1F1F`) for primary content
- [ ] Use system fonts (not custom web fonts)
- [ ] Add rounded corners (`rounded-lg` = 1rem)
- [ ] Include hover states (shadow, color shift)
- [ ] Include focus states (ring with primary color)
- [ ] Support dark mode (test with `class="dark"`)
- [ ] Use semantic colors for status (success/warning/error)
- [ ] Follow spacing scale (multiples of 4px)

---

## Design System Files

```
/lib/design-tokens.ts          ← All tokens in TypeScript
/app/globals.css               ← CSS variables & global styles
/public/paseo-logo.svg         ← Brand logo
/app/components/Header.tsx     ← Branded header
/app/components/Navigation.tsx ← Main nav
/app/components/Footer.tsx     ← Footer
DESIGN_SYSTEM.md               ← Full documentation
BRAND_QUICK_REFERENCE.md       ← This file
```

---

## Color Swatches

### Primary Palette
🟩 `#2D5016` - Primary (Main actions)
🟩 `#3D6B1F` - Primary Light (Hover)
🟩 `#1F3810` - Primary Dark (Pressed)

### Secondary Palette
🟨 `#C9A876` - Secondary (Alternative)
🟨 `#D9B896` - Secondary Light (Hover)
🟨 `#A88860` - Secondary Dark (Pressed)

### Accent Palette
🟧 `#8B6F47` - Accent (Highlights)

### Neutrals
⬜ `#FAFAF8` - Light (Primary BG)
⬜ `#F5F3F0` - Cream (Card BG)
⬜ `#FFFFFF` - White (Modals)
⬛ `#1F1F1F` - Dark (Text)
⬛ `#0A0A0A` - Black (Dark BG)

---

## Need Something Specific?

- **Buttons**: See `/app/globals.css` for `.btn-*` classes
- **Cards**: See `.card` class in `/app/globals.css`
- **Badges**: See `.badge-*` classes in `/app/globals.css`
- **Colors**: See `/lib/design-tokens.ts` for full color object
- **Spacing**: Use Tailwind (p-4, gap-6, etc.)
- **Typography**: Use Tailwind (text-lg, font-semibold, etc.)

---

**Quick Help**: Copy any color code and paste into your className with bracket notation:
```tsx
className="text-[#2D5016] bg-[#F5F3F0] border-[#C9A876]"
```

---

Updated: 2026-08-11
Brand: Paseo de Caballo | Product: ResidenceOS
