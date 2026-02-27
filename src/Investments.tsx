import React, { useState, useEffect } from 'react';
import { TrendingUp, Calculator, PieChart, ArrowUpRight, ShieldCheck, Zap, X } from 'lucide-react';

const Investments = () => {
    // raw values for calculations
    const [monthlyContributionRaw, setMonthlyContributionRaw] = useState(500);
    const [monthlyContributionStr, setMonthlyContributionStr] = useState('500,00');

    const [timeInYears, setTimeInYears] = useState(10);
    const [rate, setRate] = useState(11.25);

    // new states for real-time rates
    const [showAllRates, setShowAllRates] = useState(false);
    const [marketRates, setMarketRates] = useState([
        { name: 'Selic', value: '11.25', change: '-', trend: 'neutral' },
        { name: 'CDI', value: '11.15', change: '-', trend: 'neutral' },
        { name: 'IPCA', value: '4.50', change: '-', trend: 'neutral' },
        { name: 'CDB (110% CDI)', value: '12.26', change: '-', trend: 'neutral' },
        { name: 'LCI/LCA (90% CDI)', value: '10.03', change: '-', trend: 'neutral' },
        { name: 'Poupança', value: '6.17', change: '-', trend: 'neutral' },
        { name: 'S&P 500 (Média Histórica)', value: '10.50', change: '+1.2%', trend: 'up' },
    ]);
    const [selectedRateName, setSelectedRateName] = useState<string | null>('Selic');

    useEffect(() => {
        // Fetch Real-time rates from Brasil API
        const fetchRates = async () => {
            try {
                const res = await fetch('https://brasilapi.com.br/api/taxas/v1');
                const data = await res.json();

                // data format: [{ nome: "Selic", valor: 11.25 }, { nome: "CDI", valor: 11.15 }, { nome: "IPCA", valor: 4.51 }]
                if (Array.isArray(data)) {
                    const selic = data.find(item => item.nome.toLowerCase() === 'selic')?.valor || 11.25;
                    const cdi = data.find(item => item.nome.toLowerCase() === 'cdi')?.valor || 11.15;
                    const ipca = data.find(item => item.nome.toLowerCase() === 'ipca')?.valor || 4.50;

                    setMarketRates([
                        { name: 'Selic', value: selic.toString(), change: 'Atualizado Hoje', trend: 'up' },
                        { name: 'CDI', value: cdi.toString(), change: 'Atualizado Hoje', trend: 'up' },
                        { name: 'IPCA', value: ipca.toString(), change: 'Atualizado Hoje', trend: 'up' },
                        { name: 'CDB (110% CDI)', value: (cdi * 1.1).toFixed(2), change: 'Aproximação', trend: 'up' },
                        { name: 'LCI (90% CDI)', value: (cdi * 0.9).toFixed(2), change: 'Aproximação', trend: 'up' },
                        { name: 'Poupança', value: '6.17', change: 'Aproximação Média', trend: 'neutral' },
                        { name: 'S&P 500 (Média)', value: '10.50', change: '+1.2%', trend: 'up' },
                    ]);
                }
            } catch (err) {
                console.error('Erro ao buscar taxas reais:', err);
            }
        };
        fetchRates();
    }, []);

    const calculateResult = () => {
        const monthlyRate = (rate / 100) / 12;
        const months = timeInYears * 12;
        let total = 0;
        for (let i = 0; i < months; i++) {
            total = (total + monthlyContributionRaw) * (1 + monthlyRate);
        }
        return total.toFixed(2);
    };

    const formatCurrencyMask = (value: string) => {
        let numericValue = value.replace(/\D/g, "");
        if (numericValue === "") return "";
        numericValue = (Number(numericValue) / 100).toFixed(2);
        return numericValue.replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    };

    const parseCurrency = (value: string) => {
        if (!value) return 0;
        return Number(value.replace(/\./g, "").replace(",", "."));
    };

    const handleMoneyChange = (valStr: string) => {
        const formatted = formatCurrencyMask(valStr);
        setMonthlyContributionStr(formatted);
        setMonthlyContributionRaw(parseCurrency(formatted));
    };

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '32px'
    };

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>Investimentos Inteligentes</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Simule seu futuro com taxas atualizadas em tempo real.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Simulador */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                            <Calculator size={24} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Simulador de Liberdade</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>APORTE MENSAL (R$)</label>
                            <input
                                value={monthlyContributionStr}
                                onChange={(e) => handleMoneyChange(e.target.value)}
                                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>ANOS</label>
                                <input
                                    type="text"
                                    value={timeInYears.toString()}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 1) val = val.replace(/^0+/, '');
                                        setTimeInYears(val === '' ? 0 : Number(val));
                                    }}
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>TAXA (% AA)</label>
                                <input
                                    type="text"
                                    value={rate.toString()}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/[^0-9.]/g, '');
                                        if (val.length > 1 && !val.startsWith('0.')) val = val.replace(/^0+/, '');
                                        if (val.split('.').length > 2) val = val.replace(/\.+$/, "");
                                        setRate(val === '' ? 0 : Number(val));
                                        setSelectedRateName(null);
                                    }}
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', padding: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>RESULTADO ESTIMADO</p>
                            <h4 style={{ fontSize: '32px', fontWeight: 900, color: '#60a5fa' }}>R$ {Number(calculateResult()).toLocaleString('pt-BR')}</h4>
                        </div>
                    </div>
                </div>

                {/* Market Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '24px' }}>TAXAS DO DIA (MUNDO REAL)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {marketRates.slice(0, 3).map((tax, i) => {
                                const isSelected = selectedRateName === tax.name;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setRate(Number(tax.value));
                                            setSelectedRateName(tax.name);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '16px', borderRadius: '16px',
                                            background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer',
                                            border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }
                                        }}
                                        title="Clique para aplicar no simulador"
                                    >
                                        <span style={{ fontWeight: 700, color: isSelected ? '#60a5fa' : 'white' }}>{tax.name}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800 }}>{Number(tax.value).toFixed(2)}%</div>
                                            <div style={{ fontSize: '12px', color: tax.trend === 'up' ? '#10b981' : tax.trend === 'down' ? '#ef4444' : '#94a3b8' }}>{tax.change}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setShowAllRates(true)}
                            style={{ width: '100%', marginTop: '16px', padding: '16px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                        >Ver Todas as Taxas</button>
                    </div>

                    <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1e3a8a, #4338ca)', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <ShieldCheck size={20} />
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>Dica do Mentor</span>
                        </div>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>"Taxas dinâmicas como o CDI mudam, mas a consistência dos seus aportes mensais é o que realmente constrói riqueza no longo prazo."</p>
                    </div>
                </div>
            </div>

            {/* Modal "Ver Todas as Taxas" */}
            {showAllRates && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Biblioteca de Taxas</h2>
                            <button onClick={() => setShowAllRates(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '50%', color: 'white', display: 'flex' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            {marketRates.map((tax, i) => {
                                const isSelected = selectedRateName === tax.name;
                                return (
                                    <div
                                        key={`modal-${i}`}
                                        onClick={() => {
                                            setRate(Number(tax.value));
                                            setSelectedRateName(tax.name);
                                            setShowAllRates(false);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px',
                                            background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                            cursor: 'pointer', border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent', transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, color: isSelected ? '#60a5fa' : 'white' }}>{tax.name}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800 }}>{Number(tax.value).toFixed(2)}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Investments;
