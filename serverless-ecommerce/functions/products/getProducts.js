/**
 * Lambda Function - Get Products
 * Lista produtos com paginação e cache
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const elasticache = require('elasticache');

exports.handler = async (event) => {
    try {
        const { page = 1, limit = 20, category } = event.queryStringParameters || {};

        // Verifica cache
        const cacheKey = `products:${category || 'all'}:${page}:${limit}`;
        const cachedData = await elasticache.get(cacheKey);

        if (cachedData) {
            return {
                statusCode: 200,
                body: JSON.stringify(JSON.parse(cachedData))
            };
        }

        // Query no DynamoDB
        const params = {
            TableName: process.env.PRODUCTS_TABLE,
            Limit: parseInt(limit)
        };

        if (category) {
            params.FilterExpression = 'category = :category';
            params.ExpressionAttributeValues = { ':category': category };
        }

        const result = await dynamodb.scan(params).promise();

        // Armazena no cache por 5 minutos
        await elasticache.set(cacheKey, JSON.stringify(result.Items), 300);

        return {
            statusCode: 200,
            body: JSON.stringify({
                products: result.Items,
                total: result.Count
            })
        };

    } catch (error) {
        console.error('Get products error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao buscar produtos' })
        };
    }
};
