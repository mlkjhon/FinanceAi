import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ShieldCheck, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './contexts/AuthContext';

// Pages (lazy load)
import LandingPage from './LandingPage';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Chat from './Chat';
import Spreadsheet from './Spreadsheet';
import Profile from './Profile';

// New pages
import Transactions from './pages/Transactions';
import Forecast from './pages/Forecast';
import BankAccounts from './pages/BankAccounts';
import Alerts from './pages/Alerts';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import WhatsApp from './pages/WhatsApp';

// ─── Loading Screen ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', background: '#050505', color: 'white',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '24px', fontFamily: "'Inter', sans-serif",
  }}>
    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '3px solid rgba(239, 68, 68, 0.1)', borderTopColor: '#ef4444',
        animation: 'spin 1s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: '8px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #ef4444, #991b1b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
      }}>
        <ShieldCheck size={32} color="white" />
      </div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Finance<span style={{ color: '#f87171' }}>AI</span>
      </h2>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.05em' }}>
        Preparando ambiente seguro...
      </p>
    </div>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes slideFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  </div>
);

// ─── App Layout (authenticated) ──────────────────────────────────────────────
const AppLayout: React.FC<{ onLogout: () => void; profile: any }> = ({ onLogout, profile }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#030303', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', top: '-5%', right: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-5%', left: '-5%', width: '25%', height: '25%', background: 'radial-gradient(circle, rgba(153,27,27,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Sidebar
        profile={profile}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main content area */}
      <main style={{
        marginLeft: sidebarCollapsed ? '72px' : '240px',
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        padding: '32px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Mobile header */}
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => setSidebarCollapsed(p => !p)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', color: 'white', cursor: 'pointer' }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 800, fontSize: '18px' }}>Finance<span style={{ color: '#f87171' }}>AI</span></span>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ animation: 'slideFadeIn 0.3s ease-out' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/chat" element={<Chat avatarUrl={profile?.avatar_url} userName={profile?.nome || 'Usuário'} />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/spreadsheet" element={<Spreadsheet />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/banks" element={<BankAccounts />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/profile" element={<Profile onLogout={onLogout} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {!user ? (
              <>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/login" element={<Auth />} />
                <Route path="/auth/register" element={<Auth />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <Route path="*" element={<AppLayout profile={profile} onLogout={signOut} />} />
            )}
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
