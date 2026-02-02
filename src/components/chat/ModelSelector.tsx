'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AIManager } from '@/lib/ai/ai-manager';

export function ModelSelector({ 
  selectedModel, 
  selectedProvider, 
  onModelChange 
}: { 
  selectedModel: string; 
  selectedProvider: string; 
  onModelChange: (model: string, provider: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<{provider: string; models: any[]}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Initialize AI manager with dummy keys to get model lists
        const aiManager = new AIManager();
        
        // Initialize all providers with dummy keys just to get model info
        const providers = ['openai', 'gemini', 'anthropic'];
        const modelsByProvider = [];
        
        for (const provider of providers) {
          try {
            aiManager.initializeProvider(provider as any, { 
              apiKey: 'dummy-key-for-model-listing',
            });
            
            const providerModels = aiManager.getModelsByProvider(provider as any);
            modelsByProvider.push({
              provider,
              models: providerModels,
            });
          } catch (error) {
            console.warn(`Could not load models for ${provider}:`, error);
          }
        }
        
        setModels(modelsByProvider);
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'gemini': return 'Google Gemini';
      case 'anthropic': return 'Anthropic Claude';
      default: return provider;
    }
  };

  const getModelDisplayName = (modelId: string) => {
    for (const group of models) {
      const model = group.models.find(m => m.id === modelId);
      if (model) return model.name;
    }
    return modelId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-700 dark:text-gray-300">Loading models...</span>
      </div>
    );
  }

  const currentModelName = getModelDisplayName(selectedModel);
  const currentProviderName = getProviderDisplayName(selectedProvider);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {currentModelName}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          ({currentProviderName})
        </span>
        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {models.map((group) => (
              <div key={group.provider} className="mb-4">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {getProviderDisplayName(group.provider)}
                </div>
                <div className="space-y-1">
                  {group.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id, group.provider);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedModel === model.id && selectedProvider === group.provider
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : ''
                      }`}
                    >
                      <span className="text-gray-900 dark:text-white">{model.name}</span>
                      {selectedModel === model.id && selectedProvider === group.provider && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}