# Multi-Model AI Chat Interface

A production-ready AI chat interface supporting OpenAI GPT, Google Gemini, and Anthropic Claude models with real-time streaming.

## Features

✅ **Multi-Model Support**: Chat with models from OpenAI, Google Gemini, and Anthropic Claude
✅ **Real-time Streaming**: Tokens appear as they're generated for a smooth experience
✅ **Markdown Rendering**: Beautifully formatted responses with code syntax highlighting
✅ **Model Switching**: Easily switch between different AI providers and models
✅ **Dark/Light Mode**: Theme toggle for comfortable viewing
✅ **Responsive Design**: Works on desktop, tablet, and mobile devices
✅ **API Key Management**: Secure API key input for each provider
✅ **Error Handling**: Graceful error messages and fallback mechanisms

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, pnpm, or bun
- API keys for the providers you want to use (OpenAI, Google Gemini, or Anthropic)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Create a `.env.local` file and add your API keys:

```env
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm run start
```

## Architecture

### AI Abstraction Layer

The application uses a provider-based architecture with:

- **AIProvider Interface**: Common interface for all AI providers
- **OpenAIProvider**: Integration with OpenAI GPT models
- **GeminiProvider**: Integration with Google Gemini models  
- **AnthropicProvider**: Integration with Anthropic Claude models
- **AIManager**: Routes requests and handles fallback logic

### Frontend Components

- **ChatInterface**: Main chat container with state management
- **MessageList**: Displays messages with markdown rendering
- **InputBox**: Message input with auto-resizing textarea
- **ModelSelector**: Dropdown for switching between models
- **Sidebar**: Navigation and settings

### API Routes

- **POST /api/chat**: Handles chat requests with streaming support

## Supported Models

### OpenAI
- GPT-3.5 Turbo
- GPT-3.5 Turbo 16K
- GPT-4
- GPT-4 Turbo
- GPT-4 32K

### Google Gemini
- Gemini Pro
- Gemini Pro Vision

### Anthropic Claude
- Claude 3 Opus
- Claude 3 Sonnet  
- Claude 3 Haiku

## Usage

1. Click "Set API Key" and enter your API key for the desired provider
2. Select a model from the dropdown in the top-right corner
3. Type your message and press Enter to send
4. Watch as the AI response streams in real-time
5. Use the model selector to switch between different AI providers and models

## Technical Details

### Streaming Implementation

The application uses Next.js streaming to provide real-time responses:

- Server streams JSON chunks containing response content
- Client accumulates chunks and updates the UI in real-time
- Supports cancellation via AbortSignal

### State Management

- React Context for global state
- Local state management for chat messages
- In-memory conversation history (Phase 1)

### Error Handling

- API key validation
- Model availability checking
- Network error handling
- Fallback to alternative providers when available

## Roadmap

### Phase 1 (Complete) ✅
- Multi-model chat interface
- Real-time streaming
- Basic error handling
- API key management

### Phase 2 (Planned)
- Screen capture functionality
- Image upload support
- Multi-modal inputs

### Phase 3 (Planned)
- User authentication
- Conversation persistence
- API key storage in database
- Usage analytics

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
