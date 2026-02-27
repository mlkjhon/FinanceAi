import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    Users, BarChart2, DollarSign, Clock, ShieldCheck,
    Tag, Plus, Trash2, CheckCircle, XCircle
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'categories'>('stats');
    const [newCat, setNewCat] = useState({ nome: '', tipo: 'gasto' });

    const fetchData = async () => {
        try {
            const [sRes, cRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/categories')
            ]);
            setStats(sRes.data);
            setCategories(cRes.data.filter((c: any) => c.isGlobal));
        } catch (err) {
            console.error('Erro ao buscar dados de admin', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddGlobalCategory = async () => {
        if (!newCat.nome) return;
        try {
            // No backend, POST /api/categories vincula ao user atual. 
            // Para admin, poderíamos ter uma rota específica ou lógica no backend.
            // Vou assumir que o admin quer criar uma global.
            await api.post('/categories', { ...newCat, isGlobal: true });
            setNewCat({ nome: '', tipo: 'gasto' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm('Excluir esta categoria global?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '24px',
    };

    const tabStyle = (active: boolean) => ({
        padding: '12px 24px',
        borderRadius: '12px',
        background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
        color: active ? '#60a5fa' : 'rgba(255,255,255,0.4)',
        border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '14px',
        transition: 'all 0.2s'
    });

    if (loading) return <div style={{ color: 'white', padding: '40px' }}>Preparando painel de controle...</div>;

    return (
        <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '18px', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>
                    <ShieldCheck size={32} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Super Painel Admin</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: '16px' }}>Governança e métricas globais da FinanceAI</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '18px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button style={tabStyle(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>Visão Geral</button>
                <button style={tabStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>Usuários</button>
                <button style={tabStyle(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>Categorias Globais</button>
            </div>

            {activeTab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {[
                            { label: 'Usuários Ativos', value: stats.totalUsers, icon: <Users />, color: '#60a5fa' },
                            { label: 'Transações Totais', value: stats.totalTransactions, icon: <BarChart2 />, color: '#10b981' },
                            { label: 'Volume Financeiro', value: stats.totalVolume.toLocaleString('pt-BR'), icon: <DollarSign />, color: '#f59e0b' },
                        ].map((c, i) => (
                            <div key={i} style={cardStyle}>
                                <div style={{ color: c.color, marginBottom: '16px' }}>{c.icon}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>{c.label.toUpperCase()}</div>
                                <div style={{ fontSize: '36px', fontWeight: 800 }}>{c.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ ...cardStyle, height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.03)', borderStyle: 'dashed' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Gráficos de crescimento em tempo real (Em breve)</p>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)', textAlign: 'left' }}>
                                <th style={{ padding: '20px 24px' }}>NOME / E-MAIL</th>
                                <th style={{ padding: '20px 24px' }}>STATUS</th>
                                <th style={{ padding: '20px 24px' }}>ROLE</th>
                                <th style={{ padding: '20px 24px' }}>CRIADO EM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentUsers.map((u: any) => (
                                <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700 }}>{u.nome}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: u.onboardingDone ? '#10b981' : '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
                                            {u.onboardingDone ? <CheckCircle size={14} /> : <Clock size={14} />}
                                            {u.onboardingDone ? 'Onboarding Completo' : 'Pendente'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ padding: '4px 10px', background: u.role === 'ADMIN' ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', color: u.role === 'ADMIN' ? '#a78bfa' : 'inherit', fontSize: '12px', fontWeight: 700 }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'categories' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ ...cardStyle, display: 'flex', gap: '16px', alignItems: 'flex-end', background: 'rgba(59,130,246,0.05)' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>NOVA CATEGORIA GLOBAL</label>
                            <input
                                style={{ width: '100%', background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                placeholder="Ex: Assinaturas TV"
                                value={newCat.nome}
                                onChange={e => setNewCat({ ...newCat, nome: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>TIPO</label>
                            <select
                                style={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                                value={newCat.tipo}
                                onChange={e => setNewCat({ ...newCat, tipo: e.target.value })}
                            >
                                <option value="gasto">Gasto</option>
                                <option value="ganho">Ganho</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddGlobalCategory}
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '12px', padding: '12px 24px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={18} /> Adicionar
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {categories.map(c => (
                            <div key={c.id} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Tag size={16} color={c.tipo === 'ganho' ? '#10b981' : '#f87171'} />
                                    <span style={{ fontWeight: 600 }}>{c.nome}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCategory(c.id)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(244,63,94,0.4)', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
