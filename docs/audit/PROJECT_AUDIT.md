# CLOUDPULSE PROJECT AUDIT REPORT

**Date:** March 2026  
**Auditor:** Principal Software Architect & Engineering Team  
**Scope:** Complete Codebase Audit (`apps/backend`, `apps/admin`, `apps/web`, `apps/mobile`, `packages/*`, `prisma/schema.prisma`)

---

## 1. Executive Summary & Audit Methodology

CloudPulse is designed as a Production-Grade Infrastructure & Application Lifecycle Orchestrator. It provides centralized management for multiple VPS nodes, PM2 processes, automated Git deployments, Nginx reverse proxy routing, SSL certificates, SFTP file management, web terminal access, cron jobs, backups, and real-time monitoring.

This audit was conducted by examining the actual source code, database schemas, API controllers, frontend views, build systems, and execution paths in the repository.

### Summary of Audit Classifications
- `VERIFIED`: Functionality is fully implemented, typed, and backed by working DB/SSH execution logic.
- `PARTIAL`: Basic API or logic exists, but edge cases, lifecycle states, or complete workflows are missing.
- `MOCKED`: Frontend or backend falls back to hardcoded mock data (`MOCK_VPS_LIST`, `MOCK_INFRASTRUCTURE_DATA`, `MOCK_PROJECTS`, etc.).
- `BROKEN`: Code exists but contains compilation, syntax, or runtime errors (e.g. `projects.controller.ts` syntax error, Next.js typecheck failures).
- `MISSING`: Business feature is required by architecture/specs but not implemented.
- `BLOCKED`: Requires external infrastructure or live VPS credentials for end-to-end physical verification.

---

## 2. Technical Stack & Repository Structure

### 2.1 Workspace Architecture
- **Monorepo Manager:** `pnpm` workspaces (v9.15.0) + `TurboRepo` (v2.10.0).
- **Node Runtime:** `>= 20.0.0`
- **Database:** PostgreSQL with `Prisma ORM` (v7.4.1).

### 2.2 Application Topology
| Path | Application Name | Tech Stack | Status |
| :--- | :--- | :--- | :--- |
| `apps/backend` | `@cloudpulse/backend` | NestJS 11, Prisma 7.4.1, PostgreSQL, RxJS, `ssh2` | `BROKEN` (Syntax error in `projects.controller.ts` line 25) |
| `apps/web` | `@cloudpulse/web` | Next.js 15 (App Router), React 19, Tailwind v4, TanStack Query v5 | `BROKEN` (Typecheck errors in 4 files, relies heavily on MOCK fallbacks) |
| `apps/admin` | `@cloudpulse/admin` | Next.js 15 (App Router), React 19, Tailwind v4 | `VERIFIED` (Typecheck passes 100%) |
| `apps/mobile` | `apps/mobile` | Android Native (Kotlin + Jetpack Compose, Gradle) | `VERIFIED` (Independent Gradle build) |

### 2.3 Shared Packages
| Package | Description | Status |
| :--- | :--- | :--- |
| `packages/api-contract` | Generated OpenAPI client contracts (`admin.ts`, `app.ts`, `user.ts`) | `VERIFIED` |
| `packages/shared-ts` | Shared types, constants, and utilities | `VERIFIED` |
| `packages/ui` | Shared Radix UI & Tailwind component primitives | `VERIFIED` |
| `packages/config` | Base configurations (`tsconfig`, `eslint`, `prettier`) | `VERIFIED` |

---

## 3. Deep Dive Technical Findings

### 3.1 Backend Quality & Execution Path Analysis (`apps/backend`)
1. **Critical Syntax Error in Controller:**
   - File: `apps/backend/src/modules/projects/projects.controller.ts` (Line 25)
   - Issue: Stray string token `app` between `@Post('sync-pm2')` and `@Post('inspect-repo')`.
   - Impact: Completely breaks `nest build` and causes NestJS compilation to crash with 693 errors.

2. **Hardcoded Fallbacks to Dummy IPs & IDs:**
   - Files: `projects.service.ts` (lines 32, 34, 941, 1292, 2375) and `vps.service.ts` (lines 84, 86).
   - Issue: When a VPS is not found in the database, `resolveVps` and `findOne` automatically create or return a dummy VPS record with hardcoded IP `36.50.176.26` and ID `bcf8819c-954f-4235-a63c-8e5a79177e7f`.
   - Impact: Violates Production-Ready principles by producing silent synthetic data instead of proper `NotFoundException`.

3. **SSH Remote Execution & Security (`SshService`):**
   - Implementer: `ssh2` package for remote execution + `child_process` local fallback for `localhost`.
   - Positives: Stream-based real-time log chunk callbacks (`onLogChunk`), timeout handlers, and keyboard-interactive auth fallback.
   - Flaws:
     - VPS credentials (passwords, private SSH keys) are stored as plain text in the `Vps` model in database.
     - SSH host key verification is disabled (`readyTimeout` without `hostHash` or known_hosts check), making connections vulnerable to MITM if deployed on untrusted networks.

4. **Authentication & Role Scoping:**
   - Auth system uses JWT Bearer tokens with `RefreshToken` rotation in `AuthService`.
   - Role enforcement via `@Roles(UserRole.ADMIN)` exists for Admin endpoints.
   - **Gap:** `Vps` and `Project` entities lack ownership fields (`ownerId` / `workspaceId`). Any authenticated user with access to API endpoints can query or mutate any VPS node.

### 3.2 Frontend Quality & Mock Data Usage (`apps/web`)
1. **Typecheck Failures:**
   - File 1: `src/app/vps/[id]/projects/[projectId]/deployments/page.tsx`
     - Comparing incompatible deployment status types (`"SUCCESS" | "FAILED" | "BUILDING"` vs `"RUNNING"`).
     - Passing unknown property `buildFilter` to `triggerProjectDeployment`.
   - File 2: `src/app/vps/[id]/projects/[projectId]/settings/page.tsx`
     - Property `pm2Name` missing on type `ProjectItem`.
   - File 3: `src/app/vps/[id]/projects/page.tsx`
     - Accessing `username` on `VpsClusterDetail`.
     - `SubAppConfig` type mismatches.
     - Undeclared global `fetchProjectDeployments`.
     - Unknown properties `gitBranch` and `branch` on deployment trigger payload.
   - File 4: `src/modules/projects/components/project-nav-header.tsx`
     - Unknown property `branch` on `triggerProjectDeployment` payload.

2. **Pervasive Mock Data Fallbacks:**
   - `modules/infrastructure/api.ts`: Catches network errors and returns `MOCK_INFRASTRUCTURE_DATA`.
   - `modules/vps/api.ts`: Catches network errors and returns `MOCK_VPS_LIST`, `MOCK_PM2_PROCESSES`, `MOCK_VPS_FILES`, `MOCK_VPS_CRONS`, `MOCK_VPS_DOMAINS`, `MOCK_VPS_BACKUPS`.
   - `modules/projects/api.ts`: Catches network errors and returns `MOCK_PROJECTS`.
   - Issue: UI displays realistic metrics and process lists even when backend server is down or SSH connection fails. Must be refactored to show explicit error / offline states.

### 3.3 Database & Schema Audit (`prisma/schema.prisma`)
- Models defined: `User`, `RefreshToken`, `AuditLog`, `HealthCheck`, `Notification`, `SystemSetting`, `Subscription`, `Purchase`, `Usage`, `ApiRequestLog`, `Vps`, `Project`, `Deployment`, `ProjectDomain`, `ProjectActivity`, `VpsMetricHistory`, `VpsCronJob`, `VpsBackup`, `ProjectWebhook`.
- Gaps identified:
  - Missing AES-256 encryption for `Vps.password` and `Vps.sshKey`.
  - Missing `ownerId` on `Vps` and `Project`.
  - Missing relation between `Deployment` and `User` (who triggered).
  - Missing backup storage credentials model (S3 / R2 buckets).

---

## 4. Priority Remediation Plan
1. **Phase 1:** Fix NestJS backend compilation error and Next.js frontend typecheck errors immediately.
2. **Phase 2:** Implement AES-256 credential encryption service in NestJS backend and remove all synthetic hardcoded fallback IP/ID logic.
3. **Phase 3:** Enforce strict backend ownership / RBAC on VPS and Project routes.
4. **Phase 4:** Connect `apps/web` components to live NestJS APIs, removing silent mock fallbacks and adding proper loading/error states.
5. **Phase 5:** Harden SSH connection lifecycle, SFTP file operations, Web Terminal security, Nginx configuration generation, and deployment engine background jobs.
