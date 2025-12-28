# LinkUp Backend

A robust backend API for the LinkUp social media platform, built with Node.js and Express.js. This backend handles authentication, real-time communication, database operations, and business logic for a full-stack social media application.

## Backend Overview

The LinkUp backend serves as the core engine for the social media platform, providing secure API endpoints for user management, content creation, real-time messaging, and administrative functions. It ensures data integrity, performance optimization, and scalable architecture to support a growing user base.

### Key Responsibilities
- **Authentication & Authorization**: Secure user registration, login, and access control
- **Business Logic**: Post management, user interactions, content moderation
- **Database Access**: Efficient data storage and retrieval using PostgreSQL
- **Real-time Communication**: Instant messaging and live updates via WebSocket
- **Security & Performance**: Rate limiting, input validation, and optimized queries

## Tech Stack

### Runtime & Framework
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework for API development

### Database & ORM
- **PostgreSQL**: Primary relational database
- **Prisma**: Type-safe ORM for database operations and migrations

### Authentication
- **JWT (jsonwebtoken)**: Token-based authentication
- **bcrypt/bcryptjs**: Password hashing and verification
- **Passport.js**: OAuth integration (Google, Facebook, Twitter)

### Real-time Layer
- **Socket.IO**: Real-time bidirectional communication
- **Redis**: In-memory data structure store for caching and session management

### Additional Libraries
- **Winston**: Logging framework
- **Multer**: File upload handling
- **Cloudinary**: Cloud-based image and video management
- **SendGrid**: Email service for notifications
- **Express Rate Limit**: API rate limiting
- **Swagger**: API documentation

## Project Structure

```
src/
├── controllers/          # Request handlers for business logic
│   ├── authController.js
│   ├── postController.js
│   ├── messagesController.js
│   ├── profileController.js
│   ├── storyController.js
│   ├── notificationController.js
│   ├── searchController.js
│   ├── adminController.js
│   └── highlightController.js
├── routes/               # API route definitions
│   ├── index.js
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── messagesRoutes.js
│   ├── profileRoutes.js
│   ├── storyRoutes.js
│   ├── notificationRoutes.js
│   ├── searchRoutes.js
│   ├── adminRoutes.js
│   ├── highlightRoutes.js
│   └── testRoutes.js
├── services/             # Business logic and external integrations
│   ├── authService.js
│   ├── notificationService.js
│   ├── cloudService.js
│   ├── emailService.js
│   ├── moderationService.js
│   ├── uploadService.js
│   └── linkPreviewService.js
├── middleware/           # Custom middleware functions
│   ├── authMiddleware.js
│   ├── csrfMiddleware.js
│   ├── uploadMiddleware.js
│   ├── errorHandler.js
│   ├── validationMiddleware.js
│   ├── moderationMiddleware.js
│   └── postOwnershipMiddleware.js
├── models/               # Database models and schemas
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── socket/               # Real-time communication handlers
│   ├── index.js
│   ├── middleware/
│   │   └── auth.js
│   └── events/
│       ├── message.js
│       ├── story.js
│       ├── typing.js
│       └── status.js
├── utils/                # Utility functions and helpers
│   ├── logger.js
│   ├── redis.js
│   ├── redisUtils.js
│   ├── redisCleanup.js
│   ├── prisma.js
│   ├── encryption.js
│   ├── signalEncryption.js
│   ├── errorHandler.js
│   ├── validators.js
│   └── cloudinary.js
├── validators/           # Input validation schemas
│   ├── authValidators.js
│   ├── postValidators.js
│   ├── messageValidators.js
│   ├── profileValidators.js
│   ├── highlightValidators.js
│   ├── notificationValidator.js
│   └── searchValidators.js
├── docs/                 # API documentation
│   └── swagger.js
├── config/               # Configuration files
│   └── cloudinary.js
└── logs/                 # Application logs
    ├── combined.log
    └── error.log
```

## API Design

### REST Principles
The API follows RESTful conventions with resource-based URLs, standard HTTP methods, and consistent response formats. All endpoints return JSON responses with appropriate HTTP status codes.

### Separation of Concerns
- **Routes**: Define API endpoints and delegate to controllers
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and external API calls
- **Models**: Define data structures and database interactions
- **Middleware**: Handle cross-cutting concerns like authentication and validation

### Error Handling Strategy
- Centralized error handling middleware
- Consistent error response format
- Proper HTTP status codes for different error types
- Detailed logging for debugging and monitoring

## Authentication & Authorization

### Password Hashing
Passwords are securely hashed using bcrypt with salt rounds for enhanced security.

### Token Strategy
- **JWT Tokens**: Used for stateless authentication
- **Access Tokens**: Short-lived tokens for API access
- **Refresh Tokens**: Long-lived tokens for token renewal
- **Cookie-based**: Secure HTTP-only cookies for token storage

### Protected Routes
All sensitive endpoints require valid JWT tokens. Middleware validates tokens and attaches user information to requests. Role-based access control implemented for admin functions.

## Realtime Architecture

### Socket Usage
Socket.IO enables real-time features including:
- Instant messaging between users
- Live typing indicators
- Online status updates
- Real-time notifications

### Events Overview
- **Connection Management**: User authentication and room joining
- **Message Events**: Send, receive, and status updates
- **Typing Events**: Start/stop typing indicators
- **Status Events**: Online/offline status changes

### State Synchronization
Real-time updates ensure UI consistency across connected clients. Redis is used for temporary data storage and session management.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/linkup
DIRECT_URL=postgresql://username:password@localhost:5432/linkup

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
TWITTER_CONSUMER_KEY=your-twitter-consumer-key
TWITTER_CONSUMER_SECRET=your-twitter-consumer-secret

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
CSRF_SECRET=your-csrf-secret
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Redis server
- npm or yarn package manager

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env` file

4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Running Locally
Start the development server:
```bash
npm start
```

The server will run on `http://localhost:3000` with Socket.IO support.

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## Scripts

- `npm start`: Start the production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run test suite
- `npm run lint`: Run ESLint for code quality
- `npm run build`: Build for production (if applicable)

## Security Practices

### Rate Limiting
- Express Rate Limit middleware prevents abuse
- Configurable limits per endpoint and user
- Redis-backed rate limiting for distributed environments

### Input Validation
- Express Validator for request sanitization
- Custom validation middleware for complex rules
- SQL injection prevention through Prisma ORM

### CORS
- Configured allowed origins for cross-origin requests
- Credentials enabled for authenticated requests
- Secure headers for additional protection

### Secure Headers
- Helmet.js for security headers
- CSRF protection with csurf middleware
- HTTPS enforcement in production

## Performance Optimizations

### Query Optimization
- Prisma query optimization with select/include
- Database indexing on frequently queried fields
- Connection pooling for efficient database access

### Caching & Batching
- Redis caching for frequently accessed data
- Batch database operations where possible
- CDN integration for static assets

### Indexing
- Strategic database indexes on UserID, CreatedAt, and foreign keys
- Composite indexes for complex queries
- Regular index maintenance and monitoring

## Deployment

### Production Build
The application is containerized using Docker and deployed to Fly.io.

### Environment Configs
- Production environment variables configured in Fly.io
- Database connection optimized for production
- Logging configured for production monitoring

### Hosting Platform
**Fly.io** provides:
- Global CDN for low-latency responses
- Auto-scaling based on request load
- Built-in SSL/TLS certificates
- Easy deployment with `fly deploy`

## Future Improvements

### Backend-focused Enhancements
- **Microservices Architecture**: Split monolithic app into microservices
- **GraphQL API**: Alternative to REST for flexible data fetching
- **Advanced Caching**: Implement Redis clusters for better performance
- **API Versioning**: Implement versioning strategy for backward compatibility
- **Monitoring & Analytics**: Integrate application performance monitoring
- **Database Sharding**: Horizontal scaling for massive user growth
- **Machine Learning**: AI-powered content moderation and recommendations

## License

ISC License
