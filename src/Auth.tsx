import React, { useState } from 'react';
import api from './api';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ nome: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const { data } = await api.post(endpoint, formData);
            localStorage.setItem('token', data.token);
            onLogin(data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro na autenticação. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    const glassStyle = {
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '48px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    };

    const inputStyle = {
        width: '100%',
        padding: '16px 16px 16px 48px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s',
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #0d1b3e, #0a0e1a)', color: 'white',
            padding: '20px', position: 'relative'
        }}>
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute', top: '32px', left: '32px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '12px', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
                <ArrowLeft size={18} />
                Voltar para a Home
            </button>

            {/* Decorative Glows */}
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(59,130,246,0.1)', filter: 'blur(100px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '300px', height: '300px', background: 'rgba(139,92,246,0.1)', filter: 'blur(100px)', borderRadius: '50%' }} />

            <div style={glassStyle}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(59,130,246,0.3)'
                    }}>
                        {isLogin ? <User color="white" size={32} /> : <ShieldCheck color="white" size={32} />}
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Gerencie suas finanças com IA</p>
                </div>

                {error && (
                    <div style={{
                        padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px', color: '#f87171', fontSize: '14px', marginBottom: '24px', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {!isLogin && (
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '16px', top: '16px', color: 'rgba(255,255,255,0.2)' }} size={18} />
                            <input
                                style={inputStyle}
                                type="text"
                                placeholder="Como quer ser chamado?"
                                required
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            />
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: '16px', top: '16px', color: 'rgba(255,255,255,0.2)' }} size={18} />
                        <input
                            style={inputStyle}
                            type="email"
                            placeholder="seu@email.com"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '16px', top: '16px', color: 'rgba(255,255,255,0.2)' }} size={18} />
                        <input
                            style={inputStyle}
                            type="password"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: loading ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginTop: '10px',
                            boxShadow: '0 10px 20px rgba(59,130,246,0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                                {isLogin ? 'Entrar no Sistema' : 'Criar minha Conta'}
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                    >
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
