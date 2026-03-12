import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useToast } from './components/Toast';
import { User, Mail, ShieldCheck, Key, LogOut, Check, Loader2, Upload } from 'lucide-react';
import { supabase } from './lib/supabase';

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const };
const card = { background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '32px' };

const Profile: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { profile, updateProfile, session } = useAuth();
    const { showToast } = useToast();
    const [nome, setNome] = useState(profile?.nome || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) { showToast('Nome inv\u00e1lido', 'error'); return; }
        setSaving(true);
        const result = await updateProfile({ nome });
        if (result?.error) showToast('Erro ao atualizar perfil', 'error');
        else showToast('Perfil atualizado com sucesso!', 'success');
        setSaving(false);
    };

    const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${profile.id}/avatar.${ext}`;
            const { error: uploadError } = await supabase.storage.from('comprovantes').upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('comprovantes').getPublicUrl(path);
            await updateProfile({ avatar_url: data.publicUrl });
            showToast('Avatar atualizado!', 'success');
        } catch (err) {
            showToast('Erro ao atualizar avatar', 'error');
        } finally {
            setUploading(false);
        }
    };

    const resetPassword = async () => {
        if (!profile?.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
        if (error) showToast(error.message, 'error');
        else showToast('Link de redefini\u00e7\u00e3o enviado para seu e-mail!', 'success');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Meu Perfil</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Gerencie suas informa\u00e7\u00f5es e seguran\u00e7a</p>
            </div>

            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ position: 'relative' }}>
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'white', fontSize: '32px', fontWeight: 800 }}>{(profile?.nome || 'U').charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#ef4444', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #0a0a0a' }}>
                            {uploading ? <Loader2 size={14} className="animate-spin" color="white" /> : <Upload size={14} color="white" />}
                            <input type="file" hidden accept="image/*" onChange={handleAvatar} disabled={uploading} />
                        </label>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>{profile?.nome}</h2>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {profile?.role === 'admin' ? <ShieldCheck size={14} color="#10b981" /> : <User size={14} />} Plano {profile?.role?.toUpperCase() || 'FINANCEAI PRO'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>NOME COMPLETO</label>
                            <input value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>E-MAIL (N\u00e3o edit\u00e1vel)</label>
                            <input value={profile?.email || session?.user?.email || ''} readOnly style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button type="submit" disabled={saving || nome === profile?.nome} style={{ padding: '12px 24px', background: saving || nome === profile?.nome ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: saving || nome === profile?.nome ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar Altera\u00e7\u00f5es
                        </button>
                    </div>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(6,182,212,0.1)', borderRadius: '10px', color: '#06b6d4' }}><Key size={18} /></div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Seguran\u00e7a da Conta</h3>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
                        Atualize sua senha atrav\u00e9s de um link seguro enviado para o seu e-mail atual.
                    </p>
                    <button onClick={resetPassword} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                        Enviar E-mail de Redefini\u00e7\u00e3o
                    </button>
                </div>

                <div style={{ ...card, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#ef4444' }}><LogOut size={18} /></div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#f87171' }}>Sess\u00e3o Ativa</h3>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
                        Voc\u00ea ser\u00e1 desconectado deste dispositivo.
                    </p>
                    <button onClick={onLogout} style={{ width: '100%', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogOut size={16} /> Encerrar Sess\u00e3o
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
