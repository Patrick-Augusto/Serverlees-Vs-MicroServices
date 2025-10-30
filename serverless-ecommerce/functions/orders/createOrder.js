/**
 * Lambda Function - Create Order
 * Cria pedido e envia para fila de processamento
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
const eventBridge = new AWS.EventBridge();

exports.handler = async (event) => {
    try {
        const { userId, items, shippingAddress, paymentMethod } = JSON.parse(event.body);

        // Calcula total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Cria pedido
        const order = {
            id: uuidv4(),
            userId,
            items,
            shippingAddress,
            paymentMethod,
            total,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Salva no DynamoDB
        await dynamodb.put({
            TableName: process.env.ORDERS_TABLE,
            Item: order
        }).promise();

        // Envia para fila de processamento de pagamento
        await sqs.sendMessage({
            QueueUrl: process.env.PAYMENT_QUEUE_URL,
            MessageBody: JSON.stringify({
                orderId: order.id,
                amount: total,
                paymentMethod
            })
        }).promise();

        // Publica evento de novo pedido
        await eventBridge.putEvents({
            Entries: [{
                Source: 'ecommerce.orders',
                DetailType: 'OrderCreated',
                Detail: JSON.stringify(order)
            }]
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Pedido criado com sucesso',
                order
            })
        };

    } catch (error) {
        console.error('Create order error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao criar pedido' })
        };
    }
};
