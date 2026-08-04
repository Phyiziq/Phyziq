# Adaptive — Design System Specification
### For implementation by a coding agent. Every value below is taken directly from the built mockup (`platform-design.html`) — this is a specification of what exists, not a new proposal.

---

## 1. Brand concept (context the agent should preserve, not just the values)

The brand is **"a plan that adapts, and never hides its price."** Every visual decision below serves one of two ideas:
- **Adaptivity** — shown through the signature "rerouting path" motif, live confidence indicators, and a calm, unhurried layout rhythm (nothing decorative competes with this).
- **Trust/transparency** — a dedicated color (teal) exists *only* for confidence/verification states, never used decoratively, so users learn to associate it specifically with "this has been checked."

Do not substitute this palette or type pairing with generic SaaS defaults (no default blue/purple gradients, no default Inter-only system with no display face). The warmth and the sienna/teal pairing are deliberate brand signals, not placeholders.

---

## 2. Color tokens

### 2.1 Light mode (default — primary marketing site and light-mode app)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F2EFE7` | Page background — warm stone/sand, not pure white or cream |
| `--bg-raised` | `#FBF9F4` | Cards, panels, anything raised above the base background |
| `--ink` | `#241F1A` | Primary text — warm near-black, never pure `#000` |
| `--ink-soft` | `#5C5449` | Secondary text, captions, muted labels |
| `--line` | `#E2DCCC` | Borders, dividers, hairlines |
| `--accent` | `#B8542E` | **Primary action color** — burnt sienna. Buttons, links-as-CTA, active states, key data points |
| `--accent-ink` | `#FBF9F4` | Text/icons placed *on top of* `--accent` (e.g. button label) |
| `--accent-soft` | `#F0D9C9` | Low-emphasis accent backgrounds (badges, subtle highlights, "estimated/low-confidence" chip background) |
| `--trust` | `#2E6B5E` | **Reserved exclusively for AI-confidence and verification states** — deep teal. Never used as a generic decorative color |
| `--trust-soft` | `#DCEAE5` | Background for trust/confidence chips and callouts |

### 2.2 Dark mode (default for the logged-in app/dashboard)

| Token | Hex | Usage |
|---|---|---|
| `--dark-bg` | `#1C1815` | App background — warm charcoal, not pure black |
| `--dark-raised` | `#262019` | Cards/panels in dark mode |
| `--dark-ink` | `#F2EFE7` | Primary text on dark backgrounds (same value as light mode's `--bg`, intentionally — reinforces the warm-neutral identity across modes) |
| `--dark-line` | `#3A322A` | Borders/dividers in dark mode |

`--accent`, `--accent-soft`, `--trust`, `--trust-soft` carry over unchanged into dark mode — do not re-tint them. In the built mockup, dark-mode secondary text uses `#A79E8F` and sidebar background uses `#191512` / active nav state `#2A231C` / gym-info-card background `#241E17` — treat these as dark-mode-only tertiary tones, not global tokens.

### 2.3 Color usage rules (important — do not violate these)

1. **Teal (`--trust`) is never decorative.** It appears only on: AI-confidence chips, "verified" badges, data-checked indicators, and the trust-transparency callout on the pricing page. If a component needs a second accent color for a non-trust purpose, do not reach for teal — use `--accent-soft` or a neutral instead.
2. **Sienna (`--accent`) is the only primary-action color.** One color owns all primary buttons/CTAs across the whole product — this is a deliberate "own one color" brand strategy, not a starting point to expand into a multi-color button system.
3. Dark mode is not an inverted light mode — it uses its own warm-charcoal neutrals (`#1C1815`/`#262019`/`#3A322A`), not a mechanical brightness-flip of the light tokens.

---

## 3. Typography

| Role | Typeface | Source | Weights used | Notes |
|---|---|---|---|---|
| Display (headlines, hero text, card titles, prices) | **Fraunces** | Google Fonts — variable font | 300, 450 (default), 600, 700 | A warm serif with optical-size variation (`opsz` axis) — gives large text real character without going full "editorial newspaper" cliché |
| Body / UI (paragraphs, nav, buttons, labels) | **Inter** | Google Fonts | 400, 500, 600, 700 | Clean, highly legible at small sizes, good for dense dashboard UI |
| Mono / data (eyebrows, timestamps, confidence chips, prices' unit labels, stats) | **IBM Plex Mono** | Google Fonts | 400, 500 | Used specifically to make data/metadata feel measured and precise, distinct from conversational body copy |

**Exact `<link>` tag used** (agent should use this verbatim or self-host equivalent weights):
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,450;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**CSS variables:**
```css
--font-display: 'Fraunces', serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;
```

**Type scale observed in the mockup** (agent should treat these as the scale, extending proportionally for sizes not listed):

| Use | Size | Weight | Family |
|---|---|---|---|
| Hero H1 | 56px (38px on mobile ≤860px) | 600 | Display |
| Section H2 | 34px | 600 | Display |
| Pricing H1 | 42px | 600 | Display |
| Card H3 | 19px | 600 | Display |
| Price amount | 40px | 400 (Display default) | Display |
| Dashboard H1 | 26px | 600 | Display |
| Body / lead paragraph | 16–18px | 400 | Body |
| Standard body text | 13.5–14.5px | 400–500 | Body |
| Eyebrow / label | 11px | 400, uppercase, `letter-spacing: .12em` | Mono |
| Chip / metadata | 11–12.5px | 400–500 | Mono |

**Letter-spacing:** headlines use `-.01em` (slightly tightened); eyebrows/labels use `+.08em` to `+.12em` (loosened, uppercase) — this contrast (tight display type, loose mono labels) is a deliberate, consistent pattern, not incidental.

---

## 4. Layout & spacing

- **Max content width:** `1180px`, centered, with `32px` horizontal padding on the wrapper (`.wrap`).
- **Border radius scale:**
  - `--radius-s: 6px` — small elements (chips, mini-buttons, log thumbnails)
  - `--radius-m: 12px` — cards, panels
  - `--radius-l: 20px` — large feature cards, the hero demo panel, CTA blocks
  - Buttons use full pill radius (`999px`), not the scale above — this is intentional, buttons are always fully rounded regardless of size.
- **Grid patterns used:**
  - Landing hero: 2-column grid, `1.05fr / .95fr`, `56px` gap, collapsing to 1 column ≤860px.
  - Differentiator cards: 3-column grid with `1px` gaps filled by `--line` color (creates hairline dividers between cards without individual borders) — collapses to 1 column ≤860px.
  - Dashboard: sidebar (fixed `240px`) + fluid main content; main content area uses a `1.5fr / 1fr` two-column grid for cards. Sidebar hides entirely ≤900px (mobile assumes a different nav pattern, e.g. bottom tab bar — not built in this mockup, agent should design one consistent with this system if needed).
  - Pricing: 3-column equal grid, `20px` gap, collapsing to 1 column ≤860px.
- **Card padding:** standard card interior padding is `24–32px` depending on card size; list items inside cards use `12–14px` vertical padding with a `1px` bottom border in `--line` (or `--dark-line` in dark mode) separating rows, last row's border removed.

---

## 5. Components (exact patterns to replicate)

### 5.1 Buttons
- **Primary:** pill-shaped (`border-radius: 999px`), `--accent` background, `--accent-ink` text, `13–26px` padding depending on context, `600` weight, `14.5px` size. Hover: darken to `#9E4523` (a fixed hover-darkened value, not a CSS filter).
- **Ghost/secondary:** transparent background, `1px solid var(--line)` border, `--ink` text. Hover: border darkens to `--ink`.

### 5.2 Trust/confidence chip (the most important reusable component — used everywhere AI-estimated or verified data appears)
- Pill shape, `4px 10px 4px 8px` padding, mono font, `11px`, with a small `6px` colored dot before the label.
- **High-confidence / verified state:** `--trust-soft` background, `--trust` text and dot.
- **Low-confidence / estimated state:** `--accent-soft` background, `--accent` text and dot (class modifier `.low` in the built CSS).
- This component must appear anywhere the product shows AI-estimated data (calorie estimates, photo-logged meals) per the platform's core trust principle — never omit it silently.

### 5.3 Signature motif — the "adaptive path"
An SVG line chart-like element where a dashed "original plan" path is shown alongside a solid, re-routed `--accent`-colored path that bends around a "missed" marker (`--ink` dot) and reconnects through a "confirmed/trust" marker (`--trust` dot) to a new endpoint. This exact motif (or a close variant of it) should appear on the landing-page hero and can recur elsewhere (e.g. an empty state, a loading state) as the brand's one consistent, memorable visual device — per the design principle of spending distinctiveness in one signature place rather than scattering novelty throughout the UI.

### 5.4 Cards
- Light mode: `--bg-raised` background, `1px solid var(--line)` border, `--radius-m` or `--radius-l` corners.
- Dark mode: `--dark-raised` background, `1px solid var(--dark-line)` border.
- Featured/highlighted card (e.g. the recommended pricing tier): border color switches to `--accent`, adds a soft drop shadow tinted with the accent color at low opacity, and a small pill label overlapping the top edge.

### 5.5 Adaptive banner (dashboard)
A horizontal callout using a subtle left-to-right gradient from `rgba(184,84,46,.14)` to transparent, `1px solid rgba(184,84,46,.3)` border, small radius — used specifically to announce "your plan just changed" moments. This is distinct from the trust chip; the banner announces an *event*, the chip labels a *data point*.

---

## 6. Motion (principles, not yet coded in the static mockup)

The mockup is currently static; if the agent adds motion, it should follow these rules already established for this brand:
- One orchestrated moment beats scattered effects — the adaptive-path SVG is the natural candidate for a page-load draw-in animation (path drawing itself from Monday to the rebuilt endpoint).
- Respect `prefers-reduced-motion` — disable the path animation and any hover micro-interactions beyond simple color transitions for users who request reduced motion.
- Existing hover states use a `0.15s` transition — keep all interactive-state transitions at this duration for consistency.

---

## 7. Accessibility baseline (non-negotiable, per the platform's design principles)

- Maintain WCAG 2.2 AA contrast — verify `--ink-soft` (`#5C5449`) on `--bg` (`#F2EFE7`) and `--ink-soft` on `--bg-raised` meet 4.5:1 for body text; both currently pass but re-verify after any token changes.
- All interactive elements need a visible keyboard focus state (not present as an explicit style in the current CSS — **agent must add** a visible `:focus-visible` outline, e.g. `2px solid var(--accent)` with offset, across buttons, links, and form controls).
- Dark mode is not optional/cosmetic — it should be a fully supported first-class mode given its relevance to battery/data conservation on budget Android devices in the primary launch market, not a toggle bolted on later.

---

## 8. What NOT to change without a deliberate decision

- Do not introduce a second primary-action color — one brand color (`--accent`) owns all CTAs.
- Do not use `--trust` teal decoratively — it must stay reserved for confidence/verification meaning.
- Do not replace the warm-neutral base (`#F2EFE7` / `#1C1815`) with pure white/black — the warmth is a deliberate differentiator from generic SaaS defaults.
- Do not drop the mono typeface for data/labels in favor of using the body face everywhere — the display/body/mono three-way split is what gives the hierarchy its clarity, especially in the dense dashboard view.

---

*Reference implementation: `platform-design.html` (the full working mockup this spec was extracted from) contains the complete, working CSS for all tokens and components above, plus three built screens (landing page, consumer dashboard, pricing page) demonstrating them in context. The agent should treat that file as the canonical source and this document as its annotated explanation.*
