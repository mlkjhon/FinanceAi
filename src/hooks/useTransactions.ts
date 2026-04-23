import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Transaction {
    id: string;
    user_id: string;
    tipo: 'gasto' | 'ganho';
    valor: number;
    descricao: string;
    data: string;
    category_id: string | null;
    categories?: { id: string; nome: string; tipo: string; cor: string };
    tags: string[];
    recorrencia: 'unica' | 'semanal' | 'mensal' | 'anual';
    recorrencia_fim: string | null;
    comprovante_url: string | null;
    notes: string | null;
    created_at: string;
}

export interface TransactionInput {
    tipo: 'gasto' | 'ganho';
    valor: number;
    descricao: string;
    data: string;
    category_id?: string;
    tags?: string[];
    recorrencia?: 'unica' | 'semanal' | 'mensal' | 'anual';
    recorrencia_fim?: string;
    notes?: string;
}

const MOCK_ENABLED = true;

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (filters?: { tipo?: string; startDate?: string; endDate?: string; categoryId?: string }) => {
        setLoading(true);
        setError(null);
        try {
            if (MOCK_ENABLED) {
                const saved = localStorage.getItem('finance_ai_transactions');
                if (saved) {
                    let data = JSON.parse(saved) as Transaction[];
                    if (filters?.tipo) data = data.filter(t => t.tipo === filters.tipo);
                    if (filters?.startDate) data = data.filter(t => t.data >= filters.startDate!);
                    if (filters?.endDate) data = data.filter(t => t.data <= filters.endDate!);
                    setTransactions(data);
                    setLoading(false);
                    return;
                }
            }

            let query = supabase
                .from('transactions')
                .select('*, categories(id, nome, tipo, cor)')
                .order('data', { ascending: false })
                .order('created_at', { ascending: false });

            if (filters?.tipo) query = query.eq('tipo', filters.tipo);
            if (filters?.startDate) query = query.gte('data', filters.startDate);
            if (filters?.endDate) query = query.lte('data', filters.endDate);
            if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);

            const { data, error } = await query;
            if (error) {
                if (MOCK_ENABLED) {
                    setTransactions([]); // Silently fallback to empty mock if DB error
                } else {
                    throw error;
                }
            } else {
                setTransactions(data || []);
                if (MOCK_ENABLED) localStorage.setItem('finance_ai_transactions', JSON.stringify(data || []));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (input: TransactionInput, comprovanteFile?: File) => {
        let userId = 'demo-uid';
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch(e) {}

        if (MOCK_ENABLED) {
            const newTransaction: Transaction = {
                ...input,
                id: crypto.randomUUID(),
                user_id: userId,
                tags: input.tags || [],
                recorrencia: input.recorrencia || 'unica',
                recorrencia_fim: input.recorrencia_fim || null,
                comprovante_url: null,
                notes: input.notes || null,
                created_at: new Date().toISOString(),
                category_id: input.category_id || null,
                categories: { id: input.category_id || 'other', nome: 'Outros', tipo: input.tipo, cor: '#ccc' }
            };
            const updated = [newTransaction, ...transactions];
            setTransactions(updated);
            localStorage.setItem('finance_ai_transactions', JSON.stringify(updated));
            return newTransaction;
        }

        let comprovante_url: string | null = null;
        if (comprovanteFile) {
            const path = `${userId}/${Date.now()}_${comprovanteFile.name}`;
            const { error: uploadError } = await supabase.storage.from('comprovantes').upload(path, comprovanteFile);
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(path);
                comprovante_url = urlData.publicUrl;
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({ ...input, user_id: userId, comprovante_url })
            .select('*, categories(id, nome, tipo, cor)')
            .single();

        if (error) throw error;
        setTransactions(prev => [data, ...prev]);
        return data;
    };

    const update = async (id: string, updates: Partial<TransactionInput>) => {
        if (MOCK_ENABLED) {
             const updated = transactions.map(t => t.id === id ? { ...t, ...updates } : t) as Transaction[];
             setTransactions(updated);
             localStorage.setItem('finance_ai_transactions', JSON.stringify(updated));
             return updated.find(t => t.id === id);
        }

        const { data, error } = await supabase
            .from('transactions')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, categories(id, nome, tipo, cor)')
            .single();

        if (error) throw error;
        setTransactions(prev => prev.map(t => t.id === id ? data : t));
        return data;
    };

    const remove = async (id: string) => {
        if (MOCK_ENABLED) {
            const updated = transactions.filter(t => t.id !== id);
            setTransactions(updated);
            localStorage.setItem('finance_ai_transactions', JSON.stringify(updated));
            return;
        }
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const totais = {
        ganhos: transactions.filter(t => t.tipo === 'ganho').reduce((a, t) => a + t.valor, 0),
        gastos: transactions.filter(t => t.tipo === 'gasto').reduce((a, t) => a + t.valor, 0),
        saldo: transactions.filter(t => t.tipo === 'ganho').reduce((a, t) => a + t.valor, 0) -
            transactions.filter(t => t.tipo === 'gasto').reduce((a, t) => a + t.valor, 0),
    };

    return { transactions, loading, error, fetch, create, update, remove, totais };
}
