import React, { useState, useEffect } from 'react';
import {
    FileSpreadsheet, Download, Upload, Plus, Trash2, Check,
    Search, Filter, Calendar, Save, Loader2, RefreshCw
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { useToast } from './components/Toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };
const inputBase = { background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif" };

interface Row {
    id: string; date: string; description: string;
    category: string; type: 'gasto' | 'ganho'; amount: string; isNew?: boolean; isModified?: boolean;
}

const Spreadsheet: React.FC = () => {
    const { showToast } = useToast();
    const [rows, setRows] = useState<Row[]>([]);
    const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'todos' | 'gasto' | 'ganho'>('todos');
    const [hasChanges, setHasChanges] = useState(false);

    const fetch = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [tRes, cRes] = await Promise.all([
            supabase.from('transactions').select('*, categories(nome)').eq('user_id', user.id).order('data', { ascending: false }),
            supabase.from('categories').select('id, nome').or(`is_global.eq.true,user_id.eq.${user.id}`),
        ]);
        const txns = (tRes.data || []).map(t => ({
            id: t.id,
            date: t.data,
            description: t.descricao,
            category: t.categories?.nome || '',
            type: t.tipo as 'gasto' | 'ganho',
            amount: t.valor.toString(),
            isModified: false,
        }));
        setRows(txns);
        setCategories(cRes.data || []);
        setHasChanges(false);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const addRow = () => {
        const newRow: Row = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            description: '', category: '', type: 'gasto', amount: '0', isNew: true, isModified: true,
        };
        setRows([newRow, ...rows]);
        setHasChanges(true);
    };

    const updateRow = (id: string, field: keyof Row, val: string) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val, isModified: true } : r));
        setHasChanges(true);
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(r => r.id !== id));
        setHasChanges(true);
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const toUpsert = rows.filter(r => r.isModified || r.isNew).map(r => {
                const c = categories.find(cat => cat.nome === r.category);
                return {
                    id: r.isNew ? undefined : r.id,
                    user_id: user.id,
                    data: r.date,
                    descricao: r.description || 'Sem descrição',
                    category_id: c?.id || null,
                    tipo: r.type,
                    valor: parseFloat(r.amount) || 0,
                };
            });

            if (toUpsert.length > 0) {
                const { error } = await supabase.from('transactions').upsert(toUpsert);
                if (error) throw error;
                showToast(`${toUpsert.length} alterações salvas!`, 'success');
                fetch();
            } else {
                showToast('Nenhuma alteração para salvar.', 'info');
            }
        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const exportData = () => {
        const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
            Data: r.date, Tipo: r.type === 'gasto' ? 'Despesa' : 'Receita', Descrição: r.description,
            Categoria: r.category, Valor: parseFloat(r.amount) || 0
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Planilha Principal');
        XLSX.writeFile(wb, `FinanceAI_Planilha_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const filteredRows = rows.filter(r => {
        const matchSearch = !search || r.description.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'todos' || r.type === filterType;
        return matchSearch && matchType;
    });

    const totalFiltered = filteredRows.reduce((a, r) => r.type === 'ganho' ? a + (parseFloat(r.amount) || 0) : a - (parseFloat(r.amount) || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileSpreadsheet size={28} color="#ef4444" /> Planilha Interativa
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Edição em massa estilo Excel (Salva automaticamente no banco)</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={exportData} style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#34d399', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Exportar Excel
                    </button>
                    <button onClick={saveChanges} disabled={!hasChanges || saving} style={{ padding: '8px 16px', background: !hasChanges ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '10px', color: !hasChanges ? 'rgba(255,255,255,0.3)' : 'white', cursor: !hasChanges || saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Salvo'}
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px 8px 34px', color: 'white', fontSize: '13px', outline: 'none' }} />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                        <option value="todos">Todos os tipos</option>
                        <option value="gasto">Apenas Despesas</option>
                        <option value="ganho">Apenas Receitas</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                        Saldo exibido: <strong style={{ color: totalFiltered >= 0 ? '#10b981' : '#f87171' }}>{fmt(totalFiltered)}</strong>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                    <button onClick={addRow} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={14} /> Nova Linha
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#f87171', gap: '10px' }}>
                        <Loader2 size={24} className="animate-spin" /> Carregando planilha...
                    </div>
                ) : (
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#111', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <tr>
                                    <th style={{ padding: '10px 16px', textAlign: 'center', width: '40px', color: 'rgba(255,255,255,0.3)' }}>#</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', width: '140px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>DATA</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>DESCRIÇÃO</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', width: '200px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>CATEGORIA</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'center', width: '120px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>TIPO</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'right', width: '160px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>VALOR (R$)</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'center', width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                            Nenhuma linha encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, i) => {
                                        const cellStyle = { padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)' };
                                        const inputP = { ...inputBase, padding: '4px 8px', borderRadius: '4px', background: 'transparent' };
                                        return (
                                            <tr key={row.id} style={{
                                                background: row.isNew ? 'rgba(16,185,129,0.05)' : row.isModified ? 'rgba(245,158,11,0.05)' : 'transparent',
                                                transition: 'background 0.2s',
                                            }} onFocus={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onBlur={e => e.currentTarget.style.background = row.isNew ? 'rgba(16,185,129,0.05)' : row.isModified ? 'rgba(245,158,11,0.05)' : 'transparent'}>
                                                <td style={{ ...cellStyle, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>{i + 1}</td>
                                                <td style={cellStyle}>
                                                    <input type="date" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)} style={{ ...inputP, colorScheme: 'dark' }} />
                                                </td>
                                                <td style={cellStyle}>
                                                    <input value={row.description} onChange={e => updateRow(row.id, 'description', e.target.value)} placeholder="Descrição..." style={inputP} />
                                                </td>
                                                <td style={cellStyle}>
                                                    <input value={row.category} onChange={e => updateRow(row.id, 'category', e.target.value)} placeholder="Categoria..." list="cats" style={inputP} />
                                                    <datalist id="cats">{categories.map(c => <option key={c.id} value={c.nome} />)}</datalist>
                                                </td>
                                                <td style={{ ...cellStyle, textAlign: 'center' }}>
                                                    <select value={row.type} onChange={e => updateRow(row.id, 'type', e.target.value)} style={{ ...inputP, textAlign: 'center', color: row.type === 'ganho' ? '#34d399' : '#f87171', fontWeight: 700, appearance: 'none', cursor: 'pointer' }}>
                                                        <option value="gasto">Despesa</option>
                                                        <option value="ganho">Receita</option>
                                                    </select>
                                                </td>
                                                <td style={cellStyle}>
                                                    <input type="number" step="0.01" value={row.amount} onChange={e => updateRow(row.id, 'amount', e.target.value)} placeholder="0.00" style={{ ...inputP, textAlign: 'right', fontWeight: 700, color: row.type === 'ganho' ? '#34d399' : '#f87171' }} />
                                                </td>
                                                <td style={{ ...cellStyle, textAlign: 'center', borderRight: 'none' }}>
                                                    <button onClick={() => removeRow(row.id)} title="Remover linha" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '4px' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ padding: '8px 16px', background: '#111', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{filteredRows.length} linhas</span>
                    <span>Shift+Tab / Tab para navegar entre células</span>
                </div>
            </div>
        </div>
    );
};

export default Spreadsheet;
