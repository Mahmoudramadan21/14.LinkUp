# LinkUp

A modern, full-stack social media platform built to explore real-world product features such as authentication, posts, interactions, messaging, and real-time updates. LinkUp focuses on scalable architecture, clean separation of concerns, real-world UX decisions, and performance and security best practices.

## Project Overview

LinkUp is a comprehensive social media application that allows users to connect, share content, and communicate in real-time. The platform addresses the growing need for secure, performant social networking solutions by implementing industry-standard practices for user management, content sharing, and real-time communication.

The project serves as a demonstration of building production-ready applications with modern web technologies, emphasizing scalability, security, and user experience.

## Features

### Authentication
- User registration and login with email/username
- Social authentication (Google, Facebook, Twitter)
- Password reset with email verification
- Secure JWT-based session management
- Account banning and moderation capabilities

### User Profiles
- Public and private account settings
- Profile customization (name, bio, picture, cover photo)
- Follow/follow request system for private accounts
- User search and discovery

### Posts & Interactions
- Create text, image, and video posts
- Like, comment, and reply to posts
- Real-time post updates and notifications
- Post ownership and editing capabilities
- Content moderation with unsafe keyword filtering

### Messaging
- Real-time one-on-one messaging
- End-to-end encryption (E2E) for message security
- Message attachments (images, videos, files)
- Typing indicators and read receipts
- Message editing, deletion, and reactions
- Conversation search and infinite scroll

### Stories
- Create temporary photo/video stories
- Story replies that initiate conversations
- Story expiration and automatic cleanup
- Real-time story notifications

### Real-time Features
- WebSocket-based real-time updates
- Live notifications for interactions
- Real-time messaging and typing indicators
- Instant post and story updates

### Search & Discovery
- User search by username or profile name
- Post and message search within conversations
- Explore feed for content discovery

### Advanced Features
- Redis-based caching for performance
- Rate limiting and CSRF protection
- Content moderation and spam prevention
- Background job processing
- Comprehensive logging and error handling

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit + Zustand
- **Real-time**: Socket.io-client
- **Animations**: Framer Motion
- **UI Components**: Headless UI, Lucide React
- **Forms**: React Hook Form with Zod validation
- **Infinite Scroll**: React Infinite Scroll Component

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT + Passport.js
- **Validation**: Express Validator
- **File Upload**: Multer + Cloudinary

### Database
- **Primary**: PostgreSQL with Prisma ORM
- **Caching**: Redis (Upstash)
- **Schema Management**: Prisma Migrate

### Realtime
- **Protocol**: WebSocket via Socket.io
- **Features**: Real-time messaging, notifications, typing indicators
- **Scalability**: Room-based message distribution

### Authentication
- **Strategy**: JWT with refresh tokens
- **Social Login**: Google, Facebook, Twitter OAuth
- **Password Hashing**: bcrypt
- **Session Storage**: Redis

### Deployment
- **Frontend**: Vercel
- **Backend**: Fly.io
- **Database**: Managed PostgreSQL
- **Caching**: Upstash Redis
- **File Storage**: Cloudinary

## System Architecture

LinkUp follows a modern full-stack architecture with clear separation of concerns:

### API Layer
- RESTful API endpoints organized by feature
- Middleware stack for authentication, validation, and security
- Rate limiting and CSRF protection
- Comprehensive error handling and logging

### State Management
- Redux Toolkit for global application state
- Zustand for lightweight component-level state
- Real-time state synchronization via WebSocket

### Data Flow
1. User actions trigger API calls or WebSocket events
2. Backend processes requests with business logic in services
3. Database operations handled by Prisma ORM
4. Real-time updates broadcast via Socket.io
5. Frontend state updated through Redux/Zustand

### Real-time Architecture
- Socket.io server integrated with Express
- JWT-based authentication for WebSocket connections
- Room-based message distribution for efficient broadcasting
- Typing indicators and presence management

## Environment Variables

The application requires the following environment variables:

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/linkup

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# Redis
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@linkup.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
TWITTER_CONSUMER_KEY=your-twitter-key
TWITTER_CONSUMER_SECRET=your-twitter-secret

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
CSRF_SECRET=your-csrf-secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

## Getting Started

### Prerequisites
- Node.js 22.x or later
- PostgreSQL database
- Redis instance (local or Upstash)
- Cloudinary account for file storage
- SendGrid account for email services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mahmoudramadan21/14.LinkUp.git
   cd linkup
   ```

2. **Backend Setup**
   ```bash
   cd 05_Implementation/Source_Code/backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   cd ../backend
   npx prisma generate
   npx prisma db push
   ```

5. **Environment Configuration**
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Fill in all required environment variables

### Running the Project

1. **Start the Backend**
   ```bash
   cd 05_Implementation/Source_Code/backend
   npm start
   ```
   The backend will run on `http://localhost:8000`

2. **Start the Frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

3. **Access the Application**
   Open `http://localhost:3000` in your browser

## Scripts

### Backend Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint and TypeScript checks
- `npm run type-check` - Run TypeScript type checking

## Security Considerations

### Password Security
- Passwords hashed using bcrypt with salt rounds
- Minimum password length requirements
- Password reset with time-limited verification codes

### Authentication & Authorization
- JWT tokens with expiration and refresh mechanism
- Secure cookie settings (httpOnly, secure, sameSite)
- Token blacklisting for logout
- Role-based access control

### API Security
- CSRF protection with csurf middleware
- Rate limiting with express-rate-limit
- Input validation with express-validator
- CORS configuration for allowed origins
- Helmet.js for security headers

### Data Protection
- End-to-end encryption for messages
- Secure file upload validation
- Content moderation and unsafe keyword filtering
- User data sanitization

## Performance Optimizations

### Database Optimizations
- Prisma ORM with optimized queries
- Database indexing on frequently queried fields
- Connection pooling and prepared statements
- N+1 query prevention with proper includes

### Caching Strategy
- Redis caching for session data and tokens
- Database query result caching
- Static asset caching with appropriate headers
- CDN integration for media files

### Frontend Optimizations
- Next.js built-in optimizations (code splitting, SSR)
- Image optimization with Next.js Image component
- Lazy loading for components and images
- Virtual scrolling for large lists

### Real-time Efficiency
- WebSocket room-based message distribution
- Debounced typing indicators
- Pagination and infinite scroll for message history
- Background cleanup jobs for expired data

## Folder Structure

```
linkup/
├── 00_Project_Documentation/          # Project planning and requirements
├── 01_Project_Planning_&_Management/  # Project management documents
├── 02_Literature_Review/              # Research and analysis
├── 03_Requirement_Gathering/         # Requirements and use cases
├── 04_System_Analysis_&_Design/       # Architecture and design docs
├── 05_Implementation/
│   └── Source_Code/
│       ├── backend/                   # Backend application
│       │   ├── src/
│       │   │   ├── controllers/       # Route handlers
│       │   │   ├── middleware/        # Express middleware
│       │   │   ├── models/            # Database models
│       │   │   │   └── prisma/        # Prisma schema and migrations
│       │   │   ├── routes/            # API routes
│       │   │   ├── services/          # Business logic services
│       │   │   ├── socket/            # WebSocket handlers
│       │   │   ├── utils/             # Utility functions
│       │   │   ├── validators/        # Input validation
│       │   │   └── index.js           # Application entry point
│       │   ├── Dockerfile             # Container configuration
│       │   ├── fly.toml               # Fly.io deployment config
│       │   └── package.json
│       └── frontend/                  # Frontend application
│           ├── src/
│           │   ├── app/               # Next.js app router
│           │   ├── components/        # React components
│           │   ├── services/          # API service functions
│           │   ├── socket/            # WebSocket client
│           │   ├── store/             # State management
│           │   ├── styles/            # Global styles
│           │   ├── types/             # TypeScript types
│           │   └── utils/             # Utility functions
│           ├── public/                # Static assets
│           ├── next.config.ts         # Next.js configuration
│           └── package.json
└── README.md                          # This file
```

## Future Improvements

### Planned Features
- Group messaging and channels
- Video calling integration
- Advanced content moderation with AI
- Push notifications for mobile apps
- Advanced analytics and insights
- Multi-language support

### Technical Enhancements
- GraphQL API implementation
- Microservices architecture migration
- Advanced caching with Redis clusters
- Real-time collaboration features
- Machine learning for content recommendations
- Advanced search with Elasticsearch

### Performance & Scalability
- Horizontal scaling with load balancers
- Database sharding and read replicas
- CDN integration for global distribution
- Advanced monitoring and alerting
- Automated testing and CI/CD improvements

## Deployment

The application is designed for cloud deployment with the following considerations:

### Backend Deployment (Fly.io)
- Containerized with Docker
- Environment-specific configurations
- Automated scaling based on load
- Global distribution with multiple regions

### Frontend Deployment (Vercel)
- Static generation and SSR optimization
- Edge network for global performance
- Automatic HTTPS and CDN
- Preview deployments for pull requests

### Database & Services
- Managed PostgreSQL for reliability
- Redis cloud service (Upstash) for caching
- Cloudinary for media storage and optimization
- SendGrid for transactional emails

### Environment-Specific Considerations
- Development: Local databases and services
- Staging: Cloud services with test data
- Production: Full cloud infrastructure with monitoring

## Contributing

We welcome contributions to LinkUp! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Use conventional commit messages

### Code Style
- Use ESLint and Prettier for code formatting
- Follow TypeScript best practices for frontend
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**LinkUp** - Connecting people through modern social experiences.
