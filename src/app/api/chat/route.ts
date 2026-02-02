import { NextResponse } from 'next/server';
import { AIManager } from '@/lib/ai/ai-manager';
import { Message, ProviderType } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const { messages, model, provider, apiKey, options } = await request.json();

    // Validate required parameters
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { error: 'Model is required and must be a string' },
        { status: 400 }
      );
    }

    if (!provider || typeof provider !== 'string') {
      return NextResponse.json(
        { error: 'Provider is required and must be a string' },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required and must be a string' },
        { status: 400 }
      );
    }

    // Initialize AI Manager and provider
    const aiManager = new AIManager();

    try {
      aiManager.initializeProvider(provider as ProviderType, {
        apiKey,
        baseUrl: process.env[`${provider.toUpperCase()}_BASE_URL`]
      });
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to initialize ${provider} provider: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      );
    }

    // Validate API key
    const isValidKey = aiManager.validateApiKey(provider as ProviderType, apiKey);
    if (!isValidKey) {
      return NextResponse.json(
        { error: 'Invalid API key for the specified provider' },
        { status: 401 }
      );
    }

    // Check if model is available
    const modelInfo = aiManager.getModelInfo(model, provider as ProviderType);
    if (!modelInfo) {
      return NextResponse.json(
        { error: `Model ${model} not available for provider ${provider}` },
        { status: 400 }
      );
    }

    // Handle streaming
    const stream = options?.stream ?? false;

    if (stream) {
      // Create a transform stream to handle streaming responses
      const { readable, writable } = new TransformStream();
      const encoder = new TextEncoder();

      // Handle the streaming response in a separate async function
      (async () => {
        const writer = writable.getWriter();
        try {
          const chatOptions = {
            ...options,
            stream: true,
            signal: request.signal,
            onChunk: (chunk: string) => {
              // Stream each chunk to the client as it arrives
              const chunkData = JSON.stringify({
                content: chunk,
              });
              writer.write(encoder.encode(chunkData + '\n'));
            },
          };

          // Get the provider instance to access streaming methods directly
          const providerInstance = aiManager.getProvider(provider as ProviderType);

          // Check if the provider supports streaming for this model
          const supportsStreaming = providerInstance.supportsStreaming(model);
          if (!supportsStreaming) {
            await writer.abort(new Error('Streaming not supported for this model'));
            return;
          }

          // Call the provider's chat method with streaming enabled
          const response = await providerInstance.chat(
            messages as Message[],
            model,
            chatOptions
          );

          // Send completion marker
          const completionData = JSON.stringify({
            finishReason: response.finishReason,
            model: response.model,
            provider: response.provider,
            usage: response.usage,
          });
          await writer.write(encoder.encode(completionData + '\n'));

          await writer.close();

        } catch (error) {
          await writer.abort(error instanceof Error ? error : new Error('Streaming error'));
        }
      })();

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // Regular (non-streaming) response
      const chatOptions = {
        ...options,
        stream: false,
        signal: request.signal,
      };

      const response = await aiManager.chat(
        messages as Message[],
        model,
        provider as ProviderType,
        chatOptions
      );

      return NextResponse.json({
        content: response.content,
        model: response.model,
        provider: response.provider,
        finishReason: response.finishReason,
        usage: response.usage,
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}