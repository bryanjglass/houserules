# MilkMoney — Design System

The single source of truth for visual decisions. Open
`MilkMoney Design Specs.html` for the rendered version with annotated
screens; this file is what Claude Code reads.

- **Type:** Plus Jakarta Sans (Google Fonts), JetBrains Mono for code/tokens
- **Stack target:** React + Vite + Tailwind v3
- **Surfaces:** white app shell, cream (#FAF6EB) only on marketing/onboarding
- **Tone:** friendly, kid-readable, but never juvenile. Money is taken seriously.

---

## 1 · Color tokens

All values are flat hex; map them onto the Tailwind config in §6.

### Brand

| Token         | Hex       | Use                                              |
| ------------- | --------- | ------------------------------------------------ |
| `cream`       | `#FAF6EB` | Marketing / onboarding background                |
| `appbg`       | `#F7F8FA` | In-app surface (rarely used; mostly white)       |
| `navy`        | `#1E3A8A` | "Milk" wordmark, dark headings                   |
| `brand`       | `#2D7FF9` | Primary action, "Money" wordmark, selected state |
| `brand-600`   | `#1E6BE0` | Primary button hover                             |
| `brand-100`   | `#DBEAFE` | Secondary button border, soft fill               |
| `brand-50`    | `#EFF6FF` | Focus halo, tinted backgrounds                   |

### Ink

| Token     | Hex       | Use                          |
| --------- | --------- | ---------------------------- |
| `ink-900` | `#0F172A` | Body text, headings          |
| `ink-700` | `#334155` | Labels                       |
| `ink-500` | `#64748B` | Muted copy                   |
| `ink-400` | `#94A3B8` | Captions, meta, placeholders |
| `ink-300` | `#CBD5E1` | Dashed borders, disabled     |
| `line`    | `#E5E7EB` | Card borders, dividers       |

### Status

| Token       | Hex       | Use                              |
| ----------- | --------- | -------------------------------- |
| `money-600` | `#16A34A` | Dollar amounts, earned (`+$X`)   |
| `money-700` | `#15803D` | "Available" badge text           |
| `money-50`  | `#DCFCE7` | "Available" / earned-day bg      |
| `amber-600` | `#D97706` | "Due Soon" text                  |
| `amber-50`  | `#FEF3C7` | "Due Soon" badge bg              |
| `rose-600`  | `#DC2626` | "Overdue", destructive           |
| `rose-50`   | `#FEE2E2` | "Overdue" badge bg               |
| `violet-600`| `#7C3AED` | "Up for grabs" badge text        |
| `violet-50` | `#EDE9FE` | "Up for grabs" badge bg          |

### Wallet (Kid only)

| Token        | Hex       | Use                                       |
| ------------ | --------- | ----------------------------------------- |
| `teal-start` | `#34D399` | Wallet header gradient (top-left)         |
| `teal-end`   | `#10B981` | Wallet header gradient (bottom-right)     |
| `gold`       | `#FCD34D` | Coin highlight, balance pill              |
| `gold-deep`  | `#D97706` | Coin shadow                               |

### Rules

- **Primary actions** always use `brand`. One per screen.
- **Dollar amounts** are always `money-600` and bold. Never neutral.
- **Status pills** use `*-50` background + `*-600` text. Never invert.
- **Teal gradient** appears only in the Kid Wallet header.
- **Cream** is reserved for onboarding/login. App surfaces stay white.

---

## 2 · Typography

Single family: **Plus Jakarta Sans**, weights 400/500/600/700/800.

| Role      | Size   | Weight | Line-height | Tracking  | Example                                       |
| --------- | ------ | ------ | ----------- | --------- | --------------------------------------------- |
| Display   | 56     | 800    | 1.0         | -0.025em  | Onboarding hero only                          |
| Title 1   | 28     | 800    | 1.1         | -0.02em   | "Good morning, Alex!"                         |
| Title 2   | 22     | 800    | 1.15        | -0.01em   | "Earn, save, achieve!"                        |
| Section   | 17     | 700    | 1.25        | -0.005em  | "Outstanding Chores"                          |
| Body      | 15     | 500    | 1.5         | 0         | Long-form copy                                |
| Label     | 13     | 700    | 1.3         | 0         | Form labels ("Task Title")                    |
| Caption   | 11.5   | 600    | 1.3         | 0.005em   | Meta ("Abby · Due May 18")                    |
| Amount    | 16     | 800    | 1.1         | -0.01em   | "$18.75" — always `money-600`                 |
| Badge     | 10.5   | 700    | 1.0         | 0.02em    | "DUE SOON" — uppercase optional               |

JetBrains Mono: reserved for tokens, codes, and monetary inputs when
fixed-width helps.

---

## 3 · Surface

### Radii

| Token   | Value | Use                          |
| ------- | ----- | ---------------------------- |
| `sm`    | 8px   | Inline chips                 |
| `md`    | 12px  | Pet thumbnails, inner items  |
| `lg`    | 16px  | Standard cards               |
| `xl`    | 20px  | Large containers             |
| `2xl`   | 24px  | Hero blocks                  |
| `full`  | 9999  | Pills, badges, avatars       |

### Shadows

| Token    | Value                                          | Use                  |
| -------- | ---------------------------------------------- | -------------------- |
| `sm`     | `0 1px 2px rgba(15,23,42,0.04)`                | Hairline lift        |
| `md`     | `0 4px 14px rgba(15,23,42,0.06)`               | Cards                |
| `lg`     | `0 18px 38px rgba(15,23,42,0.08)`              | Overlays, modals     |
| `brand`  | `0 4px 14px rgba(45,127,249,0.35)`             | Primary buttons only |

### Spacing

Multiples of 4: `4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 48`.

- Cards: 16–20px internal padding.
- Screens: 20–28px horizontal padding.
- Sections: 18–24px vertical separation.
- Tab bar items: 44px hit target minimum.

---

## 4 · Components

### Button

| Variant       | Background      | Text   | Border             | Shadow   |
| ------------- | --------------- | ------ | ------------------ | -------- |
| `primary`     | `brand`         | white  | none               | `brand`  |
| `secondary`   | white           | brand  | 1.5px `brand-100`  | none     |
| `ghost`       | transparent     | brand  | none               | none     |

- Radius: 14px. Padding: 14×22px. Font: 15/700.
- Only **one primary** per screen.
- Hover (primary): swap background to `brand-600`.

### Input

- Radius 14px, border 1.5px `line`, padding 14×16px, font 15/500.
- Focus: border = `brand`, ring = 4px `brand-50`.
- Inline icons (pet thumb, $ chip, calendar) sit **inside** the field.

### Status badge

Rounded-full pill, 11.5/700, padding 4×10px. One per task.

| Badge      | Background  | Text         |
| ---------- | ----------- | ------------ |
| To Do      | `brand-50`  | `brand-600`  |
| Due Soon   | `amber-50`  | `amber-600`  |
| Overdue    | `rose-50`   | `rose-600`   |
| Available  | `money-50`  | `money-700`  |

### Avatar

- Circular, 2px white ring + 1px hairline (`line`) outer.
- Soft pastel fills: peach `#FFE6D6`, sky `#D6ECFF`, mint `#D6F5E3`,
  lilac `#E7DEFF`, rose `#FFD9E2`.
- Initial-only fallback (single uppercase letter, 800 weight).
- Replace with illustrated portraits when assets are sourced.

### Pet / task thumbnail

- 40×40, radius 12, 1px `line` border.
- Striped placeholder until real illustrations land
  (`assets/pets/dog.png` etc).

### Task card

```
┌────────────────────────────────────────────────────┐
│ [40 thumb]  Clean room                  $5.00     │
│             Abby · Due May 18           [Due Soon] │
└────────────────────────────────────────────────────┘
```

- Border 1px `line`, radius 14, padding 12.
- Title 14/700, meta 11.5/600 `ink-400`.
- Amount 14/800 `ink-900`. Badge sits below the amount, right-aligned.

### Stat tile

- 36px tinted icon chip (`*-50` bg, `*-600` text) + 2-line stack.
- Max 2 per row on mobile.

### Bottom tab bar

- 5 destinations max: Home, Tasks, Calendar, Wallet, More.
- Active: `brand` color + 700 weight. Inactive: `ink-400` + 600.
- 22px outline icon, 10px label, 22px bottom padding for home indicator.

---

## 5 · Screens

Each screen is rebuilt 1:1 with the reference. Annotations match
the design spec doc (A1–F4).

### Screen 1 — Parent Login

- BG: `linear-gradient(180deg, #EAF4FF 0%, #F8FBFF 50%, #FFFFFF 100%)`
- 68px logo tile (blue gradient + `assets/icon-bottle.png`) + wordmark
- Title 2 headline (240px max-width), Body subtitle (260px max)
- Buttons stack: primary → secondary → ghost
- Bottom: full-bleed `assets/landscape.png`, 0 bottom inset

### Screen 2 — Parent Dashboard

- 46px avatar + 2-line greeting + 38px bell tile
- **Your Family** 3-column row: kid card / kid card / "Add Child" dashed tile
- 2 stat tiles (Total Allowance Paid / Chores Completed)
- **Outstanding Chores** list — task cards w/ status pills
- Bottom: 5-tab bar, Home active

### Screen 3 — Create / Assign Task

- Header: chevron-left + center title (16/800) + "Save" right action
- Task Title input with inline pet thumb on the right
- Description (optional)
- 2-col row: Reward (with $ chip) + Due Date (with calendar icon)
- Assign To: 3-col grid — Abby / Owen / "Up for grabs" (selected = `brand-50` bg + `brand` border + star icon)
- Category pills: Home (selected = brand fill) · Pets · Chores · Other

### Screen 4 — Kid Login

- BG: same as Screen 1
- Top: `assets/cow-mascot.png` centered, ~180px tall
- Wordmark + Title 2 ("Earn, save, achieve!") + body subtitle
- Same button stack pattern as parent
- Bottom: `assets/landscape.png`

### Screen 5 — Kid Tasks

- Header: 40px avatar + "Hi Abby! 👋" + balance pill (gold-coin + amount, amber tint)
- Segmented tabs: My Tasks (active, `brand` fill) | Up for Grabs
- **My Tasks** section: 3 task cards (Due Soon / To Do / Overdue states)
- **Up for Grabs** section: 1 task card with "Available" badge
- Bottom: tab bar, Home active

### Screen 6 — Kid Wallet & Calendar

- Header: teal gradient (`teal-start` → `teal-end`)
    - White: "My Wallet" label, 36/800 amount, "Available Balance" caption
    - Right: `assets/money-jar.png`, 90×90, drop-shadow
- Month nav: "May 2025" + ‹ › buttons
- 7-col calendar grid:
    - Today (16th) = `brand` filled disc, white text
    - Earned days = `money-50` fill + small `money-600` dot below
- **Recent Earnings** list — pet thumb + title + date + amount (always `money-600` with `+` sign)
- **Savings Goal** — pet thumb + title + target + gradient progress bar (teal → brand) + saved / %
- Bottom: tab bar, Wallet active

---

## 6 · Implementation

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:   '#FAF6EB',
        appbg:   '#F7F8FA',
        navy:    '#1E3A8A',
        brand: {
          DEFAULT: '#2D7FF9',
          600: '#1E6BE0',
          100: '#DBEAFE',
          50:  '#EFF6FF',
        },
        ink: {
          900: '#0F172A', 700: '#334155',
          500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1',
        },
        line: '#E5E7EB',
        money: { 700: '#15803D', 600: '#16A34A', 50: '#DCFCE7' },
        amber: { 600: '#D97706', 500: '#F59E0B', 50: '#FEF3C7' },
        rose:  { 600: '#DC2626', 500: '#EF4444', 50: '#FEE2E2' },
        teal:  { start: '#34D399', end: '#10B981' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '16px',
        xl: '20px', '2xl': '24px', '3xl': '28px',
      },
      boxShadow: {
        sm:    '0 1px 2px rgba(15,23,42,0.04)',
        md:    '0 4px 14px rgba(15,23,42,0.06)',
        lg:    '0 18px 38px rgba(15,23,42,0.08)',
        brand: '0 4px 14px rgba(45,127,249,0.35)',
      },
    },
  },
  plugins: [],
};
```

### index.css

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-appbg text-ink-900 font-sans antialiased min-h-screen; }
}

@layer components {
  .btn-primary   { @apply bg-brand text-white font-bold rounded-2xl px-5 py-3.5 shadow-brand hover:bg-brand-600 transition; }
  .btn-secondary { @apply bg-white text-brand font-bold rounded-2xl px-5 py-3.5 border border-brand-100 hover:border-brand transition; }
  .input         { @apply w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-ink-900 placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-50 outline-none transition; }
  .card          { @apply bg-white border border-line rounded-xl; }
  .badge-due     { @apply bg-amber-50 text-amber-600 font-bold text-[11px] px-2.5 py-1 rounded-full; }
  .badge-over    { @apply bg-rose-50 text-rose-600 font-bold text-[11px] px-2.5 py-1 rounded-full; }
  .badge-todo    { @apply bg-brand-50 text-brand-600 font-bold text-[11px] px-2.5 py-1 rounded-full; }
  .badge-ok      { @apply bg-money-50 text-money-700 font-bold text-[11px] px-2.5 py-1 rounded-full; }
}
```

---

## 7 · Assets

Runtime path: `/images/<file>` (served from `client/public/images/`).

| File              | Used on              | Status      |
| ----------------- | -------------------- | ----------- |
| `icon-bottle.png` | App icon, Screen 1   | ✓ delivered |
| `cow-mascot.png`  | Screen 4 hero        | ✓ delivered |
| `landscape.png`   | Screens 1 & 4 bottom | ✓ delivered |
| `money-jar.png`   | Screen 6 header      | ✓ delivered |
| Kid avatars       | Screens 2, 3, 5      | ⚠ needed    |
| Pet/task thumbs   | Screens 2, 3, 5, 6   | ⚠ needed    |

Avatar set needs: Abby, Owen, +N placeholder. Soft pastels, illustrated.
Pet thumbnail set needs: dog, dishwasher, bed, trash, bike (40×40).

---

## 8 · Migration from current client

The existing client at `client/src/` uses `indigo-*` Tailwind classes and
emoji glyphs. Migration order:

1. Replace `client/tailwind.config.js` + `client/src/index.css` with §6.
2. Find/replace `indigo-` → `brand-` across `client/src/`.
3. Replace emoji (🥛 👶 👦 📋 …) with the outline icon set (2px stroke).
4. Rebuild screens 1 → 6 in this order: Login → Parent Dashboard → Kid Dashboard → Create Task → Kid Wallet → Calendar.
5. Add a shared `<BottomTabBar>` component; mount in both parent and kid layouts.
6. Drop the 4 illustrations into `client/public/images/`.

---

## 9 · Accessibility

- Status is never color-only — every badge has a text label.
- Min 44×44 hit target on tab bar items and kid login tiles.
- `brand` on white = 4.62:1 contrast — passes AA for normal text.
- `ink-900` on white/cream meets 7:1 (AAA).
- All inputs have visible labels; focus state is a 4px `brand-50` ring.
