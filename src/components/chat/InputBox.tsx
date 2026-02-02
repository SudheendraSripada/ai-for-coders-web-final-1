'use client';

import { useState, useRef, useEffect } from 'react';
import { CornerDownLeft, Mic, Paperclip, Send } from 'lucide-react';

export function InputBox({ 
  onSend, 
  isLoading, 
  disabled, 
  placeholder = 'Type your message...'
}: { 
  onSend: (content: string) => void; 
  isLoading: boolean; 
  disabled?: boolean; 
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && !disabled) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className="w-full min-h-[44px] max-h-[200px] resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <button
              type="button"
              disabled={isLoading || disabled}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              disabled={isLoading || disabled}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <Mic size={18} />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || disabled || !inputValue.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {disabled ? 'API key required' : 'Press Enter to send (Shift+Enter for newline)'}
      </div>
    </form>
  );
}