# Alenna API - Clean Architecture

Backend API for Alenna SaaS - Educational Management System for A.C.E. (Accelerated Christian Education) schools.

Built with **Clean Architecture** principles for maintainability, testability, and scalability.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start) - **👈 Start here!**
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Clean Architecture](#-clean-architecture)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Package Manager**: pnpm
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Clerk
- **Validation**: Zod
- **Architecture**: Clean Architecture / Hexagonal

---

## ⚡ Quick Start

### Prerequisites

Before you begin, ensure you have:

1. ✅ **Node.js 18+** - [Download](https://nodejs.org)
2. ✅ **Docker Desktop** - [Download](https://docs.docker.com/get-docker/)
3. ✅ **Git Bash** (Windows only) - Comes with [Git for Windows](https://git-scm.com/download/win)
4. ✅ **Clerk Account** - [Sign up](https://clerk.com) (free)

> **Note**: pnpm will be installed automatically by setup.sh if not present.

### Automated Setup (Recommended)

Run the setup script to automate everything:

```bash
# Make script executable (first time only)
chmod +x setup.sh

# Run setup
./setup.sh
```

> **Windows users**: Use Git Bash, WSL, or run the manual installation steps below.

The script will:
1. ✅ Check prerequisites (Node.js, pnpm, Docker)
2. ✅ Install dependencies
3. ✅ Create `.env` file from template
4. ✅ Start Docker PostgreSQL
5. ✅ Generate Prisma Client
6. ✅ Run database migrations

**After setup completes:**
1. Open `.env` and add your Clerk API keys from [dashboard.clerk.com](https://dashboard.clerk.com)
2. Run `pnpm run dev` to start the server

### Manual Installation

If you prefer to set up manually:

```bash
# 1. Install pnpm (if not already installed)
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL with Docker
docker-compose up -d

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your Clerk API keys

# 5. Run database migrations
pnpm run prisma:migrate

# 6. Generate Prisma client
pnpm run prisma:generate

# 7. Seed database (optional)
pnpm run prisma:seed

# 8. Start development server
pnpm run dev
```

Server runs on `http://localhost:3000`

**Test it:**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"...","environment":"development"}
```

---

## 📁 Project Structure

```
src/
├── config/                    # App configuration
│   └── env.ts                # Environment validation
│
├── core/                      # Clean Architecture layers
│   ├── domain/               # Domain Layer (Entities)
│   │   └── entities/
│   │       ├── School.ts
│   │       ├── User.ts
│   │       └── Student.ts
│   │
│   ├── adapters_interface/   # Ports (Repository Interfaces)
│   │   └── repositories/
│   │       ├── ISchoolRepository.ts
│   │       ├── IUserRepository.ts
│   │       └── IStudentRepository.ts
│   │
│   ├── app/                  # Application Layer
│   │   ├── dtos/            # Data Transfer Objects (Validation)
│   │   └── use-cases/       # Business Logic
│   │       ├── auth/
│   │       ├── schools/
│   │       ├── users/
│   │       └── students/
│   │
│   └── frameworks/           # Frameworks Layer (External Tools)
│       ├── api/             # Express (Controllers, Routes, Middleware)
│       │   ├── controllers/
│       │   ├── middleware/
│       │   └── routes/
│       ├── database/        # Prisma (Repositories, Mappers)
│       │   ├── mappers/
│       │   └── repositories/
│       └── di/              # Dependency Injection
│           └── container.ts
│
├── utils/                    # Shared utilities
│   ├── errors.ts
│   └── logger.ts
│
└── server.ts                 # Application entry point
```

---

## 🏗️ Clean Architecture

This project implements **Clean Architecture** (Hexagonal Architecture) with the core principle: **dependencies point inward**.

### Architecture Layers

```
┌─────────────────────────────────────┐
│   Frameworks & Drivers (Outermost)  │  ← Express, Prisma
│  ┌───────────────────────────────┐  │
│  │   Interface Adapters          │  │  ← Controllers, Presenters
│  │  ┌─────────────────────────┐  │  │
│  │  │   Application Layer     │  │  │  ← Use Cases
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │   Domain Layer    │  │  │  │  ← Entities (Core)
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Dependencies flow: Outer → Inner
Data flow: Bidirectional
```

### Layer Responsibilities

| Layer           | Path                       | Purpose           | Can Import            | Cannot Import               |
| --------------- | -------------------------- | ----------------- | --------------------- | --------------------------- |
| **Domain**      | `core/domain/`             | Business entities | Other domain entities | Frameworks, Use Cases, DTOs |
| **Application** | `core/app/`                | Use Cases, DTOs   | Domain, Interfaces    | Frameworks, Implementations |
| **Adapters**    | `core/adapters_interface/` | Interfaces/Ports  | Domain                | Frameworks, Implementations |
| **Frameworks**  | `core/frameworks/`         | Implementations   | Everything            | Nothing (outermost layer)   |

### Data Flow Example

**Creating a Student:**

```
1. HTTP Request → POST /api/students
   ↓
2. Route → students.routes.ts
   ↓
3. Middleware → Auth & Tenant validation
   ↓
4. Controller → StudentController.createStudent()
   - Validates input with DTO
   - Calls Use Case
   ↓
5. Use Case → CreateStudentUseCase.execute()
   - Creates domain entity
   - Calls repository interface
   ↓
6. Repository → StudentRepository.create()
   - Saves to Prisma
   - Maps Prisma → Domain entity
   ↓
7. Response → Returns through all layers
```

### Code Examples

**Domain Entity (Pure Business Logic):**
```typescript
// src/core/domain/entities/Student.ts
export class Student {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    // ...
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isGraduating(): boolean {
    const monthsUntilGraduation = 
      (this.graduationDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000);
    return monthsUntilGraduation <= 6 && monthsUntilGraduation >= 0;
  }
}
```

**Repository Interface (Port):**
```typescript
// src/core/adapters_interface/repositories/IStudentRepository.ts
export interface IStudentRepository {
  findById(id: string, schoolId: string): Promise<Student | null>;
  create(student: Student): Promise<Student>;
  update(id: string, data: Partial<Student>, schoolId: string): Promise<Student>;
  delete(id: string, schoolId: string): Promise<void>;
}
```

**Use Case (Business Logic Orchestration):**
```typescript
// src/core/app/use-cases/students/CreateStudentUseCase.ts
export class CreateStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(input: CreateStudentInput, schoolId: string): Promise<Student> {
    const student = Student.create({ ...input, schoolId });
    return this.studentRepository.create(student);
  }
}
```

**Controller (API Layer):**
```typescript
// src/core/frameworks/api/controllers/StudentController.ts
export class StudentController {
  async createStudent(req: Request, res: Response): Promise<void> {
    const validatedData = CreateStudentDTO.parse(req.body);
    const student = await container.createStudentUseCase.execute(
      validatedData,
      req.schoolId!
    );
    res.status(201).json(student);
  }
}
```

### Benefits

1. **Testability** - Business logic isolated and easy to test
2. **Maintainability** - Clear separation of concerns
3. **Flexibility** - Easy to swap databases or frameworks
4. **Scalability** - Well-organized code scales better

### Adding New Features

Example: Adding a "Course" entity

```typescript
// 1. Domain Entity
// src/core/domain/entities/Course.ts
export class Course { /* ... */ }

// 2. Repository Interface
// src/core/adapters_interface/repositories/ICourseRepository.ts
export interface ICourseRepository { /* ... */ }

// 3. Use Cases
// src/core/app/use-cases/courses/CreateCourseUseCase.ts
export class CreateCourseUseCase { /* ... */ }

// 4. Repository Implementation
// src/core/frameworks/database/repositories/CourseRepository.ts
export class CourseRepository implements ICourseRepository { /* ... */ }

// 5. DI Container
// src/core/frameworks/di/container.ts
get createCourseUseCase() { return new CreateCourseUseCase(this.courseRepository); }

// 6. Controller & Routes
// src/core/frameworks/api/controllers/CourseController.ts
export class CourseController { /* ... */ }
```

---

## 📚 API Endpoints

Base URL: `http://localhost:3000/api/v1`

All endpoints (except `/auth/sync` and `/schools` POST) require Clerk authentication.

**Health Check** (no versioning): `GET /api/health`

### Authentication
| Method | Endpoint        | Description          | Auth Required |
| ------ | --------------- | -------------------- | ------------- |
| POST   | `/v1/auth/sync` | Sync user from Clerk | No            |
| GET    | `/v1/auth/me`   | Get current user     | Yes           |

### Schools
| Method | Endpoint         | Description        | Auth Required | Role  |
| ------ | ---------------- | ------------------ | ------------- | ----- |
| POST   | `/v1/schools`    | Create school      | No            | -     |
| GET    | `/v1/schools/me` | Get current school | Yes           | All   |
| PUT    | `/v1/schools/me` | Update school      | Yes           | ADMIN |

### Users
| Method | Endpoint        | Description   | Auth Required | Role          |
| ------ | --------------- | ------------- | ------------- | ------------- |
| GET    | `/v1/users`     | Get all users | Yes           | All           |
| PUT    | `/v1/users/:id` | Update user   | Yes           | ADMIN or Self |
| DELETE | `/v1/users/:id` | Delete user   | Yes           | ADMIN         |

### Students
| Method | Endpoint           | Description      | Auth Required | Role  |
| ------ | ------------------ | ---------------- | ------------- | ----- |
| GET    | `/v1/students`     | Get all students | Yes           | All   |
| GET    | `/v1/students/:id` | Get student      | Yes           | All   |
| POST   | `/v1/students`     | Create student   | Yes           | All   |
| PUT    | `/v1/students/:id` | Update student   | Yes           | All   |
| DELETE | `/v1/students/:id` | Delete student   | Yes           | ADMIN |

### Health Check
| Method | Endpoint  | Description | Auth Required |
| ------ | --------- | ----------- | ------------- |
| GET    | `/health` | API status  | No            |

---

## 🔐 Multi-Tenancy & Security

- **Row-level multi-tenancy**: Each school is a tenant
- **Automatic data isolation**: All queries scoped to user's school
- **Role-based access control**: ADMIN, TEACHER, SUPERVISOR
- **Clerk authentication**: Industry-standard auth
- **Middleware protection**: Auth + Tenant isolation on all routes

---

## 🌍 Environment Variables

Create a `.env` file in the root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
# Local: postgresql://username:password@localhost:5432/alenna_db
# Neon: Get from https://neon.tech
# Supabase: Get from project settings
DATABASE_URL="postgresql://username:password@localhost:5432/alenna_db?schema=public"

# Clerk Authentication
# Get from https://dashboard.clerk.com → API Keys
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Database Setup Options

**Option A: Docker (Recommended for Local Development) 🐳**

The easiest way to run PostgreSQL locally:

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Your DATABASE_URL will be:
DATABASE_URL="postgresql://alenna_user:alenna_password@localhost:5432/alenna_db?schema=public"

# Access pgAdmin (Database GUI) at http://localhost:5050
# Email: admin@alenna.local / Password: admin
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL
# Create database
createdb alenna_db

# Use this URL
DATABASE_URL="postgresql://username:password@localhost:5432/alenna_db"
```

**Option C: Neon (Free Cloud Database)**
1. Go to [neon.tech](https://neon.tech)
2. Create account & project
3. Copy connection string

**Option D: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create project
3. Settings → Database → Copy connection string

---

## 🛠️ Development Guide

### Commands

```bash
# Development
pnpm run dev              # Start dev server with hot reload

# Docker
pnpm run docker:up        # Start PostgreSQL
pnpm run docker:down      # Stop PostgreSQL
pnpm run docker:reset     # Reset database (delete all data)

# Database
pnpm run prisma:studio    # Open Prisma Studio (DB GUI)
pnpm run prisma:migrate   # Create & run migration
pnpm run prisma:generate  # Generate Prisma Client
pnpm run prisma:seed      # Seed database

# Production
pnpm run build           # Build TypeScript
pnpm start               # Start production server
```

### Database Management

**Docker PostgreSQL:**
```bash
# Start database
docker-compose up -d

# Stop database (data persists)
docker-compose down

# Stop and delete all data (⚠️)
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Access pgAdmin GUI at http://localhost:5050
```

**Prisma Migrations:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm run prisma:migrate
# 3. Generate client
pnpm run prisma:generate
```

**Reset Database (⚠️ Deletes all data):**
```bash
# Option 1: Prisma reset
pnpm exec prisma migrate reset

# Option 2: Docker reset
docker-compose down -v
docker-compose up -d
pnpm run prisma:migrate
```

**Backup & Restore:**
```bash
# Backup
docker exec alenna-postgres pg_dump -U alenna_user alenna_db > backup.sql

# Restore
docker exec -i alenna-postgres psql -U alenna_user alenna_db < backup.sql
```

**Access PostgreSQL CLI:**
```bash
# Using Docker
docker exec -it alenna-postgres psql -U alenna_user -d alenna_db

# Or with psql installed locally
psql -h localhost -U alenna_user -d alenna_db
```

### Testing API

Use `api-tests.http` file with [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) VS Code extension.

Or use curl:
```bash
# Create school
curl -X POST http://localhost:3000/api/v1/schools \
  -H "Content-Type: application/json" \
  -d '{"name": "Grace Christian Academy", "address": "123 Main St"}'

# Sync user (after Clerk login)
curl -X POST http://localhost:3000/api/v1/auth/sync \
  -H "Content-Type: application/json" \
  -d '{
    "clerkId": "user_xxx",
    "email": "teacher@school.com",
    "schoolId": "school-id-from-above"
  }'

# Get students (with auth)
curl http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Frontend Integration

```typescript
// Example: React + Clerk
import { useAuth } from '@clerk/clerk-react';

const API_URL = 'http://localhost:3000/api/v1';

function useStudents() {
  const { getToken } = useAuth();

  async function getStudents() {
    const token = await getToken();
    const response = await fetch(`${API_URL}/students`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  }

  return { getStudents };
}
```

### Access Database GUI

**pgAdmin** is available at `http://localhost:5050`

1. **Login**: `admin@alenna.local` / `admin`
2. **Add Server**:
   - Name: `Alenna Local`
   - Host: `postgres`
   - Port: `5432`
   - Database: `alenna_db`
   - Username: `alenna_user`
   - Password: `alenna_password`

**Prisma Studio** (Alternative):
```bash
pnpm run prisma:studio
# Opens at http://localhost:5555
```

---

## 🚀 Deployment

### Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway add  # Add PostgreSQL
# Set env vars in Railway dashboard
railway up
```

### Render

1. Create Web Service
2. Connect Git repo
3. Build: `pnpm install && pnpm run build`
4. Start: `pnpm start`
5. Add env vars in dashboard

### Vercel (Serverless)

```bash
npm i -g vercel
vercel
vercel env add  # Add environment variables
```

---

## 🐛 Troubleshooting

### Cannot connect to database

**If using Docker:**
```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Other checks:**
- Check `DATABASE_URL` is correct in `.env`
- Ensure PostgreSQL is running: `docker-compose ps`
- Test connection: `pnpm exec prisma db pull`

### Unauthorized errors
- Check `CLERK_SECRET_KEY` is set
- Verify token in Authorization header
- Check token validity in Clerk dashboard

### User not found
- Call `/api/auth/sync` first
- Ensure `schoolId` exists

### pnpm not found
```bash
npm install -g pnpm
```

### Migration errors
```bash
# Reset and start fresh
pnpm exec prisma migrate reset

# Or with Docker
docker-compose down -v
docker-compose up -d
pnpm run prisma:migrate
```

### Port 5432 already in use

If you have PostgreSQL already running locally:
```bash
# Stop local PostgreSQL
# macOS/Linux: brew services stop postgresql
# Windows: Stop PostgreSQL service

# Or change Docker port in docker-compose.yml:
ports:
  - "5433:5432"  # Use 5433 instead

# Then update .env:
DATABASE_URL="postgresql://alenna_user:alenna_password@localhost:5433/alenna_db"
```

---

## 📖 Best Practices

### ✅ DO

- Keep business logic in domain entities
- Use interfaces for repository contracts
- Validate input with DTOs (Zod)
- Use dependency injection
- Write tests for use cases

### ❌ DON'T

- Import frameworks in domain layer
- Put business logic in controllers
- Use concrete implementations in use cases
- Skip input validation
- Access database directly from controllers

---

## 🎯 Architecture Rules

**Domain Layer:**
- ✅ Pure business logic
- ✅ Reference other domain entities
- ❌ No framework imports
- ❌ No DTOs or API types

**Application Layer:**
- ✅ Use domain entities
- ✅ Use repository interfaces
- ❌ No framework imports
- ❌ No concrete implementations

**Adapters Layer:**
- ✅ Define interfaces only
- ❌ No implementations

**Frameworks Layer:**
- ✅ Implement everything
- ✅ Framework-specific code
- ✅ Import anything

**Remember**: Dependencies always point **inward** 🎯

---

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ using Clean Architecture**
