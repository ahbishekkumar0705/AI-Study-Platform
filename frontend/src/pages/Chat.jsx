import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  MessageSquare,
  Send,
  FileText,
  Copy,
  Check,
  Bot,
  User,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// A simple, dependency-free Markdown and Code renderer for AI study responses
const RenderMarkdown = ({ text }) => {
  if (!text) return null;

  // Split into paragraphs / blocks
  const blocks = text.split('\n\n');

  return (
    <div className="space-y-3 text-sm leading-relaxed select-text">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // 1. Code Block Render
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={bIdx} className="my-3 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900 text-slate-100 font-mono text-xs">
              <div className="px-4 py-1.5 bg-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{lang}</span>
              </div>
              <pre className="p-4 overflow-x-auto"><code>{code}</code></pre>
            </div>
          );
        }

        // 2. Table Render
        if (trimmed.includes('|') && trimmed.split('\n')[1]?.includes('-')) {
          const lines = trimmed.split('\n');
          const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
          const rows = lines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean)).filter(row => row.length > 0);
          
          return (
            <div key={bIdx} className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row, rI) => (
                    <tr key={rI} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                      {row.map((cell, cI) => (
                        <td key={cI} className="px-4 py-2 text-xs font-medium">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // 3. Bullet List Render
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
          const lines = trimmed.split('\n');
          const isOrdered = /^\d+\.\s/.test(lines[0]);
          const ListTag = isOrdered ? 'ol' : 'ul';
          
          return (
            <ListTag key={bIdx} className={`list-outside pl-5 space-y-1.5 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\*\-\d\.]+\s+/, '');
                return <li key={lIdx} className="text-xs md:text-sm">{cleanLine}</li>;
              })}
            </ListTag>
          );
        }

        // 4. Headers
        if (trimmed.startsWith('#')) {
          const depth = (trimmed.match(/^#+/) || [''])[0].length;
          const cleanText = trimmed.replace(/^#+\s+/, '');
          const sizeClass = depth === 1 ? 'text-xl' : depth === 2 ? 'text-lg' : 'text-md';
          return <h4 key={bIdx} className={`${sizeClass} font-black mt-4 mb-2 text-indigo-500`}>{cleanText}</h4>;
        }

        // 5. Standard Text Paragraph (supporting inline bold **text**)
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={bIdx} className="text-xs md:text-sm">
            {parts.map((part, pI) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pI} className="font-extrabold text-indigo-500">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

const Chat = () => {
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  
  const [copiedId, setCopiedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentSessionIdRef = useRef(null);

  useEffect(() => {
    if (selectedFile) {
      const startSession = async () => {
        try {
          if (currentSessionIdRef.current) {
            await api.post('/progress/session/end', { sessionId: currentSessionIdRef.current });
            currentSessionIdRef.current = null;
          }
          const res = await api.post('/progress/session/start', { fileId: selectedFile._id });
          currentSessionIdRef.current = res.data.session._id;
        } catch (err) {
          console.error('Failed to start study session:', err.message);
        }
      };
      startSession();
    }

    return () => {
      if (currentSessionIdRef.current) {
        const sessionId = currentSessionIdRef.current;
        currentSessionIdRef.current = null;
        api.post('/progress/session/end', { sessionId }).catch(err => {
          console.error('Failed to end study session:', err.message);
        });
      }
    };
  }, [selectedFile?._id]);

  // Initialize and load files/chats
  const loadInitialData = async () => {
    try {
      const filesRes = await api.get('/files');
      const chatsRes = await api.get('/chats');

      const completedFiles = filesRes.data.files.filter(f => f.status === 'completed');
      setFiles(completedFiles);
      setChats(chatsRes.data.chats);

      // Check if a fileId was passed via URL state or search params
      const params = new URLSearchParams(location.search);
      const queryFileId = params.get('fileId');

      if (queryFileId) {
        const file = completedFiles.find(f => f._id === queryFileId);
        if (file) {
          setSelectedFile(file);
          // Look for an existing chat for this file, or start a new one
          const existingChat = chatsRes.data.chats.find(c => c.file?._id === queryFileId);
          if (existingChat) {
            handleSelectChat(existingChat._id);
          } else {
            handleCreateChat(queryFileId);
          }
        }
      } else if (chatsRes.data.chats.length > 0) {
        // Default to active chat
        handleSelectChat(chatsRes.data.chats[0]._id);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [location]);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, sending]);

  const handleSelectChat = async (chatId) => {
    setLoading(true);
    try {
      const response = await api.get(`/chats/${chatId}`);
      setActiveChat(response.data.chat);
      const file = files.find(f => f._id === response.data.chat.file?._id);
      if (file) setSelectedFile(file);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (fileId) => {
    setLoading(true);
    const file = files.find(f => f._id === fileId);
    if (!file) return;
    
    try {
      const response = await api.post('/chats', {
        fileId,
        title: `Chat about ${file.name}`,
      });
      const newChat = response.data.chat;
      
      setChats([newChat, ...chats]);
      setActiveChat(newChat);
      setSelectedFile(file);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !activeChat) return;

    const messageText = input;
    setInput('');
    setSending(true);

    // Optimistically update UI
    setActiveChat(prev => ({
      ...prev,
      messages: [...prev.messages, { sender: 'user', text: messageText }]
    }));

    try {
      const response = await api.post(`/chats/${activeChat._id}/message`, {
        text: messageText,
      });
      
      // Update with backend response
      setActiveChat(prev => {
        // remove the optimistic user message and append the synced pair
        const baseMsg = prev.messages.slice(0, -1);
        return {
          ...prev,
          messages: [...baseMsg, response.data.userMessage, response.data.aiMessage]
        };
      });
    } catch (err) {
      console.error(err);
      setActiveChat(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { sender: 'ai', text: 'Error: Failed to fetch AI response. Please make sure the Gemini API key is configured.' }
        ]
      }));
    } finally {
      setSending(false);
    }
  };

  const handleCopyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-140px)] flex border border-slate-200 dark:border-slate-800/60 rounded-3xl overflow-hidden glass-card">
        {/* Sidebar: Files & Conversations */}
        <aside
          className={`${
            sidebarOpen ? 'w-80 border-r' : 'w-0 border-r-0'
          } flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/30 transition-all duration-300 overflow-hidden border-slate-200 dark:border-slate-800/60`}
        >
          {/* New Chat Button */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Study Documents</h3>
            {files.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 italic">Upload files to start chatting!</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {files.map((file) => (
                  <button
                    key={file._id}
                    onClick={() => handleCreateChat(file._id)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedFile?._id === file._id
                        ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate">{file.name}</span>
                    <Plus className="h-3 w-3 ml-auto text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Chats List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Recent Conversations</h3>
            {chats.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 italic">No chats started yet.</p>
            ) : (
              <div className="space-y-1">
                {chats.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelectChat(c._id)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeChat?._id === c._id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/20 dark:bg-slate-900/10">
          {/* Header */}
          <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors mr-1"
                title="Toggle Sidebar"
              >
                <Plus className={`h-4 w-4 transition-transform ${sidebarOpen ? 'rotate-45' : ''}`} />
              </button>
              
              {selectedFile ? (
                <div>
                  <h3 className="font-extrabold text-sm truncate max-w-[180px] sm:max-w-xs">{selectedFile.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Active Study Material</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-extrabold text-sm">Select Document</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a file on the left sidebar to query.</p>
                </div>
              )}
            </div>
            
            {selectedFile && (
              <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                AI Agent Ready
              </span>
            )}
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && !activeChat ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : !activeChat ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4 text-slate-400">
                <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-full">
                  <Bot className="h-10 w-10 animate-bounce" />
                </div>
                <h4 className="font-bold text-slate-200">Start AI Document Query</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a document from the left list. The AI will answer questions using only contents extracted from that document.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeChat.messages.length === 0 && (
                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-center space-y-2 max-w-md mx-auto">
                    <Sparkles className="h-5 w-5 text-indigo-500 mx-auto" />
                    <p className="text-xs font-bold text-indigo-400">AI Context Injected</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Type your questions. The answers are sourced only from <span className="font-semibold text-slate-300">"{selectedFile?.name}"</span>.
                    </p>
                  </div>
                )}

                {activeChat.messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={index} className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : ''}`}>
                      {/* Avatar */}
                      {!isUser && (
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[82%] p-4 rounded-2xl relative group ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/15'
                            : 'bg-slate-100/80 dark:bg-slate-800/60 rounded-tl-none border border-slate-200/50 dark:border-slate-800/40'
                        }`}
                      >
                        {/* Copy button */}
                        {!isUser && (
                          <button
                            onClick={() => handleCopyToClipboard(msg.text, index)}
                            className="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-500 hover:text-white text-slate-500 rounded-lg transition-all shadow-md cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === index ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        )}

                        {isUser ? (
                          <p className="text-xs md:text-sm whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <RenderMarkdown text={msg.text} />
                        )}

                        <span
                          className={`text-[9px] font-semibold mt-1.5 block text-right ${
                            isUser ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isUser && (
                        <div className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI Thinking Indicator */}
                {sending && (
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-3.5 bg-slate-100/85 dark:bg-slate-800/60 rounded-2xl rounded-tl-none border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Box */}
          <footer className="p-4 border-t border-slate-200 dark:border-slate-800/60">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                disabled={!activeChat || sending}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeChat
                    ? `Ask questions about "${selectedFile?.name}"...`
                    : 'Select a document from the left list to begin.'
                }
                className="flex-1 px-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!activeChat || sending || !input.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
