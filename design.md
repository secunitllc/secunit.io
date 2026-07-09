# Design — secunit, llc

Contemporary minimalist system. Every page reads this file before emitting code.

## Genre
contemporary — bento grids, gradient accent, glass nav, dark mode

## Macrostructure
- **Home:** bento hero (copy tile + 2×2 stat grid) → service bento → step bento → client chips → gradient CTA tile
- **Content pages** (services, technologies, about): page-header + split sections; cards use bento surfaces
- **Utility pages** (contact, privacy, terms, security): centered column (`.prose-page`, `.contact-*`)
- **Access pages:** standalone card shell (`AccessLayout`)

## Theme
Token source: [src/styles/tokens.css](src/styles/tokens.css)

| Token | Light | Role |
|-------|-------|------|
| `--color-primary` | `#C800DF` | Brand magenta |
| `--color-secondary` | `#E60076` | Accent pink |
| `--color-surface` | `#FFFFFF` | Bento tile fill |
| `--color-ink` | `#111827` | Body text |
| `--gradient-brand` | primary → secondary | CTAs, accent tiles |

## Typography
- **Display & body:** Jost (400–800)
- **Mono / kickers:** Overpass Mono
- **Scale anchor:** `--text-display` = clamp(2.75rem … 4.75rem)

## Spacing & surfaces
- Named scale: `--space-3xs` … `--space-4xl`
- Bento radius: `--radius-card` = 1.25rem
- Shadow: `--shadow-bento`
- Page shell: `--page-max` 76rem, `--page-gutter` clamp(1rem, 4vw, 3.5rem)

## Motion
- Hover: −1px lift on tiles/buttons; border brightens toward primary
- Focus: 3px `--color-focus` ring, 4px offset
- Reduced motion: global 150ms clamp

## CTA voice
- Primary: gradient pill (`.home-button--primary`)
- Secondary: surface pill with hairline border
- Copy: short imperatives — "Let's Talk", "View Services"

## Shared across pages
- Gradient wordmark (`Secunit` in brand gradient)
- Bento tiles: surface + border + shadow
- Magenta kickers (`.home-kicker`)
- Dark mode via `.dark` on `<html>`

## May differ
- Home uses full bento macrostructure; inner pages reuse tile styling on existing components
- 404 remains a sanctioned one-off (DOS terminal)
