export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  contentHash: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  documentId: string;
  documentName: string;
  page?: number;
  chunkId: string;
  content?: string;
  similarity?: number;
}

export interface RetrievalChunk {
  id: string;
  documentId: string;
  documentName: string;
  page?: number;
  chunkIndex: number;
  content: string;
  similarity: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  citations?: Citation[];
  toolCalls?: any;
  retrievalContext?: RetrievalChunk[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface ToolCallLog {
  id: string;
  workspaceId: string;
  toolName: string;
  arguments: any;
  result?: any;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error?: string;
  createdAt: string;
  conversationId?: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversationId: string;
  retrievalContext: RetrievalChunk[];
  toolCalls?: any[];
}
