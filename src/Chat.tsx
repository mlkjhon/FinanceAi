import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Clock, TrendingUp, Target, BarChart2, Lightbulb } from 'lucide-react';
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

const SUGGESTIONS = [
  { icon: TrendingUp, label: 'Dicas de Investimento', text: 'Quais investimentos recomenda para meu perfil?' },
  { icon: Target, label: 'Criar Meta', text: 'Quero criar uma meta de reserva de emergência de R$10.000' },
  { icon: BarChart2, label: 'Análise dos Gastos', text: 'Faça uma análise dos meus gastos e onde posso economizar' },
  { icon: Lightbulb, label: 'Plano Mensal', text: 'Crie um plano financeiro prático para este mês' },
];

const WELCOME = `Olá! Sou seu Mentor Financeiro 🧠💰

Posso ajudar você com:
• Registrar gastos e receitas — ex: "Gastei R$150 em restaurante"
• Investimentos — CDB, Tesouro Direto, ações, FIIs, cripto
• Criar e acompanhar metas financeiras
• Analisar padrões de gastos e gerar planos mensais
• Tirar dúvidas sobre finanças pessoais

Use os atalhos abaixo ou escreva diretamente!`;

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
          setMessages([{ texto: WELCOME, sender: 'bot', createdAt: new Date().toISOString() }]);
        } else {
          setMessages(data);
        }
      } catch (err) {
        console.error('Erro ao carregar histórico', err);
        setMessages([{ texto: WELCOME, sender: 'bot', createdAt: new Date().toISOString() }]);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || isTyping) return;
    setInput('');
    setMessages(prev => [...prev, { texto: userMsg, sender: 'user', createdAt: new Date().toISOString() }]);
    setIsTyping(true);

    try {
      const { data } = await api.post('/chat', { message: userMsg });
      setMessages(prev => [...prev, { texto: data.message, sender: 'bot', createdAt: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, { texto: 'Ops, tive um problema. Verifique sua conexão e tente novamente.', sender: 'bot', createdAt: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const fmtTime = (iso?: string) => {
    if (!iso) return 'Agora';
    try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return 'Agora'; }
  };

  const UserAvatar = () => {
    if (avatarUrl) {
      return (
        <img src={avatarUrl} alt={userName || 'Você'}
          style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
      );
    }
    return (
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: 'linear-gradient(135deg, #ef4444, #991b1b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'white', fontWeight: 700, fontSize: '16px'
      }}>
        {(userName || 'U')[0].toUpperCase()}
      </div>
    );
  };

  const showChips = messages.length <= 1;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Messages */}
      <div ref={scrollRef} className="glass"
        style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', scrollBehavior: 'smooth' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: '16px',
            flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            maxWidth: '85%',
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {m.sender === 'bot' ? (
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', flexShrink: 0
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
                background: m.sender === 'user' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'white', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                boxShadow: m.sender === 'user' ? '0 10px 20px rgba(239, 68, 68, 0.15)' : 'none'
              }}>
                {m.texto}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: 600 }}>
                <Clock size={10} />
                {fmtTime(m.createdAt)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #991b1b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444',
                  animation: 'typing 1.4s infinite ease-in-out both',
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.05em' }}>
              MENTOR PROCESSANDO...
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showChips && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(({ icon: Icon, label, text }) => (
            <button key={label} onClick={() => handleSend(text)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '100px', color: '#f87171',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ex: 'Gastei 200 em farmácia' · 'Dicas de investimento' · 'Criar meta R$5000'"
          className="glass"
          style={{
            flex: 1, padding: '18px 24px', paddingRight: '60px',
            color: 'white', fontSize: '15px', outline: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)', transition: 'all 0.2s'
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button type="submit" disabled={!input.trim() || isTyping}
          style={{
            position: 'absolute', right: '10px', top: '10px', bottom: '10px',
            aspectRatio: '1', background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            border: 'none', borderRadius: '16px', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
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
