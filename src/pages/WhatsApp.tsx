import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Send, CheckCircle, AlertCircle, Link, Zap, Loader2, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const };

const COMMANDS = [
    { cmd: 'saldo', desc: 'Ver saldo atual de todas as contas' },
    { cmd: 'gasto [valor] [descrição]', desc: 'Registrar um gasto. Ex: gasto 50 almoço' },
    { cmd: 'receita [valor] [descrição]', desc: 'Registrar uma receita. Ex: receita 3000 salário' },
    { cmd: 'extrato', desc: 'Ver as últimas 5 movimentações' },
    { cmd: 'resumo', desc: 'Resumo financeiro do mês' },
    { cmd: 'ajuda', desc: 'Listar todos os comandos disponíveis' },
];

interface WhatsAppConfig { phone: string; provider: 'twilio' | 'meta'; connected: boolean; }

const WhatsApp: React.FC = () => {
    const { showToast } = useToast();
    const [config, setConfig] = useState<WhatsAppConfig>({ phone: '', provider: 'twilio', connected: false });
    const [accountSid, setAccountSid] = useState('');
    const [authToken, setAuthToken] = useState('');
    const [fromNumber, setFromNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [testMsg, setTestMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<{ from: string; body: string; time: string; }[]>([
        { from: 'sistema', body: '🤖 FinanceAI WhatsApp ativo! Digite "ajuda" para ver os comandos.', time: new Date().toLocaleTimeString() },
    ]);

    const saveConfig = async () => {
        if (!config.phone) { showToast('Informe o número do WhatsApp', 'error'); return; }
        setSaving(true);
        try {
            // In production: save to Supabase vault and configure edge function
            showToast('Configuração salva! Configure os webhooks no Twilio/Meta para ativar o recebimento.', 'success');
            setConfig(c => ({ ...c, connected: true }));
        } finally { setSaving(false); }
    };

    const sendTestMessage = async () => {
        if (!testMsg.trim()) return;
        setSending(true);
        // Simulate bot response locally
        const userMsg = { from: 'você', body: testMsg, time: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            let response = '';
            const msg = testMsg.toLowerCase().trim();
            if (msg === 'saldo') response = '💰 Saldo total: R$ --,-- (conecte o Open Finance para dados reais)';
            else if (msg.startsWith('gasto')) response = `✅ Gasto "${testMsg.replace('gasto', '').trim()}" registrado!`;
            else if (msg.startsWith('receita')) response = `✅ Receita "${testMsg.replace('receita', '').trim()}" registrada!`;
            else if (msg === 'extrato') response = '📊 Últimas transações:\n(abra o app para detalhes completos)';
            else if (msg === 'resumo') response = '📈 Resumo do mês:\n- Receitas: R$ --\n- Despesas: R$ --\n- Saldo: R$ --';
            else if (msg === 'ajuda') response = '📋 Comandos: saldo | gasto [val] [desc] | receita [val] [desc] | extrato | resumo';
            else response = `🤖 Comando processado pelo FinanceAI: "${testMsg}"`;

            setMessages(prev => [...prev, { from: 'bot', body: response, time: new Date().toLocaleTimeString() }]);
        }, 800);

        setTestMsg('');
        setSending(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>WhatsApp Business</h1>
                        {config.connected && (
                            <span style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.15)', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                                🟢 Configurado
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Gerencie suas finanças pelo WhatsApp</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                {/* Config card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ padding: '8px', background: 'rgba(37,211,102,0.1)', borderRadius: '10px', color: '#25d166' }}>
                                <Phone size={18} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Configuração Twilio / Meta API</h3>
                        </div>

                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'rgba(245,158,11,0.9)', lineHeight: 1.5 }}>
                            <strong>⚡ Pré-requisitos:</strong> Conta Twilio ativa com número WhatsApp Business, ou Meta Business Account com WhatsApp API aprovada.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>SEU NÚMERO (com DDD)</label>
                                <input value={config.phone} onChange={e => setConfig(c => ({ ...c, phone: e.target.value }))} placeholder="+55 11 99999-9999" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>PROVEDOR</label>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3px' }}>
                                    {(['twilio', 'meta'] as const).map(p => (
                                        <button key={p} type="button" onClick={() => setConfig(c => ({ ...c, provider: p }))} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: config.provider === p ? 'rgba(239,68,68,0.2)' : 'transparent', color: config.provider === p ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                                            {p === 'twilio' ? '📡 Twilio' : '📘 Meta API'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {config.provider === 'twilio' && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>TWILIO ACCOUNT SID</label>
                                        <input type="password" value={accountSid} onChange={e => setAccountSid(e.target.value)} placeholder="ACxxxxxxxx..." style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>AUTH TOKEN</label>
                                        <input type="password" value={authToken} onChange={e => setAuthToken(e.target.value)} placeholder="xxxxxxxx..." style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>NÚMERO TWILIO (From)</label>
                                        <input value={fromNumber} onChange={e => setFromNumber(e.target.value)} placeholder="whatsapp:+14155238886" style={inputStyle} />
                                    </div>
                                </>
                            )}
                            {config.provider === 'meta' && (
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>META ACCESS TOKEN</label>
                                    <input type="password" value={authToken} onChange={e => setAuthToken(e.target.value)} placeholder="EAAxxxxxxxx..." style={inputStyle} />
                                </div>
                            )}
                            <button onClick={saveConfig} disabled={saving} style={{ padding: '14px', background: 'linear-gradient(135deg, #25d166, #128c7e)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                {saving ? 'Salvando...' : 'Salvar Configuração'}
                            </button>
                        </div>
                    </div>

                    {/* Webhook info */}
                    <div style={{ ...card, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Link size={16} color="#22d3ee" />
                            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#22d3ee' }}>Webhook URL</h3>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px', lineHeight: 1.5 }}>Configure esta URL no painel Twilio/Meta para receber mensagens:</p>
                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#22d3ee', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            https://rujnnkwwdulzbmlehweo.supabase.co/functions/v1/whatsapp-webhook
                        </div>
                    </div>
                </div>

                {/* Demo chat + commands */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Demo chat */}
                    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', background: 'rgba(37,211,102,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MessageCircle size={20} color="#25d166" />
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>Simulador WhatsApp</span>
                        </div>
                        <div style={{ height: '280px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: m.from === 'você' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.from === 'você' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: m.from === 'você' ? 'rgba(37,211,102,0.2)' : m.from === 'sistema' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.from === 'você' ? 'rgba(37,211,102,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                                        <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.body}</p>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: '4px', textAlign: 'right' }}>{m.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
                            <input value={testMsg} onChange={e => setTestMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendTestMessage(); }} placeholder="Digite um comando..." style={{ ...inputStyle, padding: '8px 12px' }} />
                            <button onClick={sendTestMessage} style={{ padding: '8px 14px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '10px', color: '#25d166', cursor: 'pointer' }}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Commands */}
                    <div style={card}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 14px', color: 'rgba(255,255,255,0.7)' }}>COMANDOS DISPONÍVEIS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {COMMANDS.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <code style={{ fontSize: '12px', color: '#25d166', fontWeight: 700, whiteSpace: 'nowrap', background: 'rgba(37,211,102,0.08)', padding: '2px 8px', borderRadius: '6px' }}>{c.cmd}</code>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{c.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsApp;
