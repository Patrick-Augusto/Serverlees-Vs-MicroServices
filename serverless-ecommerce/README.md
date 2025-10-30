# E-commerce Serverless Architecture

## Visão Geral
Arquitetura serverless para e-commerce utilizando serviços gerenciados em nuvem (AWS como exemplo).

## Estrutura do Projeto

### Funções Lambda
- **auth/**: Autenticação e autorização de usuários
- **products/**: Gerenciamento de produtos
- **cart/**: Carrinho de compras
- **orders/**: Processamento de pedidos
- **payments/**: Integração com gateway de pagamento
- **notifications/**: Envio de notificações (email, SMS)

### Armazenamento
- **DynamoDB**: Banco de dados NoSQL para produtos, usuários, pedidos
- **S3**: Armazenamento de imagens de produtos
- **ElastiCache**: Cache para produtos populares

### Eventos
- **EventBridge**: Orquestração de eventos entre serviços
- **SQS**: Filas para processamento assíncrono
- **SNS**: Notificações pub/sub

## Vantagens
- ✅ Escalabilidade automática
- ✅ Pagamento por uso (pay-per-execution)
- ✅ Baixa manutenção de infraestrutura
- ✅ Alta disponibilidade gerenciada

## Desvantagens
- ❌ Cold start pode afetar latência
- ❌ Vendor lock-in
- ❌ Limitações de tempo de execução
- ❌ Debugging mais complexo
