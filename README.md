# Study AI - Learning Support Platform

An AI-powered learning assistant that provides personalized study materials with real-time YouTube videos and web articles.

## Features

- **Multi-AI Provider Support**: Choose between OpenAI (GPT), Anthropic (Claude), or Google (Gemini)
- **Real-time Resource Discovery**: Automatically finds relevant YouTube tutorials and web articles
- **Secure API Key Storage**: Client-side encryption with AES-256-GCM
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark Mode Support**: Built-in theme switching
- **Markdown Support**: Rich text formatting in chat responses

## Tech Stack

- **Framework**: Next.js 16.0.1
- **UI**: React 19.2, Tailwind CSS, shadcn/ui
- **Language**: TypeScript
- **AI Providers**: OpenAI, Anthropic, Google Gemini
- **APIs**: YouTube Data API v3, Google Custom Search API

## Getting Started

### Prerequisites

- Node.js 20 or higher
- API Keys (at least one):
  - OpenAI API Key
  - Anthropic API Key
  - Google Gemini API Key
  - YouTube Data API Key
  - Google Custom Search API Key & Engine ID

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd study_ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
# Create .env.local file
NEXT_PUBLIC_ENCRYPTION_KEY=your-32-character-encryption-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Key Configuration

1. Click the Settings icon in the top navigation
2. Enter your API keys:
   - At least one AI provider (OpenAI/Anthropic/Gemini)
   - YouTube Data API Key
   - Google Custom Search API Key
   - Google Search Engine ID
3. Keys are encrypted and stored securely in browser cookies for 7 days

## Usage

1. Select your preferred AI provider (OpenAI, Claude, or Gemini)
2. Type your learning query in the chat
3. The AI will automatically:
   - Search for relevant YouTube videos
   - Find helpful web articles and tutorials
   - Provide a comprehensive explanation
4. Resources appear in the right panel on desktop, or below chat on mobile

## Project Structure

```
study_ai/
├── app/
│   ├── api/
│   │   ├── chat/          # Main chat endpoint
│   │   ├── search/        # Web search endpoint
│   │   └── youtube/       # YouTube search endpoint
│   ├── components/        # React components
│   ├── lib/
│   │   ├── encryption.ts         # Client-side encryption
│   │   ├── serverEncryption.ts  # Server-side encryption
│   │   └── mcpTools.ts          # API tool implementations
│   └── types/            # TypeScript type definitions
├── components/           # shadcn/ui components
├── public/              # Static assets
└── README.md
```

## Security

- API keys are encrypted using AES-256-GCM before storage
- Keys are stored as secure HTTP-only cookies
- Automatic expiration after 7 days
- No server-side persistence of raw API keys

## Build & Deploy

### Build for production:
```bash
npm run build
npm start
```

## License

Private project

## Contributing

This is a private project. Contributions are not currently accepted.

