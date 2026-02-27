import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Search, TrendingUp, Target, Award } from 'lucide-react';
import api from './api';

interface SocialUser {
    id: number;
    nome: string;
    avatarUrl?: string;
    isFollowing: boolean;
    goalsCount?: number;
    totalSaved?: number;
}

const Social = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SocialUser[]>([]);
    const [following, setFollowing] = useState<SocialUser[]>([]);
    const [followers, setFollowers] = useState<SocialUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'seguindo' | 'seguidores' | 'descobrir'>('seguindo');

    useEffect(() => {
        fetchFollowData();
    }, []);

    const fetchFollowData = async () => {
        try {
            const [followingRes, followersRes] = await Promise.all([
                api.get('/social/following'),
                api.get('/social/followers'),
            ]);
            setFollowing(followingRes.data);
            setFollowers(followersRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const { data } = await api.get(`/social/search?q=${encodeURIComponent(searchTerm)}`);
            setSearchResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const handleFollow = async (userId: number) => {
        try {
            await api.post(`/social/follow/${userId}`);
            // Atualiza listas
            setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: true } : u));
            fetchFollowData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUnfollow = async (userId: number) => {
        try {
            await api.delete(`/social/follow/${userId}`);
            setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: false } : u));
            fetchFollowData();
        } catch (e) {
            console.error(e);
        }
    };

    const cardStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '20px',
    };

    const UserCard = ({ user, showFollow = true }: { user: SocialUser; showFollow?: boolean }) => (
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.nome} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '18px', flexShrink: 0 }}>
                    {user.nome[0].toUpperCase()}
                </div>
            )}
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'white', margin: 0 }}>{user.nome}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0' }}>Membro FinanceAI</p>
            </div>
            {showFollow && (
                <button
                    onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '12px', border: 'none',
                        background: user.isFollowing ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: user.isFollowing ? '#f87171' : 'white',
                        fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    {user.isFollowing ? <><UserMinus size={14} /> Deixar de seguir</> : <><UserPlus size={14} /> Seguir</>}
                </button>
            )}
        </div>
    );

    const tabStyle = (tab: string): React.CSSProperties => ({
        padding: '10px 20px', border: 'none', borderRadius: '12px', fontWeight: 700,
        fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
        background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: activeTab === tab ? '#60a5fa' : 'rgba(255,255,255,0.4)',
        borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
    });

    return (
        <div style={{ color: 'white', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>Comunidade</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Conecte-se com pessoas que também estão no caminho da liberdade financeira.</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Seguindo', value: following.length, icon: UserPlus, color: '#3b82f6' },
                    { label: 'Seguidores', value: followers.length, icon: Users, color: '#8b5cf6' },
                    { label: 'Comunidade', value: '∞', icon: Award, color: '#10b981' },
                ].map(stat => (
                    <div key={stat.label} style={{ ...cardStyle, textAlign: 'center' as any }}>
                        <div style={{ padding: '10px', background: `${stat.color}15`, borderRadius: '12px', display: 'inline-flex', marginBottom: '12px' }}>
                            <stat.icon size={20} color={stat.color} />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: '4px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '16px' }}>BUSCAR USUÁRIOS</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Digite um nome..."
                        style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '14px' }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Search size={16} /> {searching ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{searchResults.length} resultado(s)</p>
                        {searchResults.map(user => <UserCard key={user.id} user={user} />)}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button style={tabStyle('seguindo')} onClick={() => setActiveTab('seguindo')}>Seguindo ({following.length})</button>
                <button style={tabStyle('seguidores')} onClick={() => setActiveTab('seguidores')}>Seguidores ({followers.length})</button>
            </div>

            {/* Tab Content */}
            {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Carregando...</p>
            ) : activeTab === 'seguindo' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {following.length === 0 ? (
                        <div style={{ ...cardStyle, textAlign: 'center' as any, padding: '48px' }}>
                            <Users size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '16px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Você ainda não está seguindo ninguém.</p>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginTop: '8px' }}>Use a busca acima para encontrar amigos!</p>
                        </div>
                    ) : following.map(u => <UserCard key={u.id} user={u} />)}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {followers.length === 0 ? (
                        <div style={{ ...cardStyle, textAlign: 'center' as any, padding: '48px' }}>
                            <Users size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '16px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Ninguém te segue ainda.</p>
                        </div>
                    ) : followers.map(u => <UserCard key={u.id} user={u} showFollow={true} />)}
                </div>
            )}
        </div>
    );
};

export default Social;
