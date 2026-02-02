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
      const encoder = new TextEncoder();

      // Handle the streaming response in a separate async function
      (async () => {
        const writer = writable.getWriter();
        try {
          const chatOptions = {
            ...options,
            stream: true,
            signal: request.signal,
          };

          // Get the provider instance to access streaming methods directly
          const providerInstance = aiManager.getProvider(provider as any);
          
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

          // For streaming, we need to handle the response differently
          // Since the providers return the full response even with stream=true,
          // we'll simulate streaming by sending chunks
          const fullContent = response.content;
          const chunkSize = 50; // Send content in chunks
          
          for (let i = 0; i < fullContent.length; i += chunkSize) {
            const chunk = fullContent.slice(i, i + chunkSize);
            const chunkData = JSON.stringify({
              content: chunk,
              model: response.model,
              provider: response.provider,
            });
            
            await writer.write(encoder.encode(chunkData + '\n'));
            
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Send completion marker
          const completionData = JSON.stringify({
            finishReason: response.finishReason,
            model: response.model,
            provider: response.provider,
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