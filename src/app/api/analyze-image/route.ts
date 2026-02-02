import { NextResponse } from 'next/server';
import { AIManager } from '@/lib/ai/ai-manager';
import { VisionAnalyzer } from '@/lib/ai/vision-analyzer';
import { ProviderType } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const { imageData, model, provider, apiKey, prompt } = await request.json();

    // Validate required parameters
    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    if (!provider || typeof provider !== 'string') {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Initialize AI Manager
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

    const visionAnalyzer = new VisionAnalyzer(aiManager);
    
    const result = await visionAnalyzer.analyzeScreenshot(
        imageData, 
        model, 
        provider as ProviderType, 
        prompt
    );
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Analyze Image API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
