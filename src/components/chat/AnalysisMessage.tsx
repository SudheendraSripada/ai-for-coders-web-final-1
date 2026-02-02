import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, AlertTriangle, Lightbulb, Code } from 'lucide-react';
import { AnalysisResult } from '@/lib/ai/types';

interface AnalysisMessageProps {
  analysis: AnalysisResult;
}

export function AnalysisMessage({ analysis }: AnalysisMessageProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

  return (
    <div className="space-y-4">
      {/* General Text */}
      {analysis.text && (
        <div className="prose dark:prose-invert max-w-none text-sm">
          <ReactMarkdown>{analysis.text}</ReactMarkdown>
        </div>
      )}

      {/* Errors */}
      {analysis.errors && analysis.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-2 text-sm">
            <AlertCircle className="h-4 w-4" /> Errors Found
          </h4>
          <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300 text-sm">
            {analysis.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-semibold mb-2 text-sm">
            <AlertTriangle className="h-4 w-4" /> Warnings
          </h4>
          <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 text-sm">
            {analysis.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2 text-sm">
            <Lightbulb className="h-4 w-4" /> Suggestions
          </h4>
          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-sm">
            {analysis.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Code */}
      {analysis.code && (
        <div className="bg-gray-800 dark:bg-gray-900 rounded-lg overflow-hidden border dark:border-gray-700">
          <div className="flex items-center justify-between p-2 bg-gray-700 dark:bg-gray-800">
             <h4 className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                <Code className="h-4 w-4" /> Suggested Code
            </h4>
            <button
                onClick={() => copyToClipboard(analysis.code || "")}
                className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
            >
                Copy
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm text-gray-200 font-mono">
            <code>{analysis.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
