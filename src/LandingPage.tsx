import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, TrendingUp, BarChart3, Bot, Smartphone, Lock,
    Zap, ArrowRight, CheckCircle, ChevronRight, Play, Calculator
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [calcData, setCalcData] = useState({ renda: 5000, gastos: 3500, meses: 12 });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const econMensal = calcData.renda - calcData.gastos;
    const projecao = econMensal > 0 ? econMensal * calcData.meses : 0;

    return (
        <div style={{
            minHeight: '100vh', background: '#020202', color: 'white',
            fontFamily: "'Inter', sans-serif", overflowX: 'hidden'
        }}>
            {/* Background gradients */}
            <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(153,27,27,0.06) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                padding: '20px 48px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                background: scrolled ? 'rgba(5,5,5,0.85)' : 'transparent',
                backdropFilter: scrolled ? 'blur(24px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #ef4444, #991b1b)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(239,68,68,0.4)' }}>
                        <ShieldCheck size={24} color="white" />
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        Finance<span style={{ color: '#f87171' }}>AI</span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="hidden md:flex">
                    {['Funcionalidades', 'Simulador', 'Segurança'].map(item => (
                        <button key={item} onClick={() => scrollTo(item.toLowerCase())} style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                            fontSize: '14px', fontWeight: 600, transition: 'color 0.2s'
                        }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                            {item}
                        </button>
                    ))}
                    <button onClick={() => navigate('/auth')} style={{
                        padding: '10px 24px', background: 'white', color: 'black', border: 'none', borderRadius: '100px',
                        fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s'
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        Entrar
                    </button>
                </div>
            </nav>

            <main style={{ position: 'relative', zIndex: 1, paddingTop: '160px' }}>
                {/* Hero */}
                <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', textAlign: 'center', marginBottom: '160px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '100px', color: '#f87171', fontSize: '13px', fontWeight: 700, marginBottom: '32px' }}>
                        <Zap size={14} /> Nova versão 2.0 liberada
                    </div>
                    <h1 style={{ fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 32px' }}>
                        A inteligência artificial do<br />
                        <span style={{ background: 'linear-gradient(135deg, #ef4444, #fca5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            seu dinheiro.
                        </span>
                    </h1>
                    <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                        Assuma o controle total das suas finanças com Open Finance integrado, alertas inteligentes e análises preditivas feitas pelo Google Gemini.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/auth/register')} style={{ padding: '20px 40px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '100px', color: 'white', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 12px 32px rgba(239,68,68,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            Começar Gratuitamente <ArrowRight size={20} />
                        </button>
                        <button onClick={() => scrollTo('funcionalidades')} style={{ padding: '20px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', color: 'white', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                            <Play size={20} /> Ver Demo
                        </button>
                    </div>
                </section>

                {/* Features */}
                <section id="funcionalidades" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Tudo o que você precisa.</h2>
                        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)' }}>Uma suíte completa para gestão financeira profissional.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {[
                            { icon: <Bot size={28} />, title: 'Chatbot IA Especializado', desc: 'Converse com seus dados financeiros. O Gemini analisa seu histórico para dar dicas personalizadas em tempo real.', color: '#ef4444' },
                            { icon: <TrendingUp size={28} />, title: 'Previsões Algorítmicas', desc: 'Nossa IA projeta seus gastos pros próximos meses baseada em machine learning e médias móveis.', color: '#8b5cf6' },
                            { icon: <Smartphone size={28} />, title: 'Open Finance Real-Time', desc: 'Conecte contas do Itaú, Nubank, Banco do Brasil e outros para sync automático via APIs seguras.', color: '#10b981' },
                            { icon: <BarChart3 size={28} />, title: 'Relatórios Recharts', desc: 'Gráficos interativos impressionantes. Exporte dados em xlsx/CSV com um clique.', color: '#f59e0b' },
                            { icon: <ShieldCheck size={28} />, title: 'Alertas Inteligentes', desc: 'Seja notificado no WhatsApp caso um gasto atípico ocorra ou contas sejam duplicadas.', color: '#06b6d4' },
                            { icon: <Lock size={28} />, title: 'Segurança RLS', desc: 'Infraestrutura isolada no Supabase. Criptografia ponta a ponta e Row Level Security impenetrável.', color: '#a855f7' },
                        ].map((f, i) => (
                            <div key={i} style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '24px', transition: 'transform 0.3s, background 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                                <div style={{ width: '56px', height: '56px', background: `${f.color}15`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '24px' }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>{f.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Calc */}
                <section id="simulador" style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 32px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(153,27,27,0.1))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '32px', padding: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }} className="md:grid-cols-1">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '10px', background: 'rgba(239,68,68,0.15)', borderRadius: '12px', color: '#f87171' }}><Calculator size={24} /></div>
                                <h2 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Simulador de Impacto</h2>
                            </div>
                            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '32px' }}>
                                Mês após mês, usuários do FinanceAI economizam em média 20% extras cortando gastos invisíveis através de nossas análises prontas.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>Sua Renda (Mensal)</label>
                                        <span style={{ fontWeight: 800 }}>R$ {calcData.renda.toLocaleString()}</span>
                                    </div>
                                    <input type="range" min="1000" max="30000" step="500" value={calcData.renda} onChange={e => setCalcData(d => ({ ...d, renda: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#ef4444' }} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>Seus Gastos</label>
                                        <span style={{ fontWeight: 800 }}>R$ {calcData.gastos.toLocaleString()}</span>
                                    </div>
                                    <input type="range" min="500" max="25000" step="500" value={calcData.gastos} onChange={e => setCalcData(d => ({ ...d, gastos: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#ef4444' }} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>Horizonte de Tempo</label>
                                        <span style={{ fontWeight: 800 }}>{calcData.meses} meses</span>
                                    </div>
                                    <input type="range" min="1" max="60" step="1" value={calcData.meses} onChange={e => setCalcData(d => ({ ...d, meses: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#ef4444' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 16px' }}>AO LONGO DE {calcData.meses} MESES, VOCÊ ACUMULA:</p>
                            <p style={{ fontSize: '56px', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', background: econMensal > 0 ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #ef4444, #fca5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                R$ {projecao.toLocaleString()}
                            </p>
                            <p style={{ margin: '16px 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>
                                {econMensal > 0 ? 'Sem investimentos. Só com gestão.' : 'Atenção: seus gastos superam sua renda. Precisamos agir.'}
                            </p>
                            <button onClick={() => navigate('/auth/register')} style={{ marginTop: '32px', width: '100%', padding: '16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '100px', color: '#f87171', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                                Começar Plano Real Agora
                            </button>
                        </div>
                    </div>
                </section>

                <section id="seguranca" style={{ padding: '80px 32px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 24px' }}>Bank-grade security.</h2>
                        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginBottom: '48px', lineHeight: 1.6 }}>Nós não vendemos seus dados. Seu banco de dados privado roda em isolamento dentro da infraestrutura do Supabase.</p>
                        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {['Criptografia AES-256', 'Policies RLS Estritas', 'Open Finance Seguro', 'Não lemos seus dados'].map(s => (
                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700 }}>
                                    <CheckCircle size={20} /> <span style={{ color: 'white' }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 32px 40px', marginTop: '80px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <ShieldCheck size={28} color="#ef4444" />
                                <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>Finance<span style={{ color: '#f87171' }}>AI</span></span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontSize: '14px' }}>© 2026 FinanceAI Inc. All rights reserved.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '48px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h4 style={{ fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Produto</h4>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>Features</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>Preços</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>Open Finance</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h4 style={{ fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Empresa</h4>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>Sobre</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>Blog</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>Segurança</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
