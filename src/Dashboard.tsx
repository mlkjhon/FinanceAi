import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight,
  ArrowDownRight, Clock, Pencil, Check, X, Trash2,
  Plus, Calendar, Tag, FileText, AlertCircle, PieChart, BarChart3, Target, UploadCloud, BrainCircuit, Loader2, Play
} from 'lucide-react';
import api from './api';
import { useToast } from './components/Toast';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement
);

interface Category {
  id: number;
  nome: string;
  tipo: 'gasto' | 'ganho';
  isGlobal?: boolean;
}

interface Transaction {
  id: number;
  tipo: 'gasto' | 'ganho';
  valor: number;
  categoriaId: number;
  categoria: Category;
  descricao?: string;
  data: string;
}

// O card padrão agora usa a classe .glass do index.css

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const COLORS = ['#ef4444', '#991b1b', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a78bfa', '#fb923c', '#34d399', '#94a3b8'];

const cardContentStyle = { padding: '32px' };

// ─── Modal de Gestão de Categorias ──────────────────────────────────────────
const CategoryManager = ({ categories, onClose, onRefresh }: {
  categories: Category[],
  onClose: () => void,
  onRefresh: () => void
}) => {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'gasto' | 'ganho'>('gasto');
  const { showToast } = useToast();

  const handleAdd = async () => {
    if (!nome) return;
    try {
      await api.post('/categories', { nome, tipo });
      setNome('');
      onRefresh();
      showToast('Categoria adicionada!', 'success');
    } catch (err: any) { showToast(err.response?.data?.error || 'Erro ao adicionar', 'error'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ maxWidth: '500px', width: '100%', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Minhas Categorias</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', color: 'white', outline: 'none' }}
            placeholder="Nova categoria..."
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
          <select
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', color: 'white' }}
            value={tipo}
            onChange={e => setTipo(e.target.value as any)}
          >
            <option value="gasto">Gasto</option>
            <option value="ganho">Ganho</option>
          </select>
          <button onClick={handleAdd} style={{ background: '#ef4444', border: 'none', borderRadius: '10px', padding: '10px', color: 'white', cursor: 'pointer' }}><Plus size={20} /></button>
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Tag size={14} color={c.tipo === 'ganho' ? '#10b981' : '#f87171'} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{c.nome}</span>
                {c.isGlobal && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>PADRÃO</span>}
              </div>
              {!c.isGlobal && (
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', opacity: 0.6, cursor: 'pointer' }}><Trash2 size={16} /></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Modal de Edição ────────────────────────────────────────────────────────
const EditModal = ({ transaction, categories, onClose, onSave }: {
  transaction: Transaction,
  categories: Category[],
  onClose: () => void,
  onSave: (data: any) => void
}) => {
  const [formData, setFormData] = useState({ ...transaction });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ ...cardContentStyle, maxWidth: '500px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Editar Transação</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>DESCRIÇÃO</label>
            <input
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>VALOR</label>
              <input
                type="number"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
                value={formData.valor}
                onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>DATA</label>
              <input
                type="date"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>CATEGORIA</label>
            <select
              style={{ width: '100%', background: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
              value={formData.categoriaId}
              onChange={e => setFormData({ ...formData, categoriaId: parseInt(e.target.value) })}
            >
              {categories.filter(c => c.tipo === formData.tipo).map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onSave(formData)}
            style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #991b1b)', border: 'none', borderRadius: '14px', padding: '14px', color: 'white', fontWeight: 700, marginTop: '10px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de Importação de Arquivos ───────────────────────────────────────
const UploadModal = ({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload-extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(`Extrato processado! O AI analisou ${data.text.split('\n').length} linhas. Feche a janela e peça para o Chat registrar.`, 'success');
      setFile(null);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro na importação', 'error');
    } finally {
      setLoading(false);
      onClose();
      onRefresh();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ ...cardContentStyle, maxWidth: '500px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Importar Extrato</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X /></button>
        </div>

        <div style={{ padding: '40px', border: '2px dashed rgba(239, 68, 68, 0.3)', borderRadius: '16px', textAlign: 'center', marginBottom: '20px' }}>
          <UploadCloud size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Arraste seu arquivo PDF ou Planilha</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Formatos suportados: .pdf, .csv, .xlsx</p>
          <input
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: '20px' }}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #991b1b)', border: 'none', borderRadius: '14px', padding: '14px', color: 'white', fontWeight: 700, cursor: (!file || loading) ? 'not-allowed' : 'pointer', opacity: (!file || loading) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Processar Documento'}
        </button>
      </div>
    </div>
  );
};

// ─── Dashboard Principal ──────────────────────────────────────────────────────
const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrans, setEditingTrans] = useState<Transaction | null>(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [filterText, setFilterText] = useState('');
  const { showToast, confirm } = useToast();

  const fetchData = async () => {
    try {
      const [tRes, cRes, gRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/categories'),
        api.get('/goals')
      ]);
      setTransactions(tRes.data);
      setCategories(cRes.data);
      setGoals(gRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data } = await api.get('/insights');
      setInsights(data.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => { fetchData(); fetchInsights(); }, []);

  const handleDelete = async (id: number) => {
    confirm('Excluir esta transação permanente?', async () => {
      try {
        await api.delete(`/transactions/${id}`);
        fetchData();
        showToast('Transação excluída.', 'success');
      } catch (err: any) { showToast(err.response?.data?.error || 'Erro ao excluir', 'error'); }
    });
  };

  const handleUpdate = async (data: Transaction) => {
    try {
      await api.put(`/transactions/${data.id}`, data);
      setEditingTrans(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ color: 'white', padding: '40px' }}>Preparando seu painel financeiro...</div>;

  const totalGanhos = transactions.filter(t => t.tipo === 'ganho').reduce((a, t) => a + t.valor, 0);
  const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((a, t) => a + t.valor, 0);
  const saldo = totalGanhos - totalGastos;

  // Preparar dados para o gráfico de pizza (gastos por categoria)
  const gastosPorCat = transactions.filter(t => t.tipo === 'gasto').reduce((acc: any, t) => {
    const nome = t.categoria?.nome || 'Outros';
    acc[nome] = (acc[nome] || 0) + t.valor;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(gastosPorCat),
    datasets: [{
      data: Object.values(gastosPorCat),
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  // Preparar dados para o gráfico de barra (ganhos vs gastos últimos 7 dias)
  const shiftDate = (d: number) => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date.toISOString().split('T')[0];
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => shiftDate(6 - i));
  const barData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })),
    datasets: [
      {
        label: 'Ganhos',
        data: last7Days.map(d => transactions.filter(t => t.data === d && t.tipo === 'ganho').reduce((a, t) => a + t.valor, 0)),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'Gastos',
        data: last7Days.map(d => transactions.filter(t => t.data === d && t.tipo === 'gasto').reduce((a, t) => a + t.valor, 0)),
        backgroundColor: '#f87171',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {editingTrans && (
        <EditModal
          transaction={editingTrans}
          categories={categories}
          onClose={() => setEditingTrans(null)}
          onSave={handleUpdate}
        />
      )}

      {showCatManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCatManager(false)}
          onRefresh={fetchData}
        />
      )}

      {showUploader && (
        <UploadModal
          onClose={() => setShowUploader(false)}
          onRefresh={fetchData}
        />
      )}

      {/* Hero Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Visão Geral</h2>
        <button
          onClick={() => setShowUploader(true)}
          style={{ background: '#ef4444', border: 'none', padding: '10px 20px', borderRadius: '14px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' }}
        >
          <UploadCloud size={20} />
          Importar Extrato
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Saldo Total', value: fmt(saldo), icon: <Wallet size={24} />, color: saldo >= 0 ? '#f87171' : '#f43f5e' },
          { label: 'Ganhos Acumulados', value: fmt(totalGanhos), icon: <TrendingUp size={24} />, color: '#10b981' },
          { label: 'Gastos Totais', value: fmt(totalGastos), icon: <TrendingDown size={24} />, color: '#f43f5e' },
          { label: 'Guardado em Metas', value: fmt(goals.reduce((sum, g) => sum + g.current, 0)), icon: <Target size={24} />, color: '#8b5cf6' },
        ].map((c, i) => (
          <div key={i} className="glass" style={{ ...cardContentStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{c.label}</p>
              <p style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{c.value}</p>
            </div>
            <div style={{ padding: '12px', background: `${c.color}15`, borderRadius: '14px', color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Smart Insights Panel */}
      {insights ? (
        <div className="glass" style={{ ...cardContentStyle, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(0,0,0,0.8))', border: '1px solid rgba(239, 68, 68, 0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(239, 68, 68, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#f87171' }}>
              <BrainCircuit size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Smart Insights AI</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Análise avançada do seu comportamento</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {insights.fraud_alert && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: 700, marginBottom: '8px' }}>
                  <AlertCircle size={16} /> Alerta de Comportamento
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, color: 'rgba(255,255,255,0.8)' }}>Detectamos gastos fora do seu padrão recente. Revise suas últimas transações.</p>
              </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>
                <TrendingUp size={16} /> Dica de Economia
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{insights.savings_tip}</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, marginBottom: '8px' }}>
                <Target size={16} /> Previsão Mensal
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{insights.predictive_tip}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
            "{insights.motivation}"
          </div>
        </div>
      ) : loadingInsights ? (
        <div className="glass" style={{ ...cardContentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', color: '#f87171' }}>
          <Loader2 className="animate-spin" /> Gerando insights personalizados...
        </div>
      ) : null}

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="glass" style={cardContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: '#ef4444' }}>
              <BarChart3 size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Fluxo Semanal</h3>
          </div>
          <div style={{ height: '300px' }}>
            <Bar
              data={barData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)' } },
                  x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)' } }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        <div className="glass" style={cardContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#ffffff' }}>
              <PieChart size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Gastos por Categoria</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={pieData}
              options={{
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.5)', usePointStyle: true, font: { size: 10 } } } }
              }}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass" style={{ ...cardContentStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Movimentações Recentes</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', maxWidth: '400px' }}>
              <button
                onClick={() => setFilterText('')}
                style={{
                  padding: '6px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: filterText === '' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: filterText === '' ? '#f87171' : 'rgba(255,255,255,0.6)',
                  border: filterText === '' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                Todos
              </button>
              {Array.from(new Set(transactions.map(t => t.categoria?.nome).filter(Boolean))).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterText(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                    background: filterText === cat ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: filterText === cat ? '#f87171' : 'rgba(255,255,255,0.6)',
                    border: filterText === cat ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCatManager(true)}
              style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <Tag size={14} /> Gerenciar Categorias
            </button>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            {transactions.filter(t =>
              t.descricao?.toLowerCase().includes(filterText.toLowerCase()) ||
              t.categoria?.nome.toLowerCase().includes(filterText.toLowerCase())
            ).length} registros
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'left' }}>
              <th style={{ padding: '20px 32px', fontWeight: 600 }}>DATA</th>
              <th style={{ padding: '20px 32px', fontWeight: 600 }}>DESCRIÇÃO</th>
              <th style={{ padding: '20px 32px', fontWeight: 600 }}>CATEGORIA</th>
              <th style={{ padding: '20px 32px', fontWeight: 600, textAlign: 'right' }}>VALOR</th>
              <th style={{ padding: '20px 32px', fontWeight: 600, textAlign: 'center' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .filter(t =>
                t.descricao?.toLowerCase().includes(filterText.toLowerCase()) ||
                t.categoria?.nome.toLowerCase().includes(filterText.toLowerCase())
              )
              .map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
                      <Calendar size={14} />
                      {new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </div>
                  </td>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ fontWeight: 600 }}>{t.descricao}</div>
                  </td>
                  <td style={{ padding: '20px 32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      <Tag size={12} color="#f87171" />
                      {t.categoria?.nome || 'Sem Categoria'}
                    </div>
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div style={{ color: t.tipo === 'ganho' ? '#10b981' : '#f87171', fontWeight: 800, fontSize: '16px' }}>
                      {t.tipo === 'ganho' ? '+' : '-'} {fmt(t.valor)}
                    </div>
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setEditingTrans(t)}
                        style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '10px', color: '#f87171', cursor: 'pointer' }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        style={{ padding: '8px', background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: '10px', color: '#f43f5e', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
