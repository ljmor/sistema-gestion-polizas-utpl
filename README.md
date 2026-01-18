# Sistema de Gestión de Pólizas y Siniestros (Backend)

## Requirements
- Node.js 20+
- Docker & Docker Compose (optional, for local DB)
- PostgreSQL (if not using Docker)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Setup:
   - Copy `.env.example` (if exists) or use the generated `.env`.
   - Update `DATABASE_URL` if you are using a custom Postgres instance.
   - Update `JWT_SECRET`.

3. Database:
   - If using Docker:
     ```bash
     docker-compose up -d
     ```
   - Run migrations:
     ```bash
     npx prisma migrate dev --name init
     ```
   - If you cannot run migrations (e.g. no DB connection yet), generate the client:
     ```bash
     npx prisma generate
     ```

4. Run Application:
   ```bash
   npm run start:dev
   ```

## API Documentation
- Swagger UI is available at: `http://localhost:3000/api`

## Architecture
- **NestJS** Modular Architecture.
- **Prisma** ORM.
- **Auth**: JWT with Passport.
- **Modules**: Auth, Users, Public, Siniestros.