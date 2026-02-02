import { AIProvider, Message, ModelInfo, ChatOptions, ChatResponse, AIProviderConfig } from '../types';

export class OpenAIProvider implements AIProvider {
  providerName = 'openai';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-') && apiKey.length > 40;
  }

  getModels(): ModelInfo[] {
    return [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        contextWindow: 16385,
        maxTokens: 4096,
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        provider: 'openai',
        contextWindow: 16385,
        maxTokens: 16384,
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        contextWindow: 8192,
        maxTokens: 8192,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        contextWindow: 128000,
        maxTokens: 4096,
      },
      {
        id: 'gpt-4-32k',
        name: 'GPT-4 32K',
        provider: 'openai',
        contextWindow: 32768,
        maxTokens: 32768,
      },
    ];
  }

  supportsStreaming(_model: string): boolean {
    return true; // All OpenAI models support streaming
  }

  getModelInfo(model: string): ModelInfo | null {
    const models = this.getModels();
    return models.find(m => m.id === model) || null;
  }

  async chat(messages: Message[], model: string, options?: ChatOptions): Promise<ChatResponse> {
    if (!this.validateApiKey(this.apiKey)) {
      throw new Error('Invalid OpenAI API key');
    }

    const modelInfo = this.getModelInfo(model);
    if (!modelInfo) {
      throw new Error(`Model ${model} not found for OpenAI provider`);
    }

    const url = `${this.baseUrl}/chat/completions`;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? modelInfo.maxTokens;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: options?.stream ?? false,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    if (options?.stream) {
      return this.handleStreamingResponse(response, model, options);
    } else {
      return this.handleRegularResponse(response, model);
    }
  }

  private async handleRegularResponse(response: Response, model: string): Promise<ChatResponse> {
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model,
      provider: this.providerName,
      finishReason: data.choices[0].finish_reason,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private async handleStreamingResponse(response: Response, model: string, options?: ChatOptions): Promise<ChatResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available for streaming');
    }

    let fullContent = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const dataStr = line.replace('data: ', '').trim();
        if (dataStr === '[DONE]') break;

        try {
          const data = JSON.parse(dataStr);
          if (data.choices && data.choices[0].delta.content) {
            const content = data.choices[0].delta.content;
            fullContent += content;
            // Call the chunk callback if provided
            if (options?.onChunk) {
              options.onChunk(content);
            }
          }
        } catch (error) {
          console.error('Error parsing stream chunk:', error);
        }
      }
    }

    return {
      content: fullContent,
      model,
      provider: this.providerName,
      finishReason: 'stop',
    };
  }
}