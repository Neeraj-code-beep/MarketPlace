# MarketPlace

A microservices-based e-commerce marketplace built with Node.js, Express, MongoDB, and modern backend engineering practices.

## Project Overview

MarketPlace is designed as a scalable e-commerce platform where customers can explore products, manage shopping carts, place orders, and make payments. Sellers can manage their products and monitor their business activity.

The system follows a microservices architecture, with each service responsible for its own business domain.

## Architecture

```text
MarketPlace/
├── services/
│   └── auth-service/
├── infrastructure/
├── docs/
├── scripts/
├── .gitignore
├── docker-compose.yml
└── README.md
```

### Planned Services

- Auth Service: User registration, authentication, authorization, profiles, and addresses.
- Product Service: Product catalog and product management.
- Cart Service: Shopping cart management.
- Order Service: Order creation and lifecycle management.
- Payment Service: Payment processing and verification.
- Notification Service: Email and other event-driven notifications.
- Seller Dashboard Service: Seller analytics and management.
- AI Buddy Service: AI-powered shopping assistance.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT, bcrypt
- **Testing:** Jest, Supertest, MongoDB Memory Server
- **Containerization:** Docker
- **Version Control:** Git and GitHub

## Development Approach

- Independent services with clearly defined responsibilities.
- Database ownership at the service level.
- REST APIs for synchronous communication.
- Event-driven communication for asynchronous workflows.
- Automated testing and incremental development.
- Environment-based configuration and secure credential management.

## Getting Started

Each microservice maintains its own dependencies and configuration.

To work on the Auth Service:

```bash
cd services/auth-service
npm install
```

Configure the required environment variables using the service's `.env.example` file.

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Project Status

**Currently in development.**

The Auth Service is the first service being established. Other services and infrastructure components will be implemented incrementally.

## License

To be determined.
