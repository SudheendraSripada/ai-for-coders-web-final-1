import { NextResponse } from 'next/server';
import { AIManager } from '@/lib/ai/ai-manager';
import { Message } from '@/lib/ai/types';

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
      aiManager.initializeProvider(provider as any, { 
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
    const isValidKey = aiManager.validateApiKey(provider as any, apiKey);
    if (!isValidKey) {
      return NextResponse.json(
        { error: 'Invalid API key for the specified provider' },
        { status: 401 }
      );
    }

    // Check if model is available
    const modelInfo = aiManager.getModelInfo(model, provider as any);
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
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      try {
        const chatOptions = {
          ...options,
          stream: true,
          signal: request.signal,
        };

        const response = await aiManager.chat(
          messages as Message[],
          model,
          provider as any,
          chatOptions
        );

        // Send the response as a stream
        const responseText = JSON.stringify({ 
          content: response.content, 
          model: response.model, 
          provider: response.provider, 
          finishReason: response.finishReason 
        });

        await writer.write(encoder.encode(responseText));
        await writer.close();

        return new NextResponse(readable, {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
      } catch (error) {
        await writer.abort(error instanceof Error ? error : new Error('Streaming error'));
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Unknown streaming error' },
          { status: 500 }
        );
      }
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
        provider as any,
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