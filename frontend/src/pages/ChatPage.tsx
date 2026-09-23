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
      <div className="flex flex-1 flex-col h-full overflow-hidden relative bg-gradient-to-b from-white to-slate-50/50">
        {!activeConversationId && messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center flex-col text-center px-4 animate-in fade-in duration-700">
            <div className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform transition-transform hover:scale-105">
              <Bot className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">How can I help you today?</h2>
            <p className="text-gray-500 max-w-md text-base leading-relaxed">
              Ask questions about your documents, generate tasks, or interact with tools securely within your workspace.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex max-w-3xl space-x-3 ${msg.role === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                    msg.role === 'USER' ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white' : 'bg-gradient-to-tr from-gray-800 to-gray-700 text-white'
                  }`}>
                    {msg.role === 'USER' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col space-y-2 max-w-[calc(100vw-6rem)] md:max-w-2xl">
                    <div className={`rounded-2xl px-5 py-3.5 text-sm/relaxed shadow-sm ${
                      msg.role === 'USER' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    
                    {/* Tool Calls indicator */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="flex flex-col space-y-1.5 mt-2">
                        {msg.toolCalls.map((tc: any, i: number) => (
                          <div key={i} className="flex items-center space-x-1.5 text-[11px] font-semibold tracking-wide text-indigo-600 bg-indigo-50/50 border border-indigo-100 rounded-md px-2.5 py-1.5 w-max shadow-sm">
                            <Wrench className="h-3.5 w-3.5" />
                            <span>Executed: <span className="font-mono uppercase tracking-wider">{tc.name || 'tool'}</span></span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.citations.map((cite, i) => (
                          <div key={i} className="group flex items-center space-x-1.5 rounded-lg border border-gray-200/60 bg-white/50 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md cursor-help" title={cite.content}>
                            <FileText className="h-3.5 w-3.5 text-indigo-500 group-hover:text-indigo-600" />
                            <span className="truncate max-w-[150px] text-gray-700 group-hover:text-gray-900">{cite.documentName}</span>
                            {cite.page && <span className="text-gray-400 bg-gray-100 px-1.5 rounded-sm">p.{cite.page}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex space-x-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white px-5 py-4 text-sm border border-gray-100 shadow-sm flex items-center space-x-2">
                    <div className="h-2 w-2 bg-indigo-400/60 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200/60 bg-white/80 backdrop-blur-xl p-4 md:p-5 relative z-10">
          <div className="mx-auto max-w-4xl relative">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message DocAI..."
                className="w-full rounded-2xl border border-gray-200 bg-white pl-5 pr-14 py-3.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-3 text-[11px] font-medium text-gray-400 tracking-wide">
              DocAI can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
