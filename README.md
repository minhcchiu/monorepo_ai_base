# 🚀 Base Project - Monorepo Quick Start Guide

Dự án này là nền tảng Monorepo chuẩn mực dành cho các dự án izisoft, quản lý bởi **pnpm workspaces** và **TurboRepo**.

Cấu trúc gồm 4 application chính:
- `backend`: NestJS + Prisma + PostgreSQL
- `admin`: Next.js 15 (Internal Dashboard)
- `web`: Next.js 15 (Public Website)
- `mobile`: Android Native (Kotlin + Jetpack Compose)

---

## 🛠 1. Chuẩn bị Môi trường (Yêu cầu bắt buộc)

1. Cài đặt **Node.js** (>= 22.x).
2. Cài đặt **pnpm** (>= 9.x): `npm install -g pnpm`
3. Cài đặt **Java 17+** và **Android Studio** (Dành cho Mobile).
4. Cài đặt **PostgreSQL** (hoặc dùng Docker).

---

## ⚙️ 2. Khởi tạo Dự án (Lần đầu tiên)

### Bước 1: Cài đặt Dependencies
```bash
# Cài đặt toàn bộ packages cho Workspace (Backend, Admin, Web, Shared Packages)
pnpm install
```

### Bước 2: Thiết lập Database cho Backend
Copy file `.env`:
```bash
cd apps/backend
cp .env.example .env
```
Mở `.env` vừa tạo, sửa lại chuỗi kết nối PostgreSQL ở biến `DATABASE_URL` cho đúng với máy của bạn.
Sau đó khởi tạo Database và Seed dữ liệu (tài khoản Admin mẫu):
```bash
pnpm --filter @cloudpulse/backend db:migrate:dev --name init
pnpm --filter @cloudpulse/backend db:seed
```

### Bước 3: Thiết lập Environment cho Frontend (Admin & Web)
Copy `.env.example` sang `.env.local` ở `apps/admin` và `apps/web` (nếu có) và trỏ API về `http://localhost:3000`.

---

## 🏃 3. Hướng dẫn Chạy Dự án (Development)

Bạn có thể chạy toàn bộ hệ thống cùng lúc, hoặc chạy riêng lẻ từng Application.

### 🌟 Cách 1: Chạy FULL Hệ thống (Tất cả trừ Mobile)
TurboRepo sẽ tự động khởi động `backend`, `admin`, và `web` cùng lúc trên các port khác nhau (thường là 3000, 3001, 3002).
```bash
# Chạy ở thư mục gốc (Root)
pnpm dev
```

### 🎯 Cách 2: Chạy Riêng lẻ từng Application

Mở Terminal ở thư mục gốc và dùng các lệnh sau:

**1. Chạy Backend (NestJS):**
```bash
pnpm dev:backend
# API sẽ chạy tại: http://localhost:3000
# Swagger Docs tại: http://localhost:3000/api/docs
```

**2. Chạy Admin (Next.js Dashboard):**
```bash
pnpm dev:admin
# Admin chạy tại: http://localhost:3001
```

**3. Chạy Web (Next.js Public Site):**
```bash
pnpm dev:web
# Web chạy tại: http://localhost:3002
```

**4. Chạy Mobile (Android Native):**
Vì Mobile sử dụng **Gradle** (Không nằm trong `pnpm workspace`), bạn có 2 cách để chạy:
- **Cách A (Bằng dòng lệnh từ Root):**
  ```bash
  pnpm mobile
  ```
  Lệnh này sẽ gọi `./gradlew :app:installDebug` và cài thẳng app vào máy ảo Emulator đang mở hoặc điện thoại Android đã cắm cáp.
- **Cách B (Bằng Android Studio):**
  Mở thư mục `apps/mobile` bằng Android Studio, chờ Gradle sync xong và bấm nút **▶ Run 'app'**.

---

## 🧪 4. Hướng dẫn Code Quality & Kiểm tra Lỗi

Hệ thống được thiết lập khắt khe với Husky, ESLint và TypeScript. Bạn **BẮT BUỘC** phải fix hết lỗi mới có thể commit code.

Để tự kiểm tra trước khi commit, chạy các lệnh sau ở **thư mục gốc**:

```bash
pnpm lint       # Chạy ESLint quét toàn bộ dự án
pnpm typecheck  # Kiểm tra lỗi TypeScript toàn bộ dự án
pnpm build      # Test build production xem có vỡ không
```

> **Lưu ý Commit:** 
> Dự án áp dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Ví dụ: `feat: add login page`, `fix: crash on mobile`. Nếu viết sai format, Husky sẽ từ chối cho bạn commit!

---

## 🤖 5. Quy tắc dành cho AI / Code Agents
Toàn bộ guideline, rules, và kiến trúc hệ thống dành cho AI (như Cursor, Copilot, Cline) đã được thiết lập kỹ lưỡng tại:
- `docs/architecture/MONOREPO_ARCHITECTURE.md`: Kiến trúc tổng thể Monorepo.
- `ai_prompts/`: Quy chuẩn code, system prompt và hướng dẫn riêng biệt cho từng layer (`backend`, `admin`, `web`, `mobile`). 
AI nên ưu tiên tham chiếu các file trong `ai_prompts/` trước khi thao tác trên code base.
