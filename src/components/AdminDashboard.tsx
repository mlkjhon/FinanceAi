import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    Users, BarChart2, DollarSign, Clock, ShieldCheck,
    Tag, Plus, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { useToast } from './Toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'categories'>('stats');
    const [newCat, setNewCat] = useState({ nome: '', tipo: 'gasto' });
    const { showToast, confirm } = useToast();

    const handleUpdateUserStatus = async (id: number, status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED') => {
        try {
            await api.put(`/admin/users/${id}/status`, { status });
            showToast(`Status atualizado para ${status}`, 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Erro ao atualizar status', 'error');
        }
    };

    const handleDeleteUser = async (id: number) => {
        confirm('Tem certeza? Essa ação excluirá permanentemente o usuário e seus dados.', async () => {
            try {
                await api.delete(`/admin/users/${id}`);
                showToast('Usuário excluído com sucesso.', 'success');
                fetchData();
            } catch (err: any) {
                showToast(err.response?.data?.error || 'Erro ao excluir usuário', 'error');
            }
        });
    };

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
            showToast('Categoria global criada!', 'success');
        } catch (err: any) { showToast(err.response?.data?.error || 'Erro ao criar', 'error'); }
    };

    const handleDeleteCategory = async (id: number) => {
        confirm('Excluir esta categoria global?', async () => {
            try {
                await api.delete(`/categories/${id}`);
                fetchData();
                showToast('Categoria global excluída.', 'success');
            } catch (err: any) { showToast(err.response?.data?.error || 'Erro ao excluir', 'error'); }
        });
    };

    const cardContentStyle = { padding: '24px' };

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
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
            <div className="glass" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '18px', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>Super Painel Admin</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: '16px' }}>Governança e métricas globais da FinanceAI</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '16px' }}>
                    <button style={tabStyle(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>Visão Geral</button>
                    <button style={tabStyle(activeTab === 'users')} onClick={() => setActiveTab('users')}>Usuários</button>
                    <button style={tabStyle(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>Categorias Globais</button>
                </div>
            </div>

            {activeTab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {[
                            { label: 'Usuários Ativos', value: stats.totalUsers, icon: <Users />, color: '#60a5fa' },
                            { label: 'Transações Totais', value: stats.totalTransactions, icon: <BarChart2 />, color: '#10b981' },
                            { label: 'Volume Financeiro', value: stats.totalVolume.toLocaleString('pt-BR'), icon: <DollarSign />, color: '#f59e0b' },
                        ].map((c, i) => (
                            <div key={i} className="glass" style={cardContentStyle}>
                                <div style={{ color: c.color, marginBottom: '16px', background: `${c.color}15`, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {React.cloneElement(c.icon as React.ReactElement, { size: 20 })}
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '8px' }}>{c.label}</div>
                                <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>{c.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="glass" style={{ ...cardContentStyle, height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.05)', borderStyle: 'dashed', borderColor: 'rgba(59,130,246,0.3)' }}>
                        <p style={{ color: 'rgba(59,130,246,0.5)', fontWeight: 700, fontSize: '15px' }}>Análise preditiva e crescimento (Módulo IA em breve)</p>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="glass" style={{ ...cardContentStyle, padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)', textAlign: 'left' }}>
                                <th style={{ padding: '20px 24px' }}>NOME / E-MAIL</th>
                                <th style={{ padding: '20px 24px' }}>STATUS</th>
                                <th style={{ padding: '20px 24px' }}>ROLE</th>
                                <th style={{ padding: '20px 24px' }}>CONTA</th>
                                <th style={{ padding: '20px 24px' }}>AÇÕES</th>
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
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.status === 'ACTIVE' ? '#10b981' : u.status === 'SUSPENDED' ? '#f59e0b' : '#ef4444' }} />
                                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{u.status || 'ACTIVE'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleUpdateUserStatus(u.id, u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '6px 12px', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            {u.status === 'SUSPENDED' ? 'Restaurar' : 'Suspender'}
                                        </button>
                                        <button
                                            onClick={() => handleUpdateUserStatus(u.id, u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')}
                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 12px', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            {u.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            style={{ background: 'transparent', color: 'rgba(239,68,68,0.5)', padding: '6px', border: 'none', cursor: 'pointer' }}
                                            title="Excluir Usuário"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
