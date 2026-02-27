const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'finance-ai-secret-2024';

const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
};

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Token inválido' });

    req.user = decoded;
    next();
};

const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    next();
};

module.exports = {
    signToken,
    verifyToken,
    hashPassword,
    comparePassword,
    authMiddleware,
    adminMiddleware
};
