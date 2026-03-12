import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import {
    Plus, Search, Filter, Trash2, Pencil, X, Upload, Check,
    Tag, Calendar, ArrowUpRight, ArrowDownRight, Loader2,
    ChevronDown, Paperclip
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { format } from 'date-fns';

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const transactionSchema = z.object({
    tipo: z.enum(['gasto', 'ganho']),
    valor: z.number({ invalid_type_error: 'Informe um valor' }).positive('Valor deve ser maior que zero'),
    descricao: z.string().min(2, 'Descrição inválida').max(200),
    data: z.string().min(1, 'Informe a data'),
    category_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
    recorrencia: z.enum(['unica', 'semanal', 'mensal', 'anual']).default('unica'),
    notes: z.string().max(500).optional(),
});

const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Inter', sans-serif" };
const labelStyle = { fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' };

interface Transaction {
    id: string; tipo: 'gasto' | 'ganho'; valor: number; descricao: string;
    data: string; category_id: string | null; categories?: any; tags: string[];
    recorrencia: string; comprovante_url: string | null; notes: string | null;
}

interface Category { id: string; nome: string; tipo: string; cor: string; }

const TransactionForm: React.FC<{
    onClose: () => void; onSaved: () => void; categories: Category[]; editing?: Transaction | null;
}> = ({ onClose, onSaved, categories, editing }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        tipo: editing?.tipo || 'gasto' as 'gasto' | 'ganho',
        valor: editing?.valor?.toString() || '',
        descricao: editing?.descricao || '',
        data: editing?.data || new Date().toISOString().split('T')[0],
        category_id: editing?.category_id || '',
        tags: editing?.tags || [] as string[],
        recorrencia: editing?.recorrencia || 'unica' as 'unica' | 'semanal' | 'mensal' | 'anual',
        notes: editing?.notes || '',
    });

    const filteredCategories = categories.filter(c => c.tipo === form.tipo);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = transactionSchema.safeParse({ ...form, valor: parseFloat(form.valor) });
        if (!parsed.success) {
            const errs: Record<string, string> = {};
            parsed.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
            setErrors(errs);
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Não autenticado');

            let comprovante_url = editing?.comprovante_url || null;
            if (file) {
                const path = `${user.id}/${Date.now()}_${file.name}`;
                const { error: uploadErr } = await supabase.storage.from('comprovantes').upload(path, file);
                if (!uploadErr) {
                    const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(path);
                    comprovante_url = urlData.publicUrl;
                }
            }

            const payload = { ...parsed.data, user_id: user.id, comprovante_url, category_id: form.category_id || null, tags: form.tags };

            if (editing) {
                const { error } = await supabase.from('transactions').update(payload).eq('id', editing.id);
                if (error) throw error;
                showToast('Transação atualizada!', 'success');
            } else {
                const { error } = await supabase.from('transactions').insert(payload);
                if (error) throw error;
                showToast('Transação criada!', 'success');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !form.tags.includes(tag)) {
            setForm(f => ({ ...f, tags: [...f.tags, tag] }));
            setTagInput('');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ ...card, maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{editing ? 'Editar' : 'Nova'} Transação</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Tipo toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
                        {(['gasto', 'ganho'] as const).map(t => (
                            <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t, category_id: '' }))} style={{
                                flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
                                background: form.tipo === t ? (t === 'gasto' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') : 'transparent',
                                color: form.tipo === t ? (t === 'gasto' ? '#f87171' : '#34d399') : 'rgba(255,255,255,0.4)',
                            }}>
                                {t === 'gasto' ? '↓ Despesa' : '↑ Receita'}
                            </button>
                        ))}
                    </div>

                    {/* Row: valor + data */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>VALOR (R$)</label>
                            <input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} style={{ ...inputStyle, borderColor: errors.valor ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }} />
                            {errors.valor && <p style={{ color: '#f87171', fontSize: '11px', margin: '4px 0 0' }}>{errors.valor}</p>}
                        </div>
                        <div>
                            <label style={labelStyle}>DATA</label>
                            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label style={labelStyle}>DESCRIÇÃO</label>
                        <input placeholder="Ex: Supermercado Extra" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ ...inputStyle, borderColor: errors.descricao ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }} />
                        {errors.descricao && <p style={{ color: '#f87171', fontSize: '11px', margin: '4px 0 0' }}>{errors.descricao}</p>}
                    </div>

                    {/* Row: categoria + recorrência */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>CATEGORIA</label>
                            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={{ ...inputStyle, background: '#0a0a0a' }}>
                                <option value="">Sem categoria</option>
                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>RECORRÊNCIA</label>
                            <select value={form.recorrencia} onChange={e => setForm(f => ({ ...f, recorrencia: e.target.value as any }))} style={{ ...inputStyle, background: '#0a0a0a' }}>
                                <option value="unica">Única</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensal">Mensal</option>
                                <option value="anual">Anual</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label style={labelStyle}>TAGS</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input placeholder="Ex: mercado, lazer..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} style={{ ...inputStyle, flex: 1 }} />
                            <button type="button" onClick={addTag} style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', cursor: 'pointer' }}>
                                <Plus size={16} />
                            </button>
                        </div>
                        {form.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {form.tags.map(tag => (
                                    <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', fontSize: '12px', color: '#f87171' }}>
                                        #{tag}
                                        <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px', display: 'flex' }}>
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Comprovante upload */}
                    <div>
                        <label style={labelStyle}>COMPROVANTE (opcional)</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                            <Paperclip size={16} />
                            {file ? file.name : editing?.comprovante_url ? 'Comprovante anexado' : 'Clique para anexar arquivo'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    {/* Notas */}
                    <div>
                        <label style={labelStyle}>NOTAS (opcional)</label>
                        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações adicionais..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
                    </div>

                    {/* Submit */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {loading ? 'Salvando...' : editing ? 'Atualizar' : 'Salvar Transação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Transactions: React.FC = () => {
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [toDelete, setToDelete] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterTipo, setFilterTipo] = useState<'todos' | 'gasto' | 'ganho'>('todos');
    const [filterCat, setFilterCat] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const fetchAll = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const [tRes, cRes] = await Promise.all([
                supabase.from('transactions').select('*, categories(id, nome, tipo, cor)').eq('user_id', user.id).order('data', { ascending: false }),
                supabase.from('categories').select('*').or(`is_global.eq.true,user_id.eq.${user.id}`),
            ]);
            setTransactions(tRes.data || []);
            setCategories(cRes.data || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) { showToast('Erro ao excluir', 'error'); return; }
        showToast('Transação excluída', 'success');
        setTransactions(prev => prev.filter(t => t.id !== id));
        setToDelete(null);
    };

    const handleBulkDelete = async () => {
        for (const id of selected) {
            await supabase.from('transactions').delete().eq('id', id);
        }
        showToast(`${selected.size} transações excluídas`, 'success');
        setSelected(new Set());
        fetchAll();
    };

    const filtered = transactions.filter(t => {
        const matchSearch = !search || t.descricao.toLowerCase().includes(search.toLowerCase()) || t.categories?.nome?.toLowerCase().includes(search.toLowerCase());
        const matchTipo = filterTipo === 'todos' || t.tipo === filterTipo;
        const matchCat = !filterCat || t.category_id === filterCat;
        return matchSearch && matchTipo && matchCat;
    });

    const totais = {
        ganhos: filtered.filter(t => t.tipo === 'ganho').reduce((a, t) => a + t.valor, 0),
        gastos: filtered.filter(t => t.tipo === 'gasto').reduce((a, t) => a + t.valor, 0),
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {showForm && (
                <TransactionForm
                    onClose={() => { setShowForm(false); setEditing(null); }}
                    onSaved={fetchAll}
                    categories={categories}
                    editing={editing}
                />
            )}

            {/* Delete confirm */}
            {toDelete && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '32px', maxWidth: '380px', textAlign: 'center' }}>
                        <Trash2 size={40} color="#ef4444" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px' }}>Excluir Transação?</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>Esta ação não pode ser desfeita.</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setToDelete(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                            <button onClick={() => handleDelete(toDelete)} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Transações</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>{filtered.length} registros encontrados</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {selected.size > 0 && (
                        <button onClick={handleBulkDelete} style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Trash2 size={14} /> Excluir ({selected.size})
                        </button>
                    )}
                    <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                        <Plus size={16} /> Nova Transação
                    </button>
                </div>
            </div>

            {/* KPI mini */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {[
                    { label: 'Receitas filtradas', value: fmt(totais.ganhos), color: '#10b981' },
                    { label: 'Despesas filtradas', value: fmt(totais.gastos), color: '#ef4444' },
                    { label: 'Saldo filtrado', value: fmt(totais.ganhos - totais.gastos), color: totais.ganhos >= totais.gastos ? '#10b981' : '#ef4444' },
                ].map((k, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 6px', fontWeight: 600 }}>{k.label}</p>
                        <p style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar transações..." style={{ ...{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px 10px 36px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const } }} />
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3px', gap: '2px' }}>
                    {(['todos', 'gasto', 'ganho'] as const).map(t => (
                        <button key={t} onClick={() => setFilterTipo(t)} style={{ padding: '7px 14px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.2s', background: filterTipo === t ? 'rgba(239,68,68,0.2)' : 'transparent', color: filterTipo === t ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                    <option value="">Todas categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#f87171' }}>
                        <Loader2 size={24} className="animate-spin" /> Carregando...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        <Calendar size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Nenhuma transação encontrada</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" style={{ cursor: 'pointer' }}
                                            onChange={e => { if (e.target.checked) setSelected(new Set(filtered.map(t => t.id))); else setSelected(new Set()); }}
                                            checked={selected.size === filtered.length && filtered.length > 0}
                                        />
                                    </th>
                                    {['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'TAGS', 'RECORRÊNCIA', 'VALOR', 'AÇÕES'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: h === 'VALOR' ? 'right' : 'left', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 20px' }}>
                                            <input type="checkbox" checked={selected.has(t.id)} onChange={e => {
                                                const s = new Set(selected);
                                                if (e.target.checked) s.add(t.id); else s.delete(t.id);
                                                setSelected(s);
                                            }} style={{ cursor: 'pointer' }} />
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.tipo === 'ganho' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tipo === 'ganho' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                                                    {t.tipo === 'ganho' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{t.descricao}</p>
                                                    {t.notes && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{t.notes}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            {t.categories ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                                    <Tag size={10} style={{ color: '#f87171' }} /> {t.categories.nome}
                                                </span>
                                            ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>–</span>}
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {(t.tags || []).slice(0, 2).map((tag: string) => (
                                                    <span key={tag} style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: '20px', fontSize: '11px', color: '#f87171', fontWeight: 600 }}>#{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                            {t.recorrencia !== 'unica' ? t.recorrencia : '–'}
                                        </td>
                                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 800, color: t.tipo === 'ganho' ? '#10b981' : '#f87171' }}>
                                                {t.tipo === 'ganho' ? '+' : '-'} {fmt(t.valor)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setEditing(t); setShowForm(true); }} style={{ padding: '7px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', color: '#f87171', cursor: 'pointer' }}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => setToDelete(t.id)} style={{ padding: '7px', background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: '8px', color: '#f43f5e', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;
