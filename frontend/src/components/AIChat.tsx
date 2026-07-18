import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/axios';
import type { FestivalItem } from './DiscoveryMap';
import {
  Send,
  Loader2,
  X,
  Bot,
  User,
  ExternalLink,
  HelpCircle,
  Trash2,
} from 'lucide-react';

interface AIChatProps {
  selectedFestival: FestivalItem | null;
  onClearSelection?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  setRouteCoordinates?: (coords: [number, number][] | null) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'What is the estimated budget for this festival?',
  'Give me lineup highlights and top artists.',
  'What is the best way to travel from Warsaw?',
  'Recommend camping vs hotel accommodation nearby.',
];

const formatMessageContent = (raw: any): string => {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.text || item.content || JSON.stringify(item);
        }
        return String(item);
      })
      .join('\n');
  }
  if (typeof raw === 'object') {
    if (raw.text || raw.content || raw.reply || raw.message) {
      return String(raw.text || raw.content || raw.reply || raw.message);
    }
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  return String(raw);
};

export const AIChat: React.FC<AIChatProps> = ({ selectedFestival, onClearSelection, onMinimize, onClose, setRouteCoordinates }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'ai',
      content:
        '👋 **Welcome to your AI Festival Concierge!**\n\nClick any festival pin on the map to select it and open its dedicated entity-bound chat thread, or ask me anything generally about European music events.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isLoadingHistory]);

  // Entity-Bound Chat History: fetch history when selectedFestival changes
  useEffect(() => {
    let isMounted = true;

    const fetchEntityChatHistory = async () => {
      if (!selectedFestival) {
        if (isMounted) {
          setMessages([
            {
              id: 'welcome-init',
              role: 'ai',
              content:
                '👋 **Welcome to your AI Festival Concierge!**\n\nClick any festival pin on the map to select it and open its dedicated entity-bound chat thread, or ask me anything generally about European music events.',
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response = await api.get(`/api/chat/history/${selectedFestival.id}`);
        if (!isMounted) return;

        if (Array.isArray(response.data) && response.data.length > 0) {
          const loadedHistory: ChatMessage[] = response.data.map((row: any) => ({
            id: String(row.id || `msg-${Math.random()}`),
            role: row.role === 'assistant' ? 'ai' : row.role === 'user' ? 'user' : 'ai',
            content: formatMessageContent(row.content),
            timestamp: row.created_at ? new Date(row.created_at) : new Date(),
          }));
          setMessages(loadedHistory);
        } else {
          // Empty thread -> initialize with entity context welcome message
          setMessages([
            {
              id: `welcome-festival-${selectedFestival.id}`,
              role: 'ai',
              content: `👋 **Dedicated Concierge Thread: ${selectedFestival.name}**\n\nI have loaded the exact context and coordinates for this festival${selectedFestival.dates ? ` (${selectedFestival.dates})` : ''}. Ask me anything about lineups, tickets, travel routes, or budgeting specifically for this event!`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err: any) {
        console.error('❌ Error fetching entity-bound chat history:', err);
        if (isMounted) {
          setMessages([
            {
              id: `welcome-festival-fallback-${selectedFestival.id}`,
              role: 'ai',
              content: `👋 **Concierge Context: ${selectedFestival.name}**\n\nHow can I assist your trip planning for **${selectedFestival.name}**?`,
              timestamp: new Date(),
            },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    fetchEntityChatHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedFestival?.id]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading || isLoadingHistory) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      // Prepare history payload as fallback / context
      const historyPayload = messages.map((m) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content,
      }));

      const response = await api.post('/api/chat', {
        message: textToSend,
        festival_id: selectedFestival ? String(selectedFestival.id) : undefined,
        festival_context: selectedFestival || null,
        context: selectedFestival || null,
        history: historyPayload,
      });

      if (setRouteCoordinates) {
        if (response.data?.route_geometry && Array.isArray(response.data.route_geometry) && response.data.route_geometry.length > 0) {
          setRouteCoordinates(response.data.route_geometry);
        } else {
          setRouteCoordinates(null);
        }
      }

      const replyText = formatMessageContent(
        response.data?.reply ||
        response.data?.content ||
        'I am sorry, I could not synthesize a response right now.'
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: `⚠️ **Concierge Error:** ${
          err.response?.data?.detail || err.message || 'Could not connect to the AI backend.'
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        role: 'ai',
        content: selectedFestival
          ? `🧹 Thread view cleared for ${selectedFestival.name}. Ask another question!`
          : '🧹 Chat history cleared. Ready for your next question!',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111412] shadow-xl">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d0f0e] p-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>AI Concierge</span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                Live
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">
              Entity-bound AI assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:border-white/20 hover:text-white transition-all"
            title="Clear chat history"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-emerald-500 hover:text-black transition-all"
              title="Minimize chat window"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-red-500 hover:text-white transition-all"
              title="Close chat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── BANNER: SELECTED FESTIVAL CONTEXT ── */}
      {selectedFestival ? (
        <div className="flex items-center justify-between border-b border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            <div className="truncate text-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-400 mr-1.5">
                Talking about:
              </span>
              <strong className="text-white font-semibold">{selectedFestival.name}</strong>
              {selectedFestival.dates && (
                <span className="ml-1.5 text-slate-300 text-[11px]">({selectedFestival.dates})</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedFestival.url && (
              <a
                href={selectedFestival.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-600/50 transition-colors"
              >
                <span>Tickets</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-lg p-1 text-slate-300 hover:bg-black/30 hover:text-white transition-colors"
                title="Deselect festival"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-white/5 bg-[#151917] px-4 py-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>No specific festival selected on the map. Talking generally.</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-500/80">Click any map pin</span>
        </div>
      )}

      {/* ── CHAT HISTORY AREA ── */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4 bg-[#0a0c0b]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-[#181c19] text-emerald-400 border border-white/10'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-emerald-600/30 text-white border border-emerald-500/40 rounded-tr-none'
                    : 'bg-[#141816] text-slate-200 border border-white/10 rounded-tl-none ai-prose'
                }`}
              >
                {formatMessageContent(msg.content).split('\n').map((line, idx) => (
                  <p key={idx} className={line === '' ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
                <span
                  className={`mt-2 block text-[9px] ${
                    isUser ? 'text-emerald-300/60 text-right' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoadingHistory && (
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#181c19] text-emerald-400 border border-white/10">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-none border border-white/10 bg-[#141816] px-4 py-3 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Loading dedicated chat history for {selectedFestival?.name}...</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#181c19] text-emerald-400 border border-white/10">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-none border border-white/10 bg-[#141816] px-4 py-3 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>AI Concierge is analyzing tools & live Ticketmaster data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── QUICK PROMPT CHIPS ── */}
      <div className="border-t border-white/5 bg-[#0e110f] px-4 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-semibold text-slate-500 shrink-0 mr-1">Suggested:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={loading || isLoadingHistory}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ── INPUT AREA ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="border-t border-white/10 bg-[#111412] p-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLoadingHistory
                ? 'Loading history...'
                : selectedFestival
                  ? `Ask anything about ${selectedFestival.name}...`
                  : 'Ask your AI Concierge (lineups, routes, budgets)...'
            }
            disabled={loading || isLoadingHistory}
            className="flex-1 rounded-xl border border-white/10 bg-[#181c19] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || isLoadingHistory}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
