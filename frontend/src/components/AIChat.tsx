import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FestivalItem } from './DiscoveryMap';
import { Send, Loader2, Bot, User, Trash2, ExternalLink } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

interface AIChatProps {
  selectedFestival: FestivalItem | null;
  onMinimize?: () => void;
  onClose?: () => void;
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
  'Best way to travel from Warsaw?',
  'Camping vs hotel recommendations nearby.',
];

const formatMessageContent = (raw: any): string => {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) return item.text || item.content || JSON.stringify(item);
      return String(item);
    }).join('\n');
  }
  if (typeof raw === 'object') {
    if (raw.text || raw.content || raw.reply || raw.message) {
      return String(raw.text || raw.content || raw.reply || raw.message);
    }
    try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }
  }
  return String(raw);
};

export const AIChat: React.FC<AIChatProps> = ({
  selectedFestival,
  onMinimize,
}) => {
  const setDepartureCity = usePlannerStore((state) => state.setDepartureCity);
  const setRouteData = usePlannerStore((state) => state.setRouteData);
  const setActiveRouteCoords = usePlannerStore((state) => state.setActiveRouteCoords);
  const setWeatherForecast = usePlannerStore((state) => state.setWeatherForecast);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'ai',
      content: 'Welcome to your AI Festival Concierge. Select a festival on the map to open its dedicated thread, or ask me anything about European music events.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, loading, isLoadingHistory]);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!selectedFestival) {
        if (isMounted) {
          setMessages([{
            id: 'welcome-init',
            role: 'ai',
            content: 'Welcome to your AI Festival Concierge. Select a festival on the map to open its dedicated thread, or ask me anything about European music events.',
            timestamp: new Date(),
          }]);
        }
        return;
      }
      setIsLoadingHistory(true);
      try {
        const response = await api.get(`/api/chat/history/${selectedFestival.id}`);
        if (!isMounted) return;
        if (Array.isArray(response.data) && response.data.length > 0) {
          setMessages(response.data.map((row: any) => ({
            id: String(row.id || `msg-${Math.random()}`),
            role: row.role === 'assistant' ? 'ai' : row.role === 'user' ? 'user' : 'ai',
            content: formatMessageContent(row.content),
            timestamp: row.created_at ? new Date(row.created_at) : new Date(),
          })));
        } else {
          setMessages([{
            id: `welcome-festival-${selectedFestival.id}`,
            role: 'ai',
            content: `Thread opened: ${selectedFestival.name}${selectedFestival.dates ? ` (${selectedFestival.dates})` : ''}.\n\nAsk me about lineups, tickets, travel routes, or budgeting for this event.`,
            timestamp: new Date(),
          }]);
        }
      } catch {
        if (isMounted) {
          setMessages([{
            id: `welcome-festival-fallback-${selectedFestival.id}`,
            role: 'ai',
            content: `Concierge ready for ${selectedFestival.name}. How can I assist?`,
            timestamp: new Date(),
          }]);
        }
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [selectedFestival?.id]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || loading || isLoadingHistory) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }));
      const response = await api.post('/api/chat', {
        message: text,
        festival_id: selectedFestival ? String(selectedFestival.id) : undefined,
        festival_context: selectedFestival || null,
        context: selectedFestival || null,
        history: historyPayload,
      });

      if (response.data?.origin_city) {
        setDepartureCity(response.data.origin_city);
      }
      
      if (response.data?.route_geometry?.length > 0 || response.data?.transport_data) {
        let stdTransportData = response.data.transport_data || null;
        if (stdTransportData) {
          stdTransportData = {
            car: stdTransportData.car || stdTransportData.car_option || null,
            train: stdTransportData.train || (stdTransportData.train_options ? { itineraries: stdTransportData.train_options } : null),
          };
        }
        setRouteData({
          coordinates: response.data.route_geometry || null,
          transportData: stdTransportData,
        });

        if (stdTransportData?.train?.steps) {
          setActiveRouteSteps(stdTransportData.train.steps);
        } else {
          setActiveRouteSteps(null);
        }
      }

      if (response.data?.weather_forecast) {
        setWeatherForecast(response.data.weather_forecast);
      }

      const replyText = formatMessageContent(
        response.data?.reply || response.data?.content || 'Could not synthesize a response right now.'
      );
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', content: replyText, timestamp: new Date() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: `Error: ${err.response?.data?.detail || err.message || 'Could not connect to the AI backend.'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{
      id: `clear-${Date.now()}`,
      role: 'ai',
      content: selectedFestival
        ? `Thread cleared for ${selectedFestival.name}. Ask another question.`
        : 'Chat cleared.',
      timestamp: new Date(),
    }]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#121212',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #2D2D2D',
          backgroundColor: '#1E1E1E',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={14} style={{ color: '#10B981' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#EDEDED' }}>
            AI Concierge
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedFestival?.url && (
            <a
              href={selectedFestival.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#10B981', textDecoration: 'none', marginRight: '4px' }}
            >
              Tickets <ExternalLink size={10} />
            </a>
          )}
          <div style={{ display: 'flex', gap: '4px' }}>
            <FlatIconBtn onClick={handleClear} title="Clear thread"><Trash2 size={13} /></FlatIconBtn>
            {onMinimize && <FlatIconBtn onClick={onMinimize} title="Minimize">–</FlatIconBtn>}
          </div>
        </div>
      </div>



      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#121212',
        }}
        className="no-scrollbar"
      >
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '2px',
                  backgroundColor: isUser ? '#10B981' : '#1E1E1E',
                  border: isUser ? 'none' : '1px solid #2D2D2D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isUser
                  ? <User size={12} style={{ color: '#121212' }} />
                  : <Bot size={12} style={{ color: '#10B981' }} />
                }
              </div>
              {/* Bubble */}
              <div
                className="ai-prose"
                style={{
                  maxWidth: isUser ? '85%' : '100%',
                  padding: '10px 12px',
                  backgroundColor: isUser ? '#1E3A30' : '#1E1E1E',
                  border: `1px solid ${isUser ? '#10B981' : '#2D2D2D'}`,
                  color: '#EDEDED',
                  borderRadius: '2px',
                  overflowX: 'auto',
                }}
              >
                <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                  {isUser ? (
                    formatMessageContent(msg.content).split('\n').map((line, idx) => (
                      <p key={idx} style={{ margin: line === '' ? '8px 0 0' : '0' }}>{line}</p>
                    ))
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-[#10B981] prose-td:border-[#2D2D2D] prose-th:border-[#2D2D2D] prose-code:bg-[#2D2D2D] prose-code:px-1 prose-code:rounded prose-pre:bg-[#121212] prose-pre:border prose-pre:border-[#2D2D2D]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {formatMessageContent(msg.content)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.6rem', color: '#A1A1AA', textAlign: isUser ? 'right' : 'left' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {(isLoadingHistory || loading) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '2px', border: '1px solid #2D2D2D', backgroundColor: '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={12} style={{ color: '#10B981' }} />
            </div>
            <div style={{ padding: '10px 12px', border: '1px solid #2D2D2D', backgroundColor: '#1E1E1E', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={13} style={{ color: '#10B981', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>
                {isLoadingHistory ? 'Loading history...' : 'Analyzing...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div
        style={{
          borderTop: '1px solid #2D2D2D',
          padding: '8px 16px',
          backgroundColor: '#1A1A1A',
          flexShrink: 0,
          overflowX: 'auto',
        }}
        className="no-scrollbar"
      >
        <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading || isLoadingHistory}
              style={{
                padding: '4px 10px',
                fontSize: '0.65rem',
                color: '#A1A1AA',
                border: '1px solid #2D2D2D',
                background: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#10B981'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid #2D2D2D',
          backgroundColor: '#1E1E1E',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            isLoadingHistory ? 'Loading history...' :
            selectedFestival ? `Ask about ${selectedFestival.name}...` :
            'Ask about festivals, routes, lineups...'
          }
          disabled={loading || isLoadingHistory}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '0.8rem',
            backgroundColor: '#121212',
            border: '1px solid #2D2D2D',
            borderRadius: '2px',
            color: '#EDEDED',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#10B981'}
          onBlur={e => e.target.style.borderColor = '#2D2D2D'}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || isLoadingHistory}
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#10B981',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: !input.trim() || loading || isLoadingHistory ? 0.4 : 1,
          }}
        >
          {loading ? <Loader2 size={14} style={{ color: '#121212', animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} style={{ color: '#121212' }} />}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Flat icon button helper
const FlatIconBtn: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '4px 6px',
      background: 'none',
      border: '1px solid #2D2D2D',
      borderRadius: '2px',
      color: '#A1A1AA',
      cursor: 'pointer',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#EDEDED'}
    onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}
  >
    {children}
  </button>
);

export default AIChat;
