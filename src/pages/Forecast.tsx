import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Area, AreaChart
} from 'recharts';
import { BrainCircuit, TrendingUp, Loader2, Zap, AlertCircle, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateText } from '../lib/gemini';
import { useToast } from '../components/Toast';
import { format, addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' };

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 6px' }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.stroke || p.color, margin: '3px 0', fontSize: '13px', fontWeight: 700 }}>
                    {p.name}: {fmt(p.value)}
                </p>
            ))}
        </div>
    );
};

const Forecast: React.FC = () => {
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('transactions').select('*, categories(nome)').eq('user_id', user.id).order('data', { ascending: false });
            setTransactions(data || []);
            buildChart(data || []);
        } finally { setLoading(false); }
    };

    const buildChart = (data: any[]) => {
        // Historical 6 months
        const historical = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const ms = startOfMonth(date).toISOString().split('T')[0];
            const me = endOfMonth(date).toISOString().split('T')[0];
            const label = format(date, "MMM/yy", { locale: ptBR });
            const ganhos = data.filter(t => t.tipo === 'ganho' && t.data >= ms && t.data <= me).reduce((a: number, t: any) => a + t.valor, 0);
            const gastos = data.filter(t => t.tipo === 'gasto' && t.data >= ms && t.data <= me).reduce((a: number, t: any) => a + t.valor, 0);
            return { mes: label, Receitas: ganhos, Gastos: gastos, tipo: 'historical' };
        });

        // Projection for next 3 months (simple moving average)
        const avgGanhos = historical.filter(h => h.Receitas > 0).reduce((a, h) => a + h.Receitas, 0) / Math.max(1, historical.filter(h => h.Receitas > 0).length);
        const avgGastos = historical.filter(h => h.Gastos > 0).reduce((a, h) => a + h.Gastos, 0) / Math.max(1, historical.filter(h => h.Gastos > 0).length);

        // Trend adjustment
        const recMeses = historical.slice(-3);
        const trendGastos = recMeses.length > 1 ? (recMeses[recMeses.length - 1].Gastos - recMeses[0].Gastos) / recMeses.length : 0;

        const forecasts = Array.from({ length: 3 }, (_, i) => {
            const date = addMonths(new Date(), i + 1);
            const label = format(date, "MMM/yy", { locale: ptBR });
            return {
                mes: label,
                'Receitas (Proj.)': Math.max(0, avgGanhos * (1 + (Math.random() - 0.5) * 0.1)),
                'Gastos (Proj.)': Math.max(0, avgGastos + trendGastos * (i + 1)),
                tipo: 'forecast',
            };
        });

        setChartData([...historical.map(h => ({ mes: h.mes, Receitas: h.Receitas, Gastos: h.Gastos })), ...forecasts.map(f => ({ mes: f.mes, 'Receitas (Proj.)': f['Receitas (Proj.)'], 'Gastos (Proj.)': f['Gastos (Proj.)'] }))]);
    };

    const runAnalysis = async () => {
        if (transactions.length < 3) { showToast('Adicione mais transações para uma previsão precisa.', 'error'); return; }
        setAnalyzing(true);
        try {
            const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
            const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);

            const gastosPorCat = transactions.filter(t => t.tipo === 'gasto').reduce((acc: any, t: any) => {
                acc[t.categories?.nome || 'Outros'] = (acc[t.categories?.nome || 'Outros'] || 0) + t.valor;
                return acc;
            }, {});

            const prompt = `Analise os dados financeiros abaixo e faça uma previsão para os próximos 3 meses:

HISTÓRICO:
- Total receitas: ${fmt(totalGanhos)}
- Total despesas: ${fmt(totalGastos)}
- Saldo: ${fmt(totalGanhos - totalGastos)}
- Gastos por categoria: ${Object.entries(gastosPorCat).sort((a: any, b: any) => b[1] - a[1]).map(([c, v]) => `${c}: ${fmt(v as number)}`).join(', ')}
- Transações analisadas: ${transactions.length}

Forneça:
1. 📈 TENDÊNCIA: Análise do padrão de gastos atual
2. 🔮 PREVISÃO 3 MESES: Estimativa de receitas e despesas com valores aproximados
3. ⚠️ RISCOS: 2-3 alertas sobre categorias que podem exceder no futuro
4. 💡 SUGESTÕES: 3 ações concretas para melhorar o saldo previsto

Seja objetivo, use dados reais e responda em português.`;

            const text = await generateText(prompt);
            setAnalysis(text);
        } catch (err) {
            showToast('Erro ao gerar previsão. Verifique a API Gemini.', 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#f87171' }}>
            <Loader2 size={24} className="animate-spin" /> Carregando dados...
        </div>
    );

    const todayGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
    const todayGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);
    const taxaEconomia = todayGanhos > 0 ? ((todayGanhos - todayGastos) / todayGanhos * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Previsão de Gastos</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>IA analisando seu histórico para projetar o futuro</p>
                </div>
                <button onClick={runAnalysis} disabled={analyzing} style={{ padding: '10px 20px', background: analyzing ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                    {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    {analyzing ? 'Analisando...' : 'Gerar Previsão IA'}
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                    { label: 'Receita Média/Mês', value: fmt(todayGanhos / Math.max(1, 6)), color: '#10b981' },
                    { label: 'Gasto Médio/Mês', value: fmt(todayGastos / Math.max(1, 6)), color: '#ef4444' },
                    { label: 'Taxa de Economia', value: `${taxaEconomia.toFixed(1)}%`, color: taxaEconomia >= 20 ? '#10b981' : taxaEconomia >= 10 ? '#f59e0b' : '#ef4444' },
                    { label: 'Transações Analisadas', value: transactions.length.toString(), color: '#8b5cf6' },
                ].map((k, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 8px', fontWeight: 600 }}>{k.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Forecast Chart */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', color: '#8b5cf6' }}>
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Tendência + Projeção</h3>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>6 meses histórico + 3 meses projetados</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ width: '20px', height: '2px', background: '#10b981' }} /> Histórico
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ width: '20px', height: '2px', background: '#8b5cf6', borderTop: '2px dashed #8b5cf6' }} /> Projeção
                        </span>
                    </div>
                </div>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} connectNulls />
                            <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} connectNulls />
                            <Line type="monotone" dataKey="Receitas (Proj.)" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#34d399' }} connectNulls />
                            <Line type="monotone" dataKey="Gastos (Proj.)" stroke="#f87171" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#f87171' }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px', flexDirection: 'column', gap: '12px' }}>
                        <BarChart3 size={40} style={{ opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>Adicione mais transações para ver o gráfico de tendência</p>
                    </div>
                )}
            </div>

            {/* AI Analysis */}
            <div style={{ ...card, background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,0,0,0.8))', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', color: '#8b5cf6' }}>
                        <BrainCircuit size={18} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Análise Preditiva Gemini</h3>
                </div>
                {analysis ? (
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px 20px' }}>
                        {analysis}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.3)' }}>
                        <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>Clique em "Gerar Previsão IA" para obter análise preditiva personalizada com base nos seus dados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forecast;
