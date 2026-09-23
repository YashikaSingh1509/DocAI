import React, { createContext, useContext, useState, useEffect } from 'react';
import type {  Workspace  } from '../types';
import { workspaces } from '../api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  createWorkspace: (name: string) => Promise<Workspace>;
  switchWorkspace: (id: string) => void;
  loadWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const list = await workspaces.list();
      setWorkspaceList(list);
      
      const storedId = localStorage.getItem('activeWorkspaceId');
      if (storedId) {
        const found = list.find(w => w.id === storedId);
        if (found) {
          setActiveWorkspace(found);
        } else if (list.length > 0) {
          setActiveWorkspace(list[0]);
          localStorage.setItem('activeWorkspaceId', list[0].id);
        }
      } else if (list.length > 0) {
        setActiveWorkspace(list[0]);
        localStorage.setItem('activeWorkspaceId', list[0].id);
      }
    } catch (error) {
      console.error('Failed to load workspaces', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaces();
    } else {
      setWorkspaceList([]);
      setActiveWorkspace(null);
    }
  }, [isAuthenticated]);

  const createWorkspace = async (name: string) => {
    try {
      const newWorkspace = await workspaces.create({ name });
      setWorkspaceList([...workspaceList, newWorkspace]);
      switchWorkspace(newWorkspace.id);
      toast.success('Workspace created');
      return newWorkspace;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create workspace');
      throw error;
    }
  };

  const switchWorkspace = (id: string) => {
    const ws = workspaceList.find(w => w.id === id);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('activeWorkspaceId', id);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces: workspaceList, activeWorkspace, isLoading, createWorkspace, switchWorkspace, loadWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
