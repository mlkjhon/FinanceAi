import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, LogOut, Calendar,
    Target, Wallet, Trophy, ArrowLeft, Plus
} from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
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
        navigate('/auth');
    };

    if (!user) return null;

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
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                // Save locally temporarily for fast UI update
                const updatedUser = { ...user, avatarUrl: base64String };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Send to backend
                const token = localStorage.getItem('token');
                await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ avatar: base64String })
                });
            } catch (err) {
                console.error("Failed to update avatar", err);
            }
        };
        reader.readAsDataURL(file);
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
        </div>
    );
};

export default Profile;
