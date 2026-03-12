import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { BarChart3, Download, FileText, PieChart as PieIcon, TrendingUp, Loader2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981'];
const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 6px' }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.fill || p.stroke || p.color, margin: '3px 0', fontSize: '13px', fontWeight: 700 }}>
                    {p.name}: {fmt(p.value)}
                </p>
            ))}
        </div>
    );
};

const Reports: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('6m');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('transactions').select('*, categories(nome, cor, tipo)').eq('user_id', user.id).order('data', { ascending: false });
            setTransactions(data || []);
            setLoading(false);
        })();
    }, []);

    const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;

    const monthlyData = Array.from({ length: months }, (_, i) => {
        const date = subMonths(new Date(), months - 1 - i);
        const ms = startOfMonth(date).toISOString().split('T')[0];
        const me = endOfMonth(date).toISOString().split('T')[0];
        const label = format(date, months <= 6 ? 'MMM/yy' : 'MM/yy', { locale: ptBR });
        const ganhos = transactions.filter(t => t.tipo === 'ganho' && t.data >= ms && t.data <= me).reduce((a: number, t: any) => a + t.valor, 0);
        const gastos = transactions.filter(t => t.tipo === 'gasto' && t.data >= ms && t.data <= me).reduce((a: number, t: any) => a + t.valor, 0);
        return { mes: label, Receitas: ganhos, Despesas: gastos, Saldo: ganhos - gastos };
    });

    const gastosPorCat = transactions.filter(t => t.tipo === 'gasto').reduce((acc: any, t: any) => {
        const nome = t.categories?.nome || 'Outros';
        acc[nome] = (acc[nome] || 0) + t.valor;
        return acc;
    }, {});

    const pieData = Object.entries(gastosPorCat).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value: value as number }));

    let acumulado = 0;
    const patrimonioData = monthlyData.map(m => { acumulado += m.Saldo; return { mes: m.mes, Patrimônio: acumulado }; });

    const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
    const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Data: t.data,
            Tipo: t.tipo,
            Descrição: t.descricao,
            Categoria: t.categories?.nome || 'Sem categoria',
            Valor: t.valor,
            Tags: (t.tags || []).join(', '),
            Recorrência: t.recorrencia,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transações');
        // Monthly summary
        const wsSummary = XLSX.utils.json_to_sheet(monthlyData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Mensal');
        XLSX.writeFile(wb, `FinanceAI_Relatorio_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const exportCSV = () => {
        const header = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Tags'];
        const rows = transactions.map(t => [t.data, t.tipo, t.descricao, t.categories?.nome || 'Sem categoria', t.valor, (t.tags || []).join('|')]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `FinanceAI_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#f87171' }}>
            <Loader2 size={24} className="animate-spin" /> Carregando relatórios...
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Relatórios</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Visualizações completas da sua vida financeira</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Period filter */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3px' }}>
                        {(['3m', '6m', '12m'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 14px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.2s', background: period === p ? 'rgba(239,68,68,0.2)' : 'transparent', color: period === p ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <button onClick={exportCSV} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> CSV
                    </button>
                    <button onClick={exportExcel} style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#34d399', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Excel
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {[
                    { label: 'Total Receitas', value: fmt(totalGanhos), color: '#10b981' },
                    { label: 'Total Despesas', value: fmt(totalGastos), color: '#ef4444' },
                    { label: 'Saldo Geral', value: fmt(totalGanhos - totalGastos), color: totalGanhos >= totalGastos ? '#10b981' : '#ef4444' },
                    { label: 'Maior Gasto', value: pieData[0] ? fmt(pieData[0].value) : 'R$ 0,00', color: '#f59e0b', sub: pieData[0]?.name },
                ].map((k, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 6px', fontWeight: 600 }}>{k.label}</p>
                        <p style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: k.color }}>{k.value}</p>
                        {k.sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0' }}>{k.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Charts grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                {/* Monthly comparison */}
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#ef4444' }}><BarChart3 size={18} /></div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Receitas vs Despesas</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyData} barSize={months > 8 ? 8 : 14}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie chart */}
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'white' }}><PieIcon size={18} /></div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Despesas por Categoria</h3>
                    </div>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={pieData} cx="40%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                            Nenhuma despesa registrada
                        </div>
                    )}
                </div>

                {/* Patrimônio */}
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', color: '#8b5cf6' }}><TrendingUp size={18} /></div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Evolução Patrimonial</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={patrimonioData}>
                            <defs>
                                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="Patrimônio" stroke="#8b5cf6" strokeWidth={2} fill="url(#grad1)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Balance line */}
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981' }}><TrendingUp size={18} /></div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Balanço Mensal</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="Saldo" stroke={acumulado >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;
