# Serverless vs Microservicios - Proyecto de Comparación E-commerce

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## 📋 Descripción del Proyecto

Este proyecto académico presenta una **comparación práctica y teórica** entre dos arquitecturas modernas de desarrollo de software:
- **Serverless (Function as a Service)**
- **Microservicios (Containers)**

Implementamos el mismo sistema de e-commerce utilizando ambas arquitecturas para demostrar las diferencias en escalabilidad, costos, complejidad operacional, rendimiento y mantenibilidad.

---

## 🎯 Objetivos

- ✅ Comparar arquitecturas Serverless vs Microservicios
- ✅ Implementar ambas arquitecturas para un sistema de e-commerce
- ✅ Analizar ventajas y desventajas de cada enfoque
- ✅ Proporcionar guía de decisión para proyectos reales

---

## 🏗️ Estructura del Proyecto

```
.
├── README.md                          # Este archivo
├── COMPARACAO.md                      # Análisis comparativo detallado
├── microservices-ecommerce/           # Implementación con Microservicios
│   ├── docker-compose.yml             # Orquestación de contenedores
│   ├── kubernetes/                    # Manifiestos K8s
│   ├── auth-service/                  # Servicio de autenticación
│   ├── order-service/                 # Servicio de pedidos
│   ├── payment-service/               # Servicio de pagos
│   └── product-service/               # Servicio de productos
└── serverless-ecommerce/              # Implementación Serverless
    ├── serverless.yml                 # Configuración Serverless Framework
    └── functions/                     # Funciones Lambda
        ├── auth/                      # Función de autenticación
        ├── orders/                    # Función de pedidos
        ├── payments/                  # Función de pagos
        └── products/                  # Función de productos
```

---

## 🚀 Arquitectura Serverless

### Características
- **Framework:** Serverless Framework + AWS Lambda
- **Base de datos:** DynamoDB
- **API Gateway:** AWS API Gateway
- **Despliegue:** Automático con Serverless Framework

### Componentes
```
┌─────────────────────────────────────┐
│         AWS API Gateway             │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────────┐
       │                   │
   ┌───▼───┐         ┌─────▼─────┐
   │Lambda │         │ DynamoDB  │
   │Functions│◄──────►│ Tables   │
   └───────┘         └───────────┘
```

### Ventajas
- ✅ **Escalabilidad automática** e instantánea
- ✅ **Pago por uso** - Solo pagas por las ejecuciones
- ✅ **Cero mantenimiento** de infraestructura
- ✅ **Despliegue simple** con un comando

### Desventajas
- ⚠️ **Cold start** en la primera invocación
- ⚠️ **Vendor lock-in** con AWS
- ⚠️ **Límites de tiempo** de ejecución (15 min)

---

## 🏗️ Arquitectura Microservicios

### Características
- **Runtime:** Node.js + Express
- **Contenedores:** Docker
- **Orquestación:** Docker Compose / Kubernetes
- **Base de datos:** PostgreSQL (por servicio)

### Componentes
```
┌─────────────────────────────────────┐
│         API Gateway / Nginx         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────────┐
       │                   │
   ┌───▼────┐         ┌────▼────┐
   │ Auth   │         │ Orders  │
   │Service │         │Service  │
   └───┬────┘         └────┬────┘
       │                   │
   ┌───▼────┐         ┌────▼────┐
   │Auth DB │         │Order DB │
   └────────┘         └─────────┘
```

### Ventajas
- ✅ **Sin vendor lock-in** - Portabilidad total
- ✅ **Control completo** sobre la infraestructura
- ✅ **Rendimiento consistente** sin cold start
- ✅ **Sin límites** de tiempo de ejecución

### Desventajas
- ⚠️ **Mayor complejidad** operacional
- ⚠️ **Costos fijos** incluso sin tráfico
- ⚠️ **Requiere DevOps** para mantenimiento
- ⚠️ **Escalado manual** o con configuración

---

## 📊 Comparación Rápida

| Criterio | Serverless | Microservicios |
|----------|-----------|---------------|
| **Costo inicial** | 💰 Muy bajo | 💰💰💰 Alto |
| **Escalabilidad** | ⚡ Automática | 🔧 Manual/Config |
| **Rendimiento** | ⏱️ Cold start | ⚡ Consistente |
| **Complejidad** | 😊 Simple | 😰 Compleja |
| **Flexibilidad** | 🔒 Limitada | 🔓 Total |
| **Vendor Lock-in** | ⚠️ Alto | ✅ Bajo |

📖 **[Ver comparación completa en COMPARACAO.md](./COMPARACAO.md)**

---

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js v18+
- Docker & Docker Compose
- AWS CLI (para Serverless)
- Serverless Framework CLI

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Patrick-Augusto/Serverlees-Vs-MicroServices.git
cd Serverlees-Vs-MicroServices
```

---

## 🚀 Ejecutar la Versión Serverless

```bash
# Navegar al directorio serverless
cd serverless-ecommerce

# Instalar dependencias
npm install

# Instalar Serverless Framework globalmente
npm install -g serverless

# Configurar AWS credentials
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# Desplegar en AWS
serverless deploy

# Ver logs en tiempo real
serverless logs -f functionName -t
```

### Endpoints Serverless
Después del despliegue, obtendrás URLs como:
```
POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/auth/login
POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/orders
POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/payments
GET  - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/products
```

---

## 🐳 Ejecutar la Versión Microservicios

### Con Docker Compose (Recomendado para desarrollo)

```bash
# Navegar al directorio de microservicios
cd microservices-ecommerce

# Construir y levantar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Con Kubernetes (Producción)

```bash
# Aplicar manifiestos de Kubernetes
kubectl apply -f kubernetes/

# Verificar deployments
kubectl get deployments

# Verificar pods
kubectl get pods

# Verificar servicios
kubectl get services
```

### Endpoints Microservicios
```
POST - http://localhost:3001/auth/login      # Auth Service
POST - http://localhost:3002/orders          # Order Service
POST - http://localhost:3003/payments        # Payment Service
GET  - http://localhost:3004/products        # Product Service
```

---

## 🧪 Testing

### Probar Autenticación
```bash
# Serverless
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "123456"}'

# Microservicios
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "123456"}'
```

### Probar Productos
```bash
# Serverless
curl https://your-api.execute-api.us-east-1.amazonaws.com/dev/products

# Microservicios
curl http://localhost:3004/products
```

---

## 📈 Métricas y Monitoreo

### Serverless
- **AWS CloudWatch:** Logs y métricas automáticas
- **AWS X-Ray:** Tracing distribuido
- **Serverless Dashboard:** Monitoreo simplificado

### Microservicios
- **Prometheus:** Recolección de métricas
- **Grafana:** Visualización de dashboards
- **ELK Stack:** Logs centralizados
- **Jaeger:** Tracing distribuido

---

## 💡 Casos de Uso Recomendados

### Use Serverless cuando:
- 🎯 Startup o MVP con presupuesto limitado
- 🎯 Tráfico impredecible o estacional
- 🎯 Equipo pequeño sin experiencia en DevOps
- 🎯 Tareas asíncronas (procesamiento de imágenes, emails)
- 🎯 APIs simples con CRUD básico

### Use Microservicios cuando:
- 🎯 Sistema empresarial con múltiples equipos
- 🎯 Requisitos de latencia muy estrictos (<50ms)
- 🎯 Procesamiento de larga duración (>15min)
- 🎯 Necesita control total de la infraestructura
- 🎯 Quiere evitar vendor lock-in

---

## 🌐 Arquitectura Híbrida (Recomendada)

Muchas empresas combinan ambas arquitecturas:

```
Core Business Logic → Microservicios
   ├── Auth
   ├── Orders
   └── Payments

Tareas Asíncronas → Serverless
   ├── Email notifications
   ├── Image processing
   └── Report generation
```

---

## 📚 Recursos Adicionales

- 📖 [Comparación Detallada](./COMPARACAO.md)
- 📖 [Serverless Framework Docs](https://www.serverless.com/framework/docs/)
- 📖 [Docker Documentation](https://docs.docker.com/)
- 📖 [Kubernetes Documentation](https://kubernetes.io/docs/)
- 📖 [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

---

## 👥 Autores

- **Patrick Augusto** - [GitHub](https://github.com/Patrick-Augusto)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Contacto

¿Preguntas o sugerencias? Abre un [issue](https://github.com/Patrick-Augusto/Serverlees-Vs-MicroServices/issues) en GitHub.

---

## ⭐ Agradecimientos

Este proyecto fue desarrollado como parte del curso de **Computación Distribuida** en la **UDL Faculdade**.

Si este proyecto te fue útil, ¡no olvides darle una ⭐!

---

**Desarrollado con ❤️ para la comunidad de desarrollo**
