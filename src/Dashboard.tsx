import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, Target, AlertCircle,
  BrainCircuit, Loader2, Plus, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart as PieIcon, RefreshCw, Zap
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { generateText } from './lib/gemini';
import { useToast } from './components/Toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f43f5e', '#a78bfa'];

const card = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '20px',
  padding: '24px',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '0 0 8px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: '14px', fontWeight: 700, margin: '4px 0' }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tRes, cRes] = await Promise.all([
        supabase.from('transactions').select('*, categories(nome, cor, tipo)').eq('user_id', user.id).order('data', { ascending: false }).limit(200),
        supabase.from('categories').select('*').or(`is_global.eq.true,user_id.eq.${user.id}`),
      ]);

      setTransactions(tRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchInsights = async () => {
    if (transactions.length === 0) {
      showToast('Adicione transações primeiro para gerar insights.', 'error');
      return;
    }
    setLoadingInsights(true);
    try {
      const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
      const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);
      const categoriasMaiores = Object.entries(
        transactions.filter(t => t.tipo === 'gasto').reduce((acc: any, t: any) => {
          const c = t.categories?.nome || 'Outros';
          acc[c] = (acc[c] || 0) + t.valor;
          return acc;
        }, {})
      ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

      const prompt = `Analise os dados financeiros e forneça 3 insights curtos e objetivos em português:
- Receitas totais: ${fmt(totalGanhos)}
- Gastos totais: ${fmt(totalGastos)}
- Saldo: ${fmt(totalGanhos - totalGastos)}
- Top categorias de gasto: ${categoriasMaiores.map(([c, v]) => `${c}: ${fmt(v as number)}`).join(', ')}
- Número de transações: ${transactions.length}

Forneça exatamente 3 insights práticos e personalizados. Seja direto e muito objetivo. Máx 2 frases cada.`;

      const text = await generateText(prompt);
      setInsights(text);
    } catch (err) {
      showToast('Erro ao gerar insights. Verifique a API.', 'error');
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#f87171' }}>
      <Loader2 size={24} className="animate-spin" />
      <span>Carregando painel...</span>
    </div>
  );

  const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a: number, t: any) => a + t.valor, 0);
  const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a: number, t: any) => a + t.valor, 0);
  const saldo = totalGanhos - totalGastos;

  // Monthly chart data - last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date).toISOString().split('T')[0];
    const monthEnd = endOfMonth(date).toISOString().split('T')[0];
    const label = format(date, 'MMM', { locale: ptBR });
    const ganhos = transactions.filter(t => t.tipo === 'ganho' && t.data >= monthStart && t.data <= monthEnd).reduce((a: number, t: any) => a + t.valor, 0);
    const gastos = transactions.filter(t => t.tipo === 'gasto' && t.data >= monthStart && t.data <= monthEnd).reduce((a: number, t: any) => a + t.valor, 0);
    return { mes: label, Receitas: ganhos, Gastos: gastos, Saldo: ganhos - gastos };
  });

  // Patrimônio evolution
  let acumulado = 0;
  const patrimonioData = monthlyData.map(m => {
    acumulado += m.Saldo;
    return { mes: m.mes, Patrimônio: acumulado };
  });

  // Category pie data
  const gastosPorCat = transactions
    .filter(t => t.tipo === 'gasto')
    .reduce((acc: any, t: any) => {
      const nome = t.categories?.nome || 'Outros';
      acc[nome] = (acc[nome] || 0) + t.valor;
      return acc;
    }, {});

  const pieData = Object.entries(gastosPorCat)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: value as number }));

  // Smart alerts
  const alertas: { msg: string; sev: 'warning' | 'danger' }[] = [];
  if (totalGastos > totalGanhos) alertas.push({ msg: `Gastos (${fmt(totalGastos)}) superam receitas (${fmt(totalGanhos)}) neste período.`, sev: 'danger' });
  Object.entries(gastosPorCat).forEach(([cat, val]) => {
    if (totalGastos > 0 && (val as number) / totalGastos > 0.4) alertas.push({ msg: `Categoria "${cat}" representa ${Math.round(((val as number) / totalGastos) * 100)}% dos gastos.`, sev: 'warning' });
  });

  // Recent transactions
  const recent = transactions.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Visão Geral</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchData} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <a href="/transactions" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
            <Plus size={16} /> Nova Transação
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Saldo Total', value: fmt(saldo), change: saldo >= 0 ? '+' : '', icon: <Wallet size={22} />, color: saldo >= 0 ? '#10b981' : '#ef4444', bg: saldo >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' },
          { label: 'Receitas', value: fmt(totalGanhos), change: '', icon: <TrendingUp size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Despesas', value: fmt(totalGastos), change: '', icon: <TrendingDown size={22} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Transações', value: transactions.length.toString(), change: '', icon: <BarChart3 size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map((kpi, i) => (
          <div key={i} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, margin: '0 0 8px' }}>{kpi.label}</p>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: i === 0 ? kpi.color : 'white' }}>{kpi.value}</p>
            </div>
            <div style={{ padding: '12px', background: kpi.bg, borderRadius: '14px', color: kpi.color }}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Alerts */}
      {alertas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alertas.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '14px',
              background: a.sev === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${a.sev === 'danger' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}>
              <AlertCircle size={18} color={a.sev === 'danger' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: a.sev === 'danger' ? '#fca5a5' : '#fde68a', fontWeight: 500 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Monthly bar chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#ef4444' }}>
              <BarChart3 size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Fluxo Mensal</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'white' }}>
              <PieIcon size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Gastos por Categoria</h3>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              Nenhuma despesa registrada
            </div>
          )}
        </div>
      </div>

      {/* Patrimônio evolution */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '8px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', color: '#8b5cf6' }}>
            <TrendingUp size={18} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Evolução Patrimonial</h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={patrimonioData}>
            <defs>
              <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Patrimônio" stroke="#8b5cf6" strokeWidth={2} fill="url(#patrimonioGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div style={{ ...card, background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(0,0,0,0.8))', border: '1px solid rgba(239,68,68,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#f87171' }}>
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Smart Insights IA</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Análise personalizada pelo Gemini</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loadingInsights}
            style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loadingInsights ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {loadingInsights ? 'Analisando...' : 'Gerar Insights'}
          </button>
        </div>
        {insights ? (
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px' }}>
            {insights}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            Clique em "Gerar Insights" para obter uma análise personalizada dos seus dados financeiros.
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Movimentações Recentes</h3>
          <a href="/transactions" style={{ fontSize: '13px', color: '#f87171', textDecoration: 'none', fontWeight: 700 }}>Ver todas →</a>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <Wallet size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Nenhuma transação ainda. <a href="/transactions" style={{ color: '#f87171', textDecoration: 'none' }}>Adicione agora →</a></p>
          </div>
        ) : (
          <div>
            {recent.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.tipo === 'ganho' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tipo === 'ganho' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                    {t.tipo === 'ganho' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{t.descricao}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                      {t.categories?.nome || 'Sem categoria'} · {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: t.tipo === 'ganho' ? '#10b981' : '#f87171' }}>
                    {t.tipo === 'ganho' ? '+' : '-'} {fmt(t.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
