/**
 * Lambda Function - Process Payment
 * Processa pagamento via gateway (Stripe/PayPal)
 * Triggered por SQS
 */

const AWS = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    for (const record of event.Records) {
        try {
            const { orderId, amount, paymentMethod } = JSON.parse(record.body);

            // Processa pagamento com Stripe
            const payment = await stripe.charges.create({
                amount: amount * 100, // em centavos
                currency: 'brl',
                source: paymentMethod.token,
                description: `Pedido ${orderId}`
            });

            // Atualiza status do pedido
            await dynamodb.update({
                TableName: process.env.ORDERS_TABLE,
                Key: { id: orderId },
                UpdateExpression: 'set #status = :status, paymentId = :paymentId',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': 'paid',
                    ':paymentId': payment.id
                }
            }).promise();

            // Publica notificação de pagamento aprovado
            await sns.publish({
                TopicArn: process.env.NOTIFICATIONS_TOPIC_ARN,
                Message: JSON.stringify({
                    type: 'payment_approved',
                    orderId,
                    amount
                })
            }).promise();

            console.log(`Pagamento processado para pedido ${orderId}`);

        } catch (error) {
            console.error('Payment processing error:', error);
            // Pode reenviar para DLQ (Dead Letter Queue) se falhar
        }
    }

    return { statusCode: 200 };
};
