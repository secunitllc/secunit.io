# Design — secunit, llc

Dark technical marketing system derived from the local `extractdesign` reference.

## Direction

- Matte near-black canvas with slightly lighter panels.
- IBM Plex Sans for display/body; IBM Plex Mono for labels and technical metadata.
- Burnt orange is the only interaction and emphasis color.
- Defined edges, low radius, minimal shadow, no gradients or glass effects.
- Dense information hierarchy without reducing 44px control targets.

## Structure

- **Home:** open split hero + compact proof grid → bordered service modules → numbered workflow → client registry → restrained CTA band.
- **Services:** open page header → two-column service rows with operational callouts → compact engagement grid.
- **Technologies:** registry rows with category metadata and dense full-color logo chips.
- **About:** compact image rail + biography/logbook content → values grid.
- **Contact:** open header → trust panel → single bordered form panel → contact metadata.
- **Legal/security:** narrow document column with mono metadata and ruled sections.
- **Access:** standalone bordered card using the same dark tokens.
- **404:** sanctioned DOS terminal one-off, recolored and made responsive.

## Tokens

Source: [src/styles/tokens.css](src/styles/tokens.css)

| Token                | Value     | Role                         |
| -------------------- | --------- | ---------------------------- |
| `--background`       | `#020202` | Site canvas                  |
| `--card`             | `#070707` | Panels and modules           |
| `--secondary`        | `#1B1B1B` | Controls and recessed fields |
| `--border`           | `#292929` | Structural rules             |
| `--foreground`       | `#FAFAFA` | Primary text                 |
| `--muted-foreground` | `#8F8F8F` | Secondary text               |
| `--accent`           | `#ED7940` | CTA, focus, active state     |

## Typography

- **Display/body:** IBM Plex Sans (400–700).
- **Labels/metadata:** IBM Plex Mono (400–700).
- **Hero ceiling:** `--text-display` caps at `3rem`.
- Labels are uppercase, compact, and reserved for navigation or technical metadata.

## Surfaces and motion

- Card radius: `1rem`; control radius: `0.5rem`; pills only for compact actions/tags.
- Borders define structure. Shadows are limited to a subtle 1px depth cue.
- Interaction motion is a 100–150ms state change or 1px button movement.
- `prefers-reduced-motion` disables decorative motion and the About photo rotation.

## Accessibility

- Orange focus rings remain visible against all surfaces.
- Interactive controls retain at least 44×44px targets.
- The mobile menu exposes `aria-expanded`; current routes use `aria-current="page"`.
- Full-color technology logos keep readable text labels.
- Dark-only presentation uses `color-scheme: dark`; there is no theme preference or client storage.

## Exceptions

- The secure file-share template is standalone but uses the same tokens and fonts.
- The 404 page keeps its DOS boot sequence as intentional product personality.
