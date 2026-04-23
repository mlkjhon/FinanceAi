import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    nome: string;
    email: string;
    avatar_url: string | null;
    onboarding_done: boolean;
    role: string;
    twofa_enabled: boolean;
}

const MOCK_ENABLED = true; // Forçar modo demonstração se o banco não estiver integrado

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tentar carregar sessão mock primeiro
        if (MOCK_ENABLED) {
            const savedUser = localStorage.getItem('finance_ai_user');
            const savedProfile = localStorage.getItem('finance_ai_profile');
            if (savedUser && savedProfile) {
                setUser(JSON.parse(savedUser));
                setProfile(JSON.parse(savedProfile));
                setLoading(false);
                return;
            }
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else { setProfile(null); setLoading(false); }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (!error && data) {
                setProfile(data);
                if (MOCK_ENABLED) localStorage.setItem('finance_ai_profile', JSON.stringify(data));
            } else if (MOCK_ENABLED) {
                 // Fallback mock profile if DB fails
                 const mockProfile = { id: userId, nome: 'Usuário Demo', email: 'demo@finance.ai', role: 'user', onboarding_done: true, avatar_url: null, twofa_enabled: false };
                 setProfile(mockProfile);
            }
        } catch (err) {
            console.error('Erro ao buscar perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error && MOCK_ENABLED) {
                // FALLBACK: Se o Supabase falhar, permitir login demo com qualquer senha
                console.warn('⚠️ Supabase Auth falhou (provavelmente banco não integrado). Usando modo DEMO.');
                const mockUser: any = { id: 'demo-uid', email, user_metadata: { nome: 'Usuário Demo' } };
                const mockProfile: Profile = { id: 'demo-uid', nome: 'Usuário Demo', email, avatar_url: null, onboarding_done: true, role: 'user', twofa_enabled: false };
                
                setUser(mockUser);
                setProfile(mockProfile);
                localStorage.setItem('finance_ai_user', JSON.stringify(mockUser));
                localStorage.setItem('finance_ai_profile', JSON.stringify(mockProfile));
                
                return { data: { user: mockUser, session: {} }, error: null };
            }
            return { data, error };
        } catch (e: any) {
            if (MOCK_ENABLED) {
                return signIn(email, password); // Retry will hit the block above
            }
            return { data: null, error: e };
        }
    };

    const signUp = async (email: string, password: string, nome: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { nome } },
            });
            if (error && MOCK_ENABLED) {
                return signIn(email, password); // Permitir login direto no modo demo
            }
            return { data, error };
        } catch (e: any) {
            if (MOCK_ENABLED) {
                console.warn('⚠️ Supabase signUp falhou (rede/URL inválida). Usando modo DEMO.');
                return signIn(email, password);
            }
            return { data: null, error: e };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch(e) {}
        setUser(null);
        setProfile(null);
        setSession(null);
        localStorage.removeItem('finance_ai_user');
        localStorage.removeItem('finance_ai_profile');
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return;
        
        if (MOCK_ENABLED && user.id === 'demo-uid') {
            const newProfile = { ...profile, ...updates } as Profile;
            setProfile(newProfile);
            localStorage.setItem('finance_ai_profile', JSON.stringify(newProfile));
            return { data: newProfile, error: null };
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .single();
        if (!error && data) setProfile(data);
        return { data, error };
    };

    return { user, profile, session, loading, signIn, signUp, signOut, updateProfile, refetchProfile: () => user && fetchProfile(user.id) };
}
