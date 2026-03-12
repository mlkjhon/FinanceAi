import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, TrendingUp, FileSpreadsheet,
    Building2, Bell, CalendarClock, BarChart3, MessageCircle,
    Wallet, LogOut, ShieldCheck, ChevronRight, X, Menu
} from 'lucide-react';

interface SidebarProps {
    profile: { nome: string; avatar_url?: string | null; role: string } | null;
    onLogout: () => void;
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transações', icon: TrendingUp },
    { path: '/chat', label: 'Chat IA', icon: MessageSquare },
    { path: '/forecast', label: 'Previsões', icon: BarChart3 },
    { path: '/spreadsheet', label: 'Planilhas', icon: FileSpreadsheet },
    { path: '/reports', label: 'Relatórios', icon: BarChart3 },
    { path: '/banks', label: 'Contas Bancárias', icon: Building2 },
    { path: '/reminders', label: 'Lembretes', icon: CalendarClock },
    { path: '/alerts', label: 'Alertas', icon: Bell },
    { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const Sidebar: React.FC<SidebarProps> = ({ profile, onLogout, collapsed, onToggle }) => {
    const location = useLocation();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'ADMIN';

    return (
        <>
            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: collapsed ? '72px' : '240px',
                background: 'rgba(5,5,5,0.95)',
                backdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
            }}>
                {/* Logo */}
                <div style={{
                    padding: collapsed ? '20px 16px' : '20px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: collapsed ? 'center' : 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                        }}>
                            <ShieldCheck size={20} color="white" />
                        </div>
                        {!collapsed && (
                            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                                Finance<span style={{ color: '#f87171' }}>AI</span>
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Toggle button when collapsed */}
                {collapsed && (
                    <button
                        onClick={onToggle}
                        style={{ margin: '8px auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                    >
                        <Menu size={16} />
                    </button>
                )}

                {/* Nav Items */}
                <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {navItems.map(({ path, label, icon: Icon }) => {
                        const active = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
                        return (
                            <Link
                                key={path}
                                to={path}
                                title={collapsed ? label : undefined}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    gap: collapsed ? '0' : '10px',
                                    padding: collapsed ? '12px' : '12px 16px',
                                    borderRadius: '12px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    color: active ? 'white' : 'rgba(255,255,255,0.4)',
                                    textDecoration: 'none',
                                    background: active ? 'rgba(239,68,68,0.15)' : 'transparent',
                                    border: active ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; } }}
                            >
                                <Icon size={18} style={{ flexShrink: 0, color: active ? '#f87171' : 'inherit' }} />
                                {!collapsed && <span>{label}</span>}
                                {!collapsed && active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#f87171' }} />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info + Logout */}
                <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link to="/profile" title={collapsed ? 'Perfil' : undefined} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: collapsed ? '12px' : '10px 12px',
                        borderRadius: '12px', textDecoration: 'none',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        transition: 'background 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ color: 'white', fontSize: '14px', fontWeight: 800 }}>
                                    {(profile?.nome || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {!collapsed && (
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {profile?.nome?.split(' ')[0] || 'Usuário'}
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase' }}>
                                    {profile?.role || 'USER'}
                                </div>
                            </div>
                        )}
                    </Link>

                    <button
                        onClick={onLogout}
                        title={collapsed ? 'Sair' : undefined}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '10px', padding: collapsed ? '12px' : '10px 12px',
                            background: 'transparent', border: 'none', borderRadius: '12px',
                            color: 'rgba(239,68,68,0.6)', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            transition: 'all 0.2s', marginTop: '2px',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}
                    >
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
