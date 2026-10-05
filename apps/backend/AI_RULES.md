# 📘 AI_RULES.md
Stack: NestJS + Prisma + PostgreSQL + Redis

---

# 🎯 PURPOSE

This document defines strict rules that any AI assistant (GitHub Copilot, ChatGPT, etc.) must follow when generating code for this project.

AI must NOT break architecture, conventions, or security rules.

---

# 1️⃣ CORE STACK (MANDATORY)

Framework: NestJS  
ORM: Prisma  
Database: PostgreSQL  
Cache: Redis  
Auth: JWT  
Docs: Swagger  

All generated code must be compatible with this stack.

AI must NOT:
- Replace Prisma with another ORM
- Replace JWT with session auth
- Introduce a new architecture pattern
- Add unnecessary libraries

---

# 2️⃣ PROJECT STRUCTURE (MANDATORY)

AI must follow this structure:
 

src/
│
├── main.ts
├── app.module.ts
│
├── config/
│
├── common/
│   ├── constants/
│   ├──────enums.ts
│   ├── decorators/
│   ├── dto/
│   ├── enum-examples.dto.ts
│   ├── dtos/
│   ├── filters/
│   ├── guards/
│   ├── middleware/
│   ├── pipes/
│   ├── services/
│   ├── strategies/    
│   ├── interceptors/
│   └── utils/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   └── <new-module>/
│
├── prisma/
└── database/

❌ AI must NOT:
- Place files outside modules
- Create random folder structures
- Mix business logic inside controller

---

# 3️⃣ ARCHITECTURE RULE (STRICT)

Must follow:

Controller → Service → Prisma

Controller:
- Handle request/response only
- No business logic
- No database access

Service:
- Business logic only
- Call Prisma
- No HTTP logic

Prisma:
- Accessed only from service layer

❌ Controller must NEVER call Prisma directly.

---

# 4️⃣ AUTHENTICATION RULES

JWT Payload format MUST ALWAYS be:

{
  sub: user.id,
  email: user.email,
  role: user.role
}

All protected routes must include:

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)

Role-based routes must include:

@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)

AI must NOT:
- Hardcode JWT secret
- Expose password field
- Skip guards on protected routes

---

# 5️⃣ SWAGGER RULES

Every controller must include:

@ApiTags()

Every endpoint must include:

@ApiOperation()
@ApiResponse()

DTO properties must include:

@ApiProperty()

Swagger must NOT expose:
- password
- refreshToken
- internalId
- system fields

---

# 6️⃣ DATABASE RULES (PRISMA)

AI must:

- Use Prisma schema
- Use DTO validation
- Use migrations
- Use pagination for list endpoints

❌ AI must NOT:
- Use raw SQL unless explicitly requested
- Use "select *"
- Use db push for production logic
- Modify database manually

---

# 7️⃣ SECURITY RULES

AI must:

- Hash passwords using bcrypt
- Never return password field
- Use ConfigService for env variables
- Validate input using class-validator
- Sanitize sensitive data

Production safety:

- No stack trace exposure
- No console.log in production
- No debug logs in controller

---

# 8️⃣ RESPONSE FORMAT STANDARD

Success response:

{
  "success": true,
  "message": "Operation successful",
  "data": {}
}

Error response:

{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE"
}

All generated endpoints must follow this format.

---

# 9️⃣ PAGINATION RULE

All list endpoints must support:

- page
- limit

Must return:

{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}

AI must NOT return full table without pagination.

---

# 🔟 ENVIRONMENT RULE

AI must use ConfigModule.

Never hardcode:

- JWT_SECRET
- DATABASE_URL
- REDIS_PASSWORD
- SWAGGER credentials

All configs must come from environment variables.

---

# 1️⃣1️⃣ REDIS RULE

Redis can be used for:

- Caching
- Rate limiting
- Token blacklist
- Queue system

Redis must NOT store primary business data.

---

# 1️⃣2️⃣ CODE STYLE RULE

Naming conventions:

- Files: kebab-case
- Class: PascalCase
- Variable: camelCase
- Enum: UPPER_CASE

All DTO must:

- Use class-validator
- Use class-transformer

---

# 1️⃣3️⃣ WHEN GENERATING NEW MODULE

AI must:

1. Create module folder inside modules/
2. Create:
   - controller
   - service
   - dto/
3. Add Swagger decorators
4. Add validation
5. Follow response format
6. Follow pagination rule if list endpoint

---

# 1️⃣4️⃣ ERROR HANDLING RULE

AI must:

- Throw HttpException
- Use proper HTTP status codes
- Not expose internal DB error messages

---

# 1️⃣5️⃣ PERFORMANCE RULE

AI must:

- Select only required fields
- Avoid heavy nested queries
- Add index suggestions if needed
- Always paginate large datasets

---

# 1️⃣6️⃣ CLEAN CODE RULE

AI must:

- Use clear naming
- Keep functions small
- Avoid duplicate logic
- Extract reusable logic into common/
- Keep controllers thin

---

# 1️⃣7️⃣ DO NOT BREAK

AI must NOT:

- Change folder structure
- Remove Swagger
- Remove Guards
- Replace Prisma
- Replace JWT
- Introduce microservices without request

If unsure, follow existing project pattern.

---

# 🚀 FINAL INSTRUCTION FOR AI

When generating any feature:

- Respect architecture
- Respect security rules
- Respect folder structure
- Respect response format
- Respect JWT & RBAC rules
- Respect Swagger rules
- Respect Prisma usage rules

If unsure, follow existing project pattern.