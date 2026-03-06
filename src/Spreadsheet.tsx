import { useNavigate } from 'react-router-dom';
import api from './api';
import { useToast } from './components/Toast';

interface Category {
    id: number;
    nome: string;
    tipo: 'gasto' | 'ganho';
}

interface Row {
    id: string;
    tipo: 'gasto' | 'ganho';
    valor: string;
    categoriaId: string;
    descricao: string;
    data: string;
}

const Spreadsheet = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [rows, setRows] = useState<Row[]>(() => {
        const saved = localStorage.getItem('spreadsheet_draft');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Erro ao carregar rascunho', e);
            }
        }
        return [{ id: '1', tipo: 'gasto', valor: '', categoriaId: '', descricao: '', data: new Date().toISOString().split('T')[0] }];
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' });
    const { showToast } = useToast();
    const [history, setHistory] = useState<Row[]>([]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const { data } = await api.get('/categories');
                setCategories(data);
            } catch (err) {
                console.error('Erro ao buscar categorias', err);
            }
        };
        fetchCats();
    }, []);

    useEffect(() => {
        localStorage.setItem('spreadsheet_draft', JSON.stringify(rows));
    }, [rows]);

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Math.random().toString(36).substr(2, 9),
                tipo: 'gasto',
                valor: '',
                categoriaId: '',
                descricao: '',
                data: new Date().toISOString().split('T')[0]
            }
        ]);
    };

    const removeRow = (id: string) => {
        if (rows.length === 1) return;
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: keyof Row, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSave = async () => {
        const validRows = rows.filter(r => r.valor && parseFloat(r.valor) > 0);
        if (validRows.length === 0) {
            setStatus({ type: 'error', msg: 'Adicione pelo menos um valor válido.' });
            return;
        }

        const rowsWithoutCategory = validRows.filter(r => !r.categoriaId);
        if (rowsWithoutCategory.length > 0) {
            setStatus({ type: 'error', msg: `Selecione a CATEGORIA para todos os registros preenchidos (${rowsWithoutCategory.length} pendentes).` });
            return;
        }

        setLoading(true);
        setStatus({ type: 'none', msg: '' });

        try {
            // Registrar um por um (seguindo o padrão atual do backend)
            // Idealmente o backend teria um endpoint bulk, mas vamos usar o que temos
            await Promise.all(validRows.map(r =>
                api.post('/transactions', {
                    tipo: r.tipo,
                    valor: parseFloat(r.valor),
                    categoriaId: parseInt(r.categoriaId) || null,
                    descricao: r.descricao || 'Registro Via Planilha',
                    data: r.data
                })
            ));

            setStatus({ type: 'success', msg: `${validRows.length} registros salvos com sucesso!` });
            showToast(`${validRows.length} registros salvos!`, 'success');

            // Adicionar ao histórico local da sessão
            setHistory([...validRows, ...history]);

            // Limpar rascunho e resetar linhas
            localStorage.removeItem('spreadsheet_draft');
            setRows([{ id: Math.random().toString(36).substr(2, 9), tipo: 'gasto', valor: '', categoriaId: '', descricao: '', data: new Date().toISOString().split('T')[0] }]);
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Erro ao salvar alguns registros. Verifique os dados.' });
        } finally {
            setLoading(false);
        }
    };

    const totalGanhos = rows
        .filter(r => r.tipo === 'ganho' && r.valor)
        .reduce((acc, r) => acc + parseFloat(r.valor), 0);

    const totalGastos = rows
        .filter(r => r.tipo === 'gasto' && r.valor)
        .reduce((acc, r) => acc + parseFloat(r.valor), 0);

    const sobra = totalGanhos - totalGastos;

    const glassStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Registro Rápido</h2>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Interface estilo planilha para múltiplos lançamentos</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ ...glassStyle, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: sobra >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                        <Calculator size={20} color={sobra >= 0 ? '#10b981' : '#ef4444'} />
                        <div>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Sobra Prevista</p>
                            <p style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: sobra >= 0 ? '#10b981' : '#ef4444' }}>
                                R$ {sobra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {status.type !== 'none' && (
                <div style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    color: status.type === 'success' ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: 600 }}>{status.msg}</span>
                </div>
            )}

            <div style={{ ...glassStyle, padding: '1px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)', textAlign: 'left', fontSize: '12px' }}>
                            <th style={{ padding: '20px 24px', fontWeight: 700 }}>TIPO</th>
                            <th style={{ padding: '20px 24px', fontWeight: 700 }}>VALOR (R$)</th>
                            <th style={{ padding: '20px 24px', fontWeight: 700 }}>CATEGORIA</th>
                            <th style={{ padding: '20px 24px', fontWeight: 700 }}>DESCRIÇÃO</th>
                            <th style={{ padding: '20px 24px', fontWeight: 700 }}>DATA</th>
                            <th style={{ padding: '20px 24px', fontWeight: 700, textAlign: 'center' }}>AÇÃO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 24px' }}>
                                    <select
                                        value={row.tipo}
                                        onChange={(e) => updateRow(row.id, 'tipo', e.target.value as any)}
                                        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '10px', outline: 'none', width: '100%' }}
                                    >
                                        <option value="gasto">🔴 Gasto</option>
                                        <option value="ganho">🟢 Ganho</option>
                                    </select>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                    <input
                                        type="number"
                                        value={row.valor}
                                        placeholder="0,00"
                                        onChange={(e) => updateRow(row.id, 'valor', e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '10px', outline: 'none', width: '100%' }}
                                    />
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                    <select
                                        value={row.categoriaId}
                                        onChange={(e) => updateRow(row.id, 'categoriaId', e.target.value)}
                                        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '10px', outline: 'none', width: '100%' }}
                                    >
                                        <option value="">Selecionar...</option>
                                        {categories.filter(c => c.tipo === row.tipo).map(c => (
                                            <option key={c.id} value={c.id}>{c.nome}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                    <input
                                        type="text"
                                        value={row.descricao}
                                        placeholder="Ex: Mercado, Aluguel..."
                                        onChange={(e) => updateRow(row.id, 'descricao', e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '10px', outline: 'none', width: '100%' }}
                                    />
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                    <input
                                        type="date"
                                        value={row.data}
                                        onChange={(e) => updateRow(row.id, 'data', e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '10px', outline: 'none', width: '100%' }}
                                    />
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: rows.length === 1 ? 0.2 : 0.8 }}
                                        disabled={rows.length === 1}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={addRow}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.6)',
                            padding: '10px 32px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        <Plus size={18} /> Adicionar Linha
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '14px 28px', borderRadius: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                        border: 'none',
                        color: 'white',
                        padding: '14px 40px',
                        borderRadius: '14px',
                        fontWeight: 800,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Salvando...' : <><Save size={20} /> Salvar Tudo</>}
                </button>
            </div>

            {history.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calculator size={18} /> Lançamentos desta Sessão
                    </h3>
                    <div style={{ ...glassStyle, padding: '1px', overflow: 'hidden', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <tbody style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {history.map((h, i) => (
                                    <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '12px 24px' }}>{h.tipo === 'ganho' ? '🟢 Ganho' : '🔴 Gasto'}</td>
                                        <td style={{ padding: '12px 24px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>R$ {parseFloat(h.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '12px 24px' }}>{categories.find(c => c.id === parseInt(h.categoriaId))?.nome || '—'}</td>
                                        <td style={{ padding: '12px 24px' }}>{h.descricao || 'Registro Via Planilha'}</td>
                                        <td style={{ padding: '12px 24px' }}>{h.data.split('-').reverse().join('/')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Spreadsheet;
