const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./lib/db');
const {
  signToken, hashPassword, comparePassword,
  authMiddleware, adminMiddleware
} = require('./lib/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Proteção Básica de Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors());
app.use(express.json());

// Limiter para prevenir força bruta no Login (max 10 requisições/15min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login vindas deste IP, tente novamente após 15 minutos.' }
});

// Limiter Global para mitigar DDoS
const globalLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 200,
  message: { error: 'Tráfego intenso detectado. Descanse por 2 minutos.' }
});

app.use(globalLimiter);

// ─── Keyword Map Fallback ───────────────────────────────────────────────────
const KEYWORD_MAP = [
  { categoria: 'Alimentação', keywords: ['restaurante', 'comida', 'pizza', 'lanche', 'hambur', 'mercado', 'padaria', 'delivery', 'ifood', 'almoço', 'jantar'] },
  { categoria: 'Moradia', keywords: ['aluguel', 'condomínio', 'iptu', 'luz', 'água', 'gás', 'internet', 'casa', 'apartamento'] },
  { categoria: 'Transporte', keywords: ['uber', '99', 'gasolina', 'combustível', 'ônibus', 'metrô', 'passagem', 'ipva', 'oficina'] },
  { categoria: 'Saúde', keywords: ['farmácia', 'remédio', 'médico', 'consulta', 'exame', 'hospital', 'clínica', 'academia'] },
  { categoria: 'Educação', keywords: ['curso', 'faculdade', 'escola', 'livro', 'mensalidade', 'matrícula', 'aula', 'udemy', 'alura'] },
  { categoria: 'Lazer', keywords: ['cinema', 'show', 'teatro', 'parque', 'viagem', 'hotel', 'airbnb', 'festa', 'jogo', 'streaming'] },
  { categoria: 'Roupas', keywords: ['roupa', 'camisa', 'calça', 'vestido', 'tênis', 'sapato', 'shopping', 'zara', 'renner'] },
  { categoria: 'Tecnologia', keywords: ['celular', 'notebook', 'computador', 'mouse', 'software', 'app', 'carregador'] },
  { categoria: 'Assinatura', keywords: ['netflix', 'spotify', 'amazon', 'clube', 'assinatura', 'mensalidade'] },
  { categoria: 'Renda', keywords: ['salário', 'recebi', 'ganhei', 'freelance', 'bônus', 'pix recebido', 'honorário', 'dividendo'] },
  { categoria: 'Investimento', keywords: ['investimento', 'poupança', 'ações', 'fundo', 'cripto', 'bitcoin', 'aportar'] },
];

// Helper para tratar valores em texto (mil, milhão, bilhão)
function parseMoney(text) {
  const lower = text.toLowerCase().replace(/r\$/g, '').trim();
  let multiplier = 1;
  if (/bilh[ão]o|bilh[õo]es| bi /i.test(lower)) multiplier = 1000000000;
  else if (/milh[ão]o|milh[õo]es| mi /i.test(lower)) multiplier = 1000000;
  else if (/ mil /i.test(lower)) multiplier = 1000;

  const match = lower.match(/[\d.]+(?:[.,]\d+)?/);
  if (!match) return 0;
  const val = parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
  return val * multiplier;
}

// Helper para garantir categoria (busca global ou do usuário)
// Helper para garantir categoria (busca global ou do usuário)
async function ensureCategory(nome, tipo, userId) {
  let result = await db.query(
    'SELECT * FROM "Category" WHERE nome = $1 AND ("userId" IS NULL OR "userId" = $2)',
    [nome, userId]
  );
  let cat = result.rows[0];
  if (!cat) {
    const insert = await db.query(
      'INSERT INTO "Category" (nome, tipo, "userId") VALUES ($1, $2, $3) RETURNING *',
      [nome, tipo, userId]
    );
    cat = insert.rows[0];
  }
  return cat;
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { nome, email, password, adminCode } = req.body;
  if (!nome || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });

  // Validação de complexidade
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres contendo letras e números.' });
  }

  try {
    const existingResult = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hashedPassword = await hashPassword(password);
    const role = (adminCode === 'ADMIN123') ? 'ADMIN' : 'USER';

    const insertResult = await db.query(
      'INSERT INTO "User" (nome, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, email, hashedPassword, role]
    );
    const user = insertResult.rows[0];

    const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, onboardingDone: user.onboardingDone } });
  } catch (err) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário', details: err.message });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, onboardingDone: user.onboardingDone, onboardingData: user.onboardingData ? JSON.parse(user.onboardingData) : null, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'Erro ao fazer login', details: err.message });
  }
});

// ─── User Profile & Onboarding ───────────────────────────────────────────────

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "User" WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    res.json({ ...req.user, onboardingDone: user.onboardingdone, onboardingData: user.onboardingdata ? JSON.parse(user.onboardingdata) : null, avatarUrl: user.avatarurl });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao validar sessão' });
  }
});

app.post('/api/user/avatar', authMiddleware, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'Nenhuma foto enviada' });

  // Apenas aceita strings base64
  if (avatar.length > 5000000) return res.status(413).json({ error: 'Imagem muito grande' });

  await db.query(
    'UPDATE "User" SET "avatarUrl" = $1 WHERE id = $2',
    [avatar, req.user.id]
  );
  res.json({ success: true, avatarUrl: avatar });
});

app.post('/api/user/onboarding', authMiddleware, async (req, res) => {
  const { onboardingData } = req.body;
  await db.query(
    'UPDATE "User" SET "onboardingDone" = TRUE, "onboardingData" = $1 WHERE id = $2',
    [JSON.stringify(onboardingData), req.user.id]
  );
  res.json({ success: true });
});

// ─── Category Routes ──────────────────────────────────────────────────────────

app.get('/api/categories', authMiddleware, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM "Category" WHERE "userId" IS NULL OR "userId" = $1 ORDER BY nome ASC',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const { nome, tipo } = req.body;
  const existing = await db.query(
    'SELECT * FROM "Category" WHERE nome = $1 AND "userId" = $2',
    [nome, req.user.id]
  );
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Categoria já existe' });

  const result = await db.query(
    'INSERT INTO "Category" (nome, tipo, "userId") VALUES ($1, $2, $3) RETURNING *',
    [nome, tipo, req.user.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const check = await db.query('SELECT * FROM "Category" WHERE id = $1', [id]);
  const cat = check.rows[0];
  if (!cat || (cat.userId && cat.userId !== req.user.id)) return res.status(403).json({ error: 'Não permitido' });

  // Mover transações para 'Outros' antes de deletar
  const outros = await ensureCategory('Outros', cat.tipo, null);
  await db.query(
    'UPDATE "Transaction" SET "categoriaId" = $1 WHERE "categoriaId" = $2 AND "userId" = $3',
    [outros.id, id, req.user.id]
  );

  await db.query('DELETE FROM "Category" WHERE id = $1', [id]);
  res.json({ success: true });
});

// ─── Transaction Routes ───────────────────────────────────────────────────────

app.get('/api/transactions', authMiddleware, async (req, res) => {
  const result = await db.query(
    `SELECT t.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
     FROM "Transaction" t 
     LEFT JOIN "Category" c ON t."categoriaId" = c.id 
     WHERE t."userId" = $1 
     ORDER BY t.data DESC`,
    [req.user.id]
  );
  // Formatar para manter compatibilidade: trans.categoria.nome -> trans.categoria_nome
  const formatted = result.rows.map(r => ({
    ...r,
    categoria: { nome: r.categoria_nome, tipo: r.categoria_tipo }
  }));
  res.json(formatted);
});

app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  const { valor, descricao, data, categoriaId, tipo } = req.body;
  const id = parseInt(req.params.id);

  const result = await db.query(
    'UPDATE "Transaction" SET valor = $1, descricao = $2, data = $3, "categoriaId" = $4, tipo = $5 WHERE id = $6 AND "userId" = $7 RETURNING *',
    [valor, descricao, data, categoriaId, tipo, id, req.user.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  await db.query('DELETE FROM "Transaction" WHERE id = $1 AND "userId" = $2', [parseInt(req.params.id), req.user.id]);
  res.json({ success: true });
});

// ─── Goals Routes ────────────────────────────────────────────────────────────

app.get('/api/goals', authMiddleware, async (req, res) => {
  const result = await db.query('SELECT * FROM "Goal" WHERE "userId" = $1', [req.user.id]);
  res.json(result.rows);
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  const { name, target, current, color, icon } = req.body;
  if (!name || target === undefined) return res.status(400).json({ error: 'Nome e valor alvo são obrigatórios' });
  try {
    const result = await db.query(
      'INSERT INTO "Goal" (name, target, current, color, icon, "userId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, Number(target), Number(current) || 0, color || '#3b82f6', icon || 'Target', req.user.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('[POST /goals]', e);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  const { current, name, target, color, icon } = req.body;
  const id = parseInt(req.params.id);
  try {
    const result = await db.query(
      'UPDATE "Goal" SET current = COALESCE($1, current), name = COALESCE($2, name), target = COALESCE($3, target), color = COALESCE($4, color), icon = COALESCE($5, icon) WHERE id = $6 AND "userId" = $7 RETURNING *',
      [current, name, target, color, icon, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('[PUT /goals]', e);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM "Goal" WHERE id = $1 AND "userId" = $2', [parseInt(req.params.id), req.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

// ─── Notification Routes ─────────────────────────────────────────────────────

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20',
    [req.user.id]
  );
  res.json(result.rows);
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  await db.query(
    'UPDATE "Notification" SET lida = TRUE WHERE "userId" = $1 AND lida = FALSE',
    [req.user.id]
  );
  res.json({ success: true });
});

// ─── Chat & AI Logic ─────────────────────────────────────────────────────────

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória' });

  await db.query(
    'INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)',
    [message, 'user', req.user.id]
  );

  try {
    const userResult = await db.query('SELECT * FROM "User" WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado ou sessão expirada' });
    const onboarding = user.onboardingdata ? JSON.parse(user.onboardingdata) : {};

    const catResult = await db.query('SELECT nome FROM "Category" WHERE "userId" IS NULL OR "userId" = $1', [req.user.id]);
    const catList = catResult.rows.map(c => c.nome).join(', ');

    const histResult = await db.query(
      'SELECT * FROM "ChatMessage" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 8',
      [req.user.id]
    );
    const historyText = histResult.rows.reverse().map(m => `${m.sender === 'user' ? user.nome : 'Mentor'}: ${m.texto}`).join('\n');

    const transResult = await db.query(
      `SELECT t.*, c.nome as categoria_nome 
       FROM "Transaction" t 
       LEFT JOIN "Category" c ON t."categoriaId" = c.id 
       WHERE t."userId" = $1 
       ORDER BY t.createdAt DESC LIMIT 3`,
      [req.user.id]
    );
    const transContext = transResult.rows.length > 0
      ? transResult.rows.map(t => `- ${t.tipo === 'gasto' ? '💸 Gastou' : '💰 Ganhou'} R$${t.valor} em ${t.categoria_nome} (${t.data})`).join('\n')
      : '(Nenhuma transação recente)';

    const goalsResult = await db.query('SELECT * FROM "Goal" WHERE "userId" = $1', [req.user.id]);
    const goalsContext = goalsResult.rows.length > 0
      ? goalsResult.rows.map(g => `- "${g.name}": R$ ${g.current?.toFixed(2)} / R$ ${g.target?.toFixed(2)}`).join('\n')
      : '(sem metas cadastradas)';

    const prompt = `${historyText}\n\nMentor: Olá, ${user.nome}! Percebi que você está com o objetivo de ${onboarding.objective || 'se organizar'}. 
    Analisei seu perfil ${onboarding.profile} e suas metas atuais.
    Suas últimas transações: ${transContext}
    Metas: ${goalsContext}
    
    AÇÕES DISPONÍVEIS:
    - criar_meta (nome, valor_alvo)
    - listar_metas
    - meta (acao: adicionar|remover, valor, meta)
    - gasto (valor, categoria, descricao, data)
    - ganho (valor, categoria, descricao, data)
    - dashboard_resumo
    - social_buscar (nome)
    - social_seguir (nome)
    - conversa (resposta)

    Responda APENAS com um JSON puro contendo o campo "tipo" e os parâmetros da ação.
    Para valores em "milhão" ou "bilhão", converta para número puro.
    Se o usuário quiser adicionar dinheiro a uma meta, use o tipo "meta" com acao "adicionar".

    Pergunta do Usuário: "${message}"`;

    let aiResponse;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      aiResponse = JSON.parse(text);
    } catch (e) {
      console.error('Gemini Error:', e);
      aiResponse = fallbackParser(message);
    }

    // ── Criar nova meta ──────────────────────────────────────────────────────
    if (aiResponse.tipo === 'criar_meta') {
      const nomeMeta = aiResponse.nome || 'Nova Meta';
      const valorAlvo = Number(aiResponse.valor_alvo) || 0;
      if (valorAlvo > 0) {
        const insert = await db.query(
          'INSERT INTO "Goal" (name, target, current, color, icon, "userId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [nomeMeta, valorAlvo, 0, '#3b82f6', 'Target', req.user.id]
        );
        const novaMeta = insert.rows[0];
        const botMsg = `🎯 Meta criada com sucesso! "${novaMeta.name}" — Alvo: R$ ${valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Você pode acompanhar e depositar na aba Metas!`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      } else {
        const botMsg = `Para criar uma meta, informe o valor alvo! Ex: "cria uma meta de viagem de R$ 5.000"`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      }
    }

    // ── Listar metas ─────────────────────────────────────────────────────────
    if (aiResponse.tipo === 'listar_metas') {
      const goalsResult = await db.query('SELECT * FROM "Goal" WHERE "userId" = $1', [req.user.id]);
      const metas = goalsResult.rows;
      if (metas.length === 0) {
        const botMsg = `Você ainda não tem metas cadastradas. Quer criar uma agora? Diga algo como "cria uma meta de viagem de R$ 5.000"!`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      }
      const totalGuardado = metas.reduce((acc, m) => acc + m.current, 0);
      const listaStr = metas.map(m => `• ${m.name}: R$ ${m.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ ${m.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${Math.round((m.current / m.target) * 100)}%)`).join('\n');
      const botMsg = `📊 Suas metas:\n${listaStr}\n\n💰 Total guardado: R$ ${totalGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
      return res.json({ success: true, message: botMsg });
    }

    // ── Movimentar meta existente ────────────────────────────────────────────
    if (aiResponse.tipo === 'meta') {
      const metasResult = await db.query('SELECT * FROM "Goal" WHERE "userId" = $1', [req.user.id]);
      const metasNoBanco = metasResult.rows;
      const termo = (aiResponse.meta || '').toLowerCase();
      let targetGoal = metasNoBanco.find(m => m.name.toLowerCase().includes(termo));
      if (!targetGoal && metasNoBanco.length > 0) targetGoal = metasNoBanco[0];

      if (targetGoal) {
        let newVal = targetGoal.current;
        if (aiResponse.acao === 'adicionar') newVal += aiResponse.valor;
        else if (aiResponse.acao === 'remover') newVal -= aiResponse.valor;
        newVal = Math.max(0, newVal);

        await db.query('UPDATE "Goal" SET current = $1 WHERE id = $2', [newVal, targetGoal.id]);

        // Notificação de meta concluída
        if (newVal >= targetGoal.target) {
          await db.query(
            'INSERT INTO "Notification" (tipo, mensagem, "userId") VALUES ($1, $2, $3)',
            ['goal', `🎯 Parabéns! Você concluiu sua meta: ${targetGoal.name}!`, req.user.id]
          );
        }

        const botMsg = `🎯 Feito! Movimentei R$ ${aiResponse.valor} na sua meta "${targetGoal.name}". Novo saldo: R$ ${newVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      } else {
        const botMsg = `Não encontrei a meta "${aiResponse.meta}". Suas metas atuais: ${metasNoBanco.map(m => m.name).join(', ') || 'nenhuma'}. Crie uma dizendo "cria uma meta de X"!`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      }
    }

    // ── Registrar gasto/ganho ─────────────────────────────────────────────────
    if (aiResponse.tipo === 'gasto' || aiResponse.tipo === 'ganho') {
      const cat = await ensureCategory(aiResponse.categoria, aiResponse.tipo, req.user.id);
      const insert = await db.query(
        'INSERT INTO "Transaction" (tipo, valor, "categoriaId", descricao, data, "userId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [aiResponse.tipo, aiResponse.valor, cat.id, aiResponse.descricao || message, aiResponse.data || today, req.user.id]
      );
      const trans = insert.rows[0];
      const emoji = aiResponse.tipo === 'gasto' ? '💸' : '💰';
      const botMsg = `${emoji} Registrei: ${trans.tipo} de R$ ${trans.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${aiResponse.categoria}${aiResponse.descricao ? ` — "${aiResponse.descricao}"` : ''}`;
      await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
      return res.json({ success: true, data: trans, message: botMsg });
    }

    // ── Resumo Dashboard ──────────────────────────────────────────────────────
    if (aiResponse.tipo === 'dashboard_resumo') {
      const transResult = await db.query('SELECT * FROM "Transaction" WHERE "userId" = $1', [req.user.id]);
      const trans = transResult.rows;
      const gastos = trans.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.valor, 0);
      const ganhos = trans.filter(t => t.tipo === 'ganho').reduce((sum, t) => sum + t.valor, 0);
      const saldo = ganhos - gastos;
      const botMsg = `📊 **Seu Dashboard Atual:** \n\n🟢 Entradas: R$ ${ganhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🔴 Saídas: R$ ${gastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n💰 Saldo Atual: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nVocê está indo bem! Quer alguma dica de investimento para esse saldo?`;
      await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
      return res.json({ success: true, message: botMsg });
    }

    // ── Rede Social (Buscar e Seguir) ─────────────────────────────────────────
    if (aiResponse.tipo === 'social_buscar' || aiResponse.tipo === 'social_seguir') {
      const nomeBusca = aiResponse.nome || '';
      const userResult = await db.query(
        'SELECT * FROM "User" WHERE nome ILIKE $1 AND id <> $2 LIMIT 5',
        [`%${nomeBusca}%`, req.user.id]
      );
      const usuarios = userResult.rows;

      if (usuarios.length === 0) {
        const botMsg = `Não encontrei ninguém chamado "${nomeBusca}" na rede social. 😕`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      }

      if (aiResponse.tipo === 'social_seguir') {
        const alvo = usuarios[0];
        try {
          await db.query('INSERT INTO "Follow" ("followerId", "followingId") VALUES ($1, $2)', [req.user.id, alvo.id]);

          // Notificação para quem foi seguido
          await db.query(
            'INSERT INTO "Notification" (tipo, mensagem, "userId") VALUES ($1, $2, $3)',
            ['follower', `👤 ${user.nome} começou a seguir você!`, alvo.id]
          );

          const botMsg = `✅ Comecei a seguir **${alvo.nome}** pra você! Vá na aba Social para conferir.`;
          await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
          return res.json({ success: true, message: botMsg });
        } catch {
          const botMsg = `Você já segue **${alvo.nome}**!`;
          await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
          return res.json({ success: true, message: botMsg });
        }
      } else {
        const botMsg = `🔍 Achei estas pessoas: ${usuarios.map(u => u.nome).join(', ')}. Se quiser posso seguir algum deles! Diga "seguir [nome]".`;
        await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [botMsg, 'bot', req.user.id]);
        return res.json({ success: true, message: botMsg });
      }
    }

    const conversaMsg = aiResponse.resposta || 'Não entendi. Pode me dizer um gasto, ganho, pedir resumo do dashboard ou alguma dica financeira?';
    await db.query('INSERT INTO "ChatMessage" (texto, sender, "userId") VALUES ($1, $2, $3)', [conversaMsg, 'bot', req.user.id]);
    res.json({ success: true, message: conversaMsg });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no processamento' });
  }
});

app.get('/api/chat/history', authMiddleware, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM "ChatMessage" WHERE "userId" = $1 ORDER BY "createdAt" ASC LIMIT 50',
    [req.user.id]
  );
  res.json(result.rows);
});

// ─── Social / Follow Routes ───────────────────────────────────────────────────

app.get('/api/social/search', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);

  try {
    const userResult = await db.query(
      `SELECT id, nome, "avatarUrl", email 
       FROM "User" 
       WHERE (nome ILIKE $1 OR email ILIKE $1) AND id <> $2 
       LIMIT 15`,
      [`%${q}%`, req.user.id]
    );

    // Verificar quais já estamos seguindo
    const followResult = await db.query('SELECT "followingId" FROM "Follow" WHERE "followerId" = $1', [req.user.id]);
    const followingIds = new Set(followResult.rows.map(f => f.followingId));

    const result = userResult.rows.map(u => ({
      id: u.id,
      nome: u.nome,
      avatarUrl: u.avatarUrl,
      isFollowing: followingIds.has(u.id)
    }));
    res.json(result);
  } catch (e) {
    console.error('[social/search]', e);
    res.json([]);
  }
});

app.get('/api/social/following', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nome, u."avatarUrl" 
       FROM "Follow" f 
       JOIN "User" u ON f."followingId" = u.id 
       WHERE f."followerId" = $1`,
      [req.user.id]
    );
    const formatted = result.rows.map(u => ({ ...u, isFollowing: true }));
    res.json(formatted);
  } catch (e) {
    console.error('[social/following]', e);
    res.json([]);
  }
});

app.get('/api/social/followers', authMiddleware, async (req, res) => {
  const result = await db.query(
    `SELECT u.id, u.nome, u."avatarUrl" 
     FROM "Follow" f 
     JOIN "User" u ON f."followerId" = u.id 
     WHERE f."followingId" = $1`,
    [req.user.id]
  );

  const myFollowsResult = await db.query('SELECT "followingId" FROM "Follow" WHERE "followerId" = $1', [req.user.id]);
  const followingIds = new Set(myFollowsResult.rows.map(f => f.followingId));

  const formatted = result.rows.map(u => ({ ...u, isFollowing: followingIds.has(u.id) }));
  res.json(formatted);
});

app.post('/api/social/follow/:id', authMiddleware, async (req, res) => {
  const followingId = parseInt(req.params.id);
  if (followingId === req.user.id) return res.status(400).json({ error: 'Você não pode seguir a si mesmo' });

  try {
    await db.query('INSERT INTO "Follow" ("followerId", "followingId") VALUES ($1, $2)', [req.user.id, followingId]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Já está seguindo este usuário' });
  }
});

app.delete('/api/social/follow/:id', authMiddleware, async (req, res) => {
  const followingId = parseInt(req.params.id);
  await db.query('DELETE FROM "Follow" WHERE "followerId" = $1 AND "followingId" = $2', [req.user.id, followingId]);
  res.json({ success: true });
});

app.post('/api/correct', authMiddleware, async (req, res) => {
  const { transactionId, novaCategoriaId } = req.body;
  await db.query(
    'UPDATE "Transaction" SET "categoriaId" = $1 WHERE id = $2 AND "userId" = $3',
    [novaCategoriaId, transactionId, req.user.id]
  );
  res.json({ success: true });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userCountResult = await db.query('SELECT COUNT(*) FROM "User"');
    const transCountResult = await db.query('SELECT COUNT(*) FROM "Transaction"');
    const sumValResult = await db.query('SELECT SUM(valor) FROM "Transaction"');
    const recentUsersResult = await db.query('SELECT id, nome, email, role, "createdAt", "onboardingDone" FROM "User" ORDER BY "createdAt" DESC LIMIT 10');

    const transByDayResult = await db.query(
      `SELECT data, COUNT(id) as count 
       FROM "Transaction" 
       WHERE "createdAt" >= NOW() - INTERVAL '7 days' 
       GROUP BY data 
       ORDER BY data ASC`
    );

    res.json({
      totalUsers: parseInt(userCountResult.rows[0].count),
      totalTransactions: parseInt(transCountResult.rows[0].count),
      totalVolume: parseFloat(sumValResult.rows[0].sum || 0),
      recentUsers: recentUsersResult.rows,
      activity: transByDayResult.rows
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ─── Fallback Parser Helper ──────────────────────────────────────────────────

function fallbackParser(text) {
  const lower = text.toLowerCase();

  // Criar nova meta
  if (/cria|criar|nova meta|adiciona meta|abre meta/.test(lower)) {
    const valorMatch = text.match(/[\d.]+(?:[.,]\d+)?/);
    const valor = valorMatch ? parseFloat(valorMatch[0].replace(/\./g, '').replace(',', '.')) : 0;
    let nome = 'Nova Meta';
    if (lower.includes('viagem')) nome = 'Viagem';
    else if (lower.includes('carro')) nome = 'Carro';
    else if (lower.includes('casa')) nome = 'Casa';
    else if (lower.includes('emergência') || lower.includes('emergencia')) nome = 'Emergência';
    else if (lower.includes('aposentadoria')) nome = 'Aposentadoria';
    if (valor > 0) return { tipo: 'criar_meta', nome, valor_alvo: valor };
  }

  // Listar metas
  if (/metas|minhas metas|quanto guardei|saldo da meta|ver metas|mostras metas/.test(lower)) {
    return { tipo: 'listar_metas' };
  }

  // Dashboard
  if (/resumo|dashboard|gastei|lucro|saldo/.test(lower)) {
    return { tipo: 'dashboard_resumo' };
  }

  // Social
  if (/procura|buscar?|pesquisar|quem é|ache/.test(lower)) {
    const nome = text.split(' ').pop();
    return { tipo: 'social_buscar', nome };
  }
  if (/seguir|sigo|acompanhar/.test(lower)) {
    const nome = text.split(' ').pop();
    return { tipo: 'social_seguir', nome };
  }

  // Movimentar meta existente
  if (lower.includes('meta') || lower.includes('reserva') || lower.includes('objetivo')) {
    const isAdicionar = /adiciona|coloca|guarda|deposita|põe|poe|guardei/.test(lower);
    const isRemover = /tira|remove|saca|resgata/.test(lower);
    const acao = isRemover ? 'remover' : 'adicionar';
    const val = parseMoney(text);
    let nomeGoal = 'reserva';
    if (lower.includes('viagem')) nomeGoal = 'viagem';
    else if (lower.includes('carro')) nomeGoal = 'carro';
    else if (lower.includes('casa')) nomeGoal = 'casa';
    if (val > 0 && (isAdicionar || isRemover)) return { tipo: 'meta', acao, valor: val, meta: nomeGoal };
  }

  // Ganho ou gasto
  const tipo = /ganhei|recebi|salario|salário|entrou|deposito|depósito|renda/.test(lower) ? 'ganho' : 'gasto';
  const valor = parseMoney(text);
  if (valor === 0) return { tipo: 'conversa', resposta: 'Olá! 👋 Sou seu Mentor Financeiro. Posso registrar gastos, ganhos, criar metas ou dar dicas de investimento. Como posso ajudar?' };

  for (const item of KEYWORD_MAP) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return { tipo, valor, categoria: item.categoria, descricao: text, data: new Date().toISOString().split('T')[0] };
    }
  }
  return { tipo, valor, categoria: tipo === 'ganho' ? 'Renda' : 'Outros', descricao: text, data: new Date().toISOString().split('T')[0] };
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
}

module.exports = app;
