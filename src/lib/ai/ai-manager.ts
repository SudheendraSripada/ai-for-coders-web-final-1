import { AIProvider, Message, ModelInfo, ChatOptions, ChatResponse, ProviderType } from './types';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { AnthropicProvider } from './providers/anthropic';

export class AIManager {
  private providers: Map<ProviderType, AIProvider>;
  private defaultProvider: ProviderType;

  constructor() {
    this.providers = new Map();
    this.defaultProvider = 'openai';
  }

  initializeProvider(provider: ProviderType, config: { apiKey: string; baseUrl?: string }): void {
    let providerInstance: AIProvider;

    switch (provider) {
      case 'openai':
        providerInstance = new OpenAIProvider(config);
        break;
      case 'gemini':
        providerInstance = new GeminiProvider(config);
        break;
      case 'anthropic':
        providerInstance = new AnthropicProvider(config);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    this.providers.set(provider, providerInstance);
  }

  getProvider(provider: ProviderType): AIProvider {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not initialized`);
    }
    return providerInstance;
  }

  getAllModels(): ModelInfo[] {
    const allModels: ModelInfo[] = [];
    
    this.providers.forEach(provider => {
      allModels.push(...provider.getModels());
    });

    return allModels;
  }

  getModelsByProvider(provider: ProviderType): ModelInfo[] {
    const providerInstance = this.getProvider(provider);
    return providerInstance.getModels();
  }

  async chat(messages: Message[], model: string, provider: ProviderType, options?: ChatOptions): Promise<ChatResponse> {
    try {
      const providerInstance = this.getProvider(provider);
      return await providerInstance.chat(messages, model, options);
    } catch (error) {
      console.error(`Error with ${provider} provider:`, error);
      
      // Try fallback to another provider if available
      if (this.providers.size > 1) {
        for (const [fallbackProvider, fallbackInstance] of this.providers) {
          if (fallbackProvider !== provider) {
            try {
              const fallbackModel = fallbackInstance.getModels()[0].id; // Use first available model
              console.log(`Falling back to ${fallbackProvider} with model ${fallbackModel}`);
              return await fallbackInstance.chat(messages, fallbackModel, options);
            } catch (fallbackError) {
              console.error(`Fallback to ${fallbackProvider} also failed:`, fallbackError);
            }
          }
        }
      }

      throw error; // Re-throw the original error if no fallback works
    }
  }

  supportsStreaming(model: string, provider: ProviderType): boolean {
    const providerInstance = this.getProvider(provider);
    return providerInstance.supportsStreaming(model);
  }

  getModelInfo(model: string, provider: ProviderType): ModelInfo | null {
    const providerInstance = this.getProvider(provider);
    return providerInstance.getModelInfo(model);
  }

  validateApiKey(provider: ProviderType, apiKey: string): boolean {
    const providerInstance = this.getProvider(provider);
    return providerInstance.validateApiKey(apiKey);
  }

  setDefaultProvider(provider: ProviderType): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not initialized`);
    }
    this.defaultProvider = provider;
  }

  getDefaultProvider(): ProviderType {
    return this.defaultProvider;
  }

  getDefaultModel(): string | null {
    try {
      const defaultProvider = this.getDefaultProvider();
      const providerInstance = this.getProvider(defaultProvider);
      return providerInstance.getModels()[0]?.id || null;
    } catch {
      return null;
    }
  }
}