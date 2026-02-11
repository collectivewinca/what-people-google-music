# 🎵 What People Google About Music

Discover what the world is curious about when it comes to music! Search for any artist, song, genre, or album to see real Google autocomplete suggestions.

![Screenshot](docs/screenshot.png)

## Features

- **Search anything**: Artists, songs, genres, albums
- **7 question types**: "Why is...", "Why does...", "Is...", "Does...", "How...", "When will...", "Can..."
- **Real-time results**: Fetches live Google autocomplete data
- **Click to search**: Each suggestion links to Google search

## Demo

Try it live: [what-people-google-music.netlify.app](https://what-people-google-music.netlify.app)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourusername/what-people-google-music.git
cd what-people-google-music

# Install dependencies
npm install

# Build
npm run build

# Start dev server
npm run server
# Open http://localhost:8080
```

## Development

```bash
# Watch mode + server
npm run dev
```

## Example Searches

- **Artists**: Taylor Swift, The Beatles, Drake, BTS
- **Songs**: Bohemian Rhapsody, Stairway to Heaven, Bad Guy
- **Genres**: Jazz, Hip Hop, K-Pop, Classical
- **Albums**: Thriller, Abbey Road, 1989

## How It Works

This app uses Google's autocomplete suggestions API via JSONP to fetch real-time data about what people are searching for. Each search term is combined with different question prefixes to show various curiosities people have.

## Credits

- Forked from [anvaka/what-people-google](https://github.com/anvaka/what-people-google)
- Inspired by the original country/state map visualization

## License

MIT
