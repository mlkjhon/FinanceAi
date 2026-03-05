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
import api from './api';
import { ToastProvider, useToast } from './components/Toast';

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface User {
  id: number;
  nome: string;
  email: string;
  role: 'USER' | 'ADMIN';
  onboardingDone: boolean;
  avatarUrl?: string;
}

// ─── Componente Lembrete 2FA ──────────────────────────────────────────────────
const TwoFaReminder = ({ userName, onClose }: { userName: string, onClose: () => void }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="glass" style={{ maxWidth: '450px', width: '100%', padding: '32px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.4)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
          ✕
        </button>
        <div style={{ width: '64px', height: '64px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldCheck color="#f59e0b" size={32} />
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Ative o 2FA, {userName.split(' ')[0]}!</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          Notamos que você ainda não ativou a <strong>Autenticação de 2 Fatores (2FA)</strong>.
          Para a segurança dos seus dados financeiros, recomendamos fortemente ativar esta proteção.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            Lembrar depois
          </button>
          <Link to="/profile" onClick={onClose} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', textDecoration: 'none', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
            Ativar Agora
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Layout Principal ────────────────────────────────────────────────────────
const AppLayout = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const location = useLocation();
  const isAdmin = user.role === 'ADMIN';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [show2FAReminder, setShow2FAReminder] = useState(false);

  useEffect(() => {
    // Verificar lembrete 2FA
    if (user && !(user as any).twofa_enabled) {
      const lastReminder = localStorage.getItem(`2fa_reminder_${user.id}`);
      const now = Date.now();
      // Mostrar se nunca mostrou ou se passou 24h
      if (!lastReminder || now - parseInt(lastReminder) > 24 * 60 * 60 * 1000) {
        setShow2FAReminder(true);
      }
    }
  }, [user]);

  const handleClose2FAReminder = () => {
    localStorage.setItem(`2fa_reminder_${user.id}`, Date.now().toString());
    setShow2FAReminder(false);
  };

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
      minHeight: '100vh', background: 'radial-gradient(circle at top right, #0a0a0a, #000000)',
      color: 'white', fontFamily: "'Inter', sans-serif"
    }}>
      {show2FAReminder && <TwoFaReminder userName={user.nome} onClose={handleClose2FAReminder} />}

      {/* Background Glows */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(153, 27, 27, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)',
        background: 'rgba(5, 5, 5, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
          }}>
            <ShieldCheck color="white" size={24} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Finance<span style={{ color: '#f87171' }}>AI</span></h1>
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
          {isAdmin && navItem('/admin', 'Admin', ShieldCheck)}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(5, 5, 5, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) markAsRead();
              }}
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px',
                borderRadius: '50%', transition: 'all 0.2s', position: 'relative'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #050505' }} />
              )}
            </button>
            {showNotifications && (
              <div className="glass" style={{ position: 'absolute', right: 0, top: 'calc(100% + 12px)', width: '320px', padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={16} color="#ef4444" /> Notificações
                  </h3>
                  {unreadCount > 0 && <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 8px', borderRadius: '10px', fontWeight: 700 }}>{unreadCount} novas</span>}
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '12px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      <Bell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '12px 14px', borderRadius: '16px',
                        background: n.lida ? 'transparent' : 'rgba(239, 68, 68,0.05)',
                        marginBottom: '4px', border: '1px solid transparent',
                        transition: 'all 0.2s', cursor: 'default'
                      }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ width: '8px', height: '8px', background: n.lida ? 'rgba(255,255,255,0.1)' : '#ef4444', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', color: n.lida ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>{n.mensagem}</p>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', display: 'block', fontWeight: 500 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

          <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 16px 4px 6px', background: 'transparent', borderRadius: '100px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 800 }}>{user.nome.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{user.nome.split(' ')[0]}</span>
          </Link>

          <button
            onClick={onLogout}
            style={{ padding: '0', background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', transition: 'all 0.2s', marginLeft: '4px' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div key={location.pathname} style={{ animation: 'slideFadeIn 0.3s ease-out' }}>
          <Routes>
            <Route path="/" element={<Chat avatarUrl={user.avatarUrl} userName={user.nome} />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile onLogout={onLogout} />} />
            <Route path="/social" element={<Navigate to="/" />} />
            {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {/* Security & Privacy Banner */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
      }}>
        <ShieldCheck size={14} color="#10b981" />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
          Dados protegidos por <strong style={{ color: 'rgba(255,255,255,0.5)' }}>criptografia de ponta a ponta</strong>. Nunca compartilhamos suas informações financeiras.
        </span>
      </footer>
    </div>
  );
};

// ─── Entry Component ────────────────────────────────────────────────────────
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

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
    setOnboardingLoading(true);
    setOnboardingError('');
    try {
      await api.post('/user/onboarding', { onboardingData: data });
      setShowOnboarding(false);
      const updatedUser = user ? { ...user, onboardingDone: true, onboardingData: JSON.stringify(data) } : null;
      setUser(updatedUser);
      if (updatedUser) localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err: any) {
      console.error('Erro ao salvar onboarding', err);
      setOnboardingError(err?.response?.data?.error || 'Erro ao salvar. Tente novamente.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050505', color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '24px', fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid rgba(239, 68, 68, 0.1)', borderTopColor: '#ef4444',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            position: 'absolute', inset: '8px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
            animation: 'pulse 2s infinite'
          }}>
            <ShieldCheck size={32} color="white" />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Finance<span style={{ color: '#f87171' }}>AI</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Preparando seu ambiente seguro...
          </p>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.8; transform: scale(1); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        {showOnboarding && user && (
          <Onboarding
            userName={user.nome}
            onComplete={completeOnboarding}
            loading={onboardingLoading}
            error={onboardingError}
          />
        )}
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
    </ToastProvider>
  );
};

export default App;
