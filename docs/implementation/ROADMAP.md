# CLOUDPULSE RE-ENGINEERING ROADMAP

**Document Version:** 1.0.0  
**Updated:** March 2026

---

## Roadmap Phases Overview

```
Phase 0: Discovery & Audit (COMPLETE)
   │
Phase 1: Build & Type Quality Foundation
   │
Phase 2: Database, Identity, RBAC & Credential Encryption
   │
Phase 3: VPS Connection & Live Monitoring Engine
   │
Phase 4: VPS Management (PM2, Files, Terminal, Crons)
   │
Phase 5: Project Management & Git Integration
   │
Phase 6: Deployment Engine (Live Logs, Rollback, Health Check)
   │
Phase 7: Nginx Routing, Domains & Automated SSL
   │
Phase 8: Backups, Alerts & Notification Delivery
   │
Phase 9: Global Dashboard & Frontend API Wiring
   │
Phase 10: Production Hardening, Testing & Final Verification
```

---

## Phase Details & Action Items

### Phase 0 — Repository Discovery & Audit (COMPLETE)
- [x] Codebase exploration & dependency analysis.
- [x] Identification of broken controller syntax (`projects.controller.ts`) and Next.js typecheck errors.
- [x] Audit documents generated:
  - `docs/audit/PROJECT_AUDIT.md`
  - `docs/audit/FEATURE_MATRIX.md`
  - `docs/architecture/CURRENT_ARCHITECTURE.md`
  - `docs/architecture/TARGET_ARCHITECTURE.md`
  - `docs/implementation/ROADMAP.md`

---

### Phase 1 — Build & Type Quality Foundation
- [ ] **Task 1.1:** Fix NestJS backend controller syntax error in `apps/backend/src/modules/projects/projects.controller.ts`.
- [ ] **Task 1.2:** Verify `@cloudpulse/backend` compiles cleanly via `pnpm --filter @cloudpulse/backend build`.
- [ ] **Task 1.3:** Fix TypeScript compilation errors in `@cloudpulse/web` (`deployments/page.tsx`, `settings/page.tsx`, `projects/page.tsx`, `project-nav-header.tsx`).
- [ ] **Task 1.4:** Ensure `pnpm typecheck` passes workspace-wide.

---

### Phase 2 — Database, Identity, RBAC & Credential Encryption
- [ ] **Task 2.1:** Implement `EncryptionService` using AES-256-GCM in NestJS backend.
- [ ] **Task 2.2:** Update `VpsService` to encrypt passwords/SSH keys on save and decrypt before SSH execution.
- [ ] **Task 2.3:** Add `ownerId` / `workspaceId` to `Vps` and `Project` schemas in `schema.prisma`.
- [ ] **Task 2.4:** Remove synthetic hardcoded dummy VPS fallbacks (`36.50.176.26`) and return proper NestJS HTTP exceptions (`NotFoundException`, `ForbiddenException`).

---

### Phase 3 — VPS Connection & Live Monitoring Engine
- [ ] **Task 3.1:** Enhance `SshService` to support connection keepalive, strict timeout controls, and structured error responses.
- [ ] **Task 3.2:** Implement live telemetry collection (`uptime`, CPU %, RAM %, Disk %, Network) without hardcoded mock values.
- [ ] **Task 3.3:** Add historical telemetry sampling service (`VpsMetricHistory`).

---

### Phase 4 — VPS Management (PM2, Files, Terminal, Crons)
- [ ] **Task 4.1:** Verify and fix PM2 management API (`getPm2Processes`, `restart`, `reload`, `scale`, `flush`, `delete`).
- [ ] **Task 4.2:** SFTP File Manager hardening (validate paths against directory traversal attacks).
- [ ] **Task 4.3:** Web Terminal command execution authorization and audit logging.
- [ ] **Task 4.4:** Crontab management sync & manual cron execution over SSH.

---

### Phase 5 — Project Management & Git Integration
- [ ] **Task 5.1:** Project CRUD and binding to target VPS.
- [ ] **Task 5.2:** Git source inspection over SSH (`git ls-remote`, branch listing, commit SHA retrieval).
- [ ] **Task 5.3:** Environment variable management (`.env` file write/read on VPS).
- [ ] **Task 5.4:** Port allocation management & conflict detection.

---

### Phase 6 — Deployment Engine
- [ ] **Task 6.1:** Implement structured deployment pipeline (Validate -> Fetch -> Install -> Build -> Migrate -> Restart PM2 -> Health Check).
- [ ] **Task 6.2:** Real-time log streaming using Server-Sent Events (SSE).
- [ ] **Task 6.3:** Automated rollback to previous known good commit on health check failure.
- [ ] **Task 6.4:** Git Webhook receiver & signature verification.

---

### Phase 7 — Nginx Routing, Domains & Automated SSL
- [ ] **Task 7.1:** Safe Nginx configuration generation from templates.
- [ ] **Task 7.2:** Nginx syntax testing (`nginx -t`) and safe reload over SSH.
- [ ] **Task 7.3:** Automated Let's Encrypt SSL issuance via Certbot over SSH.

---

### Phase 8 — Backups, Alerts & Notification Delivery
- [ ] **Task 8.1:** Database & Filesystem backup execution via SSH (`pg_dump`, `tar`).
- [ ] **Task 8.2:** Resource monitoring thresholds & alert trigger lifecycle.
- [ ] **Task 8.3:** Firebase Cloud Messaging (FCM) push notification delivery.

---

### Phase 9 — Global Dashboard & Frontend API Wiring
- [ ] **Task 9.1:** Connect `@cloudpulse/web` dashboard views to live backend API endpoints.
- [ ] **Task 9.2:** Remove static mock fallbacks from `modules/infrastructure/api.ts`, `modules/vps/api.ts`, and `modules/projects/api.ts`.
- [ ] **Task 9.3:** Add comprehensive loading skeletons, empty states, and error alerts to frontend UI.

---

### Phase 10 — Production Hardening, Testing & Final Verification
- [ ] **Task 10.1:** Execute full unit & integration tests (`pnpm test`).
- [ ] **Task 10.2:** Run production build test across all monorepo apps (`pnpm build`).
- [ ] **Task 10.3:** Validate E2E workflow & generate final verification report.
