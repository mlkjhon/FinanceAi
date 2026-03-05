import React, { useState } from 'react';
import api from './api';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, ArrowLeft, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ nome: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [requires2FA, setRequires2FA] = useState(false);
    const [twofaCode, setTwofaCode] = useState('');
    const [userId, setUserId] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (requires2FA) {
                // Verify 2FA Code
                const { data } = await api.post('/auth/verify-2fa', { userId, code: twofaCode });
                localStorage.setItem('token', data.token);
                onLogin(data.user);
                return;
            }

            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const { data } = await api.post(endpoint, formData);

            if (data.requires2FA) {
                setRequires2FA(true);
                setUserId(data.userId);
            } else {
                localStorage.setItem('token', data.token);
                onLogin(data.user);
            }
        } catch (err: any) {
            console.error('[Auth Exception]:', err);
            const errResponse = err.response?.data;

            if (err.code === 'ERR_NETWORK') {
                setError('Erro de conexão: Verifique se o servidor backend está rodando na porta 5000.');
            } else if (errResponse) {
                const msg = typeof errResponse.error === 'string' ? errResponse.error :
                    (errResponse.details || errResponse.message || 'Erro inesperado no servidor.');
                setError(msg);
            } else {
                setError('Erro na autenticação. Status: ' + (err.response?.status || 'Desconhecido'));
            }
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
        textAlign: requires2FA ? 'center' as const : 'left' as const,
        letterSpacing: requires2FA ? '4px' : 'normal',
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #3f0909, #050505)', color: 'white',
            padding: '20px', position: 'relative'
        }}>
            {/* Back Button */}
            {!requires2FA && (
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
            )}

            {/* Decorative Glows */}
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(239, 68, 68, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '300px', height: '300px', background: 'rgba(153, 27, 27, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }} />

            <div style={glassStyle}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                        borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                    }}>
                        {requires2FA ? <Lock color="white" size={32} /> : (isLogin ? <User color="white" size={32} /> : <ShieldCheck color="white" size={32} />)}
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        {requires2FA ? 'Verificação Segura' : (isLogin ? 'Bem-vindo de volta' : 'Crie sua conta')}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
                        {requires2FA ? 'Digite o código de 6 dígitos enviado para seu e-mail.' : 'Gerencie suas finanças com IA'}
                    </p>
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
                    {requires2FA ? (
                        <div style={{ position: 'relative' }}>
                            <ShieldCheck style={{ position: 'absolute', left: '16px', top: '16px', color: 'rgba(255,255,255,0.2)' }} size={18} />
                            <input
                                style={{ ...inputStyle, paddingLeft: '48px', paddingRight: '16px' }}
                                type="text"
                                placeholder="000000"
                                required
                                maxLength={6}
                                value={twofaCode}
                                onChange={e => setTwofaCode(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    ) : (
                        <>
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
                                    style={{ ...inputStyle, paddingRight: '48px' }}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '16px', top: '16px',
                                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
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
                            boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                {requires2FA ? <ShieldCheck size={18} /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                                {requires2FA ? 'Verificar e Entrar' : (isLogin ? 'Entrar no Sistema' : 'Criar minha Conta')}
                            </>
                        )}
                    </button>
                    {requires2FA && (
                        <button
                            type="button"
                            onClick={() => { setRequires2FA(false); setTwofaCode(''); setError(''); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer', marginTop: '-10px' }}
                        >
                            Cancelar
                        </button>
                    )}
                </form>

                {!requires2FA && (
                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                        >
                            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
