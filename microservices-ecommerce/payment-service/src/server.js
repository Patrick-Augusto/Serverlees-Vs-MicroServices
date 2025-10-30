/**
 * Payment Service - Microserviço de Pagamentos
 * Processa pagamentos via gateway
 */

const express = require('express');
const amqp = require('amqplib');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const app = express();
app.use(express.json());

let rabbitChannel;

// Conecta ao RabbitMQ
async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('payment-requests');
    await rabbitChannel.assertQueue('payment-events');
    console.log('Connected to RabbitMQ');

    // Consome fila de pagamentos
    rabbitChannel.consume('payment-requests', processPayment);
}

// Processa pagamento
async function processPayment(msg) {
    if (!msg) return;

    try {
        const { orderId, amount, paymentMethod } = JSON.parse(msg.content.toString());

        console.log(`Processing payment for order ${orderId}`);

        // Processa com Stripe
        const payment = await stripe.charges.create({
            amount: Math.round(amount * 100), // em centavos
            currency: 'brl',
            source: paymentMethod.token,
            description: `Pedido ${orderId}`
        });

        // Notifica order-service sobre pagamento aprovado
        await axios.patch(
            `${process.env.ORDER_SERVICE_URL}/orders/${orderId}/status`,
            { status: 'paid', paymentId: payment.id }
        );

        // Publica evento de pagamento aprovado
        rabbitChannel.sendToQueue(
            'payment-events',
            Buffer.from(JSON.stringify({
                type: 'PAYMENT_APPROVED',
                orderId,
                paymentId: payment.id,
                amount
            }))
        );

        console.log(`Payment approved for order ${orderId}`);
        rabbitChannel.ack(msg);

    } catch (error) {
        console.error('Payment processing error:', error);

        // Publica evento de pagamento recusado
        const { orderId } = JSON.parse(msg.content.toString());

        rabbitChannel.sendToQueue(
            'payment-events',
            Buffer.from(JSON.stringify({
                type: 'PAYMENT_REJECTED',
                orderId,
                reason: error.message
            }))
        );

        // Rejeita mensagem (pode ir para DLQ)
        rabbitChannel.nack(msg, false, false);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'payment-service' });
});

// Webhook do Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('Stripe webhook event:', event.type);

        // Processa eventos do Stripe (refunds, disputes, etc)

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// Inicialização
async function start() {
    await connectRabbitMQ();

    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () => {
        console.log(`Payment Service running on port ${PORT}`);
    });
}

start().catch(console.error);
