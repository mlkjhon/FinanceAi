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

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (filters?: { tipo?: string; startDate?: string; endDate?: string; categoryId?: string }) => {
        setLoading(true);
        setError(null);
        try {
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
            if (error) throw error;
            setTransactions(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (input: TransactionInput, comprovanteFile?: File) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        let comprovante_url: string | null = null;
        if (comprovanteFile) {
            const path = `${user.id}/${Date.now()}_${comprovanteFile.name}`;
            const { error: uploadError } = await supabase.storage.from('comprovantes').upload(path, comprovanteFile);
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(path);
                comprovante_url = urlData.publicUrl;
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({ ...input, user_id: user.id, comprovante_url })
            .select('*, categories(id, nome, tipo, cor)')
            .single();

        if (error) throw error;
        setTransactions(prev => [data, ...prev]);
        return data;
    };

    const update = async (id: string, updates: Partial<TransactionInput>) => {
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
