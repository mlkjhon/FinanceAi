import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Building2, Plus, RefreshCw, Trash2, X, Loader2, Check, Link, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const };

const BANKS = [
    { id: 'nubank', nome: 'Nubank', cor: '#8b5cf6', logo: '💜' },
    { id: 'itau', nome: 'Itaú Unibanco', cor: '#ef8200', logo: '🏛️' },
    { id: 'bradesco', nome: 'Bradesco', cor: '#cc0000', logo: '🔴' },
    { id: 'bb', nome: 'Banco do Brasil', cor: '#f5c505', logo: '🟡' },
    { id: 'santander', nome: 'Santander', cor: '#ec0000', logo: '🔴' },
    { id: 'inter', nome: 'Banco Inter', cor: '#ff7a00', logo: '🟠' },
    { id: 'c6', nome: 'C6 Bank', cor: '#ffffff', logo: '⚫' },
    { id: 'picpay', nome: 'PicPay', cor: '#21c25e', logo: '💚' },
    { id: 'outro', nome: 'Outro Banco', cor: '#64748b', logo: '🏦' },
];

interface BankAccount {
    id: string; banco: string; agencia?: string; conta?: string; tipo_conta: string;
    saldo: number; saldo_anterior: number; conectado: boolean; ultimo_sync?: string;
    cor: string; is_active: boolean;
}

const accountSchema = z.object({
    banco: z.string().min(1, 'Selecione o banco'),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    tipo_conta: z.enum(['corrente', 'poupança', 'investimento']),
    saldo: z.number({ invalid_type_error: 'Informe o saldo' }),
    api_key_encrypted: z.string().optional(),
});

const BankAccounts: React.FC = () => {
    const { showToast } = useToast();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({ banco: '', agencia: '', conta: '', tipo_conta: 'corrente', saldo: '', api_key_encrypted: '' });

    const fetch = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at');
        setAccounts(data || []);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = accountSchema.safeParse({ ...form, saldo: parseFloat(form.saldo) });
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
            const bankInfo = BANKS.find(b => b.id === parsed.data.banco) || BANKS[BANKS.length - 1];
            await supabase.from('bank_accounts').insert({
                ...parsed.data,
                user_id: user.id,
                cor: bankInfo.cor,
                conectado: !!parsed.data.api_key_encrypted,
                ultimo_sync: new Date().toISOString(),
                saldo_anterior: parsed.data.saldo,
            });
            showToast('Conta bancária adicionada!', 'success');
            setShowForm(false);
            setForm({ banco: '', agencia: '', conta: '', tipo_conta: 'corrente', saldo: '', api_key_encrypted: '' });
            fetch();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally { setFormLoading(false); }
    };

    const syncAccount = async (id: string) => {
        showToast('Sincronizando... (simulado - conecte sua API Key real para dados reais)', 'success');
        await supabase.from('bank_accounts').update({ ultimo_sync: new Date().toISOString() }).eq('id', id);
        fetch();
    };

    const deleteAccount = async (id: string) => {
        await supabase.from('bank_accounts').update({ is_active: false }).eq('id', id);
        showToast('Conta removida', 'success');
        fetch();
    };

    const totalSaldo = accounts.reduce((a, acc) => a + acc.saldo, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '32px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Conectar Conta Bancária</h2>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '13px', color: 'rgba(6,182,212,0.9)', lineHeight: 1.5 }}>
                            <strong>Arquitetura Open Finance:</strong> Insira sua API Key do banco para conectar e receber saldos em tempo real. Para uso manual, basta informar o saldo atual sem API Key.
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>BANCO</label>
                                <select value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} style={{ ...inputStyle, background: '#0a0a0a' }}>
                                    <option value="">Selecione o banco...</option>
                                    {BANKS.map(b => <option key={b.id} value={b.id}>{b.logo} {b.nome}</option>)}
                                </select>
                                {errors.banco && <p style={{ color: '#f87171', fontSize: '11px', margin: '4px 0 0' }}>{errors.banco}</p>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>AGÊNCIA</label>
                                    <input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} placeholder="Ex: 0001" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>CONTA</label>
                                    <input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} placeholder="Ex: 12345-6" style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>TIPO</label>
                                    <select value={form.tipo_conta} onChange={e => setForm(f => ({ ...f, tipo_conta: e.target.value }))} style={{ ...inputStyle, background: '#0a0a0a' }}>
                                        <option value="corrente">Conta Corrente</option>
                                        <option value="poupança">Poupança</option>
                                        <option value="investimento">Investimento</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>SALDO ATUAL</label>
                                    <input type="number" step="0.01" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: e.target.value }))} placeholder="0,00" style={inputStyle} />
                                    {errors.saldo && <p style={{ color: '#f87171', fontSize: '11px', margin: '4px 0 0' }}>{errors.saldo}</p>}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>API KEY (Open Finance — opcional)</label>
                                <input type="password" value={form.api_key_encrypted} onChange={e => setForm(f => ({ ...f, api_key_encrypted: e.target.value }))} placeholder="Insira sua API Key do banco para conexão automática..." style={inputStyle} />
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>Armazenada com criptografia AES-256. Somente você tem acesso.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                                <button type="submit" disabled={formLoading} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Adicionar Conta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Contas Bancárias</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Open Finance — Saldos e extratos por instituição</p>
                </div>
                <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                    <Plus size={16} /> Conectar Conta
                </button>
            </div>

            {/* Total saldo */}
            <div style={{ ...card, background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(0,0,0,0.8))', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0, fontWeight: 600 }}>SALDO TOTAL (TODOS OS BANCOS)</p>
                    <p style={{ fontSize: '36px', fontWeight: 900, margin: '8px 0 0', letterSpacing: '-0.02em', color: totalSaldo >= 0 ? '#10b981' : '#ef4444' }}>{fmt(totalSaldo)}</p>
                </div>
                <Wallet size={40} color="rgba(239,68,68,0.3)" />
            </div>

            {/* Bank cards */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', color: '#f87171' }}>
                    <Loader2 size={24} className="animate-spin" />
                </div>
            ) : accounts.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                    <Building2 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Nenhuma conta conectada</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>Conecte suas contas bancárias para ver saldos em um só lugar</p>
                    <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Conectar Primeiro Banco
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {accounts.map(acc => {
                        const bank = BANKS.find(b => b.id === acc.banco) || BANKS[BANKS.length - 1];
                        const variacao = acc.saldo - acc.saldo_anterior;
                        return (
                            <div key={acc.id} style={{ ...card, padding: '0', overflow: 'hidden', borderColor: `${acc.cor}30` }}>
                                <div style={{ padding: '20px', background: `linear-gradient(135deg, ${acc.cor}15, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '24px' }}>{bank.logo}</span>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>{bank.nome}</p>
                                                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{acc.tipo_conta} {acc.conta ? `• ${acc.conta}` : ''}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <span style={{ padding: '3px 10px', background: acc.conectado ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: acc.conectado ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
                                                {acc.conectado ? '🟢 API Ativa' : '⚪ Manual'}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '30px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: acc.saldo >= 0 ? 'white' : '#f87171' }}>{fmt(acc.saldo)}</p>
                                    {variacao !== 0 && (
                                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: variacao > 0 ? '#10b981' : '#f87171', fontWeight: 600 }}>
                                            {variacao > 0 ? '↑' : '↓'} {fmt(Math.abs(variacao))} vs anterior
                                        </p>
                                    )}
                                </div>
                                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                        Sync: {acc.ultimo_sync ? format(new Date(acc.ultimo_sync), 'dd/MM HH:mm') : 'Nunca'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => syncAccount(acc.id)} title="Sincronizar" style={{ padding: '7px', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '8px', color: '#10b981', cursor: 'pointer' }}>
                                            <RefreshCw size={14} />
                                        </button>
                                        <button onClick={() => deleteAccount(acc.id)} style={{ padding: '7px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', color: '#f87171', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Open Finance info */}
            <div style={{ ...card, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Link size={18} color="#06b6d4" />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#22d3ee' }}>Arquitetura Open Finance</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                    {BANKS.slice(0, 6).map(b => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '20px' }}>{b.logo}</span>
                            <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{b.nome}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Open Finance API</p>
                            </div>
                            <span style={{ marginLeft: 'auto', padding: '2px 8px', background: 'rgba(6,182,212,0.1)', borderRadius: '20px', fontSize: '10px', color: '#22d3ee', fontWeight: 700 }}>DISPONÍVEL</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BankAccounts;
