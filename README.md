# WealthJourney - Personal Financial Management System

<div align="center">
  <img src="src/wj-client/public/logo.png" alt="WealthJourney Logo" width="200"/>
</div>

## 📖 Overview

Welcome to WealthJourney - Our platform empowers you to track expenses, set achievable savings goals, and make informed financial decisions. WealthJourney is a comprehensive personal finance management application designed to help users take control of their financial future through intuitive tracking, insightful analytics, and smart budgeting tools.

## 🌟 Features

### 🏠 Dashboard

- **Account Overview**: View all your accounts and wallets in one place
- **Balance Tracking**: Monitor total balance and individual wallet balances
- **Financial Insights**: Visual charts showing spending patterns and income
- **Monthly Reports**: Track monthly income, expenses, and savings
- **Transaction History**: Comprehensive view of all financial activities

### 💰 Wallet Management

- **Multiple Wallets**: Create and manage multiple wallets for different purposes
- **Money Transfer**: Easy transfer between wallets
- **Balance Tracking**: Real-time balance updates for all wallets
- **Custom Categories**: Organize transactions by custom categories

### 📊 Analytics & Reporting

- **Spending Analysis**: Detailed breakdown of expenses by category
- **Income Tracking**: Monitor various income sources
- **Monthly Dominance**: Visual representation of spending categories
- **Budget Progress**: Track progress towards financial goals

### 🔐 Security

- **Google OAuth Integration**: Secure authentication with Google
- **JWT Authentication**: Secure session management
- **Data Protection**: Your financial data is encrypted and protected

## 🏗️ Architecture

WealthJourney follows a modern microservices architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │   Backend       │    │    Database     │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (MySQL)       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   React Components        REST API            Relational Data
   Redux State             JWT Auth            TypeORM ORM
   Tailwind CSS            Redis Cache         Migrations
```

### Technology Stack

**Frontend (`wj-client`)**

- **Next.js 15** - React framework for server-side rendering
- **React 19** - UI library with hooks and modern features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **Recharts** - Data visualization library
- **Google OAuth** - Authentication provider

**Backend (`wj-server`)**

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **TypeORM** - Object-relational mapping
- **MySQL** - Relational database
- **Redis** - In-memory caching
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens for auth

**DevOps & Infrastructure**

- **Docker & Docker Compose** - Containerization
- **ESLint & Prettier** - Code quality tools
- **Jest** - Testing framework

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose
- MySQL (if running without Docker)
- Redis (if running without Docker)

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs (when running in development)

## 📁 Project Structure

```
Personal_Financial_Management/
├── src/
│   ├── wj-client/                 # Next.js Frontend
│   │   ├── app/                   # App Router pages
│   │   │   ├── auth/             # Authentication pages
│   │   │   └── dashboard/        # Dashboard pages
│   │   ├── components/           # Reusable React components
│   │   │   ├── modals/          # Modal components
│   │   │   └── success/         # Success animations
│   │   ├── redux/               # Redux store configuration
│   │   ├── utils/               # Utility functions
│   │   └── public/              # Static assets
│   │
│   ├── wj-server/                # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── transaction/     # Transaction management
│   │   │   ├── wallet/          # Wallet management
│   │   │   ├── user/            # User management
│   │   │   └── config/          # Configuration files
│   │   └── test/                # Test files
│   │
│   └── docker-compose.yml        # Docker configuration
│
├── design/                       # Design files
│   ├── system_design.drawio      # System architecture diagram
│   └── Figma_UI_design.pdf       # UI/UX design specifications
│
└── README.md                     # This file
```

## 🔧 Environment Variables

### Backend Environment (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=wealthjourney

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server
PORT=5000
NODE_ENV=development
```

### Frontend Environment (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📊 Database Schema

The application uses a relational database with the following main entities:

- **Users**: User authentication and profile information
- **Wallets**: Multiple wallets for different purposes
- **Transactions**: Income and expense records
- **Categories**: Transaction categorization
- **Budgets**: Budget planning and tracking

## 🧪 Testing

```bash
# Backend tests
cd src/wj-server
npm run test                # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # End-to-end tests

# Frontend tests (when configured)
cd src/wj-client
npm test                   # Run tests
npm run test:watch        # Watch mode
```

## 📦 Deployment

### Production Docker Setup

```bash
# Build for production
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-specific considerations

1. **Development**: Hot reload, debug logs, test database
2. **Staging**: Production-like environment for testing
3. **Production**: Optimized builds, proper SSL, backup strategies

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Use TypeScript for type safety
- Follow the established folder structure

## 🎯 Roadmap

### Upcoming Features

- [ ] **Mobile App**: React Native application for iOS and Android
- [ ] **Advanced Analytics**: Machine learning for spending insights
- [ ] **Investment Tracking**: Portfolio management features
- [ ] **Bill Reminders**: Automatic bill payment reminders
- [ ] **Multi-currency Support**: Handle multiple currencies
- [ ] **Export Features**: Export data to PDF, CSV formats
- [ ] **API for Third-party Integration**: Connect with banks and financial services
- [ ] **Collaborative Features**: Family budgeting and shared accounts

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeORM](https://typeorm.io/) - Object-relational mapping
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Recharts](https://recharts.org/) - Data visualization

---

<div align="center">
  Made with ❤️ by the Khanh Nguyen
</div>
