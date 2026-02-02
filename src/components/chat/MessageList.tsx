'use client';

import { Message } from '@/lib/ai/types';
import ReactMarkdown from 'react-markdown';
import { useTheme } from 'next-themes';

export function MessageList({ messages }: { messages: Message[] }) {
  const { theme } = useTheme();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
            }`}
          >
            {message.role === 'assistant' ? (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = className === undefined || className === '';
                    
                    if (!isInline && match) {
                      return (
                        <div className="relative">
                          <pre
                            className={`bg-gray-800 dark:bg-gray-900 text-white p-4 rounded-lg overflow-x-auto ${
                              theme === 'dark' ? 'dark' : ''
                            }`}
                          >
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard(String(children))}
                            className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                          >
                            Copy
                          </button>
                        </div>
                      );
                    }
                    
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}