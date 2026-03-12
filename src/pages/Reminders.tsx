import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Plus, Check, Clock, AlertTriangle, Trash2, Pencil, X, Bell, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Inter', sans-serif" };

const reminderSchema = z.object({
    titulo: z.string().min(2).max(100),
    valor: z.number().positive('Valor deve ser positivo'),
    data_vencimento: z.string().min(1, 'Informe a data'),
    recorrencia: z.enum(['unica', 'semanal', 'mensal', 'anual']).default('unica'),
    descricao: z.string().max(500).optional(),
});

interface Reminder {
    id: string; titulo: string; valor: number; data_vencimento: string;
    status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'; recorrencia: string;
    descricao?: string; notificado: boolean;
}

const Reminders: React.FC = () => {
    const { showToast } = useToast();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Reminder | null>(null);
    const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'pago' | 'atrasado'>('todos');
    const [formLoading, setFormLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({ titulo: '', valor: '', data_vencimento: '', recorrencia: 'mensal', descricao: '' });

    const fetch = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Auto-update overdue status
        await supabase.from('payment_reminders')
            .update({ status: 'atrasado' })
            .eq('user_id', user.id)
            .eq('status', 'pendente')
            .lt('data_vencimento', new Date().toISOString().split('T')[0]);

        const { data } = await supabase.from('payment_reminders').select('*').eq('user_id', user.id).order('data_vencimento', { ascending: true });
        setReminders(data || []);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = reminderSchema.safeParse({ ...form, valor: parseFloat(form.valor) });
        if (!parsed.success) {
            const errs: Record<string, string> = {};
            parsed.error.errors.forEach(er => { errs[er.path[0] as string] = er.message; });
            setErrors(errs);
            return;
        }
        setFormLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (editing) {
                await supabase.from('payment_reminders').update({ ...parsed.data }).eq('id', editing.id);
                showToast('Lembrete atualizado!', 'success');
            } else {
                await supabase.from('payment_reminders').insert({ ...parsed.data, user_id: user.id, status: 'pendente' });
                showToast('Lembrete criado!', 'success');
            }
            setShowForm(false); setEditing(null);
            setForm({ titulo: '', valor: '', data_vencimento: '', recorrencia: 'mensal', descricao: '' });
            fetch();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally { setFormLoading(false); }
    };

    const markPaid = async (id: string) => {
        await supabase.from('payment_reminders').update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] }).eq('id', id);
        showToast('Marcado como pago!', 'success');
        fetch();
    };

    const deleteReminder = async (id: string) => {
        await supabase.from('payment_reminders').delete().eq('id', id);
        showToast('Lembrete excluído', 'success');
        fetch();
    };

    const filtered = reminders.filter(r => filterStatus === 'todos' || r.status === filterStatus);
    const pending = reminders.filter(r => r.status === 'pendente');
    const overdue = reminders.filter(r => r.status === 'atrasado');
    const totalPending = pending.reduce((a, r) => a + r.valor, 0);

    const statusColor = (s: string) => ({ pendente: '#f59e0b', pago: '#10b981', atrasado: '#ef4444', cancelado: 'rgba(255,255,255,0.3)' }[s] || 'white');
    const statusIcon = (s: string) => ({ pendente: <Clock size={14} />, pago: <Check size={14} />, atrasado: <AlertTriangle size={14} />, cancelado: <X size={14} /> }[s]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{editing ? 'Editar' : 'Novo'} Lembrete</h2>
                            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>TÍTULO</label>
                                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Aluguel, Conta de luz..." style={inputStyle} />
                                {errors.titulo && <p style={{ color: '#f87171', fontSize: '11px', margin: '4px 0 0' }}>{errors.titulo}</p>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>VALOR</label>
                                    <input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" style={inputStyle} />
                                    {errors.valor && <p style={{ color: '#f87171', fontSize: '11px', margin: '4px 0 0' }}>{errors.valor}</p>}
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>VENCIMENTO</label>
                                    <input type="date" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>RECORRÊNCIA</label>
                                <select value={form.recorrencia} onChange={e => setForm(f => ({ ...f, recorrencia: e.target.value }))} style={{ ...inputStyle, background: '#0a0a0a' }}>
                                    <option value="unica">Única vez</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="mensal">Mensal</option>
                                    <option value="anual">Anual</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>DESCRIÇÃO (opcional)</label>
                                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                                <button type="submit" disabled={formLoading} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                                    {editing ? 'Atualizar' : 'Criar Lembrete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Lembretes</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Controle de contas a pagar e vencimentos</p>
                </div>
                <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                    <Plus size={16} /> Novo Lembrete
                </button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {[
                    { label: 'A Vencer', value: pending.length.toString(), sub: fmt(totalPending), color: '#f59e0b' },
                    { label: 'Em Atraso', value: overdue.length.toString(), sub: fmt(overdue.reduce((a, r) => a + r.valor, 0)), color: '#ef4444' },
                    { label: 'Pagos Este Mês', value: reminders.filter(r => r.status === 'pago').length.toString(), color: '#10b981' },
                    { label: 'Total de Lembretes', value: reminders.length.toString(), color: '#8b5cf6' },
                ].map((k, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 6px', fontWeight: 600 }}>{k.label}</p>
                        <p style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: k.color }}>{k.value}</p>
                        {k.sub && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontWeight: 600 }}>{k.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3px', width: 'fit-content' }}>
                {(['todos', 'pendente', 'atrasado', 'pago'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 16px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.2s', background: filterStatus === s ? 'rgba(239,68,68,0.2)' : 'transparent', color: filterStatus === s ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Reminders list */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', color: '#f87171' }}>
                    <Loader2 size={24} className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                    <Bell size={40} style={{ marginBottom: '12px', opacity: 0.3, color: 'rgba(255,255,255,0.5)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nenhum lembrete {filterStatus !== 'todos' ? `"${filterStatus}"` : ''} encontrado</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map(r => {
                        const venc = new Date(r.data_vencimento + 'T00:00:00');
                        const daysLeft = differenceInDays(venc, new Date());
                        const isOverdue = r.status === 'atrasado';
                        return (
                            <div key={r.id} style={{ ...card, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderColor: isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${statusColor(r.status)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor(r.status), flexShrink: 0 }}>
                                    {statusIcon(r.status)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>{r.titulo}</p>
                                        <span style={{ padding: '3px 10px', background: `${statusColor(r.status)}20`, borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: statusColor(r.status) }}>
                                            {r.status.toUpperCase()}
                                        </span>
                                        {r.recorrencia !== 'unica' && (
                                            <span style={{ padding: '3px 10px', background: 'rgba(139,92,246,0.1)', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>
                                                {r.recorrencia}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Vence em {format(venc, "dd 'de' MMMM", { locale: ptBR })}
                                        {r.status === 'pendente' && ` (${daysLeft >= 0 ? `em ${daysLeft} dias` : `há ${Math.abs(daysLeft)} dias`})`}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: r.status === 'pago' ? '#10b981' : isOverdue ? '#ef4444' : 'white' }}>{fmt(r.valor)}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {r.status === 'pendente' && (
                                        <button onClick={() => markPaid(r.id)} title="Marcar como pago" style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '10px', color: '#10b981', cursor: 'pointer' }}>
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => { setEditing(r); setForm({ titulo: r.titulo, valor: r.valor.toString(), data_vencimento: r.data_vencimento, recorrencia: r.recorrencia, descricao: r.descricao || '' }); setShowForm(true); }} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '10px', color: '#f87171', cursor: 'pointer' }}>
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => deleteReminder(r.id)} style={{ padding: '8px', background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: '10px', color: '#f43f5e', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
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

export default Reminders;
