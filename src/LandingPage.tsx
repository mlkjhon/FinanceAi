import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import Hero3DElement from './components/Hero3DElement';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ShieldCheck,
    MessageSquare,
    LayoutDashboard,
    Zap,
    ChevronRight,
    ArrowRight,
    BrainCircuit,
    Star,
    UserCircle2,
    Scale,
    Lock,
    TrendingUp,
    Quote
} from 'lucide-react';

const card = {
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
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
        <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>SUA RENDA MENSAL</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>R$</span>
                        <input
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(Number(e.target.value))}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px 24px 24px 60px', color: 'white', fontSize: '32px', fontWeight: 900, outline: 'none' }}
                        />
                    </div>
                    <input
                        type="range"
                        min="1000"
                        max="30000"
                        step="500"
                        value={income}
                        onChange={(e) => setIncome(Number(e.target.value))}
                        style={{ width: '100%', marginTop: '24px', cursor: 'pointer', accentColor: '#ef4444' }}
                    />
                </div>

                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: 1.6 }}>
                    A regra 50/30/20 é um método simples para gerenciar seu orçamento: 50% para necessidades, 30% desejos e 20% para o futuro.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', justifyContent: 'center', marginTop: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#f87171' }}>Necessidades (50%)</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(needs)}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <div style={barStyle('#f87171', '50%')} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#fca5a5' }}>Desejos (30%)</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(wants)}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <div style={barStyle('#fca5a5', '30%')} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Investimentos (20%)</span>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(savings)}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                        <div style={barStyle('#ffffff', '20%')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;

const LandingPage = () => {
    const navigate = useNavigate();

    const { scrollYProgress } = useScroll();

    // Parallax effect: image moves up slower than the page
    const y = useTransform(scrollYProgress, [0, 1], [0, -300]);
    // Rotation effect: slight rotation as you scroll down
    const rotate = useTransform(scrollYProgress, [0, 1], [0, -15]);
    // Opacity: fades out slightly when reaching the end
    const opacity = useTransform(scrollYProgress, [0, 0.8, 1], [0.9, 0.4, 0]);

    const featureCardStyle = {
        background: 'rgba(5, 5, 5, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '40px',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px'
    };

    const sectionStyle = {
        padding: '120px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#040404', // Slightly lighter/noisier black for depth
            backgroundImage: 'radial-gradient(circle at top right, rgba(239, 68, 68, 0.03) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.02) 0%, transparent 40%)',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative'
        }}>

            {/* Background Interactive 3D Art - Fixed to follow scroll */}
            <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', opacity: 0.8 }}>
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Environment preset="city" />
                    <React.Suspense fallback={null}>
                        <Hero3DElement />
                    </React.Suspense>
                </Canvas>
            </div>


            {/* Foreground Content */}
            <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>

                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        ...sectionStyle,
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '120px 20px 60px 20px',
                        position: 'relative',
                        zIndex: 10
                    }}
                >
                    <div style={{
                        width: '100%',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap-reverse',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '40px'
                    }}>
                        {/* Text Content */}
                        <div style={{ flex: '1 1 500px', maxWidth: '600px', zIndex: 10 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '100px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <Zap size={16} color="#ef4444" />
                                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em' }}>INTELIGÊNCIA ARTIFICIAL FINANCEIRA</span>
                            </div>
                            <h1 style={{ fontSize: 'clamp(48px, 8vw, 84px)', fontWeight: 900, lineHeight: 1.05, marginBottom: '24px', letterSpacing: '-0.03em', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                Domine suas finanças com mente <span style={{ color: '#ef4444', textShadow: '0 0 40px rgba(239,68,68,0.4)' }}>clara</span>.
                            </h1>
                            <p style={{ fontSize: 'clamp(18px, 2vw, 22px)', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '500px' }}>
                                O Mentor definitivo que une análise fria e dados precisos para o crescimento real do seu patrimônio.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/auth')}
                                    style={{
                                        padding: '18px 32px',
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '100px',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 10px 30px rgba(239,68,68,0.3)',
                                        transition: 'transform 0.2s',
                                        flex: '1 1 auto',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Iniciar Jornada <ChevronRight size={20} />
                                </button>
                                <button
                                    style={{
                                        padding: '18px 32px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '100px',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        flex: '1 1 auto',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    Conhecer a Lógica
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Features Section */}
                <motion.section
                    initial={{ opacity: 0, y: 80 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    id="features"
                    style={{ ...sectionStyle, padding: '160px 20px', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8) 20%)' }}
                >
                    <div style={{ maxWidth: '600px', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '56px', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1 }}>A Razão acima do Impulso.</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '20px', lineHeight: 1.6 }}>Nossa IA não apenas lê planilhas, ela orienta e prevê como suas ações de hoje moldam o amanhã.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                        <div style={featureCardStyle}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                                <MessageSquare size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Mentor via Chat</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6, fontSize: '16px' }}>Esqueça formulários engessados. Converse como conversaria com um consultor. Ele entende, organiza e planeja.</p>
                        </div>

                        <div style={featureCardStyle}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                                <LayoutDashboard size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Visão Analítica</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6, fontSize: '16px' }}>Dashboards limpos, escuros e diretos ao ponto. Saiba onde seu dinheiro está sem ruídos visuais.</p>
                        </div>

                        <div style={featureCardStyle}>
                            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(153,27,27,0.1))', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                <BrainCircuit size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Previsões Preditivas</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6, fontSize: '16px' }}>O Mentor identifica padrões nocivos de gastos e alerta quando você está fugindo do comportamento saudável.</p>
                        </div>
                    </div>
                </motion.section>

                {/* Finance Calculator Section */}
                <motion.section
                    initial={{ opacity: 0, y: 80 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ ...sectionStyle, padding: '160px 20px', display: 'flex', justifyContent: 'flex-end' }}
                >
                    <div style={{ width: '100%', maxWidth: '500px' }}>
                        <div style={{ marginBottom: '48px' }}>
                            <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>Simulador<br /><span style={{ color: '#ef4444' }}>Estratégico</span></h2>
                            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px' }}>O primeiro passo da sabedoria é saber distribuir recursos.</p>
                        </div>

                        <div style={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '32px',
                            padding: '48px',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
                        }}>
                            <FinanceCalculator />
                        </div>
                    </div>
                </motion.section>

                {/* Como Funciona Section */}
                <motion.section
                    initial={{ opacity: 0, y: 80 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ ...sectionStyle, padding: '120px 20px', background: '#020202' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1 }}>Como o Mentor <span style={{ color: '#ef4444' }}>Funciona</span></h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>Três passos simples para transformar caos em clareza estratégica.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', maxWidth: '1000px', margin: '0 auto' }}>
                        {[
                            { step: '01', title: 'Conecte', desc: 'Sincronize ou insira seus dados financeiros de forma totalmente segura e anônima.' },
                            { step: '02', title: 'Analise', desc: 'A IA varre suas finanças buscando padrões ocultos e gargalos invisíveis a olho nu.' },
                            { step: '03', title: 'Domine', desc: 'Receba um plano de ação claro, frio e focado em metas reais, sem achismos.' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(239, 68, 68, 0.2)', marginBottom: '16px' }}>{item.step}</div>
                                <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>{item.title}</h3>
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Benefícios (Segurança & Razão) Section */}
                <motion.section
                    initial={{ opacity: 0, y: 80 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ ...sectionStyle, padding: '160px 20px', display: 'flex', flexDirection: 'column', gap: '60px' }}
                >
                    <div style={{ maxWidth: '600px', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1 }}>Por que escolher a <span style={{ borderBottom: '4px solid #ef4444' }}>Razão Pura</span>?</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        <div style={{ ...featureCardStyle, background: 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(0,0,0,1))' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', marginBottom: '24px' }}>
                                <Scale size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Decisões Sem Emoção</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>O dinheiro obedece à matemática, não aos sentimentos. Nossa IA extirpa o viés emocional das suas escolhas, garantindo que você compre ou invista baseado apenas em lógica e dados reais.</p>
                        </div>

                        <div style={{ ...featureCardStyle, background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(0,0,0,1))', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '24px' }}>
                                <Lock size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Segurança Absoluta</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>Seus dados estão protegidos por criptografia de ponta a ponta. Não vendemos suas informações. O FinanceAI é um cofre digital onde apenas você e seu Mentor têm a chave.</p>
                        </div>

                        <div style={{ ...featureCardStyle, background: 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(0,0,0,1))' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', marginBottom: '24px' }}>
                                <TrendingUp size={28} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Crescimento Estratégico</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>Não focamos apenas em cortar gastos pequenos. O objetivo é a expansão do seu patrimônio com previsões de cenário e mapeamento de juros compostos a seu favor.</p>
                        </div>
                    </div>
                </motion.section>

                {/* Social Proof / Testimonials Section */}
                <motion.section
                    initial={{ opacity: 0, y: 80 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ ...sectionStyle, padding: '120px 20px', background: '#020202', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1 }}>Quem confia na <span style={{ color: '#ef4444' }}>lógica</span></h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {[
                            { quote: "Antes eu investia pelo que lia nas notícias. O FinanceAI me mostrou que a matemática da minha renda exigia uma estratégia muito mais conservadora. Mudou meu jogo.", author: "Marcos T.", role: "Engenheiro de Software" },
                            { quote: "Impressionante como a IA funciona como um CFO pessoal. Os relatórios são frios, duros, mas exatamente o que eu precisava para parar de me sabotar financeiramente.", author: "Elena R.", role: "Empresária" },
                            { quote: "A interface é absurdamente premium e os conselhos do chat parecem vir de um especialista sênior de Wall Street. Indispensável.", author: "Lucas M.", role: "Médico" }
                        ].map((testimonial, idx) => (
                            <div key={idx} style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', position: 'relative' }}>
                                <Quote size={40} color="rgba(239, 68, 68, 0.2)" style={{ position: 'absolute', top: '24px', left: '24px' }} />
                                <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: '32px', position: 'relative', zIndex: 1, paddingTop: '24px' }}>"{testimonial.quote}"</p>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{testimonial.author}</div>
                                    <div style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '14px', fontWeight: 600 }}>{testimonial.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Final CTA Section */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ ...sectionStyle, textAlign: 'center', padding: '160px 20px', background: 'radial-gradient(circle at center, rgba(153,27,27,0.15) 0%, transparent 70%)' }}
                >
                    <h2 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.02em', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                        O poder de decidir<br />com confiança.
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '22px', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>Junte-se ao novo padrão de gestão financeira focado em inteligência e design premium.</p>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            padding: '24px 64px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '100px',
                            color: '#050505',
                            fontSize: '20px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 20px 50px rgba(255,255,255,0.15)',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Entrar no Sistema <ArrowRight size={24} />
                    </button>
                </motion.section>

                {/* Footer */}
                <footer style={{ padding: '60px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '15px', background: '#000000' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                        <ShieldCheck size={24} color="#ef4444" />
                        <span style={{ fontWeight: 800, color: 'white' }}>FinanceAI</span>
                    </div>
                    © 2026 Inteligência Financeira. Todos os direitos reservados.
                </footer>
            </div>

            <style>{`
@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
#features { position: relative; z-index: 10; }
section { position: relative; z-index: 10; }
`}</style>
        </div>
    );
};

export default LandingPage;
