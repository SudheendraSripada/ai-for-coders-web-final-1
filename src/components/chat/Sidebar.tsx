'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Settings, Moon, Sun, Bot, Key } from 'lucide-react';
import { useTheme } from 'next-themes';

export function Sidebar({ 
  onNewChat, 
  showApiKeyInput, 
  onApiKeyToggle 
}: { 
  onNewChat: () => void; 
  showApiKeyInput: boolean; 
  onApiKeyToggle: () => void; 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`flex flex-col h-full bg-gray-800 text-white transition-all duration-200 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Logo/Menu Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {isExpanded ? (
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <span className="font-semibold text-lg">AI Chat</span>
          </div>
        ) : (
          <Bot size={24} />
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          {isExpanded ? '<' : '>'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors mb-2 ${
            isExpanded ? '' : 'justify-center'
          }`}
        >
          <Plus size={18} />
          {isExpanded && <span>New Chat</span>}
        </button>

        <div className="mb-4">
          <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {isExpanded ? 'Recent Chats' : ''}
          </div>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
              isExpanded ? '' : 'justify-center'
            }`}
          >
            <MessageSquare size={18} />
            {isExpanded && <span>Welcome</span>}
          </button>
        </div>
      </nav>

      {/* Bottom Controls */}
      <div className="p-2 border-t border-gray-700">
        <div className="space-y-1">
          <button
            onClick={onApiKeyToggle}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
              isExpanded ? '' : 'justify-center'
            }`}
          >
            <Key size={18} />
            {isExpanded && <span>{showApiKeyInput ? 'Hide API Key' : 'API Key'}</span>}
          </button>

          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
              isExpanded ? '' : 'justify-center'
            }`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {isExpanded && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
              isExpanded ? '' : 'justify-center'
            }`}
          >
            <Settings size={18} />
            {isExpanded && <span>Settings</span>}
          </button>
        </div>
      </div>
    </div>
  );
}