import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    MessageSquare,
    LayoutDashboard,
    TrendingUp,
    Zap,
    ChevronRight,
    ArrowRight,
    BrainCircuit,
    Star,
    Sparkles,
    UserCircle2
} from 'lucide-react';

const card = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '32px',
};

const FinanceCalculator = () => {
    const [income, setIncome] = React.useState(5000);

    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;

    const barStyle = (color: string, width: string) => ({
        height: '12px',
        background: color,
        width: width,
        borderRadius: '10px',
        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>SUA RENDA MENSAL</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>R$</span>
                        <input
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(Number(e.target.value))}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px 24px 24px 60px', color: 'white', fontSize: '32px', fontWeight: 900, outline: 'none' }}
                        />
                    </div>
                    <input
                        type="range"
                        min="1000"
                        max="30000"
                        step="500"
                        value={income}
                        onChange={(e) => setIncome(Number(e.target.value))}
                        style={{ width: '100%', marginTop: '24px', cursor: 'pointer', accentColor: '#3b82f6' }}
                    />
                </div>

                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: 1.6 }}>
                    A regra 50/30/20 é um método simples para gerenciar seu orçamento: 50% para necessidades básicas, 30% para desejos pessoais e 20% para poupança ou investimentos.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>Necessidades (50%)</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(needs)}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <div style={barStyle('#10b981', '50%')} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>Desejos (30%)</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(wants)}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <div style={barStyle('#f59e0b', '30%')} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>Investimentos (20%)</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(savings)}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <div style={barStyle('#3b82f6', '20%')} />
                    </div>
                </div>
            </div>
        </>
    );
};

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const LandingPage = () => {
    const navigate = useNavigate();

    const featureCardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '32px',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px'
    };

    const sectionStyle = {
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0e1a',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden'
        }}>
            {/* Background Ambient Glows */}
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Hero Section */}
            <section style={{ ...sectionStyle, textAlign: 'center', paddingTop: '120px', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '24px',
                    animation: 'fadeDown 0.8s ease-out'
                }}>
                    <Zap size={16} />
                    <span>A Revolução da Gestão Financeira com IA</span>
                </div>

                <h1 style={{
                    fontSize: '72px',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    marginBottom: '24px',
                    background: 'linear-gradient(to bottom, #ffffff 30%, rgba(255,255,255,0.7) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    maxWidth: '900px',
                    animation: 'fadeUp 0.8s ease-out'
                }}>
                    Domine suas finanças conversando com nossa IA.
                </h1>

                <p style={{
                    fontSize: '20px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    maxWidth: '650px',
                    lineHeight: 1.6,
                    marginBottom: '48px',
                    animation: 'fadeUp 1s ease-out'
                }}>
                    O FinanceAI transforma suas mensagens em dados organizados. Registre gastos, ganhe insights e alcance seus objetivos mais rápido.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    animation: 'fadeUp 1.2s ease-out'
                }}>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            padding: '16px 32px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Começar Grátis <ChevronRight size={20} />
                    </button>

                    <button
                        onClick={() => {
                            const el = document.getElementById('features');
                            el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                            padding: '16px 32px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    >
                        Ver Funcionalidades
                    </button>
                </div>

                {/* Mockup Preview Area */}
                <div style={{
                    marginTop: '80px',
                    width: '100%',
                    maxWidth: '1100px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '40px',
                    padding: '16px',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                    animation: 'fadeUp 1.4s ease-out',
                    position: 'relative'
                }}>
                    <div style={{
                        background: '#0a0e1a',
                        borderRadius: '28px',
                        minHeight: '520px',
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(300px, 1fr) 320px',
                        gap: '20px',
                        padding: '24px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* Area Chart Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ ...card, flex: 1, padding: '20px', background: 'rgba(59,130,246,0.05)' }}>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>SALDO TOTAL</p>
                                    <p style={{ fontSize: '24px', fontWeight: 900 }}>R$ 12.450,00</p>
                                </div>
                                <div style={{ ...card, flex: 1, padding: '20px', background: 'rgba(16,185,129,0.05)' }}>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>ECONOMIA MÊS</p>
                                    <p style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>+ 18%</p>
                                </div>
                            </div>

                            <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Análise de Fluxo</h4>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                                    </div>
                                </div>
                                <div style={{ height: '200px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                    {/* Simulated smooth area chart with bars for simple rendering */}
                                    {[30, 45, 35, 60, 55, 80, 70, 95, 85, 100, 90, 80].map((h, i) => (
                                        <div key={i} style={{
                                            flex: 1,
                                            height: `${h}%`,
                                            background: `linear-gradient(to top, rgba(59,130,246,${0.1 + (i * 0.05)}), rgba(139,92,246,${0.2 + (i * 0.05)}))`,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 1s ease'
                                        }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mini AI Chat Section */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                <BrainCircuit size={20} color="#60a5fa" />
                                <span style={{ fontSize: '14px', fontWeight: 800 }}>FinanceAI Assistant</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                <div style={{ alignSelf: 'flex-end', background: '#3b82f6', padding: '10px 14px', borderRadius: '16px 16px 0 16px', fontSize: '13px' }}>
                                    Gastei R$ 45 no almoço hoje
                                </div>
                                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '16px 16px 16px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                    Entendido! Registrei R$ 45,00 em <b>Alimentação</b>. Seu saldo restante para lazer este mês é R$ 850.
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                                Digite um comando...
                            </div>
                        </div>

                        {/* Abstract background blur in mockup */}
                        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '200px', height: '200px', background: 'rgba(139,92,246,0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={sectionStyle}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '16px' }}>Por que o FinanceAI?</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px' }}>Tecnologia de ponta para sua liberdade financeira.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <div style={featureCardStyle}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                            <MessageSquare size={24} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Chat com IA</h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>Esqueça formulários chatos. Apenas digite "Gastei 50 no mercado" e nossa IA cuida do resto.</p>
                    </div>

                    <div style={featureCardStyle}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                            <LayoutDashboard size={24} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Dashboard Premium</h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>Visualize seus gastos por categoria em gráficos lindos e intuitivos.</p>
                    </div>

                    <div style={featureCardStyle}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                            <ShieldCheck size={24} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Segurança Total</h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>Seus dados são protegidos com criptografia de ponta e autenticação JWT.</p>
                    </div>
                </div>
            </section>

            {/* Stats / Proof Section */}
            <section style={{ ...sectionStyle, background: 'rgba(255,255,255,0.02)', borderRadius: '40px', padding: '60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '48px', fontWeight: 900, color: '#3b82f6' }}>100%</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Privado e Seguro</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '48px', fontWeight: 900, color: '#8b5cf6' }}>24/7</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Assistente Generativo</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '48px', fontWeight: 900, color: '#10b981' }}>+80k</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Dados Processados</div>
                    </div>
                </div>
            </section>

            {/* Finance Calculator Section */}
            <section style={{ ...sectionStyle, padding: '100px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>Simulador de Planejamento 50/30/20</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px' }}>Quanto você deveria estar guardando por mês?</p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '40px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '32px',
                    padding: '40px'
                }}>
                    <FinanceCalculator />
                </div>
            </section>

            {/* Reviews Section */}
            <section style={{ ...sectionStyle, padding: '120px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '24px' }}>O que dizem nossos usuários</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={24} fill="#f59e0b" color="#f59e0b" />)}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {[
                            { name: "Carlos Silva", role: "Empresário", text: "O FinanceAI mudou a forma como vejo meu dinheiro. A IA realmente entende minhas necessidades." },
                            { name: "Mariana Costa", role: "Designer Freelancer", text: "Finalmente um app que não parece uma planilha do Excel. Lindo e extremamente funcional." },
                            { name: "Ricardo Oliveira", role: "Engenheiro", text: "As previsões de gastos são assustadoramente precisas. Me ajudou a economizar 20% no primeiro mês." }
                        ].map((rev, idx) => (
                            <div key={idx} style={{ ...card, padding: '40px' }}>
                                <p style={{ fontSize: '18px', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }}>"{rev.text}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserCircle2 color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800 }}>{rev.name}</p>
                                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{rev.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section style={{ ...sectionStyle, textAlign: 'center', padding: '120px 20px' }}>
                <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '24px' }}>Pronto para mudar sua vida financeira?</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px', marginBottom: '40px' }}>Junte-se a milhares de pessoas que já organizam suas finanças com IA.</p>
                <button
                    onClick={() => navigate('/auth')}
                    style={{
                        padding: '18px 48px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        color: '#0a0e1a',
                        fontSize: '18px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 20px 40px rgba(255,255,255,0.1)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Criar minha conta grátis <ArrowRight size={20} />
                </button>
            </section>

            {/* Footer */}
            <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                © 2026 FinanceAI - Sua inteligência financeira. Todos os direitos reservados.
            </footer>

            <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
};

export default LandingPage;
