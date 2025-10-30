/**
 * Auth Service - Microserviço de Autenticação
 * Gerencia autenticação, autorização e usuários
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
app.use(express.json());

// Conexão PostgreSQL
const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Conexão Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});
redisClient.connect();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'auth-service' });
});

// Registro de usuário
app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Verifica se usuário já existe
        const existingUser = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Usuário já existe' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insere usuário
        const result = await db.query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hashedPassword, name]
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Busca usuário
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Verifica senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Gera token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Armazena sessão no Redis
        await redisClient.setEx(`session:${user.id}`, 86400, token);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
});

// Validação de token
app.post('/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ valid: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verifica se sessão existe no Redis
        const session = await redisClient.get(`session:${decoded.userId}`);

        if (!session) {
            return res.status(401).json({ valid: false });
        }

        res.json({ valid: true, userId: decoded.userId });

    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
