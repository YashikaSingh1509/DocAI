import React, { useEffect, useState, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { documents as docsApi } from '../api';
import type {  Document  } from '../types';
import { FileText, Upload, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentsPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const data = await docsApi.list(activeWorkspace.id);
      setDocs(data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeWorkspace]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;

    setIsUploading(true);
    try {
      await docsApi.upload(activeWorkspace.id, file);
      toast.success('Document uploaded successfully');
      fetchDocs();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeWorkspace || !confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await docsApi.delete(activeWorkspace.id, id);
      toast.success('Document deleted');
      setDocs(docs.filter(d => d.id !== id));
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Completed</span>;
      case 'PROCESSING': return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Processing</span>;
      case 'FAILED': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Failed</span>;
      default: return null;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Please select or create a workspace first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your knowledge base for this workspace.</p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".txt,.md,.pdf,.csv"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center"><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> Uploading...</span>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Upload Document</>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex py-12 justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
          <p className="mb-6 mt-1 text-sm text-gray-500">Upload documents to start chatting with them.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Select a file to upload
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div key={doc.id} className="relative flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-gray-900" title={doc.originalFilename}>
                      {doc.originalFilename}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(doc.fileSize)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {getStatusBadge(doc.status)}
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {doc.status === 'FAILED' && (
                <div className="mt-3 flex items-start space-x-1 text-xs text-red-600">
                  <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>Processing failed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
