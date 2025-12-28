# LinkUp - Social Media Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

LinkUp is a modern, full-stack social media platform designed to explore real-world product features such as authentication, content sharing, social interactions, messaging, and real-time updates. Built with scalability, clean architecture, and user experience in mind, LinkUp provides a seamless platform for users to connect, share, and engage.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)
- [Folder Structure](#folder-structure)
- [Future Improvements](#future-improvements)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

### What is LinkUp?

LinkUp is a comprehensive social media platform that enables users to create profiles, share content, build connections, and communicate in real-time. The platform focuses on providing a rich, interactive experience while maintaining high standards of security, performance, and scalability.

### The Problem It Solves

Traditional social media platforms often suffer from:
- Poor user experience with slow loading times
- Lack of real-time interactions
- Inadequate content moderation
- Complex privacy controls
- Limited customization options

LinkUp addresses these challenges by providing:
- Fast, responsive interfaces with optimized performance
- Real-time messaging and notifications
- Comprehensive content moderation tools
- Granular privacy settings
- Extensive profile customization

### The Main Idea Behind the Project

LinkUp demonstrates modern web development practices by implementing a production-ready social media platform with:
- **Scalable Architecture**: Microservices-inspired separation of concerns
- **Real-time Communication**: WebSocket-based messaging and notifications
- **Advanced Security**: Multi-layered authentication and authorization
- **Performance Optimization**: Caching, pagination, and efficient data handling
- **User-Centric Design**: Intuitive UX with accessibility considerations

## Features

### Authentication & Authorization
- User registration and login with email verification
- JWT-based authentication with refresh tokens
- OAuth integration (Google, Facebook, Twitter)
- Password reset functionality
- Session management with secure cookies

### Social Features
- **Public & Private Accounts**: Users can set their profiles to public or private
- **Follow System**: Send follow requests, accept/reject follows
- **Content Sharing**: Create posts with text, images, and videos
- **Stories**: Share temporary content with 24-hour expiration
- **Highlights**: Save important stories to profile highlights

### Interactions
- Like and comment on posts and stories
- Reply to comments with nested threading
- Share posts with custom captions
- Save posts to personal collections
- Report inappropriate content

### Real-time Features
- **Instant Messaging**: One-on-one and group conversations
- **Live Notifications**: Real-time alerts for all activities
- **Typing Indicators**: See when others are typing
- **Online Status**: View user availability
- **Message Reactions**: React to messages with emojis

### Profile Management
- Customizable profile pictures and cover photos
- Bio and personal information editing
- Privacy settings for posts and profile visibility
- Activity status and last seen tracking

### Advanced Features
- **Search Functionality**: Find users and content
- **Admin Panel**: User management and content moderation
- **Content Moderation**: Automated filtering and manual review
- **Analytics**: Post views and engagement metrics
- **Caching**: Redis-based caching for improved performance

## Tech Stack

### Frontend
- **Framework**: Next.js 15+ (React 19)
- **Styling**: Tailwind CSS with custom components
- **State Management**: Redux Toolkit + Zustand
- **Real-time Communication**: Socket.IO Client
- **UI Components**: Headless UI, Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion, Lottie animations

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.IO with Redis adapter
- **File Storage**: Cloudinary for media uploads
- **Email Service**: SendGrid for notifications
- **Caching**: Upstash Redis (serverless)

### Database
- **Primary Database**: PostgreSQL
- **ORM**: Prisma with database migrations
- **Caching Layer**: Redis for session and data caching
- **Backup**: Automated database backups

### Real-time Communication
- **WebSocket Library**: Socket.IO
- **Message Encryption**: Custom encryption for sensitive data
- **Connection Management**: Automatic reconnection and error handling

### Authentication
- **Primary Auth**: JWT tokens with refresh mechanism
- **Social Auth**: Passport.js with OAuth providers
- **Security**: CSRF protection, rate limiting
- **Session Storage**: Redis-backed sessions

### Deployment
- **Frontend**: Vercel with automatic deployments
- **Backend**: Fly.io with Docker containers
- **Database**: Managed PostgreSQL (production)
- **CDN**: Cloudinary for media delivery

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React App     │    │ - REST API      │    │ - User Data     │
│ - Socket Client │    │ - Socket Server │    │ - Posts         │
│ - State Mgmt    │    │ - Auth Service  │    │ - Messages      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Caching       │    │   File Storage  │
│   (Socket.IO)   │    │   (Redis)       │    │   (Cloudinary)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Separation of Responsibilities

#### API Layer (Backend)
- **Authentication Service**: Handles user registration, login, and token management
- **Post Service**: Manages content creation, updates, and interactions
- **Message Service**: Handles real-time messaging and conversation management
- **Notification Service**: Processes and delivers notifications
- **Profile Service**: Manages user profiles and settings
- **Admin Service**: Provides administrative controls and moderation tools

#### State Management (Frontend)
- **Authentication State**: User session and permissions
- **Feed State**: Posts, comments, and interactions
- **WebSocket Library**: Socket.IO
- **Message Encryption**: Custom encryption for sensitive data
- **Connection Management**: Automatic reconnection and error handling

### Authentication
- **Primary Auth**: JWT tokens with refresh mechanism
- **Social Auth**: Passport.js with OAuth providers
- **Security**: CSRF protection, rate limiting
- **Session Storage**: Redis-backed sessions

### Deployment
- **Frontend**: Vercel with automatic deployments
- **Backend**: Fly.io with Docker containers
- **Database**: Managed PostgreSQL (production)
- **CDN**: Cloudinary for media delivery

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React App     │    │ - REST API      │    │ - User Data     │
│ - Socket Client │    │ - Socket Server │    │ - Posts         │
│ - State Mgmt    │    │ - Auth Service  │    │ - Messages      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Caching       │    │   File Storage  │
│   (Socket.IO)   │    │   (Redis)       │    │   (Cloudinary)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Separation of Responsibilities

#### API Layer (Backend)
- **Authentication Service**: Handles user registration, login, and token management
- **Post Service**: Manages content creation, updates, and interactions
- **Message Service**: Handles real-time messaging and conversation management
- **Notification Service**: Processes and delivers notifications
- **Profile Service**: Manages user profiles and settings
- **Admin Service**: Provides administrative controls and moderation tools

#### State Management (Frontend)
- **Authentication State**: User session and permissions
- **Feed State**: Posts, comments, and interactions
- **Messaging State**: Conversations and real-time updates
- **Notification State**: Alerts and system messages
- **UI State**: Modal states, loading indicators, and navigation

#### Real-time Layer
- **WebSocket Server**: Manages persistent connections
- **Event Broadcasting**: Distributes messages and notifications
- **Presence System**: Tracks user online status
- **Typing Indicators**: Real-time typing status updates

### Data Flow Overview

1. **User Authentication**: Client sends credentials → Server validates → JWT issued → Client stores token
2. **Content Creation**: Client uploads media → Cloudinary processes → Database stores metadata → Real-time broadcast
3. **Social Interactions**: Client sends action → Server validates permissions → Database updates → Notifications sent
4. **Real-time Messaging**: Client sends message → Server encrypts → Database stores → WebSocket broadcasts → Recipients receive

## Environment Variables

### Backend Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/linkup"
DIRECT_URL="postgresql://username:password@localhost:5432/linkup"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"

# Email Service
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@linkup.com"

# File Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Redis Caching
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Security
ENCRYPTION_SECRET="32-character-encryption-key"
CSRF_SECRET="your-csrf-protection-secret"

# External APIs
FRONTEND_URL="https://your-frontend-domain.com"
NODE_ENV="production"

# Server Configuration
PORT=3000
```

### Frontend Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL="https://your-backend-api.com"
NEXT_PUBLIC_SOCKET_URL="https://your-backend-api.com"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-frontend-domain.com"

# Analytics (Optional)
GOOGLE_ANALYTICS_ID="GA_MEASUREMENT_ID"
```

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 15 or higher
- **Git**: For version control
- **npm** or **yarn**: Package manager

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/linkup.git
   cd linkup/05_Implementation/Source_Code
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # Edit the .env files with your configuration
   ```

4. **Set Up the Database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

5. **Run Database Migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Start the Development Servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api-docs

## Scripts

### Backend Scripts

```json
{
  "scripts": {
    "start": "cd src && node index.js",
    "dev": "nodemon src/index.js",
    "build": "npm run prisma:generate",
    "prisma:generate": "npx prisma generate --schema=src/models/prisma/schema.prisma",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:studio": "npx prisma studio",
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix"
  }
}
```

### Frontend Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Common Script Usage

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Check code style and potential issues
- `npm run test`: Run the test suite

## Security Considerations

### Password Security
- **Hashing Algorithm**: bcrypt with salt rounds (cost factor 12)
- **Password Requirements**: Minimum 8 characters, mixed case, numbers, symbols
- **Password Reset**: Secure token-based reset with expiration

### Authentication & Authorization
- **JWT Implementation**: Stateless authentication with refresh tokens
- **Token Expiration**: Access tokens (15 minutes), refresh tokens (7 days)
- **Secure Cookies**: HttpOnly, Secure, SameSite protection
- **CSRF Protection**: Double-submit cookie pattern with CSRF tokens

### API Security
- **Rate Limiting**: Express rate limiter with Redis backing
- **Input Validation**: Comprehensive validation with express-validator
- **CORS Configuration**: Strict origin policies with credentials support
- **Helmet.js**: Security headers for XSS and clickjacking protection

### Data Protection
- **Encryption**: AES-256 encryption for sensitive message content
- **Data Sanitization**: Input sanitization to prevent XSS attacks
- **SQL Injection Prevention**: Parameterized queries with Prisma ORM
- **File Upload Security**: Type validation and malware scanning

### Real-time Security
- **Socket Authentication**: JWT verification for WebSocket connections
- **Message Encryption**: End-to-end encryption for private messages
- **Rate Limiting**: Connection and message rate limiting
- **Spam Prevention**: Automated detection and blocking

## Performance Optimizations

### Database Optimizations
- **Indexing Strategy**: Composite indexes on frequently queried fields
- **Query Optimization**: Efficient SELECT statements with proper JOINs
- **Connection Pooling**: Prisma connection pooling for concurrent requests
- **Pagination**: Cursor-based pagination for large datasets

### Caching Strategies
- **Redis Caching**: User sessions, frequently accessed data
- **Database Query Caching**: Expensive queries cached for 5-15 minutes
- **API Response Caching**: Static data cached at edge locations
- **File Caching**: Cloudinary CDN for media assets

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Next.js Image component with WebP conversion
- **Bundle Analysis**: Webpack bundle analyzer for size optimization
- **Lazy Loading**: Components and images loaded on demand

### Real-time Efficiency
- **Connection Pooling**: Efficient WebSocket connection management
- **Message Batching**: Grouped notifications to reduce server load
- **Presence Optimization**: Efficient online status tracking
- **Event Debouncing**: Prevent excessive real-time updates

### Infrastructure Optimizations
- **CDN Integration**: Global content delivery for static assets
- **Load Balancing**: Distributed traffic across multiple instances
- **Database Sharding**: Horizontal scaling for large datasets
- **Monitoring**: Performance metrics and alerting systems

## Folder Structure

```
05_Implementation/Source_Code/
├── backend/                          # Backend application
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── cloudinary.js         # Cloudinary configuration
│   │   │   └── unsafeKeywords.json   # Content moderation keywords
│   │   ├── controllers/              # Route controllers
│   │   │   ├── authController.js     # Authentication logic
│   │   │   ├── postController.js     # Post management
│   │   │   ├── messagesController.js # Messaging logic
│   │   │   └── ...
│   │   ├── middleware/               # Express middleware
│   │   │   ├── authMiddleware.js     # JWT authentication
│   │   │   ├── csrfMiddleware.js     # CSRF protection
│   │   │   ├── uploadMiddleware.js   # File upload handling
│   │   │   └── ...
│   │   ├── models/                   # Database models
│   │   │   └── prisma/
│   │   │       └── schema.prisma     # Prisma database schema
│   │   ├── routes/                   # API route definitions
│   │   │   ├── authRoutes.js         # Authentication routes
│   │   │   ├── postRoutes.js         # Post routes
│   │   │   └── ...
│   │   ├── services/                 # Business logic services
│   │   │   ├── authService.js        # Authentication service
│   │   │   ├── notificationService.js # Notification handling
│   │   │   └── ...
│   │   ├── socket/                   # WebSocket handlers
│   │   │   ├── index.js              # Socket.IO setup
│   │   │   └── events/               # Socket event handlers
│   │   ├── utils/                    # Utility functions
│   │   │   ├── logger.js             # Logging utility
│   │   │   ├── redis.js              # Redis client
│   │   │   ├── prisma.js             # Database client
│   │   │   └── ...
│   │   ├── validators/               # Input validation
│   │   │   ├── authValidators.js     # Authentication validation
│   │   │   └── ...
│   │   ├── docs/                     # API documentation
│   │   │   └── swagger.js            # Swagger configuration
│   │   └── index.js                  # Application entry point
│   ├── Dockerfile                    # Docker configuration
│   ├── fly.toml                      # Fly.io deployment config
│   ├── package.json                  # Dependencies and scripts
│   └── README.md                     # Backend documentation
├── frontend/                         # Frontend application
│   ├── src/
│   │   ├── app/                      # Next.js app directory
│   │   │   ├── (auth)/               # Authentication routes
│   │   │   ├── (main)/               # Main application routes
│   │   │   └── api/                  # API routes
│   │   ├── components/               # React components
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   ├── forms/                # Form components
│   │   │   └── ...
│   │   ├── services/                 # API service functions
│   │   ├── socket/                   # WebSocket client
│   │   ├── store/                    # State management
│   │   ├── types/                    # TypeScript type definitions
│   │   └── utils/                    # Utility functions
│   ├── public/                       # Static assets
│   │   ├── icons/                    # Icon assets
│   │   ├── illustrations/            # Illustration assets
│   │   └── ...
│   ├── next.config.ts                # Next.js configuration
│   ├── tailwind.config.ts            # Tailwind CSS config
│   ├── package.json                  # Dependencies and scripts
│   └── README.md                     # Frontend documentation
├── .gitignore                        # Git ignore rules
└── README.md                         # Project overview (this file)
```

## Future Improvements

### Planned Features
- **Video Calling**: Real-time video and voice calls
- **Live Streaming**: Broadcast live content to followers
- **Advanced Search**: AI-powered content discovery
- **Content Recommendations**: Personalized feed algorithm
- **Multi-language Support**: Internationalization (i18n)
- **Mobile Applications**: React Native apps for iOS/Android
- **API Marketplace**: Third-party integrations

### Technical Enhancements
- **Microservices Migration**: Break down monolithic backend
- **GraphQL API**: More efficient data fetching
- **Advanced Caching**: Implement CDN caching strategies
- **Machine Learning**: Content moderation and recommendation engine
- **Blockchain Integration**: Decentralized identity and content ownership
- **Progressive Web App**: Offline functionality and app-like experience

### Performance Improvements
- **Database Optimization**: Implement read replicas and sharding
- **Edge Computing**: Deploy functions closer to users
- **Advanced Monitoring**: Implement distributed tracing
- **Auto-scaling**: Dynamic resource allocation based on load

### Security Enhancements
- **Zero Trust Architecture**: Implement comprehensive access controls
- **Advanced Threat Detection**: AI-powered security monitoring
- **Privacy Controls**: Enhanced data protection and GDPR compliance
- **Audit Logging**: Comprehensive security event logging

## Deployment

### Backend Deployment (Fly.io)

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Authenticate and Initialize**
   ```bash
   fly auth login
   cd backend
   fly launch
   ```

3. **Configure Environment**
   ```bash
   fly secrets set DATABASE_URL="your-production-db-url"
   fly secrets set JWT_SECRET="your-production-jwt-secret"
   # Add other required secrets
   ```

4. **Deploy**
   ```bash
   fly deploy
   ```

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Set production environment variables in Vercel dashboard
   - Configure custom domain if needed

### Database Setup (Production)

1. **Choose a PostgreSQL Provider**
   - AWS RDS, Google Cloud SQL, or Supabase
   - Configure connection pooling and backups

2. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Set Up Redis**
   - Use Upstash Redis or AWS ElastiCache
   - Configure connection strings

### Environment-Specific Considerations

- **Development**: Local PostgreSQL, file-based sessions
- **Staging**: Cloud database, limited resources
- **Production**: Managed services, auto-scaling, monitoring

## Contributing

We welcome contributions to LinkUp! Please follow these guidelines:

### Development Workflow

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/linkup.git
   cd linkup
   git checkout -b feature/your-feature-name
   ```

2. **Set Up Development Environment**
   ```bash
   # Follow the Getting Started guide
   npm install
   npm run dev
   ```

3. **Code Standards**
   - Follow ESLint configuration
   - Write meaningful commit messages
   - Add tests for new features
   - Update documentation

4. **Testing**
   ```bash
   npm run test
   npm run lint
   ```

5. **Submit a Pull Request**
   - Create a clear, descriptive PR title
   - Provide detailed description of changes
   - Reference related issues
   - Ensure CI checks pass

### Code Style Guidelines

- **JavaScript/TypeScript**: Use modern ES6+ syntax
- **React**: Functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for functions, inline comments for complex logic
- **Error Handling**: Proper try-catch blocks and error logging

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Provide detailed steps to reproduce bugs
- Include browser/OS information
- Attach screenshots for UI issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**LinkUp** - Connecting people through meaningful interactions. Built with ❤️ using modern web technologies.
