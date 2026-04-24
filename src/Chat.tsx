import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Trash2, MessageSquare, User, Bot, Zap, BrainCircuit } from 'lucide-react';
import { supabase } from './lib/supabase';
import { streamGemini } from './lib/gemini';
import { useToast } from './components/Toast';
import { format } from 'date-fns';

interface Message { id: string; role: 'user' | 'assistant'; content: string; created_at: string; }

const quickPrompts = [
  'Analisar meus gastos do mês',
  'Qual categoria gasto mais?',
  'Dê dicas para economizar',
  'Como melhorar meu saldo?',
  'Previsão para o próximo mês',
  'Onde posso cortar gastos?',
];

const Chat: React.FC<{ avatarUrl?: string | null; userName?: string }> = ({ avatarUrl, userName }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamingText]);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('chat_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(100);
    setMessages(data || []);
  };

  const getFinancialContext = async (userId: string): Promise<string> => {
    const [tRes, profileRes] = await Promise.all([
      supabase.from('transactions').select('*, categories(nome)').eq('user_id', userId).order('data', { ascending: false }).limit(50),
      supabase.from('profiles').select('nome').eq('id', userId).single(),
    ]);

    const transactions = tRes.data || [];
    const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
    const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);

    const gastosPorCat = transactions.filter(t => t.tipo === 'gasto').reduce((acc: any, t: any) => {
      const c = t.categories?.nome || 'Outros';
      acc[c] = (acc[c] || 0) + t.valor;
      return acc;
    }, {});

    return `CONTEXTO FINANCEIRO DO USUÁRIO "${profileRes.data?.nome || 'Usuário'}":
- Receitas totais: R$ ${totalGanhos.toFixed(2)}
- Despesas totais: R$ ${totalGastos.toFixed(2)}
- Saldo atual: R$ ${(totalGanhos - totalGastos).toFixed(2)}
- Top gastos por categoria: ${Object.entries(gastosPorCat).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([c, v]) => `${c}: R$${(v as number).toFixed(2)}`).join(', ')}
- Total de transações: ${transactions.length}
- Data atual: ${new Date().toLocaleDateString('pt-BR')}

Você é o FinanceAI, assistente financeiro pessoal. Use esses dados reais para responder de forma personalizada, objetiva e em português.`;
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setInput('');
    setLoading(true);

    // Save user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    await supabase.from('chat_history').insert({ user_id: user.id, role: 'user', content });

    // Stream AI response
    setStreaming(true);
    setStreamingText('');
    let fullResponse = '';

    try {
      const systemCtx = await getFinancialContext(user.id);
      const fullPrompt = `${systemCtx}\n\n---\nPergunta do usuário: ${content}`;

      for await (const chunk of streamGemini(fullPrompt)) {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      // Save AI response
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        created_at: new Date().toISOString(),
      };
      await supabase.from('chat_history').insert({ user_id: user.id, role: 'assistant', content: fullResponse });
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      showToast('Erro ao conectar com o Gemini. Verifique sua API Key.', 'error');
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamingText('');
    }
  };

  const clearHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('chat_history').delete().eq('user_id', user.id);
    setMessages([]);
    showToast('Histórico limpo', 'success');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(153,27,27,0.1))', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Chat IA</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>OpenRouter (Gemma 2 9B Free) — Online</span>
            </div>
          </div>
        </div>
        <button onClick={clearHistory} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={14} /> Limpar histórico
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
        {messages.length === 0 && !streaming && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f87171' }}>
              <MessageSquare size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Olá, {(userName || 'Usuário').split(' ')[0]}! 👋</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              Sou seu assistente financeiro pessoal. Pergunte qualquer coisa sobre suas finanças — tenho acesso aos seus dados em tempo real.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {quickPrompts.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '20px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? 'linear-gradient(135deg, #ef4444, #8b5cf6)' : 'rgba(239,68,68,0.15)', border: msg.role === 'assistant' ? '1px solid rgba(239,68,68,0.2)' : 'none' }}>
              {msg.role === 'user' ? (
                avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> :
                  <User size={16} color="white" />
              ) : <Bot size={16} color="#f87171" />}
            </div>
            <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </p>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '6px', display: 'block' }}>
                {format(new Date(msg.created_at), 'HH:mm')}
              </span>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streaming && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Bot size={16} color="#f87171" />
            </div>
            <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {streamingText ? (
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {streamingText}<span style={{ display: 'inline-block', width: '2px', height: '16px', background: '#ef4444', marginLeft: '2px', animation: 'blink 1s infinite' }} />
                </p>
              ) : (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Quick prompts below messages */}
        {messages.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {quickPrompts.slice(0, 3).map(p => (
              <button key={p} onClick={() => sendMessage(p)} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                {p}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre suas finanças... (Enter para enviar, Shift+Enter para nova linha)"
            rows={2}
            disabled={loading}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif", lineHeight: 1.5, transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ width: '48px', height: '48px', background: loading || !input.trim() ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '14px', color: 'white', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: input.trim() ? '0 4px 16px rgba(239,68,68,0.3)' : 'none', transition: 'all 0.2s', flexShrink: 0 }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: '8px 0 0', textAlign: 'center' }}>
          Chat privado • Histórico criptografado • Dados somente seus
        </p>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
};

export default Chat;
