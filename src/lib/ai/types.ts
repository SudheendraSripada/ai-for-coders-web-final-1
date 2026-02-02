export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxTokens: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  providerName: string;
  
  getModels(): ModelInfo[];
  
  chat(messages: Message[], model: string, options?: ChatOptions): Promise<ChatResponse>;
  
  supportsStreaming(model: string): boolean;
  
  getModelInfo(model: string): ModelInfo | null;
  
  validateApiKey(apiKey: string): boolean;
}

export type ProviderType = 'openai' | 'gemini' | 'anthropic';

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
}