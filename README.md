# Apex Search Engine

<p align="center">
  <img src="previews/Apex Homepage.png" alt="Apex Homepage" width="100%"/>
</p>

A minimal, fast search engine built with modern web technologies. Apex uses advanced search algorithms including inverted indices, tries for autocomplete, and intelligent caching for optimal performance.

## Features

- ⚡ **Fast Search** - Optimized inverted index with binary search for lightning-fast queries
- 🔍 **Autocomplete** - Real-time search suggestions powered by Trie data structure
- 💾 **Smart Caching** - Redis-powered result caching for instant subsequent searches
- 🎯 **Fuzzy Matching** - Find results even with partial queries (e.g., "jav" finds "java")
- 📱 **Responsive Design** - Beautiful, minimal UI that works on all devices
- 🔄 **URL Persistence** - Search results and queries persist in the URL for easy sharing

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Document storage
- **Redis** - Search result caching
- **Custom Search Algorithms**:
  - Inverted Index with binary search
  - Trie (Prefix Tree) for autocomplete

## Screenshots

### Search Results
<p align="center">
  <img src="previews/Apex Search.png" alt="Apex Search Results" width="100%"/>
</p>

<!-- Add more screenshots to the previews folder and they'll automatically appear below -->

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DevDad-Main/Apex.git
cd Apex
```

2. Install dependencies:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Configure environment variables:

**Server** (`.env` in server folder):
```env
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
PORT=3000
```

**Client** (`.env` in client folder):
```env
VITE_API_URL=http://localhost:3000
```

4. Start the development servers:

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

5. Open http://localhost:5173 in your browser

### Building for Production

```bash
# Build client
cd client
npm run build

# Build server
cd ../server
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/apex/search?query=<query>` | Search for documents |
| GET | `/apex/autocomplete?q=<prefix>` | Get search suggestions |
| POST | `/apex/scrape` | Scrape and index a URL |
| GET | `/apex/document/:id` | Get a specific document |
| GET | `/apex/document` | Get all documents |

### Example Requests

```bash
# Search for "javascript"
curl "http://localhost:3000/apex/search?query=javascript"

# Get autocomplete suggestions
curl "http://localhost:3000/apex/autocomplete?q=jav"

# Scrape a URL
curl -X POST "http://localhost:3000/apex/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Architecture

### Search Flow
1. User enters a search query
2. Frontend sends request to `/apex/search`
3. Backend checks Redis cache first
4. If not cached, searches inverted index using binary search
5. Results are cached and returned
6. Frontend displays results with animations

### Data Structures

- **Inverted Index**: Maps terms to documents for fast full-text search
- **Binary Search**: O(log n) lookup for prefix matching
- **Trie**: Prefix tree for O(m) autocomplete where m = query length

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

<p align="center">Built with ❤️ by <a href="https://github.com/DevDad-Main">DevDad</a></p>
