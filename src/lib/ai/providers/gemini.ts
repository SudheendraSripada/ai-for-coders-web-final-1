import { AIProvider, Message, ModelInfo, ChatOptions, ChatResponse, AIProviderConfig } from '../types';

export class GeminiProvider implements AIProvider {
  providerName = 'gemini';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  validateApiKey(apiKey: string): boolean {
    return apiKey.length > 20; // Basic validation for Gemini API keys
  }

  getModels(): ModelInfo[] {
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'gemini',
        contextWindow: 32768,
        maxTokens: 8192,
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'gemini',
        contextWindow: 16384,
        maxTokens: 4096,
        supportsVision: true,
      },
    ];
  }

  supportsStreaming(_model: string): boolean {
    return true; // Gemini supports streaming
  }

  getModelInfo(model: string): ModelInfo | null {
    const models = this.getModels();
    return models.find(m => m.id === model) || null;
  }

  async chat(messages: Message[], model: string, options?: ChatOptions): Promise<ChatResponse> {
    if (!this.validateApiKey(this.apiKey)) {
      throw new Error('Invalid Google Gemini API key');
    }

    const modelInfo = this.getModelInfo(model);
    if (!modelInfo) {
      throw new Error(`Model ${model} not found for Gemini provider`);
    }

    // Convert messages to Gemini format
    const contents = messages.map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    }));

    const url = `${this.baseUrl}/models/${model}:streamGenerateContent`;
    const params = new URLSearchParams({
      key: this.apiKey,
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? modelInfo.maxTokens,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Gemini API request failed');
    }

    if (options?.stream) {
      return this.handleStreamingResponse(response, model, options);
    } else {
      return this.handleRegularResponse(response, model);
    }
  }

  private async handleRegularResponse(response: Response, model: string): Promise<ChatResponse> {
    const data = await response.json();

    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content: responseText,
      model,
      provider: this.providerName,
      finishReason: data.candidates?.[0]?.finishReason || 'stop',
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
      const lines = chunk.split('\n').filter(line => line.trim().length > 0);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const content = data.candidates[0].content.parts[0].text;
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