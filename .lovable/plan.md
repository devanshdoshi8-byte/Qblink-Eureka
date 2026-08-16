## Dual-theme design system for QblinkAdd this as a new section near **Theme Provider + Persistence**:

&nbsp;

**First-Time Theme Selection**

Do not automatically default users to Dark mode or follow the system appearance.

On a user’s very first visit (only when no theme preference has been stored), display a lightweight, elegant appearance selection modal before entering the website.

The modal should present only two equally prominent options:

☀️ **Light Theme** – Clean, bright, airy, and approachable.

🌙 **Dark Theme** – Premium, cinematic, immersive, and modern.

Neither option should be pre-selected or visually favored. Both must have equal visual weight so the choice feels intentional.

Once the user selects a theme:

- Save the preference in localStorage.
- Apply it immediately without reloading the page.
- Persist the preference across all sessions, devices (when account syncing is available), logins, logouts, and future visits.
- Never ask again unless the user manually resets preferences.

Users must be able to switch themes anytime from the Appearance settings without affecting any data, animations, layouts, or workflows.

The transition between themes should be smooth (300–400ms), preserving all animations and scroll position without visual flicker or flashes of the incorrect theme.

This behavior must apply consistently across the entire Qblink ecosystem, ensuring users always feel in control of their preferred viewing experience.

Goal: one product, two equally polished appearances. Dark = the current premium navy identity (unchanged visually). Light = the earlier Qblink appearance (white + soft blue, rounded cards, gradient CTA) — recreated inside the *current* layout/sections/animations so structure, motion, and copy stay identical between themes. Only surfaces, text colors, borders, shadows, and glows change.

### 1. Semantic token layer (`src/index.css`)

Introduce a pure semantic layer that both themes fill in. Components will only ever reference these tokens.

```
--background          page background
--surface             primary section surface
--surface-2           secondary section surface
--surface-editorial   contrast/breakout surface (was "cream")
--surface-inverse     opposite-polarity surface (e.g. dark card on light page)
--text-strong         primary text on surfaces
--text-muted          secondary text
--text-on-editorial   text color on editorial surface
--accent              brand accent (blue/teal family)
--accent-glow         relief highlight color
--border-hairline     thin dividers
--shadow-card         base shadow
--shadow-elevated     hover/elevated shadow
--shadow-glow         accent glow
--gradient-primary    hero/CTA gradient
--gradient-soft       ambient section gradient
--gradient-relief     radial relief highlight
```

Brand hues (`--ink`, `--deep`, `--teal`, `--glow`, `--cream`) stay declared once as constants; the two themes just remap the semantic tokens on top.

- **Dark theme (`.dark` or default)** — maps semantics to the current Ocean Deep palette (ink surface, cream editorial, glow accent). Zero visual change.
- **Light theme (`:root` or `.light`)** — maps semantics to the earlier Qblink look:
  - background/surface: pure white / very light blue-tinted paper
  - surface-2: soft blue wash (`#eff6ff`-ish)
  - surface-editorial: white cards with soft blue border, rounded, subtle shadow
  - surface-inverse: deep navy (for the same "dark editorial" sections — becomes a hero-card style in light mode)
  - text-strong: near-black navy
  - text-muted: slate gray
  - accent: vivid brand blue (`#2563eb`) with cyan gradient partner (`#06b6d4`) — matches the earlier "Start Free / See Demo" gradient CTA
  - shadows: soft blue-tinted (`0 10px 30px -10px rgba(37,99,235,0.18)`)
  - radius bumps to `0.75rem` (rounded cards, per earlier design)

Result: the same `bg-surface` section renders navy in dark and white-with-soft-shadow in light without touching component code.

### 2. Rewrite `qb/` primitives to semantic classes

Every `qb/*.tsx` file currently uses raw brand classes (`text-cream`, `bg-glow`, `border-glow/15`, `ink-surface`, `cream-surface`, `hsl(var(--ink))`). Rewrite each to semantic equivalents:


| Old                     | New                                             |
| ----------------------- | ----------------------------------------------- |
| `ink-surface`           | `bg-surface text-strong`                        |
| `deep-surface`          | `bg-surface-2 text-strong`                      |
| `cream-surface`         | `bg-surface-editorial text-on-editorial`        |
| `text-cream` / `/70`    | `text-strong` / `text-muted`                    |
| `text-ink`              | `text-on-editorial`                             |
| `text-glow`             | `text-accent-glow`                              |
| `bg-glow`               | `bg-accent-glow`                                |
| `border-glow/15`        | `border-hairline`                               |
| `hsl(var(--ink))` (SVG) | `hsl(var(--text-strong))` / `--surface-inverse` |
| `hsl(var(--glow))`      | `hsl(var(--accent-glow))`                       |
| `hsl(var(--cream))`     | `hsl(var(--surface-editorial))`                 |


All 13 components in `src/components/qb/` will be updated. Layout, spacing, motion, SVG geometry, copy, animations — untouched.

### 3. Theme provider + persistence

New `src/hooks/useTheme.tsx`:

- `theme: "light" | "dark"`, `setTheme`, `toggle`
- Reads `localStorage.qblink-theme`, defaults to `"dark"` (current identity), falls back to `prefers-color-scheme` only when no stored value.
- Applies/removes `.dark` on `document.documentElement`.
- Wrapped once in `src/App.tsx` (or `main.tsx`) so every route inherits it.

Add a smooth cross-theme transition in `index.css`:

```
html { transition: background-color .4s ease, color .4s ease; }
* { transition: background-color .3s ease, border-color .3s ease, color .3s ease, box-shadow .3s ease; }
```

(scoped so it doesn't fight Framer Motion transforms).

### 4. Theme switcher UI

Two entry points, both wired to the same hook:

- **Quick toggle** — Sun/Moon icon button added to `SideRail` (desktop) and the floating mobile monogram cluster. Uses `lucide-react` `Sun` / `Moon` with a soft cross-fade + 180° rotate.
- **Appearance menu** — small dropdown inside `SideRail` labeled "Appearance" opening a mini popover with:
  - ☀️ Light
  - 🌙 Dark
  Selected item marked with a check. Uses existing shadcn `DropdownMenu`.

### 5. Files touched

- `src/index.css` — semantic token layer, two theme blocks, transition rules, updated utility classes.
- `tailwind.config.ts` — add semantic color aliases (`surface`, `surface-2`, `surface-editorial`, `surface-inverse`, `text-strong`, `text-muted`, `text-on-editorial`, `accent-glow`, `border-hairline`).
- `src/hooks/useTheme.tsx` — new provider + hook.
- `src/App.tsx` — mount `ThemeProvider`.
- `src/components/qb/*.tsx` — all 13 files retokenized (visual result unchanged in dark; light appearance driven by tokens).
- `src/components/qb/SideRail.tsx` — Appearance dropdown + Sun/Moon quick toggle.
- `src/components/qb/Monogram.tsx` — small theme-aware stroke.

Out of scope (untouched): backend, routing, animations, Framer Motion configs, section order, copy, SVG geometry, `/dashboard`, `/onboarding`, `/affiliate`, auth pages.

### 6. Verification

- Playwright pass at 390px and 1280px in both themes: capture Opening, ProblemInfographic, ReliefBento, InterviewFAQ, Signature.
- Confirm dark screenshots are pixel-identical to current state.
- Confirm light screenshots match the earlier Qblink reference (white page, soft blue accents, rounded gradient CTA, dark navy headings).
- Toggle theme, reload, confirm persistence via localStorage.