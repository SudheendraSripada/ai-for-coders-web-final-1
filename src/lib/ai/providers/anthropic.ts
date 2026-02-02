import { AIProvider, Message, ModelInfo, ChatOptions, ChatResponse, AIProviderConfig } from '../types';

export class AnthropicProvider implements AIProvider {
  providerName = 'anthropic';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-ant-api03') && apiKey.length > 40;
  }

  getModels(): ModelInfo[] {
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        contextWindow: 200000,
        maxTokens: 4096,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        contextWindow: 200000,
        maxTokens: 4096,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        contextWindow: 200000,
        maxTokens: 4096,
      },
    ];
  }

  supportsStreaming(_model: string): boolean {
    return true; // Anthropic supports streaming
  }

  getModelInfo(model: string): ModelInfo | null {
    const models = this.getModels();
    return models.find(m => m.id === model) || null;
  }

  async chat(messages: Message[], model: string, options?: ChatOptions): Promise<ChatResponse> {
    if (!this.validateApiKey(this.apiKey)) {
      throw new Error('Invalid Anthropic API key');
    }

    const modelInfo = this.getModelInfo(model);
    if (!modelInfo) {
      throw new Error(`Model ${model} not found for Anthropic provider`);
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(message => {
      if (message.role === 'user') {
        return { role: 'user', content: message.content };
      } else {
        return { role: 'assistant', content: message.content };
      }
    });

    const url = `${this.baseUrl}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: anthropicMessages,
        max_tokens: options?.maxTokens ?? modelInfo.maxTokens,
        temperature: options?.temperature ?? 0.7,
        stream: options?.stream ?? false,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Anthropic API request failed');
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
      content: data.content[0].text,
      model,
      provider: this.providerName,
      finishReason: data.stop_reason || 'stop',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
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
          if (data.type === 'content_block_delta' && data.delta.text) {
            const content = data.delta.text;
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