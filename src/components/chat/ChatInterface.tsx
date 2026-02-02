'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import { ModelSelector } from './ModelSelector';
import { Sidebar } from './Sidebar';
import { ScreenShareButton } from './ScreenShareButton';
import { ScreenPreview } from './ScreenPreview';
import { Message, AnalysisResult } from '@/lib/ai/types';
import { useScreenShare } from '@/lib/hooks/useScreenShare';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    startScreenShare, 
    stopScreenShare, 
    isSharing, 
    videoRef, 
    error: screenShareError 
  } = useScreenShare();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update error from screen share
  useEffect(() => {
    if (screenShareError) {
        setError(screenShareError);
    }
  }, [screenShareError]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user message
      const userMessage: Message = {
        role: 'user',
        content,
      };

      setMessages(prev => [...prev, userMessage]);

      // Prepare request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          provider: selectedProvider,
          apiKey,
          options: {
            stream: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      const decoder = new TextDecoder();
      let aiResponse = '';

      const aiMessage: Message = {
        role: 'assistant',
        content: '',
      };

      // Update messages with empty AI response first
      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsedData = JSON.parse(line);
              if (parsedData.content) {
                aiResponse += parsedData.content;
                // Update the AI message in real-time
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: aiResponse,
                    };
                  }
                  return newMessages;
                });
              }
            } catch (parseError) {
              // Ignore parse errors for partial chunks
            }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = async (imageData: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    
    // Create a message with the image immediately
    const userMessage: Message = {
        role: 'user',
        content: 'Analyze this screenshot',
        imageUrl: imageData
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageData,
                model: selectedModel,
                provider: selectedProvider,
                apiKey
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Analysis failed');
        }
        
        const analysis: AnalysisResult = await response.json();
        
        const aiMessage: Message = {
            role: 'assistant',
            content: analysis.text,
            analysis: analysis
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
    } catch (err) {
        console.error("Analysis error:", err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
        // Add error message to chat
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Error analyzing image: ${err instanceof Error ? err.message : 'Unknown error'}`
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleModelChange = (model: string, provider: string) => {
    setSelectedModel(model);
    setSelectedProvider(provider);
  };

  const handleApiKeySubmit = () => {
    setShowApiKeyInput(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        onNewChat={handleNewChat}
        showApiKeyInput={showApiKeyInput}
        onApiKeyToggle={() => setShowApiKeyInput(!showApiKeyInput)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Chat Interface
            </h1>
            <div className="flex items-center gap-2">
              <ScreenShareButton 
                isSharing={isSharing} 
                onStartShare={startScreenShare} 
                onStopShare={stopScreenShare}
                disabled={isLoading} 
              />
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
              <ModelSelector 
                selectedModel={selectedModel}
                selectedProvider={selectedProvider}
                onModelChange={handleModelChange}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
             {/* Chat Column */}
            <div className={`flex flex-col flex-1 overflow-hidden min-w-0 transition-all duration-300`}>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Welcome to Multi-Model AI Chat
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md">
                          Chat with cutting-edge AI models from OpenAI (GPT), Google Gemini, and Anthropic Claude.
                        </p>
                        <div className="flex justify-center gap-4 mt-4">
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-sm font-medium">OpenAI</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-sm font-medium">Gemini</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="text-sm font-medium">Claude</span>
                          </div>
                        </div>
                         <div className="flex gap-2 mt-4 justify-center">
                          <button
                            onClick={() => setShowApiKeyInput(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Set API Key
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MessageList messages={messages} />
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-2">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">Error:</strong>
                      <span className="block sm:inline"> {error}</span>
                    </div>
                  </div>
                )}

                {/* Input Box */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <InputBox 
                    onSend={handleSendMessage}
                    onCapture={handleCapture}
                    isLoading={isLoading}
                    disabled={!apiKey}
                    placeholder={apiKey ? 'Type your message...' : 'Please set your API key first'}
                  />
                </div>
            </div>

            {/* Screen Share Preview Column */}
            {isSharing && (
                <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-gray-900 overflow-hidden relative">
                     <ScreenPreview videoRef={videoRef} isSharing={isSharing} />
                     <div className="absolute top-0 right-0 p-2">
                        <button 
                            onClick={stopScreenShare}
                            className="bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
                            title="Stop Sharing"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                     </div>
                </div>
            )}
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Enter your {selectedProvider.toUpperCase()} API Key
            </h3>
            <div className="space-y-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${selectedProvider.toUpperCase()} API key`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApiKeySubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}