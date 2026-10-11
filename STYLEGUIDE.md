# Framekit Pro / Frame Drop — Framer Native Style Guide
*Liquid Glassmorphism Design System & Interface Standards for High-Conversion Framer Plugins*

---

## 1. Product UI Principles & Philosophy

Framer plugins operate within a constrained workspace alongside an active design canvas. Designers use plugins during active creation; therefore, **density, clarity, tactile feedback, and instant visual validation** must always supersede decorative ornamentation.

### Core Tenets:
1. **Tool Feel, Not Landing Page**:
   - Avoid oversized marketing hero banners or empty whitespace within the plugin panel.
   - Every pixel must serve discovery, customization, or canvas manipulation.
2. **True Liquid Glassmorphism**:
   - Utilize layered, semi-translucent frosted glass (`backdrop-filter: blur(16px)`) over deep obsidian or crystal light surfaces.
   - Every card, dialog, and floating dock features an **inset specular highlight** (`inset 0 1px 0 0 rgba(255, 255, 255, 0.18)`) simulating refined beveled glass edges.
3. **Framer Native Integration**:
   - Match Framer’s native UI cadence: crisp micro-typography, electric blue tint accents (`#0099ff`), clean 7–10px corner radii, and seamless light/dark mode adaptation.
4. **Non-Destructive & Protective UX**:
   - Never overwrite user work silently.
   - Always classify quality issues into **Warnings** (advisory) vs **Blockers** (canvas-breaking).
   - Display real-time contrast badges (WCAG 4.5:1 ratio) before canvas insertion.

---

## 2. Window Geometry & Viewport Standards

Framer plugins must maintain fixed or bounded dimensions to prevent canvas distortion. The plugin window is managed via `@framer/plugin`'s `framer.showUI()`.

| Viewport Profile | Width | Height | Recommended Usage |
| :--- | :--- | :--- | :--- |
| **`compact`** | `350px` | `600px` | Small displays, quick single-purpose tools, floating palettes |
| **`standard`** *(Default)* | `380px` | `640px` | Framekit Pro primary workspace, section browsers, settings |
| **`medium` / `wide`** | `420px` | `680px` | Complex multi-column editors, code inspection, side-by-side QA |

```typescript
export const PLUGIN_FRAME_SIZES = {
  compact: { width: 360, height: 600 },
  standard: { width: 380, height: 640 },
  medium: { width: 420, height: 680 },
} as const;
```

---

## 3. Color Tokens & Theme Architecture

The system supports seamless dark and light theme switching via `[data-theme="dark"]` and `[data-theme="light"]` (or Framer's `[data-framer-theme]`).

### 3.1 Accent & Brand Palette

| Token | Dark Mode Value | Light Mode Value | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `--tint` | `#0099ff` | `#0099ff` | Signature Electric Blue primary action & highlights |
| `--tint-hover` | `#0088ee` | `#0088ee` | Primary button & link hover state |
| `--tint-active` | `#0077dd` | `#0077dd` | Pressed active state |
| `--tint-dimmed` | `rgba(0, 153, 255, 0.14)` | `rgba(0, 153, 255, 0.10)` | Subtle pill background, active row tints |
| `--tint-border` | `rgba(0, 153, 255, 0.38)` | `rgba(0, 153, 255, 0.30)` | Focused inputs, active tab borders |
| `--tint-glow` | `0 0 20px -3px rgba(0, 153, 255, 0.38)` | `0 0 20px -3px rgba(0, 153, 255, 0.25)` | Primary CTA illumination |
| `--pro-accent` | `#f59e0b` (Amber) | `#d97706` (Warm Gold) | Pro tier crowns, locked badges, premium cards |
| `--pro-gradient` | `linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)` | Amber to Orange gradient for upgrade CTAs |
| `--auth-accent` | `#6366f1` (Indigo) | `#4f46e5` (Deep Indigo) | Authentication flows, OTP inputs, team sync |

### 3.2 Semantic Status Palette

| State | Dark Value | Light Value | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `#10b981` (`rgba(16, 185, 129, 0.12)`) | `#059669` (`rgba(16, 185, 129, 0.10)`) | Insertion confirmed, AAA contrast, verified |
| **Warning** | `#f59e0b` (`rgba(245, 158, 11, 0.12)`) | `#d97706` (`rgba(245, 158, 11, 0.10)`) | Preflight heuristic warnings, sample content |
| **Danger** | `#f43f5e` (`rgba(244, 63, 94, 0.12)`) | `#e11d48` (`rgba(244, 63, 94, 0.08)`) | Insertion blockers, invalid URL, contrast fail |

### 3.3 Surface & Glassmorphism Tokens

#### Obsidian Dark (Default)
```css
:root, [data-theme="dark"], [data-framer-theme="dark"] {
  --bg-app: #08090d;
  --bg-surface: rgba(18, 22, 34, 0.68);
  --bg-surface-elevated: rgba(26, 32, 48, 0.86);
  --bg-card: rgba(20, 26, 40, 0.65);
  --bg-card-hover: rgba(28, 36, 56, 0.78);
  --bg-glass-base: rgba(14, 18, 28, 0.72);
  --bg-glass-nav: rgba(12, 16, 26, 0.85);
  --border-default: rgba(255, 255, 255, 0.12);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --line-strong: rgba(255, 255, 255, 0.28);

  /* Fluid Ambient Mesh Background */
  --bg-mesh: 
    radial-gradient(ellipse 80% 50% at 20% -20%, rgba(0, 153, 255, 0.14) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 10%, rgba(139, 92, 246, 0.11) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 50% 110%, rgba(0, 212, 255, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 90% 90%, rgba(16, 185, 129, 0.06) 0%, transparent 55%);

  --liquid-glass-gradient: linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 60%, rgba(0, 153, 255, 0.04) 100%);
  --shadow-liquid-glass: inset 0 1px 0 0 rgba(255, 255, 255, 0.18), inset 0 0 16px 0 rgba(255, 255, 255, 0.015), 0 8px 24px -4px rgba(0, 0, 0, 0.45);

  --text-primary: #ffffff;
  --text-secondary: #9aa2b1;
  --text-tertiary: #717b91;
  --text-muted: #646c7c;
}
```

#### Crystal Light
```css
[data-theme="light"], [data-framer-theme="light"] {
  --bg-app: #f2f5fa;
  --bg-surface: rgba(255, 255, 255, 0.82);
  --bg-surface-elevated: rgba(255, 255, 255, 0.96);
  --bg-card: rgba(255, 255, 255, 0.78);
  --bg-card-hover: rgba(255, 255, 255, 0.95);
  --bg-glass-base: rgba(255, 255, 255, 0.82);
  --bg-glass-nav: rgba(255, 255, 255, 0.88);
  --border-default: rgba(0, 0, 0, 0.09);
  --border-subtle: rgba(0, 0, 0, 0.04);
  --line-strong: rgba(0, 0, 0, 0.18);

  --liquid-glass-gradient: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.80) 100%);
  --shadow-liquid-glass: inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 4px 16px rgba(0, 0, 0, 0.06);

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
}
```

---

## 4. Typography Hierarchy & Micro-Scale

Plugins use the **Inter** font family (`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;550;600;700;800&display=swap');`).

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### Scale Specifications:
- **Badge / Micro Label (`10px` / `550-600` weight)**:
  `font-size: 10px; line-height: 12px; letter-spacing: 0.04em; text-transform: uppercase;`
  Used for: Contrast grades (`AAA`, `AA`), `PRO` pill, category tags.
- **Metadata / Hint (`11px` / `450` weight)**:
  `font-size: 11px; line-height: 14px; color: var(--text-tertiary);`
  Used for: Input helper descriptions, aspect ratio specs, time-ago notes.
- **Standard Body & Buttons (`12px` / `450-500` weight)**:
  `font-size: 12px; line-height: 16px; color: var(--text-secondary);`
  Used for: Button text, tab titles, select options, form labels.
- **Emphasized Item / Card Title (`13px` / `600` weight)**:
  `font-size: 13px; line-height: 18px; color: var(--text-primary);`
  Used for: Section card titles, preset titles, slot rows.
- **Section Heading (`14px` / `650-700` weight)**:
  `font-size: 14px; line-height: 20px; font-weight: 650; color: var(--text-primary);`
  Used for: Drawer titles, panel subheaders, setting group names.
- **Modal / Panel Header (`16px-18px` / `700` weight)**:
  `font-size: 16px; line-height: 22px; font-weight: 700; letter-spacing: -0.01em;`
  Used for: Dialog headings, top branding, wizard steps.

---

## 5. Shape, Border & Elevation System

### Radii Scale
```css
--radius-xs: 4px;     /* Micro badges, inline tags, swatches */
--radius-sm: 7px;     /* Small icon buttons, chips, nested inputs */
--radius-md: 10px;    /* Standard cards, buttons, select triggers */
--radius-lg: 13px;    /* Section preview cards, modal containers */
--radius-xl: 16px;    /* Bottom floating nav, hero banners */
--radius-full: 9999px;/* Circular icon triggers, pill tags, sliders */
```

### Elevation & Shadow Stack
```css
--shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.25);
--shadow-md: 0 6px 20px rgba(0, 0, 0, 0.35);
--shadow-lg: 0 16px 40px -8px rgba(0, 0, 0, 0.6);
--shadow-glass: inset 0 1px 0 0 rgba(255, 255, 255, 0.14), 0 8px 24px -4px rgba(0, 0, 0, 0.4);
--shadow-btn-primary: inset 0 1px 0 0 rgba(255, 255, 255, 0.35), var(--tint-glow), 0 3px 10px rgba(0, 153, 255, 0.4);
--shadow-floating-bar: 0 10px 28px -4px rgba(0, 0, 0, 0.6), var(--tint-glow), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
```

---

## 6. Component Architecture & UI Patterns

### 6.1 Bottom Floating Dock Navigation
The primary navigation resides at the bottom of the plugin frame, floating over content with high-blur frosted glass.

```
+--------------------------------------------------------+
|  [🏠 Home]    [🗂 Library]    [⚡ Studio]    [⚙ Settings]  |
|                  ● active dot                          |
+--------------------------------------------------------+
```
- **Height**: `48px`
- **Background**: `var(--bg-dock-nav)` with `backdrop-filter: blur(20px)`
- **Border**: `1px solid var(--border-dock-nav)`
- **Active State**: Inset top highlight + glowing electric blue dot (`--dock-nav-active-dot: #0099ff` with `box-shadow: 0 0 8px rgba(0, 153, 255, 0.6)`).

### 6.2 Floating Action Bar (Draft / Primary CTA)
Anchored directly above the bottom nav when the user has active items in their queue:
- **Components**: Slot count pill, clear button, preview toggle, and primary **Insert** CTA.
- **Specular Border**: `1px solid rgba(56, 189, 248, 0.22)`
- **Primary Button**: Electric blue gradient with inner specular edge and active glow.

### 6.3 Section & Component Preview Cards
- **Structure**:
  1. **Thumbnail Stage**: Fixed aspect ratio (`16:9` or `4:3`), dark canvas preview (`--bg-preview-canvas`).
  2. **Metadata Row**: Category label in Electric Blue (`11px`), component title (`13px, 600`), and Pro/Free badge.
  3. **Direct Action**: Floating `+` button in the top-right corner to add instantly with zero drag delay.

### 6.4 Real-time Contrast Badge (`ContrastBadge`)
Calculates mathematical relative luminance per WCAG standards:
- **`AAA` (>= 7.0:1)**: Emerald green background (`#10b981`), glowing green dot.
- **`AA` (>= 4.5:1)**: Blue/Amber indicator.
- **`Low` (< 4.5:1)**: Crimson danger indicator (`#f43f5e`).
```tsx
<ContrastBadge colorA={brand.text} colorB={brand.background} minRatio={4.5} label="Page Contrast" />
```

### 6.5 Custom Select & Dropdowns (`CustomSelect`)
Never use native OS `<select>` elements. Use the frosted liquid glass dropdown:
- **Trigger**: Full-width button with current icon, text label, and rotating chevron.
- **Dropdown Listbox**: Positioned absolutely, `backdrop-filter: blur(24px)`, keyboard accessible (`Escape` to close), with checkmarks on selected options.

### 6.6 Modals & Dialogs (`AuthModal`, `ProModal`)
- **Backdrop**: `rgba(4, 6, 12, 0.78)` with `backdrop-filter: blur(8px)`.
- **Dialog Box**: Rounded `16px`, bordered with subtle amber/indigo highlight, centered in frame.
- **Exit Action**: Top-right close icon + `Escape` key capture.

---

## 7. Motion & Interaction Rules

| Interaction | Timing Function | Duration | Transition Properties |
| :--- | :--- | :--- | :--- |
| **Hover / Glow** | `cubic-bezier(0.16, 1, 0.3, 1)` | `160ms` | `background, border-color, box-shadow` |
| **Button Click / Tap** | `ease-out` | `100ms` | `transform: scale(0.97)` |
| **Modal Enter** | `cubic-bezier(0.16, 1, 0.3, 1)` | `220ms` | `opacity (0 -> 1), transform (scale 0.96 -> 1)` |
| **Drawer Slide** | `cubic-bezier(0.2, 0.8, 0.2, 1)` | `240ms` | `transform: translateY(0)` |

```css
/* Tactile Press Utility */
.interactive-tap {
  transition: transform 0.12s ease-out, box-shadow 0.16s ease;
}
.interactive-tap:active {
  transform: scale(0.97);
}
```

---

## 8. Code & CSS Standards Checklist

1. **Strictly Tokenized**: Always use `var(--token-name)`. Never write hardcoded hex values in component CSS.
2. **Component File Structure**:
   ```
   src/
   ├── components/       # Self-contained UI components (CustomSelect, ContrastBadge, Modals)
   ├── insertion/        # Framer Plugin API wrappers & canvas manipulation
   ├── catalog/          # Typed schemas, presets, and component metadata
   ├── quality/          # Preflight checks, WCAG luminance heuristics
   └── styles.css        # Centralized Liquid Glassmorphism design tokens & styles
   ```
3. **Strict Type Safety**: All component props, slots, and Framer API return values must be strictly typed in TypeScript (`strict: true`).
