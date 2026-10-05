# Monorepo Architecture

## 1. Overview
This repository uses a strict Monorepo 4 Application + Shared Packages Architecture, managed by `pnpm` workspaces and `TurboRepo`.

## 2. Applications (`apps/`)
- **`backend`**: NestJS + Prisma + PostgreSQL backend. Provides REST APIs.
- **`mobile`**: Native Android (Kotlin + Jetpack Compose) application. It is excluded from the pnpm workspace and uses Gradle.
- **`admin`**: Next.js (App Router) internal dashboard for administrators.
- **`web`**: Next.js (App Router) public-facing web application.

## 3. Shared Packages (`packages/`)
- **`api-contract`**: Contains OpenAPI specifications and generated TypeScript types (`openapi-typescript`) for sharing API contracts between backend and frontends.
- **`shared-ts`**: Shared TypeScript utilities, constants, and validation logic.
- **`config`**: Centralized configuration for ESLint, Prettier, and TypeScript (`tsconfig.base.json`).
- **`ui`**: Shared React components (TailwindCSS, Radix UI, etc.) for `admin` and `web`.

## 4. Dependency Rules
Dependencies MUST flow downwards:
`apps/*` -> `packages/*` -> External Libraries.

- Frontends (`admin`, `web`, `mobile`) MUST NOT import from `backend` source code directly.
- Frontends MUST communicate with the backend via the network (REST API) using types defined in `api-contract`.
- `admin` and `web` are separate applications and MUST NOT import from each other. Shared logic goes to `packages/shared-ts` or `packages/ui`.

## 5. Mobile Integration
The `apps/mobile` directory is a standalone Gradle project. It does not participate in TurboRepo builds but exists in the monorepo for codebase colocation.
