import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, AlertCircle, Trash2, Check, Loader2, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };

interface Alert { id: string; tipo: string; titulo: string; mensagem: string; lida: boolean; severidade: string; created_at: string; }

const severityConfig = {
    danger: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: <AlertCircle size={18} /> },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: <AlertTriangle size={18} /> },
    info: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', icon: <Info size={18} /> },
    success: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: <CheckCircle size={18} /> },
};

const Alerts: React.FC = () => {
    const { showToast } = useToast();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [filter, setFilter] = useState<'todos' | 'nao_lidas'>('todos');

    const fetch = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        setAlerts(data || []);
        setLoading(false);
    };

    const generateSmartAlerts = async () => {
        setGenerating(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setGenerating(false); return; }

        try {
            // Fetch transactions to analyze
            const { data: txns } = await supabase.from('transactions').select('*, categories(nome)').eq('user_id', user.id).order('data', { ascending: false }).limit(100);
            const transactions = txns || [];
            const newAlerts: any[] = [];

            if (transactions.length === 0) { showToast('Adicione transações para gerar alertas', 'error'); setGenerating(false); return; }

            const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
            const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);

            // Alert 1: Gastos > receitas
            if (totalGastos > totalGanhos) {
                newAlerts.push({ user_id: user.id, tipo: 'gasto_elevado', titulo: '⚠️ Gastos acima das receitas', mensagem: `Seus gastos (R$ ${totalGastos.toFixed(2)}) estão acima das suas receitas (R$ ${totalGanhos.toFixed(2)}). Revise suas despesas urgentemente.`, severidade: 'danger' });
            }

            // Alert 2: Categoria dominante
            const gastosPorCat = transactions.filter(t => t.tipo === 'gasto').reduce((acc: any, t: any) => {
                const c = t.categories?.nome || 'Outros';
                acc[c] = (acc[c] || 0) + t.valor;
                return acc;
            }, {});
            Object.entries(gastosPorCat).forEach(([cat, val]) => {
                if (totalGastos > 0 && (val as number) / totalGastos > 0.45) {
                    newAlerts.push({ user_id: user.id, tipo: 'gasto_elevado', titulo: `📊 Alto gasto em ${cat}`, mensagem: `A categoria "${cat}" representa ${Math.round(((val as number) / totalGastos) * 100)}% dos seus gastos totais (R$ ${(val as number).toFixed(2)}). Considere revisar.`, severidade: 'warning' });
                }
            });

            // Alert 3: Duplicate charges detection
            const descriptions = transactions.filter(t => t.tipo === 'gasto').map(t => t.descricao?.toLowerCase().trim());
            const dupes = descriptions.filter((d, i) => descriptions.indexOf(d) !== i);
            if (dupes.length > 0) {
                const uniqueDupes = [...new Set(dupes)];
                newAlerts.push({ user_id: user.id, tipo: 'cobranca_duplicada', titulo: '🔁 Cobranças possivelmente duplicadas', mensagem: `Detectamos lançamentos repetidos: "${uniqueDupes.slice(0, 2).join('", "')}". Verifique se não há cobranças duplas.`, severidade: 'warning' });
            }

            // Alert 4: Economy rate
            const taxaEcon = totalGanhos > 0 ? ((totalGanhos - totalGastos) / totalGanhos) * 100 : 0;
            if (taxaEcon >= 20) {
                newAlerts.push({ user_id: user.id, tipo: 'sistema', titulo: '🎉 Ótima taxa de economia!', mensagem: `Você está economizando ${taxaEcon.toFixed(1)}% da sua renda. Continue assim! A meta ideal é acima de 20%.`, severidade: 'success' });
            } else if (taxaEcon < 10 && totalGanhos > 0) {
                newAlerts.push({ user_id: user.id, tipo: 'variacao_atipica', titulo: '📉 Taxa de economia baixa', mensagem: `Você está economizando apenas ${taxaEcon.toFixed(1)}% da renda. Tente aumentar para pelo menos 20%.`, severidade: 'warning' });
            }

            if (newAlerts.length > 0) {
                await supabase.from('alerts').insert(newAlerts);
                showToast(`${newAlerts.length} alertas gerados!`, 'success');
            } else {
                showToast('Nenhum alerta detectado — suas finanças estão saudáveis!', 'success');
            }
            fetch();
        } catch (err) {
            showToast('Erro ao gerar alertas', 'error');
        } finally { setGenerating(false); }
    };

    useEffect(() => { fetch(); }, []);

    const markRead = async (id: string) => {
        await supabase.from('alerts').update({ lida: true }).eq('id', id);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, lida: true } : a));
    };

    const markAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('alerts').update({ lida: true }).eq('user_id', user.id);
        setAlerts(prev => prev.map(a => ({ ...a, lida: true })));
        showToast('Todos marcados como lidos', 'success');
    };

    const deleteAlert = async (id: string) => {
        await supabase.from('alerts').delete().eq('id', id);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const filtered = filter === 'nao_lidas' ? alerts.filter(a => !a.lida) : alerts;
    const unread = alerts.filter(a => !a.lida).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Alertas</h1>
                        {unread > 0 && <span style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.2)', borderRadius: '20px', fontSize: '13px', fontWeight: 700, color: '#f87171' }}>{unread} novos</span>}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Notificações inteligentes sobre seus gastos</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {unread > 0 && (
                        <button onClick={markAllRead} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} /> Marcar todos lidos
                        </button>
                    )}
                    <button onClick={generateSmartAlerts} disabled={generating} style={{ padding: '10px 20px', background: generating ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {generating ? 'Analisando...' : 'Gerar Alertas IA'}
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3px', width: 'fit-content' }}>
                {[{ k: 'todos', l: 'Todos' }, { k: 'nao_lidas', l: 'Não lidas' }].map(({ k, l }) => (
                    <button key={k} onClick={() => setFilter(k as any)} style={{ padding: '8px 16px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: filter === k ? 'rgba(239,68,68,0.2)' : 'transparent', color: filter === k ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                        {l}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', color: '#f87171' }}>
                    <Loader2 size={24} className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                    <Bell size={40} style={{ marginBottom: '12px', opacity: 0.3, color: 'rgba(255,255,255,0.5)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Nenhum alerta por enquanto</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>Clique em "Gerar Alertas IA" para analisar seus dados</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map(a => {
                        const sev = severityConfig[a.severidade as keyof typeof severityConfig] || severityConfig.info;
                        return (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '18px 20px', borderRadius: '16px', background: a.lida ? 'rgba(255,255,255,0.01)' : sev.bg, border: `1px solid ${a.lida ? 'rgba(255,255,255,0.06)' : sev.border}`, transition: 'all 0.2s', opacity: a.lida ? 0.6 : 1 }}>
                                <div style={{ color: sev.color, flexShrink: 0, marginTop: '2px' }}>{sev.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: a.lida ? 'rgba(255,255,255,0.6)' : 'white' }}>{a.titulo}</p>
                                        {!a.lida && <span style={{ width: '6px', height: '6px', background: sev.color, borderRadius: '50%', display: 'inline-block' }} />}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{a.mensagem}</p>
                                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                        {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {!a.lida && (
                                        <button onClick={() => markRead(a.id)} title="Marcar como lida" style={{ padding: '6px', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '8px', color: '#10b981', cursor: 'pointer' }}>
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteAlert(a.id)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', color: '#f87171', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Alerts;
