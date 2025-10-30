/**
 * Order Service - Microserviço de Pedidos
 * Gerencia criação e acompanhamento de pedidos
 */

const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib');
const axios = require('axios');

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

let rabbitChannel;

// Conecta ao RabbitMQ
async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('order-events');
    await rabbitChannel.assertQueue('payment-requests');
    console.log('Connected to RabbitMQ');
}

// Middleware de autenticação
async function authenticate(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        // Valida token com auth-service
        const response = await axios.post(
            `${process.env.AUTH_SERVICE_URL}/validate`,
            {},
            { headers: { authorization: `Bearer ${token}` } }
        );

        if (!response.data.valid) {
            return res.status(401).json({ message: 'Não autorizado' });
        }

        req.userId = response.data.userId;
        next();

    } catch (error) {
        res.status(401).json({ message: 'Não autorizado' });
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'order-service' });
});

// Criar pedido
app.post('/orders', authenticate, async (req, res) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const { items, shippingAddress, paymentMethod } = req.body;
        const userId = req.userId;

        // Verifica disponibilidade dos produtos com inventory-service
        const inventoryCheck = await axios.post(
            `${process.env.INVENTORY_SERVICE_URL}/check`,
            { items }
        );

        if (!inventoryCheck.data.available) {
            return res.status(400).json({
                message: 'Alguns produtos não estão disponíveis',
                unavailable: inventoryCheck.data.unavailable
            });
        }

        // Calcula total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Cria pedido
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, total, status, shipping_address, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [userId, total, 'pending', JSON.stringify(shippingAddress)]
        );

        const order = orderResult.rows[0];

        // Insere itens do pedido
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, item.productId, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');

        // Reserva estoque via mensageria
        rabbitChannel.sendToQueue(
            'order-events',
            Buffer.from(JSON.stringify({
                type: 'ORDER_CREATED',
                orderId: order.id,
                items
            }))
        );

        // Solicita processamento de pagamento
        rabbitChannel.sendToQueue(
            'payment-requests',
            Buffer.from(JSON.stringify({
                orderId: order.id,
                amount: total,
                paymentMethod
            }))
        );

        res.status(201).json({
            message: 'Pedido criado com sucesso',
            order: {
                id: order.id,
                total: order.total,
                status: order.status
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Erro ao criar pedido' });
    } finally {
        client.release();
    }
});

// Listar pedidos do usuário
app.get('/orders', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.*, 
                    json_agg(json_build_object(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'price', oi.price
                    )) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.userId]
        );

        res.json({ orders: result.rows });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Erro ao buscar pedidos' });
    }
});

// Inicialização
async function start() {
    await connectRabbitMQ();

    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
        console.log(`Order Service running on port ${PORT}`);
    });
}

start().catch(console.error);
