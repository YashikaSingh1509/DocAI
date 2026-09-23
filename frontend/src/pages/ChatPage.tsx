import React, { useEffect, useState, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { chat as chatApi } from '../api';
import type {  Message, Conversation  } from '../types';
import { Send, Plus, MessageSquare, Bot, User, Wrench, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadConversations();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeConversationId && activeWorkspace) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, activeWorkspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!activeWorkspace) return;
    try {
      const data = await chatApi.getConversations(activeWorkspace.id);
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const loadMessages = async (convId: string) => {
    if (!activeWorkspace) return;
    try {
      const data = await chatApi.getMessages(activeWorkspace.id, convId);
      setMessages(data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleNewChat = async () => {
    if (!activeWorkspace) return;
    try {
      const newConv = await chatApi.createConversation(activeWorkspace.id, { title: 'New Conversation' });
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newConv.id);
      setMessages([]);
    } catch (error) {
      toast.error('Failed to create new chat');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeWorkspace || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic UI for user message
    const tempId = Date.now().toString();
    const newUserMsg: Message = {
      id: tempId,
      conversationId: activeConversationId || '',
      role: 'USER',
      content: userMsg,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const res = await chatApi.send({
        workspaceId: activeWorkspace.id,
        conversationId: activeConversationId || undefined,
        message: userMsg
      });

      // If this was first message, we might have created a new conversation implicitly
      if (!activeConversationId && res.conversationId) {
        setActiveConversationId(res.conversationId);
        loadConversations();
      }

      // Store retrieval context for Debug page (in a real app, use Context or Redux)
      if (res.retrievalContext) {
        localStorage.setItem('lastRetrievalContext', JSON.stringify(res.retrievalContext));
      }

      // Reload messages to get the real IDs and assistant response
      if (res.conversationId) {
        loadMessages(res.conversationId);
      }
    } catch (error) {
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Please select or create a workspace to start chatting.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white">
      {/* Sidebar for conversations */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
          >
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeConversationId === conv.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="mr-3 h-4 w-4 shrink-0" />
              <div className="truncate flex-1">
                <div className="truncate font-medium">{conv.title || 'New Conversation'}</div>
                <div className="text-xs text-gray-500">{new Date(conv.createdAt).toLocaleDateString()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {!activeConversationId && messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center flex-col text-center px-4">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">How can I help you today?</h2>
            <p className="text-gray-500 max-w-md">
              Ask questions about your documents, generate tasks, or interact with tools.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-3xl space-x-3 ${msg.role === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'
                  }`}>
                    {msg.role === 'USER' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col space-y-2 max-w-[calc(100vw-6rem)] md:max-w-2xl">
                    <div className={`rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'USER' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    
                    {/* Tool Calls indicator */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="flex flex-col space-y-1 mt-1">
                        {msg.toolCalls.map((tc: any, i: number) => (
                          <div key={i} className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 w-max">
                            <Wrench className="h-3 w-3" />
                            <span>Executed: <span className="font-mono">{tc.name || 'tool'}</span></span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.citations.map((cite, i) => (
                          <div key={i} className="flex items-center space-x-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm cursor-help" title={cite.content}>
                            <FileText className="h-3 w-3 text-blue-500" />
                            <span className="truncate max-w-[150px]">{cite.documentName}</span>
                            {cite.page && <span className="text-gray-400">p.{cite.page}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex space-x-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 text-sm border border-gray-200 flex items-center space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="mx-auto max-w-4xl relative">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message DocAI..."
                className="w-full rounded-full border border-gray-300 bg-gray-50 pl-4 pr-12 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-2 text-[10px] text-gray-400">
              DocAI can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
