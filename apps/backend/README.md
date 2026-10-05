# Production-Ready NestJS Backend API

A scalable, enterprise-grade backend architecture built with **NestJS**, **PostgreSQL**, **Prisma ORM**, and **JWT authentication**. This project follows **Clean Architecture** principles and is optimized for outsource-friendly code standards.

# Lỡ xóa table trong database muốn dựa vào prisma để đồng bộ lại thì
yarn prisma db push

# Generate Prisma client
yarn db:generate

# Run migrations
yarn db:migrate:dev

cd /home/pp09base-backend/; git pull; yarn build;pm2 stop pp09base-backend; yarn db:generate; yarn db:migrate:dev; pm2 restart pp09base-backend

## 🎯 Project Overview

This backend implements a complete authentication system with role-based access control (RBAC), comprehensive error handling, audit logging, and health monitoring. It's designed to serve as a foundation for large-scale applications.

### Key Features

✅ **JWT Authentication & Token Refresh**  
✅ **Role-Based Access Control (RBAC)**  
✅ **PostgreSQL with Prisma ORM**  
✅ **Soft Delete Pattern** (data retention)  
✅ **Audit Logging** (track all changes)  
✅ **Pagination & Search**  
✅ **Global Exception Handling**  
✅ **Request ID Tracing**  
✅ **Health Check Endpoints**  
✅ **Docker Support**  
✅ **TypeScript** (100% typed)  
✅ **Comprehensive Logging**  

## 📁 Project Structure

```
src/
├── modules/                    # Feature modules
│   ├── auth/                  # Authentication (login, register, JWT)
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                 # User management with CRUD
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── health/                # Health checks & monitoring
│       ├── health.controller.ts
│       ├── health-check.service.ts
│       └── health.module.ts
├── common/                     # Shared utilities
│   ├── guards/               # JWT, Role-based guards
│   ├── decorators/           # Custom decorators (@Roles, @CurrentUser)
│   ├── filters/              # Global exception filters
│   ├── middleware/           # Request ID, logging middleware
│   ├── dtos/                 # Common DTOs (pagination, response)
│   ├── pipes/                # Custom validation pipes
│   └── constants/            # Application constants
├── prisma/                     # Database layer
│   ├── prisma.service.ts     # Central DB access
│   └── prisma.module.ts
├── config/                     # Configuration management
│   ├── app-config.service.ts # Type-safe config
│   └── config.module.ts
├── app.module.ts             # Root module
├── app.controller.ts
├── app.service.ts
└── main.ts                    # Application bootstrap

prisma/
├── schema.prisma             # Database schema with enums, indexes
└── migrations/               # Migration history
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **yarn** >= 1.22.0 (or Yarn Classic/berry)
- **PostgreSQL** >= 14
- **Docker** & **Docker Compose** (optional)

### Local Setup (Without Docker)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pp09base-backend
   ```

2. **Install dependencies**
   ```bash
  yarn install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb nestjs_db
   ```

5. **Generate Prisma client**
   ```bash
  yarn db:generate
   ```

6. **Run database migrations**
   ```bash
  yarn db:migrate:dev
   ```

7. **Start development server**
   ```bash
  yarn start:dev
   ```

   The API will be available at `http://localhost:3000/api/v1/`

### Docker Setup

**Start services with Docker Compose:**

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- NestJS app on port 3000

**View logs:**
```bash
docker-compose logs -f app
```

**Stop services:**
```bash
docker-compose down
```

## 🔐 Authentication

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    }
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Protected Endpoint Example
```bash
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | User login |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Logout user |
| POST | `/auth/change-password` | ✅ | Change password |

### Users
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users` | ✅ | - | List all users (paginated) |
| GET | `/users/me` | ✅ | - | Get current user profile |
| GET | `/users/search` | ✅ | - | Search users |
| GET | `/users/:id` | ✅ | - | Get user by ID |
| POST | `/users` | ✅ | ADMIN | Create new user |
| PATCH | `/users/:id` | ✅ | - | Update user |
| DELETE | `/users/:id` | ✅ | ADMIN | Soft delete user |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Overall health status |
| GET | `/health/readiness` | ❌ | Readiness probe (K8s) |
| GET | `/health/liveness` | ❌ | Liveness probe (K8s) |
| GET | `/health/info` | ❌ | Application info |

## 🗄️ Database Schema

### User Model
```typescript
User {
  id: UUID (primary key)
  email: String (unique)
  firstName: String
  lastName: String
  password: String (hashed)
  role: RoleEnum (ADMIN, USER, MODERATOR)
  status: UserStatusEnum (ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION)
  emailVerified: Boolean
  lastLoginAt: DateTime?
  
  // Soft delete
  isDeleted: Boolean (default: false)
  deletedAt: DateTime?
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  refreshTokens: RefreshToken[]
  auditLogs: AuditLog[]
}
```

### RefreshToken Model
```typescript
RefreshToken {
  id: UUID
  token: String (unique)
  expiresAt: DateTime
  revoked: Boolean (default: false)
  
  userId: UUID (FK)
  user: User
  
  createdAt: DateTime
}
```

### AuditLog Model
```typescript
AuditLog {
  id: UUID
  action: String (LOGIN, USER_CREATE, USER_UPDATE, etc.)
  entityType: String (User, Post, etc.)
  entityId: UUID
  changes: JSON?
  ipAddress: String?
  userAgent: String?
  
  userId: UUID (FK)
  user: User
  
  createdAt: DateTime
}
```

## 🔒 Security Features

### Password Security
- Bcrypt hashing (10 rounds minimum)
- Strong password validation
- Password change endpoint

### JWT Authentication
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Token rotation support
- Token revocation (logout)

### Authorization
- Role-Based Access Control (RBAC)
- Route guards for authentication
- Role guards for specific permissions
- Custom decorators (@Roles, @CurrentUser)

### Data Protection
- Soft delete pattern (data retention)
- Audit logging (track all changes)
- Request ID tracing
- Input validation with class-validator

## 📊 Pagination Example

```bash
GET /api/v1/users?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [
      { "id": "...", "email": "...", ... }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## 🛠️ Common Tasks

### Database Operations

**Create migration**
```bash
 yarn db:migrate:dev -- --name add_new_table
```

**Push schema changes**
```bash
  yarn db:migrate
```

**Open Prisma Studio**
```bash
  yarn db:studio
```

**Seed database**
```bash
  yarn db:seed
```

### Development

**Format code**
```bash
  yarn format
```

**Lint code**
```bash
  yarn lint
```

**Run tests**
```bash
  yarn test
```

**Watch tests**
```bash
  yarn test:watch
```

**Code coverage**
```bash
  yarn test:cov
```

### Production

**Build**
```bash
yarn build
```

**Start production**
```bash
yarn start:prod
```

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t nestjs-backend:latest .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  nestjs-backend:latest
```

## 📋 Environment Variables

See `.env.example` for complete configuration. Key variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=super-secret-key
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d
CORS_ORIGIN=https://yourdomain.com
FIREBASE_ENABLED=true
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=base64-encoded-service-account-json
```

## 🧪 Testing

### Unit Tests
```bash
yarn test
```

### E2E Tests
```bash
yarn test:e2e
```

### With Coverage
```bash
yarn test:cov
```

## 🚢 Deployment

### Deploy to Production

1. **Build application**
   ```bash
  yarn build
   ```

2. **Set environment variables** (on server)
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=...
   export JWT_SECRET=...
   ```

3. **Run migrations**
   ```bash
  yarn db:migrate
   ```

4. **Start application**
   ```bash
  yarn start:prod
   ```

### Kubernetes Deployment

See health check endpoints:
- Readiness: `GET /api/v1/health/readiness`
- Liveness: `GET /api/v1/health/liveness`

### CI/CD Pipeline

Update `.gitlab-ci.yml` or GitHub Actions workflow with:
1. Install dependencies
2. Run linting
3. Run tests
4. Build Docker image
5. Push to registry
6. Deploy to production

## 📚 Architecture Principles

### Clean Architecture
- **Separation of Concerns**: Controllers, Services, Repositories
- **Single Responsibility**: Each class has one reason to change
- **Dependency Injection**: Loose coupling via NestJS DI
- **SOLID Principles**: Applied throughout codebase

### Best Practices
- Global exception handling
- Centralized logging
- Request ID tracing
- Graceful shutdown
- Health monitoring
- Comprehensive audit logging

### Outsource-Friendly
- Well-documented code
- Consistent naming conventions
- Clear folder structure
- Type-safe with TypeScript
- Comprehensive comments

## 🔄 Workflow Example: Adding New Feature

1. **Create feature module**
   ```bash
   nest g module modules/posts
   nest g service modules/posts
   nest g controller modules/posts
   ```

2. **Define database schema** (Prisma)
   ```prisma
   model Post {
     id String @id @default(uuid())
     title String
     content String
     userId String
     user User @relation(fields: [userId], onDelete: Cascade)
     
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

3. **Create migration**
   ```bash
  yarn db:migrate:dev -- --name add_posts
   ```

4. **Create DTOs**
   ```typescript
   CreatePostDto { title, content }
   UpdatePostDto { title?, content? }
   PostResponseDto { id, title, content, user, createdAt }
   ```

5. **Implement service with audit logging**
   ```typescript
   @Injectable()
   export class PostsService {
     async create(dto: CreatePostDto, userId: string) {
       await this.prisma.executeTransaction(async (tx) => {
         const post = await tx.post.create({ data: { ...dto, userId } });
         await tx.createAuditLog({
           action: 'POST_CREATE',
           entityType: 'Post',
           entityId: post.id,
           userId,
         });
         return post;
       });
     }
   }
   ```

6. **Implement controller with guards**
   ```typescript
   @Controller('posts')
   export class PostsController {
     @UseGuards(JwtGuard)
     @Post()
     create(@Body() dto: CreatePostDto, @CurrentUserId() userId: string) {
       return this.postsService.create(dto, userId);
     }
   }
   ```

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📄 License

UNLICENSED - Proprietary

## 👥 Support

For questions or issues, contact the backend team or create an issue in the repository.

---

**Created:** January 2024  
**Last Updated:** January 2024  
**Maintainers:** Backend Team

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
