import client from './client';
import type { 
  User, Workspace, Document, Conversation, Message, Task, ToolCallLog, ChatResponse
 } from '../types';

export const auth = {
  signup: async (data: any) => {
    const res = await client.post<{ user: User; token: string }>('/api/auth/signup', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await client.post<{ user: User; token: string }>('/api/auth/login', data);
    return res.data;
  },
  getMe: async () => {
    const res = await client.get<User>('/api/auth/me');
    return res.data;
  }
};

export const workspaces = {
  create: async (data: { name: string }) => {
    const res = await client.post<Workspace>('/api/workspaces', data);
    return res.data;
  },
  list: async () => {
    const res = await client.get<Workspace[]>('/api/workspaces');
    return res.data;
  },
  get: async (id: string) => {
    const res = await client.get<Workspace>(`/api/workspaces/${id}`);
    return res.data;
  },
  update: async (id: string, data: { name: string }) => {
    const res = await client.patch<Workspace>(`/api/workspaces/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await client.delete(`/api/workspaces/${id}`);
    return res.data;
  }
};

export const documents = {
  upload: async (workspaceId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post<Document>(`/api/workspaces/${workspaceId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  list: async (workspaceId: string) => {
    const res = await client.get<Document[]>(`/api/workspaces/${workspaceId}/documents`);
    return res.data;
  },
  delete: async (workspaceId: string, id: string) => {
    const res = await client.delete(`/api/workspaces/${workspaceId}/documents/${id}`);
    return res.data;
  }
};

export const chat = {
  send: async (data: { workspaceId: string; conversationId?: string; message: string }) => {
    const res = await client.post<ChatResponse>('/api/chat', data);
    return res.data;
  },
  getConversations: async (workspaceId: string) => {
    const res = await client.get<Conversation[]>(`/api/workspaces/${workspaceId}/conversations`);
    return res.data;
  },
  createConversation: async (workspaceId: string, data?: { title?: string }) => {
    const res = await client.post<Conversation>(`/api/workspaces/${workspaceId}/conversations`, data);
    return res.data;
  },
  getMessages: async (workspaceId: string, conversationId: string) => {
    const res = await client.get<Message[]>(`/api/conversations/${conversationId}/messages`, {
      params: { workspaceId }
    });
    return res.data;
  }
};

export const tasks = {
  list: async (workspaceId: string) => {
    const res = await client.get<Task[]>(`/api/workspaces/${workspaceId}/tasks`);
    return res.data;
  },
  update: async (workspaceId: string, id: string, data: { status?: string; title?: string; description?: string }) => {
    const res = await client.patch<Task>(`/api/workspaces/${workspaceId}/tasks/${id}`, data);
    return res.data;
  }
};

export const toolCalls = {
  list: async (workspaceId: string) => {
    const res = await client.get<ToolCallLog[]>(`/api/workspaces/${workspaceId}/tool-calls`);
    return res.data;
  }
};
