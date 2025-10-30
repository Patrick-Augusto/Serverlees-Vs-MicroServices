/**
 * Lambda Function - User Login
 * Autentica usuário e retorna JWT token
 */

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);

        // Busca usuário no DynamoDB
        const result = await dynamodb.get({
            TableName: process.env.USERS_TABLE,
            Key: { email }
        }).promise();

        if (!result.Item) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Credenciais inválidas' })
            };
        }

        // Verifica senha
        const validPassword = await bcrypt.compare(password, result.Item.password);
        if (!validPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Credenciais inválidas' })
            };
        }

        // Gera JWT token
        const token = jwt.sign(
            { userId: result.Item.id, email: result.Item.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                token,
                user: {
                    id: result.Item.id,
                    email: result.Item.email,
                    name: result.Item.name
                }
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro interno do servidor' })
        };
    }
};
