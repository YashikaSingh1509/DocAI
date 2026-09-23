import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ChevronDown, Plus, Building } from 'lucide-react';

const WorkspaceSwitcher: React.FC = () => {
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName);
    setNewWorkspaceName('');
    setIsModalOpen(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-2 truncate">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="truncate">{activeWorkspace?.name || 'Select Workspace'}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg bg-gray-800 py-1 shadow-lg border border-gray-700">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  switchWorkspace(ws.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                  activeWorkspace?.id === ws.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
            <div className="border-t border-gray-700 my-1"></div>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-blue-400 hover:bg-gray-700 hover:text-blue-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl border border-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-white">Create Workspace</h2>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace Name"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newWorkspaceName.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
