import React, { useState } from 'react';
import {
    Target, TrendingUp, PiggyBank, ShieldAlert,
    ArrowRight, ArrowLeft, CheckCircle2, Wallet,
    BrainCircuit, Coins, Zap, Trophy, X
} from 'lucide-react';

interface OnboardingProps {
    userName: string;
    onComplete: (data: any) => void;
}

const steps = [
    { id: 'objective', title: 'Objetivo', subtitle: 'Qual sua prioridade?' },
    { id: 'profile', title: 'Perfil', subtitle: 'Como você gasta?' },
    { id: 'income', title: 'Renda', subtitle: 'Sua realidade mensal.' },
    { id: 'dream', title: 'Sonho', subtitle: 'Sua meta de vida.' }
];

const Onboarding = ({ userName, onComplete }: OnboardingProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState({
        objective: '',
        profile: '',
        income: '',
        dream: ''
    });

    const next = () => currentStep < steps.length - 1 ? setCurrentStep(currentStep + 1) : onComplete(data);
    const back = () => currentStep > 0 && setCurrentStep(currentStep - 1);

    const glassStyle = {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const optionStyle = (selected: boolean) => ({
        width: '100%',
        padding: '16px 20px',
        background: selected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { id: 'save', icon: PiggyBank, label: 'Economizar', color: '#10b981' },
                            { id: 'invest', icon: TrendingUp, label: 'Investir', color: '#8b5cf6' },
                            { id: 'organize', icon: Target, label: 'Organizar', color: '#3b82f6' },
                            { id: 'emergency', icon: ShieldAlert, label: 'Reserva', color: '#f59e0b' }
                        ].map(opt => (
                            <div
                                key={opt.id}
                                style={optionStyle(data.objective === opt.id)}
                                onClick={() => setData({ ...data, objective: opt.id })}
                            >
                                <div style={{ padding: '8px', background: `${opt.color}15`, borderRadius: '10px' }}>
                                    <opt.icon color={opt.color} size={18} />
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{opt.label}</span>
                                {data.objective === opt.id && <CheckCircle2 style={{ marginLeft: 'auto' }} color="#3b82f6" size={16} />}
                            </div>
                        ))}
                    </div>
                );
            case 1:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { id: 'saver', icon: Coins, label: 'Econômico', color: '#10b981' },
                            { id: 'balanced', icon: Wallet, label: 'Equilibrado', color: '#3b82f6' },
                            { id: 'spender', icon: Zap, label: 'Impulsivo', color: '#f43f5e' }
                        ].map(opt => (
                            <div
                                key={opt.id}
                                style={optionStyle(data.profile === opt.id)}
                                onClick={() => setData({ ...data, profile: opt.id })}
                            >
                                <div style={{ padding: '8px', background: `${opt.color}15`, borderRadius: '10px' }}>
                                    <opt.icon color={opt.color} size={18} />
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{opt.label}</span>
                                {data.profile === opt.id && <CheckCircle2 style={{ marginLeft: 'auto' }} color="#3b82f6" size={16} />}
                            </div>
                        ))}
                    </div>
                );
            case 2:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.05em' }}>RENDA MENSAL</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '0 16px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>R$</span>
                                <input
                                    type="text"
                                    placeholder="0,00"
                                    value={data.income}
                                    onChange={e => {
                                        let numericValue = e.target.value.replace(/\D/g, "");
                                        if (numericValue !== "") {
                                            numericValue = (Number(numericValue) / 100).toFixed(2);
                                            numericValue = numericValue.replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                                        }
                                        setData({ ...data, income: numericValue });
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', fontWeight: 700, padding: '16px 12px', outline: 'none', width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { id: 'house', icon: Target, label: 'Casa própria', color: '#10b981' },
                            { id: 'freedom', icon: BrainCircuit, label: 'Independência', color: '#8b5cf6' },
                            { id: 'travel', icon: Trophy, label: 'Viagem', color: '#3b82f6' },
                            { id: 'nothing', icon: ShieldAlert, label: 'Sem Dívidas', color: '#f43f5e' }
                        ].map(opt => (
                            <div
                                key={opt.id}
                                style={optionStyle(data.dream === opt.id)}
                                onClick={() => setData({ ...data, dream: opt.id })}
                            >
                                <div style={{ padding: '8px', background: `${opt.color}15`, borderRadius: '10px' }}>
                                    <opt.icon color={opt.color} size={18} />
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{opt.label}</span>
                                {data.dream === opt.id && <CheckCircle2 style={{ marginLeft: 'auto' }} color="#3b82f6" size={16} />}
                            </div>
                        ))}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={glassStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
                            Olá, {userName.split(' ')[0]}!
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0', fontWeight: 500 }}>
                            {steps[currentStep].subtitle}
                        </p>
                    </div>
                    <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ position: 'absolute', transform: 'rotate(-90deg)', width: '42px', height: '42px' }}>
                            <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <circle cx="21" cy="21" r="18" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={113} strokeDashoffset={113 - (113 * (currentStep + 1) / steps.length)} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6' }}>{currentStep + 1}</span>
                    </div>
                </div>

                {renderStep()}

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                    {currentStep > 0 && (
                        <button
                            onClick={back}
                            style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <button
                        onClick={next}
                        disabled={
                            (currentStep === 0 && !data.objective) ||
                            (currentStep === 1 && !data.profile) ||
                            (currentStep === 2 && !data.income) ||
                            (currentStep === 3 && !data.dream)
                        }
                        style={{
                            flex: 1, padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(59,130,246,0.3)', transition: 'all 0.2s', opacity: (
                                (currentStep === 0 && !data.objective) ||
                                (currentStep === 1 && !data.profile) ||
                                (currentStep === 2 && !data.income) ||
                                (currentStep === 3 && !data.dream)
                            ) ? 0.5 : 1
                        }}
                    >
                        {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes slideIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
        </div>
    );
};

export default Onboarding;
