# Design — secunit, llc

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre
modern-minimal

## Macrostructure family
- Marketing pages (home): Map / Diagram — split hero with Tier-A CSS stat diagram, spec-sheet rows, numbered workflow list.
- Content pages (services, technologies, about): Long Document — `.page-header` / `.tech-hero` lead, hairline-ruled sections in a `0.42fr / 1fr` split.
- Utility pages (contact, privacy, terms): centered single column (`.contact-*`, `.prose-page`).

## Theme — Quiet (warm paper · single warm accent)
Token source of truth: [src/styles/tokens.css](src/styles/tokens.css). Light + dark
schemes both live there; pages must reference tokens by name, never raw values.

Key tokens (light):
- `--color-paper`   oklch(96% 0.01 58)
- `--color-ink`     oklch(18% 0.012 52)
- `--color-accent`  oklch(66% 0.2 42) — borders, icons, large fills only
- `--color-accent-text` oklch(50% 0.19 42) — accent used as small text (≥4.5:1)
- `--color-focus`   oklch(62% 0.22 42)
- `--color-danger`  oklch(57% 0.2 25)

## Typography
- Display: Geist, weight 750, tracking -0.055em
- Body: Geist, weight 400–500
- Mono (outlier, kickers/tags): Geist Mono, weight 650, uppercase, tracking 0.04–0.18em
- Type scale anchor: `--text-display` = clamp(2.75rem, 5vw + 0.75rem, 5.25rem)

## Spacing
4-point named scale in `tokens.css` (`--space-3xs` … `--space-4xl`). Pages use
named tokens, never raw values. Page shell: `--page-max` 76rem, `--page-gutter`
clamp(1rem, 4vw, 3.5rem).

## Motion
- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1), `--ease-in`, `--ease-in-out`
- Durations: `--dur-micro` 120ms · `--dur-short` 220ms · `--dur-long` 420ms
- Reveal pattern: none — hover/focus transitions only (color, border, ±1px translateY)
- Reduced-motion fallback: all transitions/animations clamp to 150ms (global media query)

## Microinteractions stance
- Silent success (inline form panel, no toasts)
- Buttons: -1px lift on hover, +1px press on active
- Focus: 3px `--color-focus` ring, 4px offset, never animated

## CTA voice
- Primary: pill, ink fill (`.home-button--primary`), accent fill on hover
- Secondary: pill, hairline ink outline (`.home-button--secondary`)
- Copy pattern: short imperatives — "Let's Talk", "View Services", "Get in Touch"

## What pages MUST share
- The `secunit, llc` wordmark (mono, accent on "Secunit")
- Hairline `--color-rule` section dividers
- The accent hue and its restraint (≤5% per viewport; small accent text uses `--color-accent-text`)
- Geist display + body, Geist Mono outliers
- CTA voice (pill buttons, padding rhythm)
- `[ Kicker ]` mono uppercase section labels in the footer only

## What pages MAY differ on
- Macrostructure within the page-type family
- Tier-A CSS enrichment — marketing pages only (home stat map); content/utility pages are typography only

## Per-page allowances
- Home MAY use the Tier-A CSS diagram hero. No other enrichment tiers.
- 404 is a sanctioned one-off (DOS terminal easter egg) — outside the system on purpose.

## Exports

### tokens.css
Canonical copy lives at [src/styles/tokens.css](src/styles/tokens.css) and is
imported by `global.css`. Mirror from there; do not fork values into this file.
