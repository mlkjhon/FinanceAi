import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Chat from './Chat';
import Dashboard from './Dashboard';
import Auth from './Auth';
import AdminDashboard from './components/AdminDashboard';
import Profile from './Profile';
import Investments from './Investments';
import Goals from './Goals';
import LandingPage from './LandingPage';
import Onboarding from './Onboarding';
import { MessageSquare, LayoutDashboard, LogOut, ShieldCheck, User as UserIcon, TrendingUp, Target, Users, Bell } from 'lucide-react';
import Social from './Social';
import api from './api';

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface User {
  id: number;
  nome: string;
  email: string;
  role: 'USER' | 'ADMIN';
  onboardingDone: boolean;
  avatarUrl?: string;
}

// ─── Layout Principal ────────────────────────────────────────────────────────
const AppLayout = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const location = useLocation();
  const isAdmin = user.role === 'ADMIN';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } catch (e) {
        console.error('Erro ao buscar notificações');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.lida).length;

  const markAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, lida: true })));
    } catch (e) {
      console.error('Erro ao marcar como lidas');
    }
  };

  const navItem = (path: string, label: string, Icon: any) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
          borderRadius: '12px', color: active ? 'white' : 'rgba(255,255,255,0.4)',
          textDecoration: 'none', background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
          transition: 'all 0.2s', fontWeight: 600, fontSize: '14px'
        }}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'radial-gradient(circle at top right, #0a1628, #0a0e1a)',
      color: 'white', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background Glows */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)',
        background: 'rgba(10, 14, 26, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59,130,246,0.4)'
          }}>
            <ShieldCheck color="white" size={24} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Finance<span style={{ color: '#60a5fa' }}>AI</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sistema Online</span>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {navItem('/', 'Chat', MessageSquare)}
          {navItem('/dashboard', 'Dashboard', LayoutDashboard)}
          {navItem('/investments', 'Investimentos', TrendingUp)}
          {navItem('/goals', 'Metas', Target)}
          {navItem('/social', 'Social', Users)}
          {isAdmin && navItem('/admin', 'Admin', ShieldCheck)}
          {navItem('/profile', 'Perfil', UserIcon)}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); if (unreadCount > 0) markAsRead(); }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: 'white', display: 'flex' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', background: '#ef4444', borderRadius: '50%', border: '2px solid #0a0e1a', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {unreadCount}
                </div>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '300px',
                background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 200, padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Notificações</span>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Nenhuma notificação por enquanto</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '10px', borderRadius: '8px', background: n.lida ? 'transparent' : 'rgba(59,130,246,0.05)', marginBottom: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{n.mensagem}</p>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 4px 4px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {user.avatarUrl && <img src={user.avatarUrl} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{user.nome}</span>
            <button
              onClick={onLogout}
              style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '10px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Chat avatarUrl={user.avatarUrl} userName={user.nome} />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/social" element={<Social />} />
          {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

// ─── Entry Component ────────────────────────────────────────────────────────
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/me');
          setUser(data);
          if (!data.onboardingDone) {
            setShowOnboarding(true);
          }
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (!userData.onboardingDone) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowOnboarding(false);
  };

  const completeOnboarding = async (data: any) => {
    try {
      await api.post('/user/onboarding', { onboardingData: data });
      setShowOnboarding(false);
      const updatedUser = user ? { ...user, onboardingDone: true, onboardingData: JSON.stringify(data) } : null;
      setUser(updatedUser);
      if (updatedUser) localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Erro ao salvar onboarding', err);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#0a0e1a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando FinanceAI...</div>;
  }

  return (
    <Router>
      {showOnboarding && user && <Onboarding userName={user.nome} onComplete={completeOnboarding} />}
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
            <Route path="/auth/login" element={<Auth onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <Route path="*" element={<AppLayout user={user} onLogout={handleLogout} />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
