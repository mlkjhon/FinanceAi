import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, LogOut, Calendar,
    Target, Wallet, Trophy, ArrowLeft, Plus
} from 'lucide-react';
import api from './api';
import { useToast } from './components/Toast';

interface ProfileProps {
    onLogout?: () => void;
}

const Profile = ({ onLogout }: ProfileProps) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const userData = JSON.parse(stored);
            if (userData.onboardingData && typeof userData.onboardingData === 'string') {
                userData.onboardingData = JSON.parse(userData.onboardingData);
            }
            setUser(userData);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (onLogout) {
            onLogout();
        } else {
            navigate('/auth');
        }
    };

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '32px',
        width: '100%'
    };

    const sectionTitle = {
        fontSize: '12px',
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: '0.1em',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const infoRow = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px'
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.8 quality
                const base64String = canvas.toDataURL('image/jpeg', 0.8);

                try {
                    // Send to backend via axios to use interceptor automatically
                    await api.post('/user/avatar', { avatar: base64String });

                    // Save locally only after successful backend update
                    const updatedUser = { ...user, avatarUrl: base64String };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    showToast('Sua foto de perfil foi atualizada com sucesso!', 'success');
                } catch (err: any) {
                    console.error("Failed to update avatar", err);
                    showToast(err.response?.data?.error || 'Erro ao atualizar foto. Tente uma imagem diferente.', 'error');
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    // Initial check from DB not fully supported in local user yet, so we fetch /me
    useEffect(() => {
        api.get('/me').then(res => {
            setUser((prev: any) => ({ ...prev, twofa_enabled: res.data.twofa_enabled }));
        }).catch(err => console.error(err));
    }, []);
    const [twofaCode, setTwofaCode] = useState('');
    const [loading2FA, setLoading2FA] = useState(false);

    // Move up the early return here AFTER all hooks
    if (!user) return null;

    const handleToggle2FA = async () => {
        try {
            if (user.twofa_enabled) {
                if (window.confirm("Deseja realmente desativar seu 2FA? Sua conta ficará menos segura.")) {
                    await api.post('/auth/enable-2fa', { action: 'disable' });
                    setUser({ ...user, twofa_enabled: false });
                    showToast('2FA desativado com sucesso.', 'success');
                }
            } else {
                setLoading2FA(true);
                await api.post('/auth/enable-2fa', { action: 'request' });
                setIs2FAModalOpen(true);
                showToast('Código enviado para seu e-mail.', 'success');
            }
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Erro ao configurar 2FA', 'error');
        } finally {
            setLoading2FA(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!twofaCode || twofaCode.length < 6) return showToast('Código inválido', 'error');
        setLoading2FA(true);
        try {
            await api.post('/auth/enable-2fa', { action: 'verify', code: twofaCode });
            setUser({ ...user, twofa_enabled: true });
            setIs2FAModalOpen(false);
            setTwofaCode('');
            showToast('Autorização em Duas Etapas ATIVADA!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Erro ao verificar código', 'error');
        } finally {
            setLoading2FA(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: 'white', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header Navigation */}
                <button
                    onClick={() => navigate('/chat')}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '32px' }}
                >
                    <ArrowLeft size={18} /> Voltar para o Chat
                </button>

                <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '40px', letterSpacing: '-0.03em' }}>Minha Conta</h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* Basic Info */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitle}><User size={14} /> DADOS PESSOAIS</h3>
                        <div style={infoRow}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                }}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User color="white" size={32} />
                                    )}
                                </div>
                                <label style={{
                                    position: 'absolute', bottom: '-4px', right: '-4px', background: '#10b981',
                                    width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', cursor: 'pointer', border: '2px solid #020617'
                                }} title="Alterar Foto">
                                    <Plus color="white" size={14} style={{ fontWeight: 800 }} />
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <div>
                                <p style={{ fontSize: '20px', fontWeight: 800 }}>{user.nome}</p>
                                <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px' }}>Membro desde hoje</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>
                            <Mail size={16} /> {user.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: user.role === 'ADMIN' ? '#10b981' : 'rgba(255, 255, 255, 0.6)' }}>
                            <Shield size={16} /> Perfil {user.role}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Financial Onboarding Data */}
                        <div style={cardStyle}>
                            <h3 style={sectionTitle}><Target size={14} /> PERFIL FINANCEIRO</h3>
                            {user.onboardingData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Objetivo:</span>
                                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>{user.onboardingData.objective}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Renda Mensal:</span>
                                        <span style={{ fontWeight: 700 }}>R$ {user.onboardingData.income}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Estilo:</span>
                                        <span style={{ fontWeight: 700 }}>{user.onboardingData.profile}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Meta:</span>
                                        <span style={{ fontWeight: 700 }}>{user.onboardingData.dream}</span>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'rgba(255, 255, 255, 0.2)' }}>Nenhum dado de onboarding disponível.</p>
                            )}
                        </div>

                        {/* Security 2FA */}
                        <div style={{ ...cardStyle, border: user.twofa_enabled ? '1px solid rgba(16, 185, 129, 0.3)' : cardStyle.border }}>
                            <h3 style={{ ...sectionTitle, color: user.twofa_enabled ? '#10b981' : sectionTitle.color }}><Shield size={14} /> SEGURANÇA E LOGIN</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '15px' }}>Verificação em 2 Fatores</p>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Enviaremos um código por e-mail no login</p>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{
                                        width: '44px', height: '24px', borderRadius: '12px',
                                        background: user.twofa_enabled ? '#10b981' : 'rgba(255,255,255,0.1)',
                                        position: 'relative', transition: 'all 0.3s'
                                    }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            background: 'white', position: 'absolute', top: '2px',
                                            left: user.twofa_enabled ? '22px' : '2px', transition: 'all 0.3s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                    <input type="checkbox" checked={!!user.twofa_enabled} onChange={handleToggle2FA} disabled={loading2FA} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Action */}
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: '40px',
                        width: '100%',
                        padding: '16px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        borderRadius: '16px',
                        color: '#f43f5e',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                >
                    <LogOut size={18} /> Sair da Conta
                </button>

                {user.role === 'ADMIN' && (
                    <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', border: '1px dashed rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <p style={{ color: '#10b981', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
                            Você é Administrador. O painel global está disponível no menu superior.
                        </p>
                    </div>
                )}
            </div>

            {/* 2FA Verification Modal */}
            {is2FAModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#0f172a', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '400px',
                        border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Shield color="white" size={32} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Ativar 2FA</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>
                            Nós enviamos um código de 6 dígitos para o seu e-mail ({user.email}). Insira-o abaixo para confirmar a ativação.
                        </p>

                        <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={twofaCode}
                            onChange={(e) => setTwofaCode(e.target.value.replace(/\D/g, ''))}
                            style={{
                                width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                color: 'white', fontSize: '24px', textAlign: 'center', fontWeight: 700,
                                letterSpacing: '4px', outline: 'none', marginBottom: '24px'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setIs2FAModalOpen(false)}
                                disabled={loading2FA}
                                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVerify2FA}
                                disabled={loading2FA || twofaCode.length < 6}
                                style={{ flex: 1, padding: '14px', background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {loading2FA ? 'Verificando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
