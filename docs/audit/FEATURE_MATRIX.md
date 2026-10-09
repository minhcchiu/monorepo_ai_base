# CLOUDPULSE FEATURE STATUS MATRIX

**Updated:** March 2026  
**Evaluation Standard:** Direct Code Inspection & Build Verification

---

## 1. Global Infrastructure Management (Level 1)

| Feature Module | Feature Description | Status | Evidence / Implementation Path |
| :--- | :--- | :--- | :--- |
| **System Dashboard** | Global summary KPI cards (CPU, RAM, Storage, Bandwidth) | `MOCKED` | `apps/web/src/modules/infrastructure/api.ts` falls back to `MOCK_INFRASTRUCTURE_DATA` |
| **VPS Fleet Overview** | List all connected VPS nodes with status badges | `PARTIAL` | `VpsService.findAll()` queries DB, but UI falls back to `MOCK_VPS_LIST` on network error |
| **Global Project List** | Cross-VPS project list with runtime info | `PARTIAL` | `ProjectsService.findAllGlobal()` exists; frontend uses fallback `MOCK_PROJECTS` |
| **Global Monitoring** | Aggregate resource telemetry and metric charts | `MOCKED` | Frontend uses static chart data from mock constants |
| **Deployment History** | System-wide deployment audit log | `PARTIAL` | `Deployment` model exists; backend service fetches top 10 per project |
| **Alerts & Notifications**| System alert triggers & FCM push notifications | `PARTIAL` | `NotificationService` and `FirebaseMessagingService` implemented in NestJS |
| **Global Backups** | Overview of backups across all VPS nodes | `PARTIAL` | `VpsBackup` schema exists; backend lists backups per VPS |
| **User & Role Admin** | Manage Users, User Roles (User, Admin), status | `VERIFIED` | Fully implemented in `apps/backend/src/modules/admin/` & `apps/admin` |
| **System Settings** | System key/value configurations | `VERIFIED` | `SystemSetting` model & `AdminSystemSettingsService` fully functional |

---

## 2. Individual VPS Management (Level 2)

| Feature Module | Feature Description | Status | Evidence / Implementation Path |
| :--- | :--- | :--- | :--- |
| **VPS Overview** | Specific VPS hardware specs, OS, Kernel, Uptime | `VERIFIED` | `VpsService.findOne()` inspects live SSH telemetry (`uptime && free -m && df -h /`) |
| **SSH Connectivity** | Test SSH credentials & host connection | `VERIFIED` | `SshService.executeCommand()` uses `ssh2` package with password/key support |
| **Resource Telemetry** | CPU %, RAM %, Disk %, Network Mbps live metrics | `VERIFIED` | `VpsService.getVpsMonitoring()` parses Linux shell outputs into structured metrics |
| **Hosted Projects** | Projects assigned to specific VPS node | `PARTIAL` | DB relation `Project -> Vps` exists; UI fallback active |
| **PM2 Process Manager**| List, Restart, Reload, Scale, Flush, Delete PM2 apps | `VERIFIED` | `SshService.getPm2Processes()` executes `pm2 jlist` over SSH |
| **Web Terminal** | Shell command execution via WebSocket/HTTP | `PARTIAL` | HTTP execution (`execTerminalCommand`) working; WebSocket gateway exists |
| **SFTP File Manager** | List, Read, Write, Delete, Mkdir, Chmod on VPS | `VERIFIED` | `VpsService` file methods execute SFTP/SSH file commands |
| **Cron Jobs Manager** | List, Add, Edit, Disable, Run Crontab tasks | `VERIFIED` | `VpsService.getCrons()` parses crontab output via SSH |
| **Domains & Nginx** | Manage Nginx domain proxy configurations | `PARTIAL` | Nginx generator exists in `ProjectsService`; domain DNS verification working |
| **SSL Management** | Let's Encrypt SSL issuance & expiry tracking | `PARTIAL` | `ProjectDomain` model tracks SSL status; certbot execution present |
| **VPS Backups** | Database & filesystem backup creation | `PARTIAL` | `createBackup` runs `pg_dump` or `tar` commands over SSH |
| **VPS Settings** | Update VPS name, IP, port, credentials | `PARTIAL` | CRUD endpoints exist; credentials stored unencrypted in DB |

---

## 3. Project & Application Lifecycle Management

| Feature Module | Feature Description | Status | Evidence / Implementation Path |
| :--- | :--- | :--- | :--- |
| **Project Overview** | App status, runtime, branch, commit, memory/CPU | `PARTIAL` | `ProjectsService.findByVps()` retrieves DB project with PM2 sync |
| **Git Source Control** | Inspect Git repo, branches, commits over SSH | `VERIFIED` | `ProjectsService.inspectRepo()` runs `git ls-remote` via SSH |
| **Runtime Config** | Node.js/Python version, entry point, instances | `VERIFIED` | `ProjectsService.updateRuntime()` updates project settings |
| **Environment Vars** | Manage `.env` key-value pairs on VPS | `VERIFIED` | Writes `.env` files directly to project working directory on VPS |
| **Deployment Engine** | Multi-step automated build, deploy, reload | `PARTIAL` | Executed synchronously via SSH; background queue needed for long builds |
| **Deployment Rollback**| Rollback to previous commit build | `PARTIAL` | Git checkout rollback logic implemented in `ProjectsService` |
| **Git Webhooks** | Auto-deploy on GitHub/GitLab push event | `PARTIAL` | Webhook endpoint parses payload; HMAC signature verification required |
| **Port Management** | Port assignment & conflict checking | `VERIFIED` | `checkPortsAvailability` checks DB and active Linux listening ports (`netstat/ss`) |
| **Nginx Routing** | Domain proxy & multi-app routing generation | `VERIFIED` | `generateNginxConfig` supports subdomain and path-based proxy templates |

---

## 4. Operational & Security Status

| Domain | Assessment | Status | Notes |
| :--- | :--- | :--- | :--- |
| **TypeScript Build** | Workspace typecheck | `BROKEN` | `apps/backend` has syntax error in controller; `apps/web` has 15+ type mismatches |
| **Secrets Security** | Credential storage safety | `BROKEN` | Passwords & private keys in plain text in PostgreSQL `Vps` table |
| **RBAC Authorization** | Access control on VPS endpoints | `MISSING` | Scoping by user/workspace missing on VPS/Project routes |
| **Error Handling** | UI response to API/SSH failures | `MOCKED` | UI hides errors behind static mock data instead of alerting user |
