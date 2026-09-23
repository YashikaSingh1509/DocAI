import React, { useEffect, useState } from 'react';
import type {  RetrievalChunk  } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { Bug, FileText, Search } from 'lucide-react';

const DebugPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [context, setContext] = useState<RetrievalChunk[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lastRetrievalContext');
    if (saved) {
      try {
        setContext(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse debug context', e);
      }
    }
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bug className="mr-2 h-6 w-6 text-purple-500" /> RAG Debug
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Inspect the retrieval context from the last chat message.
          </p>
        </div>
        {activeWorkspace && (
          <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-200">
            Workspace: {activeWorkspace.name}
          </div>
        )}
      </div>

      {context.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
          <Search className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No retrieval data</h3>
          <p className="mb-6 mt-1 text-sm text-gray-500">Send a message in the chat to see RAG results here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
            <p className="text-sm text-gray-600">Retrieved {context.length} chunks for the last query.</p>
          </div>

          <div className="space-y-4">
            {context.map((chunk, idx) => (
              <div key={chunk.id || idx} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-blue-600">
                    <FileText className="h-4 w-4" />
                    <span>{chunk.documentName}</span>
                    {chunk.page && <span className="text-gray-400 font-normal">Page {chunk.page}</span>}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                      ID: {chunk.id || `chunk-${chunk.chunkIndex}`}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      chunk.similarity > 0.8 ? 'bg-green-100 text-green-800' : 
                      chunk.similarity > 0.6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Score: {(chunk.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md font-serif text-sm leading-relaxed whitespace-pre-wrap">
                    {chunk.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPage;
