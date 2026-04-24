import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    nome: string;
    email: string;
    avatar_url: string | null;
    onboarding_done: boolean;
    role: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
    signUp: (email: string, password: string, nome: string) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
    refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ENABLED = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

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
                 const mockProfile = { id: userId, nome: 'Usuário Demo', email: 'demo@finance.ai', role: 'user', onboarding_done: true, avatar_url: null };
                 setProfile(mockProfile);
            }
        } catch (err) {
            console.error('Erro ao buscar perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (MOCK_ENABLED) {
            const savedUser = localStorage.getItem('finance_ai_user');
            const savedProfile = localStorage.getItem('finance_ai_profile');
            if (savedUser && savedProfile) {
                setUser(JSON.parse(savedUser));
                setProfile(JSON.parse(savedProfile));
                setLoading(false);
            }
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else if (!MOCK_ENABLED || !localStorage.getItem('finance_ai_user')) {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error && MOCK_ENABLED) {
                console.warn('⚠️ Supabase Auth falhou. Usando modo DEMO.');
                const mockUser: any = { id: 'demo-uid', email, user_metadata: { nome: 'Usuário Demo' } };
                const mockProfile: Profile = { id: 'demo-uid', nome: 'Usuário Demo', email, avatar_url: null, onboarding_done: true, role: 'user' };
                
                setUser(mockUser);
                setProfile(mockProfile);
                localStorage.setItem('finance_ai_user', JSON.stringify(mockUser));
                localStorage.setItem('finance_ai_profile', JSON.stringify(mockProfile));
                
                return { data: { user: mockUser, session: {} }, error: null };
            }
            return { data, error };
        } catch (e: any) {
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
                return signIn(email, password);
            }
            return { data, error };
        } catch (e: any) {
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
        if (!user) return { data: null, error: 'No user' };
        
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

    const value = {
        user, profile, session, loading,
        signIn, signUp, signOut, updateProfile,
        refetchProfile: () => user ? fetchProfile(user.id) : Promise.resolve()
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuthContext must be used within an AuthProvider');
    return context;
};
