const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./lib/prisma');
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
async function ensureCategory(nome, tipo, userId) {
  let cat = await prisma.category.findFirst({
    where: { nome: { equals: nome }, OR: [{ userId: null }, { userId }] }
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: { nome, tipo, userId }
    });
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
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hashedPassword = await hashPassword(password);
    const userCount = await prisma.user.count();
    const role = (adminCode === 'ADMIN123') ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { nome, email, password: hashedPassword, role }
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, onboardingDone: user.onboardingDone } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, onboardingDone: user.onboardingDone, onboardingData: user.onboardingData ? JSON.parse(user.onboardingData) : null, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ─── User Profile & Onboarding ───────────────────────────────────────────────

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    res.json({ ...req.user, onboardingDone: user.onboardingDone, onboardingData: user.onboardingData ? JSON.parse(user.onboardingData) : null, avatarUrl: user.avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao validar sessão' });
  }
});

app.post('/api/user/avatar', authMiddleware, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'Nenhuma foto enviada' });

  // Apenas aceita strings base64
  if (avatar.length > 5000000) return res.status(413).json({ error: 'Imagem muito grande' });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: avatar }
  });
  res.json({ success: true, avatarUrl: avatar });
});

app.post('/api/user/onboarding', authMiddleware, async (req, res) => {
  const { onboardingData } = req.body;
  await prisma.user.update({
    where: { id: req.user.id },
    data: { onboardingDone: true, onboardingData: JSON.stringify(onboardingData) }
  });
  res.json({ success: true });
});

// ─── Category Routes ──────────────────────────────────────────────────────────

app.get('/api/categories', authMiddleware, async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId: req.user.id }] },
    orderBy: { nome: 'asc' }
  });
  res.json(categories);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const { nome, tipo } = req.body;
  const existing = await prisma.category.findFirst({
    where: { nome, userId: req.user.id }
  });
  if (existing) return res.status(400).json({ error: 'Categoria já existe' });

  const cat = await prisma.category.create({
    data: { nome, tipo, userId: req.user.id }
  });
  res.json(cat);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || cat.userId !== req.user.id) return res.status(403).json({ error: 'Não permitido' });

  // Mover transações para 'Outros' antes de deletar
  const outros = await ensureCategory('Outros', cat.tipo, null);
  await prisma.transaction.updateMany({
    where: { categoriaId: id, userId: req.user.id },
    data: { categoriaId: outros.id }
  });

  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
});

// ─── Transaction Routes ───────────────────────────────────────────────────────

app.get('/api/transactions', authMiddleware, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    include: { categoria: true },
    orderBy: { data: 'desc' }
  });
  res.json(transactions);
});

app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  const { valor, descricao, data, categoriaId, tipo } = req.body;
  const id = parseInt(req.params.id);

  const trans = await prisma.transaction.update({
    where: { id, userId: req.user.id },
    data: { valor, descricao, data, categoriaId, tipo }
  });
  res.json(trans);
});

app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  await prisma.transaction.delete({
    where: { id: parseInt(req.params.id), userId: req.user.id }
  });
  res.json({ success: true });
});

// ─── Goals Routes ────────────────────────────────────────────────────────────

app.get('/api/goals', authMiddleware, async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.user.id } });
  res.json(goals);
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  const { name, target, current, color, icon } = req.body;
  if (!name || target === undefined) return res.status(400).json({ error: 'Nome e valor alvo são obrigatórios' });
  try {
    const goal = await prisma.goal.create({
      data: { name, target: Number(target), current: Number(current) || 0, color: color || '#3b82f6', icon: icon || 'Target', userId: req.user.id }
    });
    res.json(goal);
  } catch (e) {
    console.error('[POST /goals]', e);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  const { current, name, target, color, icon } = req.body;
  const updateData = {};
  if (current !== undefined) updateData.current = Number(current);
  if (name) updateData.name = name;
  if (target !== undefined) updateData.target = Number(target);
  if (color) updateData.color = color;
  if (icon) updateData.icon = icon;
  try {
    const goal = await prisma.goal.update({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      data: updateData
    });
    res.json(goal);
  } catch (e) {
    console.error('[PUT /goals]', e);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.goal.delete({ where: { id: parseInt(req.params.id), userId: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

// ─── Notification Routes ─────────────────────────────────────────────────────

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(notifications);
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, lida: false },
    data: { lida: true }
  });
  res.json({ success: true });
});

// ─── Chat & AI Logic ─────────────────────────────────────────────────────────

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória' });

  await prisma.chatMessage.create({ data: { texto: message, sender: 'user', userId: req.user.id } });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado ou sessão expirada' });
    const onboarding = user.onboardingData ? JSON.parse(user.onboardingData) : {};
    const categories = await prisma.category.findMany({ where: { OR: [{ userId: null }, { userId: req.user.id }] } });
    const catList = categories.map(c => c.nome).join(', ');

    const history = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      take: 8,
      orderBy: { createdAt: 'desc' }
    });
    const historyText = history.reverse().map(m => `${m.sender === 'user' ? user.nome : 'Mentor'}: ${m.texto}`).join('\n');

    // Pegar as últimas 3 transações para contexto
    const recentTrans = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { categoria: true }
    });
    const transContext = recentTrans.length > 0
      ? recentTrans.map(t => `- ${t.tipo === 'gasto' ? '💸 Gastou' : '💰 Ganhou'} R$${t.valor} em ${t.categoria.nome} (${t.data})`).join('\n')
      : '(Nenhuma transação recente)';

    const today = new Date().toISOString().split('T')[0];
    const userGoals = await prisma.goal.findMany({ where: { userId: req.user.id } });
    const goalsContext = userGoals.length > 0
      ? userGoals.map(g => `- "${g.name}": R$ ${g.current?.toFixed(2)} / R$ ${g.target?.toFixed(2)}`).join('\n')
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
        const novaMeta = await prisma.goal.create({
          data: { name: nomeMeta, target: valorAlvo, current: 0, color: '#3b82f6', icon: 'Target', userId: req.user.id }
        });
        const botMsg = `🎯 Meta criada com sucesso! "${novaMeta.name}" — Alvo: R$ ${valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Você pode acompanhar e depositar na aba Metas!`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      } else {
        const botMsg = `Para criar uma meta, informe o valor alvo! Ex: "cria uma meta de viagem de R$ 5.000"`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      }
    }

    // ── Listar metas ─────────────────────────────────────────────────────────
    if (aiResponse.tipo === 'listar_metas') {
      const metas = await prisma.goal.findMany({ where: { userId: req.user.id } });
      if (metas.length === 0) {
        const botMsg = `Você ainda não tem metas cadastradas. Quer criar uma agora? Diga algo como "cria uma meta de viagem de R$ 5.000"!`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      }
      const totalGuardado = metas.reduce((acc, m) => acc + m.current, 0);
      const listaStr = metas.map(m => `• ${m.name}: R$ ${m.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ ${m.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${Math.round((m.current / m.target) * 100)}%)`).join('\n');
      const botMsg = `📊 Suas metas:\n${listaStr}\n\n💰 Total guardado: R$ ${totalGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
      return res.json({ success: true, message: botMsg });
    }

    // ── Movimentar meta existente ────────────────────────────────────────────
    if (aiResponse.tipo === 'meta') {
      const metasNoBanco = await prisma.goal.findMany({ where: { userId: req.user.id } });
      const termo = (aiResponse.meta || '').toLowerCase();
      let targetGoal = metasNoBanco.find(m => m.name.toLowerCase().includes(termo));
      if (!targetGoal && metasNoBanco.length > 0) targetGoal = metasNoBanco[0];

      if (targetGoal) {
        let newVal = targetGoal.current;
        if (aiResponse.acao === 'adicionar') newVal += aiResponse.valor;
        else if (aiResponse.acao === 'remover') newVal -= aiResponse.valor;
        newVal = Math.max(0, newVal);

        await prisma.goal.update({ where: { id: targetGoal.id }, data: { current: newVal } });

        // Notificação de meta concluída
        if (newVal >= targetGoal.target) {
          await prisma.notification.create({
            data: {
              tipo: 'goal',
              mensagem: `🎯 Parabéns! Você concluiu sua meta: ${targetGoal.name}!`,
              userId: req.user.id
            }
          });
        }

        const botMsg = `🎯 Feito! Movimentei R$ ${aiResponse.valor} na sua meta "${targetGoal.name}". Novo saldo: R$ ${newVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      } else {
        const botMsg = `Não encontrei a meta "${aiResponse.meta}". Suas metas atuais: ${metasNoBanco.map(m => m.name).join(', ') || 'nenhuma'}. Crie uma dizendo "cria uma meta de X"!`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      }
    }

    // ── Registrar gasto/ganho ─────────────────────────────────────────────────
    if (aiResponse.tipo === 'gasto' || aiResponse.tipo === 'ganho') {
      const cat = await ensureCategory(aiResponse.categoria, aiResponse.tipo, req.user.id);
      const trans = await prisma.transaction.create({
        data: {
          tipo: aiResponse.tipo,
          valor: aiResponse.valor,
          categoriaId: cat.id,
          descricao: aiResponse.descricao || message,
          data: aiResponse.data || today,
          userId: req.user.id
        }
      });
      const emoji = aiResponse.tipo === 'gasto' ? '💸' : '💰';
      const botMsg = `${emoji} Registrei: ${trans.tipo} de R$ ${trans.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${aiResponse.categoria}${aiResponse.descricao ? ` — "${aiResponse.descricao}"` : ''}`;
      await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
      return res.json({ success: true, data: trans, message: botMsg });
    }

    // ── Resumo Dashboard ──────────────────────────────────────────────────────
    if (aiResponse.tipo === 'dashboard_resumo') {
      const trans = await prisma.transaction.findMany({ where: { userId: req.user.id } });
      const gastos = trans.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.valor, 0);
      const ganhos = trans.filter(t => t.tipo === 'ganho').reduce((sum, t) => sum + t.valor, 0);
      const saldo = ganhos - gastos;
      const botMsg = `📊 **Seu Dashboard Atual:** \n\n🟢 Entradas: R$ ${ganhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🔴 Saídas: R$ ${gastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n💰 Saldo Atual: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nVocê está indo bem! Quer alguma dica de investimento para esse saldo?`;
      await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
      return res.json({ success: true, message: botMsg });
    }

    // ── Rede Social (Buscar e Seguir) ─────────────────────────────────────────
    if (aiResponse.tipo === 'social_buscar' || aiResponse.tipo === 'social_seguir') {
      const nomeBusca = aiResponse.nome || '';
      const usuarios = await prisma.user.findMany({ where: { nome: { contains: nomeBusca }, id: { not: req.user.id } }, take: 5 });

      if (usuarios.length === 0) {
        const botMsg = `Não encontrei ninguém chamado "${nomeBusca}" na rede social. 😕`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      }

      if (aiResponse.tipo === 'social_seguir') {
        const alvo = usuarios[0];
        try {
          await prisma.follow.create({ data: { followerId: req.user.id, followingId: alvo.id } });

          // Notificação para quem foi seguido
          await prisma.notification.create({
            data: {
              tipo: 'follower',
              mensagem: `👤 ${user.nome} começou a seguir você!`,
              userId: alvo.id
            }
          });

          const botMsg = `✅ Comecei a seguir **${alvo.nome}** pra você! Vá na aba Social para conferir.`;
          await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
          return res.json({ success: true, message: botMsg });
        } catch {
          const botMsg = `Você já segue **${alvo.nome}**!`;
          await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
          return res.json({ success: true, message: botMsg });
        }
      } else {
        const botMsg = `🔍 Achei estas pessoas: ${usuarios.map(u => u.nome).join(', ')}. Se quiser posso seguir algum deles! Diga "seguir [nome]".`;
        await prisma.chatMessage.create({ data: { texto: botMsg, sender: 'bot', userId: req.user.id } });
        return res.json({ success: true, message: botMsg });
      }
    }

    const conversaMsg = aiResponse.resposta || 'Não entendi. Pode me dizer um gasto, ganho, pedir resumo do dashboard ou alguma dica financeira?';
    await prisma.chatMessage.create({ data: { texto: conversaMsg, sender: 'bot', userId: req.user.id } });
    res.json({ success: true, message: conversaMsg });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no processamento' });
  }
});

app.get('/api/chat/history', authMiddleware, async (req, res) => {
  const history = await prisma.chatMessage.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'asc' },
    take: 50
  });
  res.json(history);
});

// ─── Social / Follow Routes ───────────────────────────────────────────────────

app.get('/api/social/search', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { nome: { contains: q } },
              { email: { contains: q } }
            ]
          },
          { id: { not: req.user.id } }
        ]
      },
      take: 15,
      select: { id: true, nome: true, avatarUrl: true, email: true }
    });

    // Verificar quais já estamos seguindo
    const myFollows = await prisma.follow.findMany({ where: { followerId: req.user.id } });
    const followingIds = new Set(myFollows.map(f => f.followingId));

    const result = users.map(u => ({
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
  const follows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    include: { following: { select: { id: true, nome: true, avatarUrl: true } } }
  });
  const result = follows.map(f => ({ ...f.following, isFollowing: true }));
  res.json(result);
});

app.get('/api/social/followers', authMiddleware, async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { followingId: req.user.id },
    include: { follower: { select: { id: true, nome: true, avatarUrl: true } } }
  });

  // Verificar quais desses eu também sigo de volta
  const myFollows = await prisma.follow.findMany({ where: { followerId: req.user.id } });
  const followingIds = new Set(myFollows.map(f => f.followingId));

  const result = follows.map(f => ({ ...f.follower, isFollowing: followingIds.has(f.follower.id) }));
  res.json(result);
});

app.post('/api/social/follow/:id', authMiddleware, async (req, res) => {
  const followingId = parseInt(req.params.id);
  if (followingId === req.user.id) return res.status(400).json({ error: 'Você não pode seguir a si mesmo' });

  try {
    await prisma.follow.create({ data: { followerId: req.user.id, followingId } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Já está seguindo este usuário' });
  }
});

app.delete('/api/social/follow/:id', authMiddleware, async (req, res) => {
  const followingId = parseInt(req.params.id);
  await prisma.follow.deleteMany({ where: { followerId: req.user.id, followingId } });
  res.json({ success: true });
});

app.post('/api/correct', authMiddleware, async (req, res) => {
  const { transactionId, novaCategoriaId } = req.body;
  const trans = await prisma.transaction.update({
    where: { id: transactionId, userId: req.user.id },
    data: { categoriaId: novaCategoriaId }
  });
  res.json({ success: true });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  const userCount = await prisma.user.count();
  const transCount = await prisma.transaction.count();
  const sumVal = await prisma.transaction.aggregate({ _sum: { valor: true } });
  const recentUsers = await prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, nome: true, email: true, role: true, createdAt: true, onboardingDone: true } });

  const transByDay = await prisma.transaction.groupBy({
    by: ['data'],
    _count: { id: true },
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { data: 'asc' }
  });

  res.json({
    totalUsers: userCount,
    totalTransactions: transCount,
    totalVolume: sumVal._sum.valor || 0,
    recentUsers,
    activity: transByDay
  });
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
