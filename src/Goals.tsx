import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Flame, TrendingUp, Minus, PlusCircle } from 'lucide-react';
import api from './api';

const Goals = () => {
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewGoal, setShowNewGoal] = useState(false);

    // Form state local for new goal
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');

    // State for depositing/withdrawing
    const [activeGoalId, setActiveGoalId] = useState<number | null>(null);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionType, setTransactionType] = useState<'add' | 'remove'>('add');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const { data } = await api.get('/goals');
            setGoals(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrencyMask = (value: string) => {
        let numericValue = value.replace(/\D/g, "");
        if (numericValue === "") return "";
        numericValue = (Number(numericValue) / 100).toFixed(2);
        return numericValue.replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    };

    const parseCurrency = (value: string): number => {
        // Remove tudo exceto dígitos e vírgula (pontos de milhar saem aqui)
        const withoutThousands = value.replace(/\./g, '').replace(',', '.');
        const clean = withoutThousands.replace(/[^\d.]/g, '');
        const num = parseFloat(clean);
        console.log('[parseCurrency] input:', value, '=> clean:', clean, '=> num:', num);
        return isNaN(num) ? 0 : num;
    };

    const [goalError, setGoalError] = useState('');

    const handleCreateGoal = async () => {
        setGoalError('');
        if (!newGoalName.trim()) { setGoalError('Digite o nome da meta.'); return; }
        if (!newGoalTarget.trim()) { setGoalError('Digite o valor alvo.'); return; }
        const targetNum = parseCurrency(newGoalTarget);
        if (targetNum <= 0) { setGoalError('Valor inválido. Ex: 5.000,00'); return; }
        try {
            await api.post('/goals', {
                name: newGoalName,
                target: targetNum,
                current: 0,
                color: '#3b82f6',
                icon: 'Target'
            });
            setShowNewGoal(false);
            setNewGoalName('');
            setNewGoalTarget('');
            fetchGoals();
        } catch (e: any) {
            console.error(e);
            setGoalError(e?.response?.data?.error || 'Erro ao salvar meta. Tente novamente.');
        }
    };

    const handleTransaction = async () => {
        if (!activeGoalId || !transactionAmount) return;
        const goal = goals.find(g => g.id === activeGoalId);
        if (!goal) return;

        const amountFloat = parseCurrency(transactionAmount);
        let newCurrent = goal.current;
        if (transactionType === 'add') newCurrent += amountFloat;
        else newCurrent -= amountFloat;

        newCurrent = Math.max(0, newCurrent);

        try {
            await api.put(`/goals/${activeGoalId}`, { current: newCurrent });
            setActiveGoalId(null);
            setTransactionAmount('');
            fetchGoals();
        } catch (e) { console.error(e); }
    };

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '20px'
    };

    const totalSaved = goals.reduce((acc, g) => acc + g.current, 0);

    if (loading) return <div style={{ color: 'white' }}>Carregando metas...</div>;

    return (
        <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>Minhas Metas</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Defina seus objetivos e acompanhe sua evolução.</p>
                </div>
                {!showNewGoal && (
                    <button onClick={() => setShowNewGoal(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '14px', padding: '12px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Plus size={18} /> Nova Meta
                    </button>
                )}
            </div>

            {showNewGoal && (
                <div style={{ ...cardStyle, border: '1px solid #3b82f6' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Criar Nova Meta</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr) auto', gap: '16px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>NOME DA META</label>
                            <input value={newGoalName} onChange={e => setNewGoalName(e.target.value)} placeholder="Ex: Viagem Europa" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>VALOR ALVO</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '14px', color: 'rgba(255,255,255,0.4)' }}>R$</span>
                                <input value={newGoalTarget} onChange={e => setNewGoalTarget(formatCurrencyMask(e.target.value))} placeholder="0,00" style={{ width: '100%', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCreateGoal} style={{ padding: '14px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                            <button onClick={() => { setShowNewGoal(false); setGoalError(''); }} style={{ padding: '14px 24px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                    {goalError && <p style={{ marginTop: '12px', color: '#f87171', fontSize: '13px', fontWeight: 600 }}>⚠ {goalError}</p>}
                </div>
            )}


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ ...cardStyle, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Flame color="#10b981" size={20} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>METAS ATIVAS</span>
                    </div>
                    <h4 style={{ fontSize: '24px', fontWeight: 900 }}>{goals.length}</h4>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <TrendingUp color="#3b82f6" size={20} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>TOTAL GUARDADO</span>
                    </div>
                    <h4 style={{ fontSize: '24px', fontWeight: 900 }}>R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
            </div>

            <div>
                {goals.length === 0 && !showNewGoal && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Target size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Nenhuma meta definida</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Crie sua primeira meta financeira para começar acompanhar seus objetivos!</p>
                    </div>
                )}
                {goals.map((goal) => {
                    const percent = Math.min((goal.current / goal.target) * 100, 100);
                    const isTransactionActive = activeGoalId === goal.id;

                    return (
                        <div key={goal.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${goal.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 color={goal.color} size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{goal.name}</h4>
                                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Alvo: R$ {goal.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 800 }}>{percent.toFixed(1)}%</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>R$ {goal.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} guardados</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setActiveGoalId(goal.id); setTransactionType('add'); setTransactionAmount(''); }} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} /></button>
                                        <button onClick={() => { setActiveGoalId(goal.id); setTransactionType('remove'); setTransactionAmount(''); }} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            {isTransactionActive && (
                                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <span style={{ position: 'absolute', left: '16px', top: '12px', color: 'rgba(255,255,255,0.4)' }}>R$</span>
                                        <input
                                            value={transactionAmount}
                                            onChange={e => setTransactionAmount(formatCurrencyMask(e.target.value))}
                                            placeholder="0,00"
                                            style={{ width: '100%', padding: '12px 12px 12px 44px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${transactionType === 'add' ? '#10b981' : '#ef4444'}55`, borderRadius: '12px', color: 'white' }}
                                            autoFocus
                                        />
                                    </div>
                                    <button onClick={handleTransaction} style={{ padding: '12px 24px', background: transactionType === 'add' ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                        {transactionType === 'add' ? 'Depositar' : 'Retirar'}
                                    </button>
                                    <button onClick={() => setActiveGoalId(null)} style={{ padding: '12px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                </div>
                            )}

                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', background: goal.color, borderRadius: '4px', transition: 'width 1s ease-out' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Goals;
