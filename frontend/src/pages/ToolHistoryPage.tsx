import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { toolCalls as toolCallsApi } from '../api';
import type {  ToolCallLog  } from '../types';
import { Wrench, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ToolHistoryPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [logs, setLogs] = useState<ToolCallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!activeWorkspace) return;
      setIsLoading(true);
      try {
        const data = await toolCallsApi.list(activeWorkspace.id);
        setLogs(data);
      } catch (error) {
        toast.error('Failed to load tool history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [activeWorkspace]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };

  if (!activeWorkspace) {
    return <div className="flex h-full items-center justify-center"><p className="text-gray-500">Please select a workspace.</p></div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tool Call History</h1>
        <p className="mt-1 text-sm text-gray-500">History of actions performed by the AI.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
          <Wrench className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No tool calls yet</h3>
          <p className="mb-6 mt-1 text-sm text-gray-500">The AI hasn't used any tools in this workspace.</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Tool Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Time</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 flex items-center">
                      <Wrench className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-mono text-blue-600">{log.toolName}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      <span className="capitalize">{log.status.toLowerCase()}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button className="text-blue-600 hover:text-blue-900">
                        {expandedId === log.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Arguments</h4>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-xs font-mono">
                              {JSON.stringify(log.arguments, null, 2)}
                            </pre>
                          </div>
                          {log.result && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Result</h4>
                              <pre className="bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto text-xs font-mono max-h-48 overflow-y-auto">
                                {typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.error && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-red-500 tracking-wider mb-2">Error</h4>
                              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{log.error}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ToolHistoryPage;
