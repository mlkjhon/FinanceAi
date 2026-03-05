import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export const useToast = () => useContext(ToastContext);

let toastCounter = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++toastCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
        success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '#10b981' },
        error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '#ef4444' },
        warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '#f59e0b' },
        info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: '#60a5fa' },
    };

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <Info size={20} />,
        info: <Info size={20} />,
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed', bottom: '28px', right: '28px',
                zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px',
                maxWidth: '390px', width: '100%',
            }}>
                {toasts.map(t => {
                    const c = colors[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: '14px',
                                padding: '16px 20px',
                                background: `rgba(10,10,10,0.95)`,
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${c.border}`,
                                borderLeft: `4px solid ${c.icon}`,
                                borderRadius: '16px',
                                boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
                                color: 'white',
                                fontFamily: "'Inter', sans-serif",
                                animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        >
                            <div style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>
                                {icons[t.type]}
                            </div>
                            <p style={{ flex: 1, margin: 0, fontSize: '14px', fontWeight: 500, lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>
                                {t.message}
                            </p>
                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.3)', padding: '0', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', marginTop: '1px',
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
        </ToastContext.Provider>
    );
};

// Modal de Confirmação profissional (substitui window.confirm)
interface ConfirmModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    danger?: boolean;
}

export const ConfirmModal = ({ message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }: ConfirmModalProps) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        animation: 'toastSlideIn 0.2s ease-out'
    }}>
        <div style={{
            background: 'rgba(12,12,12,0.98)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', padding: '32px', maxWidth: '420px', width: '100%',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        }}>
            <div style={{ marginBottom: '8px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                    border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                    color: danger ? '#ef4444' : '#60a5fa',
                }}>
                    {danger ? <XCircle size={24} /> : <Info size={24} />}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'white' }}>Atenção</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6 }}>{message}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <button
                    onClick={onCancel}
                    style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    style={{ flex: 1, padding: '12px', background: danger ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);
