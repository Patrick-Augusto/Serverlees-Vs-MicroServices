/**
 * Product Service - Microserviço de Produtos
 * Gerencia catálogo de produtos
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

let db;
let redisClient;
let rabbitChannel;

// Conecta ao MongoDB
async function connectMongo() {
    const client = await MongoClient.connect(process.env.MONGO_URL);
    db = client.db('products');
    console.log('Connected to MongoDB');
}

// Conecta ao Redis
async function connectRedis() {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log('Connected to Redis');
}

// Conecta ao RabbitMQ
async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('product-events');
    console.log('Connected to RabbitMQ');
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'product-service' });
});

// Listar produtos
app.get('/products', async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;

        // Verifica cache
        const cacheKey = `products:${category || 'all'}:${page}:${limit}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            return res.json(JSON.parse(cached));
        }

        // Busca no MongoDB
        const query = category ? { category } : {};
        const products = await db.collection('products')
            .find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection('products').countDocuments(query);

        const response = { products, total, page: parseInt(page), limit: parseInt(limit) };

        // Armazena no cache por 5 minutos
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

        res.json(response);

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Erro ao buscar produtos' });
    }
});

// Buscar produto por ID
app.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await db.collection('products').findOne({ _id: id });

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }

        res.json(product);

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Erro ao buscar produto' });
    }
});

// Criar produto
app.post('/products', async (req, res) => {
    try {
        const product = req.body;
        product.createdAt = new Date();

        const result = await db.collection('products').insertOne(product);

        // Publica evento de produto criado
        rabbitChannel.sendToQueue(
            'product-events',
            Buffer.from(JSON.stringify({
                type: 'PRODUCT_CREATED',
                data: { ...product, _id: result.insertedId }
            }))
        );

        // Invalida cache
        const keys = await redisClient.keys('products:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        res.status(201).json({ ...product, _id: result.insertedId });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Erro ao criar produto' });
    }
});

// Atualizar estoque (chamado pelo inventory-service)
app.patch('/products/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        await db.collection('products').updateOne(
            { _id: id },
            { $inc: { stock: quantity } }
        );

        res.json({ message: 'Estoque atualizado' });

    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ message: 'Erro ao atualizar estoque' });
    }
});

// Inicialização
async function start() {
    await connectMongo();
    await connectRedis();
    await connectRabbitMQ();

    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
        console.log(`Product Service running on port ${PORT}`);
    });
}

start().catch(console.error);
