import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Clock } from 'lucide-react';
import api from './api';

interface Message {
  id?: number;
  texto: string;
  sender: 'user' | 'bot';
  createdAt?: string;
}

interface ChatProps {
  avatarUrl?: string;
  userName?: string;
}

const Chat = ({ avatarUrl, userName }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/chat/history');
        if (data.length === 0) {
          setMessages([{ texto: "Olá! Sou seu Mentor Financeiro pessoal 🧠💰. Pode me dizer um gasto, ganho ou pedir uma dica de investimento!", sender: 'bot' }]);
        } else {
          setMessages(data);
        }
      } catch (err) {
        console.error('Erro ao carregar histórico', err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { texto: userMsg, sender: 'user', createdAt: new Date().toISOString() }]);
    setIsTyping(true);

    try {
      const { data } = await api.post('/chat', { message: userMsg });
      setMessages(prev => [...prev, { texto: data.message, sender: 'bot', createdAt: new Date().toISOString() }]);
    } catch (error) {
      setMessages(prev => [...prev, { texto: "Ops, tive um problema ao processar sua mensagem. Verifique se o servidor está rodando.", sender: 'bot', createdAt: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
  };

  const UserAvatar = () => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={userName || 'Você'}
          style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
        />
      );
    }
    return (
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'white', fontWeight: 700, fontSize: '16px'
      }}>
        {(userName || 'U')[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        style={{
          ...glassStyle, flex: 1, padding: '32px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '24px',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)', scrollBehavior: 'smooth'
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: '16px',
            flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            maxWidth: '85%',
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Avatar */}
            {m.sender === 'bot' ? (
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                flexShrink: 0
              }}>
                <Bot size={20} color="white" />
              </div>
            ) : (
              <UserAvatar />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                padding: '14px 20px',
                borderRadius: m.sender === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                background: m.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'white', fontSize: '15px', lineHeight: 1.5,
                boxShadow: m.sender === 'user' ? '0 10px 20px rgba(37,99,235,0.15)' : 'none'
              }}>
                {m.texto}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: 600 }}>
                <Clock size={10} />
                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: `typing 1.4s infinite ease-in-out both`, animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.05em' }}>MENTOR PROCESSANDO...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: 'Recebi 5000 de salário' ou 'Gastei 150 em restaurante' ou 'Como investir?'"
          style={{
            ...glassStyle, flex: 1, padding: '18px 24px', paddingRight: '60px',
            color: 'white', fontSize: '15px', outline: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)', transition: 'all 0.2s'
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          style={{
            position: 'absolute', right: '10px', top: '10px', bottom: '10px',
            aspectRatio: '1', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none', borderRadius: '16px', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Send size={20} />
        </button>
      </form>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Chat;
