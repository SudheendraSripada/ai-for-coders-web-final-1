import { AIProvider, Message, ModelInfo, ChatOptions, ChatResponse, AIProviderConfig, AnalysisResult } from '../types';

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

  supportsStreaming(model: string): boolean {
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

    const url = `${this.baseUrl}/models/${model}:generateContent`;
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

  async analyzeImage(imageData: string, model: string, prompt?: string): Promise<AnalysisResult> {
    if (!this.validateApiKey(this.apiKey)) {
      throw new Error('Invalid Google Gemini API key');
    }

    // Use gemini-pro-vision if available or fallback to it
    const visionModel = model === 'gemini-pro-vision' ? model : 'gemini-pro-vision';

    const systemPrompt = `You are an expert software engineer and code reviewer. 
    Analyze the attached screenshot or image code.
    Identify any errors, bugs, or improvements.
    Provide a structured response in JSON format with the following fields:
    - text: A general summary of the analysis (markdown supported)
    - errors: An array of strings describing specific errors found (with line numbers if applicable)
    - warnings: An array of strings describing potential issues or warnings
    - suggestions: An array of strings describing suggestions for improvement
    - code: (Optional) corrected code snippet if applicable
    
    IMPORTANT: Return ONLY valid JSON.`;

    const userPrompt = prompt || "Analyze this screenshot for errors and code issues.";

    // Handle imageData to get mimeType and base64
    let mimeType = 'image/jpeg';
    let data = imageData;
    
    if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            mimeType = matches[1];
            data = matches[2];
        }
    }

    const contents = [
      {
        role: "user",
        parts: [
          { text: systemPrompt + "\n\n" + userPrompt },
          {
            inlineData: {
              mimeType,
              data
            }
          }
        ]
      }
    ];

    const url = `${this.baseUrl}/models/${visionModel}:generateContent`;
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
            temperature: 0.4,
            maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.error?.message || 'Gemini API request failed');
    }

    const resData = await response.json();
    const content = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';

     // Clean up markdown code blocks if present (e.g. ```json ... ```)
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        text: parsed.text || "Analysis complete",
        errors: parsed.errors || [],
        warnings: parsed.warnings || [],
        suggestions: parsed.suggestions || [],
        code: parsed.code
      };
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini", e);
      return {
        text: content,
        errors: [],
        warnings: [],
        suggestions: []
      };
    }
  }
}