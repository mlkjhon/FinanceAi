import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useAuth } from './hooks/useAuth';

const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});

interface AuthProps {
    onLogin?: (user: any) => void;
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '14px 14px 14px 44px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
};

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({ nome: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(e2 => ({ ...e2, [field]: '' }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (mode === 'login') {
            const result = loginSchema.safeParse(form);
            if (!result.success) {
                const errs: Record<string, string> = {};
                result.error.errors.forEach(e => { errs[e.path[0]] = e.message; });
                setErrors(errs);
                return;
            }
            setLoading(true);
            const { error } = await signIn(form.email, form.password);
            setLoading(false);
            if (error) { setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message); return; }
            navigate('/dashboard');

        } else if (mode === 'register') {
            const result = registerSchema.safeParse(form);
            if (!result.success) {
                const errs: Record<string, string> = {};
                result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
                setErrors(errs);
                return;
            }
            setLoading(true);
            const { error } = await signUp(form.email, form.password, form.nome);
            setLoading(false);
            if (error) { setError(error.message); return; }
            setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
            setMode('login');

        } else if (mode === 'forgot') {
            if (!form.email) { setErrors({ email: 'Informe seu e-mail' }); return; }
            setLoading(true);
            const { supabase } = await import('./lib/supabase');
            const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/auth` });
            setLoading(false);
            if (error) { setError(error.message); return; }
            setSuccess('E-mail de recuperação enviado!');
        }
    };

    const iconStyle = { position: 'absolute' as const, left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' as const };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, rgba(239,68,68,0.08) 0%, transparent 40%), #040404',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', fontFamily: "'Inter', sans-serif",
        }}>
            {/* Background glow */}
            <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '10%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(153,27,27,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #ef4444, #991b1b)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(239,68,68,0.3)' }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                        Finance<span style={{ color: '#f87171' }}>AI</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px' }}>
                        {mode === 'login' ? 'Acesse sua conta segura' : mode === 'register' ? 'Crie sua conta gratuita' : 'Recuperar acesso'}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(10,10,10,0.9)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '28px',
                    padding: '40px',
                }}>
                    {/* Mode tabs */}
                    {mode !== 'forgot' && (
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '32px' }}>
                            {(['login', 'register'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => { setMode(m); setError(''); setSuccess(''); setErrors({}); }}
                                    style={{
                                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                        fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
                                        background: mode === m ? 'rgba(239,68,68,0.2)' : 'transparent',
                                        color: mode === m ? '#f87171' : 'rgba(255,255,255,0.4)',
                                    }}
                                >
                                    {m === 'login' ? 'Entrar' : 'Registrar'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Alerts */}
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '14px', color: '#f87171' }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '14px', color: '#34d399' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Nome field for register */}
                        {mode === 'register' && (
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>NOME COMPLETO</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={iconStyle} />
                                    <input
                                        type="text" placeholder="Seu nome" value={form.nome} onChange={set('nome')}
                                        style={{ ...inputStyle, borderColor: errors.nome ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'}
                                        onBlur={e => e.currentTarget.style.borderColor = errors.nome ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                                {errors.nome && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{errors.nome}</p>}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>E-MAIL</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input
                                    type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')}
                                    style={{ ...inputStyle, borderColor: errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'}
                                    onBlur={e => e.currentTarget.style.borderColor = errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                            {errors.email && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{errors.email}</p>}
                        </div>

                        {/* Password */}
                        {mode !== 'forgot' && (
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>SENHA</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={iconStyle} />
                                    <input
                                        type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')}
                                        style={{ ...inputStyle, paddingRight: '48px', borderColor: errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'}
                                        onBlur={e => e.currentTarget.style.borderColor = errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
                                    />
                                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{errors.password}</p>}
                            </div>
                        )}

                        {/* Confirm password */}
                        {mode === 'register' && (
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>CONFIRMAR SENHA</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={iconStyle} />
                                    <input
                                        type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')}
                                        style={{ ...inputStyle, paddingRight: '48px', borderColor: errors.confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'}
                                        onBlur={e => e.currentTarget.style.borderColor = errors.confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                                {errors.confirmPassword && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{errors.confirmPassword}</p>}
                            </div>
                        )}

                        {/* Forgot password link */}
                        {mode === 'login' && (
                            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                                <button type="button" onClick={() => { setMode('forgot'); setError(''); setErrors({}); }} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.7)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                                    Esqueci minha senha
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px', background: loading ? 'rgba(239,68,68,0.5)' : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                                border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 8px 24px rgba(239,68,68,0.3)', transition: 'all 0.2s', marginTop: '8px',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    {mode === 'login' ? 'Entrar no Sistema' : mode === 'register' ? 'Criar Conta' : 'Enviar E-mail'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        {mode === 'forgot' && (
                            <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}>
                                Voltar para login
                            </button>
                        )}
                    </form>
                </div>

                {/* Security badge */}
                <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                        Dados protegidos por criptografia AES-256
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Auth;
