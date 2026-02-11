# What People Google About Music

Discover what the world is curious about when it comes to music. Search for any artist, song, genre, or album to see real Google autocomplete suggestions.

**Try it live:** [what-people-google-music.netlify.app](https://what-people-google-music.netlify.app)

## Features

- **Category search** — Choose Artist, Song, Genre, or Album to get category-specific results
- **7 question types** — "Why is...", "Why does...", "Is...", "Does...", "How...", "When will...", "Can..."
- **Shareable links** — Every search generates a deep link you can share (`?q=Taylor+Swift&c=artist`)
- **Instant cache** — Repeat searches load from localStorage in ~200ms (24-hour TTL)
- **Search history** — Recent searches appear as clickable chips on the landing page
- **Accessible** — Keyboard navigation, ARIA attributes, screen reader support, reduced motion
- **Zero dependencies** — Vanilla JS, ~15KB bundle

## Quick Start

```bash
git clone https://github.com/collectivewinca/what-people-google-music.git
cd what-people-google-music
npm install
npm run build
npm run server
# Open http://localhost:8080
```

## Development

```bash
npm run dev    # Watch mode + dev server
npm run build  # Production bundle
```

## Example Searches

- **Artists**: Taylor Swift, The Beatles, Drake, BTS
- **Songs**: Bohemian Rhapsody, Stairway to Heaven, Bad Guy
- **Genres**: Jazz, Hip Hop, K-Pop, Classical
- **Albums**: Thriller, Abbey Road, 1989

## How It Works

1. User enters a search term and selects a category
2. The app sends 7 JSONP requests to Google's autocomplete API (one per question prefix)
3. Results are categorized, filtered, and displayed in glassmorphism cards
4. Results are cached in localStorage for instant repeat access
5. The browser URL updates for shareability via `history.replaceState`

## Design

- MINY-inspired dark theme with amber (#fbbf24) accents
- Montserrat typography
- Glassmorphism cards with backdrop blur
- Responsive layout (mobile + desktop)

## What's Next

- [x] **Open Graph meta tags** — Rich previews when sharing links on Slack, Twitter, iMessage
- [x] **Favicon** — Amber music note icon for browser tabs (inline SVG)
- [x] **Keyboard shortcut** — Press `/` to focus search input
- [x] **Grid View landing page** — Browse 40 curated artists/songs/genres/albums as discovery cards
- [x] **Animated state transitions** — Fade/stagger animations between empty, loading, and results
- [ ] **PWA / offline support** — Service worker + manifest for installable offline app
- [ ] **Pre-computed popular data** — Ship top 100 searches as static JSON for instant first load
- [ ] **Result comparison** — Search two terms side-by-side (e.g., Beatles vs Rolling Stones)
- [ ] **Trending indicator** — Flag new/trending suggestions by comparing against older cached results

## Credits

- Forked from [anvaka/what-people-google](https://github.com/anvaka/what-people-google)
- Design inspired by [MINY Vinyl](https://minyvinyl.com)
- Built by [VeLab](https://velab.org)

## License

MIT
