# pp09base Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuẩn hoá `pp09baseproduct` thành base template sạch: đổi tên `pp00base`→`pp09base`, gỡ nghiệp vụ Rock Identifier khỏi `apps/mobile` (giữ core IAP/IAA, bỏ 15 feature đá quý), và port 9 module IAP/quota từ `apps/backend_pp03_refer` vào `apps/backend`.

**Architecture:** Monorepo pnpm không đổi (backend NestJS/Prisma, web-admin Next.js, mobile Android Gradle ngoài workspace). Mobile tách thành 2 Gradle module `:core` (IAP/IAA/network/theme — bất biến giữa các sản phẩm) + `:app` (feature — xoá sạch khi clone base). Backend port module bằng cách copy nguyên file từ `apps/backend_pp03_refer` rồi patch chính xác (rename `scan→action` cho trung tính, sửa 4 bug đã biết, gắn `@ApiScope`).

**Tech Stack:** NestJS 11 + Prisma 7 + PostgreSQL, Next.js 15, Kotlin + Jetpack Compose + Hilt + Retrofit, Gradle Kotlin DSL, pnpm + Turborepo.

## Global Constraints

- Scope package đổi thành `@pp09base/*` (từ `@pp00base/*`).
- Cổng nội bộ: backend **22090**, web-admin **32090** (từ 22000/32000).
- Android `namespace`/`applicationId`: `com.izisoft.pp09base` (từ `com.rock.ai.rock.identifier`).
- Gradle `rootProject.name`: `pp09base_android`.
- Mọi endpoint client-facing mới PHẢI gắn `@ApiScope(...)` — thiếu sẽ bị loại khỏi cả 3 swagger spec (root rule mục 3).
- `User` model của base giữ nguyên: `email String @unique` bắt buộc, `firstName`/`lastName` bắt buộc — KHÔNG đổi theo `apps/backend_pp03_refer` (model đó có `email String?`, `name String?`).
- Không hardcode secret/URL trong source — luôn qua env/`BuildConfig`.
- Migration Prisma đầu tiên của base tên `init`, gộp cả phần lõi lẫn phần IAP/quota mới.
- Không code feature nghiệp vụ mới; không hỗ trợ IAP iOS (chỉ chuẩn bị enum `Platform.IOS`).

---

## Phase 1 — Dọn rác & bịt secret

### Task 1: Xoá rác build + xoá secret trong `apps/mobile`, thêm file `.example`

**Files:**
- Delete: `apps/mobile/app/build/`, `apps/mobile/.gradle/`, `apps/mobile/.idea/`, `apps/mobile/.kotlin/`, `apps/mobile/.vscode/`, `apps/mobile/output.log`, `apps/mobile/docs-json.json`, `apps/mobile/local.properties`, `apps/mobile/app/.DS_Store`, `apps/mobile/.github/`, `apps/mobile/README.md`, `apps/mobile/app/rock-identifier-keystore.jks`, `apps/mobile/key.properties`, `apps/mobile/app/google-services.json`, `apps/mobile/features/ratting/` (nếu tồn tại ở path này — thực tế nằm ở `apps/mobile/app/src/main/java/com/rock/ai/rock/identifier/features/ratting/`)
- Create: `apps/mobile/key.properties.example`
- Create: `apps/mobile/app/google-services.json.example`
- Modify: `apps/mobile/app/build.gradle.kts` (signing config không crash khi thiếu `key.properties`)

**Interfaces:** Không có — chỉ dọn file + tự vệ Gradle script, không đổi hành vi feature.

- [ ] **Step 1: Xoá thư mục rác build/IDE**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
rm -rf app/build .gradle .idea .kotlin .vscode .github
rm -f output.log docs-json.json local.properties app/.DS_Store
rm -f README.md
```

- [ ] **Step 2: Xoá 3 file secret thật**

```bash
rm -f app/rock-identifier-keystore.jks key.properties app/google-services.json
rm -rf app/src/main/java/com/rock/ai/rock/identifier/features/ratting
```

- [ ] **Step 3: Tạo `key.properties.example`**

```bash
cat > key.properties.example <<'EOF'
# Copy thành key.properties (đã gitignore) rồi điền giá trị thật.
# Tạo keystore mới: keytool -genkey -v -keystore app/release.keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
storePassword=change-me
keyPassword=change-me
keyAlias=upload
storeFile=app/release.keystore.jks
EOF
```

- [ ] **Step 4: Tạo `app/google-services.json.example`**

```bash
cat > app/google-services.json.example <<'EOF'
{
  "_comment": "Placeholder. Tạo Firebase project mới rồi tải google-services.json thật vào app/google-services.json (đã gitignore). Xem hướng dẫn: https://firebase.google.com/docs/android/setup",
  "project_info": {
    "project_number": "REPLACE_ME",
    "project_id": "REPLACE_ME",
    "storage_bucket": "REPLACE_ME.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "REPLACE_ME",
        "android_client_info": { "package_name": "com.izisoft.pp09base" }
      },
      "api_key": [{ "current_key": "REPLACE_ME" }]
    }
  ],
  "configuration_version": "1"
}
EOF
```

- [ ] **Step 5: Xác nhận `.gitignore` của mobile đã chặn 3 file secret**

```bash
grep -E "\*\.jks|key\.properties|google-services\.json" .gitignore
```
Expected: cả 3 pattern đều có mặt (`*.keystore`/`*.jks`, `local.properties`, cần thêm `google-services.json` nếu chưa có — xem Step 6).

- [ ] **Step 6: Thêm `google-services.json` vào `.gitignore` nếu thiếu**

```bash
grep -q "^google-services.json$" .gitignore || cat >> .gitignore <<'EOF'

# Firebase config thật — chỉ commit bản .example
app/google-services.json
EOF
```

- [ ] **Step 7: Sửa `app/build.gradle.kts` — KHÔNG crash khi thiếu `key.properties` (vừa xoá ở Step 2)**

`signingConfigs.create("release")` hiện đọc `keystoreProperties["keyAlias"] as String` vô điều kiện — nếu
`key.properties` không tồn tại (đúng trạng thái sau Step 2), `keystoreProperties` rỗng, ép kiểu `as String`
trên `null` ném `NullPointerException` ngay lúc Gradle evaluate script, khiến MỌI task (kể cả `compileDebugKotlin`)
crash. Phải sửa trước khi chạy bất kỳ lệnh `./gradlew` nào ở các Task sau (Task 17 trở đi).

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -n "signingConfigs {" -A 8 app/build.gradle.kts
```
Expected:
```kotlin
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = rootProject.file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
```

Dùng Edit tool sửa thành:

```kotlin
    val hasReleaseSigning = keystorePropertiesFile.exists()
    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = rootProject.file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }
```

Tìm tiếp đoạn `buildTypes`:

```kotlin
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
```

Sửa thành:

```kotlin
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
```

Không có `key.properties` → build `release` vẫn chạy được (APK unsigned/debug-signed tuỳ cấu hình máy), chỉ
build `assembleRelease` để phát hành thật mới cần tạo `key.properties` từ `key.properties.example`.

```bash
grep -n "hasReleaseSigning" app/build.gradle.kts
```
Expected: 3 dòng (khai báo `val` + 2 chỗ dùng).

- [ ] **Step 9: Build kiểm chứng — Gradle không còn crash khi thiếu `key.properties`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew help
```
Expected: `BUILD SUCCESSFUL` (trước Step 7, lệnh này crash với `NullPointerException` ngay từ bước evaluate script).

- [ ] **Step 10: Kiểm tra kích thước còn lại và commit**

```bash
du -sh /Volumes/Data/Product/pp09baseproduct/apps/mobile
```
Expected: dưới 10MB (từ ~511MB).

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile
git status --short apps/mobile | grep -E "\.jks|google-services\.json$|key\.properties$"
```
Expected: lệnh `grep` không in ra dòng nào (không có secret nào được stage).

```bash
git commit -m "chore(mobile): dọn rác build + xoá secret, sửa signing config không crash khi thiếu key.properties"
```

---

### Task 2: Xoá secret trong `apps/backend_pp03_refer` (chỉ dọn, chưa xoá cả thư mục — còn dùng để port ở Phase 3)

**Files:**
- Delete: `apps/backend_pp03_refer/pc-api-6069487326580261483-172-b4c556e09e40.json`, `apps/backend_pp03_refer/.env`, `apps/backend_pp03_refer/.env.example`, `apps/backend_pp03_refer/yarn.lock`, `apps/backend_pp03_refer/copilot_history/`, `apps/backend_pp03_refer/copilot_history_v1/`, `apps/backend_pp03_refer/copilot_prompts/`

**Interfaces:** Không có.

- [ ] **Step 1: Xoá private key Google Play + mật khẩu DB production**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer
rm -f "pc-api-6069487326580261483-172-b4c556e09e40.json" .env .env.example yarn.lock
rm -rf copilot_history copilot_history_v1 copilot_prompts
```

- [ ] **Step 2: Xác nhận thư mục này KHÔNG được git track (chưa từng commit)**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git status --short apps/backend_pp03_refer | head -5
```
Expected: toàn bộ dòng bắt đầu bằng `??` (untracked) — xác nhận `apps/backend_pp03_refer` chưa từng vào git history, nên xoá file ở đây không để lại vết trong log.

Không commit bước này riêng — `apps/backend_pp03_refer` sẽ bị xoá hẳn ở cuối Phase 3 (Task 17), không bao giờ được `git add`.

---
## Phase 2 — Chuẩn hoá tên monorepo (`pp00base` → `pp09base`)

### Task 3: Đổi tên `pp00base` → `pp09base` xuyên 23 file + đổi cổng nội bộ

**Files:**
- Modify (rename `pp00base`→`pp09base`, giữ nguyên phần còn lại): `package.json`, `README.md`, `AI_RULES_ROOT.md`, `apps/backend/package.json`, `apps/backend/README.md`, `apps/backend/docs/deploy.md`, `apps/backend/src/docs/export-specs.ts`, `apps/backend/src/docs/docs.setup-stoplight.ts`, `apps/backend/src/modules/notification/firebase-messaging.service.ts`, `apps/web-admin/package.json`, `apps/web-admin/docs/deploy.md`, `apps/web-admin/next.config.ts`, `apps/web-admin/src/types/api.ts`, `apps/web-admin/src/lib/api-contract.ts`, `packages/shared-ts/package.json`, `packages/shared-ts/src/index.ts`, `packages/api-contract/package.json`, `packages/api-contract/src/index.ts`, `packages/api-contract/README.md`, `ai_prompts/01.list tasks project.md`, `ai_prompts/02.run task.md`
- Modify (rename + đổi cổng + đổi path deploy): `ecosystem.config.js`, `apps/backend/ecosystem.config.js`, `apps/web-admin/ecosystem.config.js`
- Modify (xoá dòng `apps/web-user` không tồn tại): `pnpm-workspace.yaml`
- Modify (script `mobile` từ Flutter sang Gradle): `package.json`

**Interfaces:** Không có — đổi tên thuần tuý, không đổi hành vi runtime.

- [ ] **Step 1: Đổi tên `pp00base` → `pp09base` trên 20 file (không đụng cổng/path)**

```bash
cd /Volumes/Data/Product/pp09baseproduct
FILES=(
  package.json
  README.md
  AI_RULES_ROOT.md
  apps/backend/package.json
  apps/backend/README.md
  apps/backend/docs/deploy.md
  apps/backend/src/docs/export-specs.ts
  apps/backend/src/docs/docs.setup-stoplight.ts
  apps/backend/src/modules/notification/firebase-messaging.service.ts
  apps/web-admin/package.json
  apps/web-admin/docs/deploy.md
  apps/web-admin/next.config.ts
  apps/web-admin/src/types/api.ts
  apps/web-admin/src/lib/api-contract.ts
  packages/shared-ts/package.json
  packages/shared-ts/src/index.ts
  packages/api-contract/package.json
  packages/api-contract/src/index.ts
  packages/api-contract/README.md
  "ai_prompts/01.list tasks project.md"
  "ai_prompts/02.run task.md"
)
sed -i '' 's/pp00base/pp09base/g' "${FILES[@]}"
```

- [ ] **Step 2: Đổi tên + đổi cổng trong 3 file `ecosystem.config.js`**

```bash
sed -i '' -e 's/pp00base/pp09base/g' -e 's/PORT: 22000/PORT: 22090/g' -e 's/PORT: 32000/PORT: 32090/g' -e 's/-p 32000/-p 32090/g' \
  ecosystem.config.js apps/backend/ecosystem.config.js apps/web-admin/ecosystem.config.js
```

- [ ] **Step 3: Xác nhận không còn `pp00base` hay cổng cũ (trừ `pnpm-lock.yaml`)**

```bash
grep -rl "pp00base" . --include="*.json" --include="*.js" --include="*.ts" --include="*.md" 2>/dev/null | grep -v node_modules | grep -v pnpm-lock.yaml
grep -rn "22000\|32000" ecosystem.config.js apps/backend/ecosystem.config.js apps/web-admin/ecosystem.config.js
```
Expected: dòng đầu không in gì; dòng hai không in gì.

- [ ] **Step 4: Sửa `pnpm-workspace.yaml` — bỏ `apps/web-user` không tồn tại**

```bash
cat pnpm-workspace.yaml
```

```
packages:
  - 'apps/backend'
  - 'apps/web-admin'
  - 'apps/web-user'
  - 'packages/*'
# Lưu ý: apps/mobile (Flutter) KHÔNG nằm trong JS workspace — quản lý riêng bằng pub/FVM.
```

Ghi đè bằng nội dung đúng:

```bash
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - 'apps/backend'
  - 'apps/web-admin'
  - 'packages/*'
# Lưu ý: apps/mobile (Android Gradle) KHÔNG nằm trong pnpm workspace — quản lý riêng bằng Gradle.
EOF
```

- [ ] **Step 5: Sửa script `mobile` trong `package.json` root — từ Flutter sang Gradle**

```bash
grep -n '"mobile"' package.json
```
Expected: `"mobile": "cd apps/mobile && flutter run"`

```bash
sed -i '' 's#"mobile": "cd apps/mobile && flutter run"#"mobile": "cd apps/mobile \&\& ./gradlew :app:installDebug"#' package.json
grep -n '"mobile"' package.json
```
Expected: `"mobile": "cd apps/mobile && ./gradlew :app:installDebug"`

- [ ] **Step 6: `pnpm install` để cập nhật lockfile theo scope mới, verify build**

```bash
pnpm install
pnpm typecheck
```
Expected: cả hai lệnh thoát mã 0. `pnpm-lock.yaml` sẽ có diff (scope `@pp00base/*` → `@pp09base/*`) — đây là diff mong đợi duy nhất trong file này.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: đổi tên pp00base -> pp09base, sửa pnpm-workspace.yaml, đổi cổng 22090/32090"
```

---

### Task 4: Viết lại `README.md` và `AI_RULES_ROOT.md` cho đúng thực tế (mobile là Android Kotlin, không phải Flutter)

**Files:**
- Modify: `README.md`
- Modify: `AI_RULES_ROOT.md`

**Interfaces:** Không có — chỉ sửa tài liệu.

- [ ] **Step 1: Đọc lại 2 file sau khi Task 3 đã đổi tên**

```bash
cat README.md
cat AI_RULES_ROOT.md
```

- [ ] **Step 2: Sửa `README.md` — mục "Cấu trúc" và "Bắt đầu một dự án mới"**

Thay khối mô tả `mobile` (đang ghi "Flutter + Riverpod — quản lý riêng (pub/FVM, KHÔNG nằm trong pnpm workspace)") thành:

```
  mobile      Android (Kotlin + Jetpack Compose) — Gradle, KHÔNG nằm trong pnpm workspace
              apps/mobile/core/  Gradle module :core (IAP, IAA, network, theme — bất biến)
              apps/mobile/app/   Gradle module :app  (feature — xoá khi clone base)
```

Thay bước 6 trong "Bắt đầu một dự án mới" (hiện ghi `flutterfire configure` + placeholder `google-services.json`/`firebase_options.dart`) thành:

```
6. Firebase (nếu dùng push/analytics): tạo Firebase project mới trên console, tải
   `google-services.json` thật, ghi đè `apps/mobile/app/google-services.json`
   (đã gitignore, xem `apps/mobile/app/google-services.json.example`).
```

Sửa lệnh trong mục "Lệnh thường dùng" — dòng `pnpm mobile   # flutter run trong apps/mobile` thành `pnpm mobile   # gradlew :app:installDebug trong apps/mobile`.

Dùng Edit tool áp các thay đổi trên vào `README.md`.

- [ ] **Step 3: Sửa `AI_RULES_ROOT.md` mục 1 — cấu trúc monorepo**

Đổi dòng `mobile      Flutter — quản lý riêng (pub/FVM, KHÔNG nằm trong pnpm workspace; nhóm: app)` thành:

```
  mobile      Android Kotlin + Jetpack Compose — Gradle, KHÔNG nằm trong pnpm workspace (nhóm: app)
```

- [ ] **Step 4: Sửa `AI_RULES_ROOT.md` mục 4 — luồng phụ thuộc contract**

Đổi dòng `└─ mobile     swagger_parser <- api/swagger-app.json (CHỈ nhóm app)` thành:

```
             └─ mobile     Retrofit + tay viết interface theo swagger-app.json (CHỈ nhóm app)
```

- [ ] **Step 5: Sửa `AI_RULES_ROOT.md` mục 5 — quy ước env**

Đổi câu `KHÔNG hardcode URL/secret/DSN/token trong source — luôn đọc từ env (process.env / String.fromEnvironment cho Flutter)` thành:

```
- KHÔNG hardcode URL/secret/DSN/token trong source — luôn đọc từ env (`process.env` cho
  backend/web-admin, `BuildConfig` sinh từ `gradle.properties` cho mobile Android).
```

- [ ] **Step 6: Diff review + commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git diff README.md AI_RULES_ROOT.md
```
Expected: diff chỉ chứa các đoạn sửa mô tả mobile, không đụng phần contract chung (mục 2–4 nội dung API).

```bash
git add README.md AI_RULES_ROOT.md
git commit -m "docs: sửa README + AI_RULES_ROOT — mobile là Android Kotlin, không phải Flutter"
```

---

## Phase 3 — Backend: port 9 module IAP/quota từ `apps/backend_pp03_refer`

### Task 5: Thêm model/enum Prisma cho subscription + quota + api-log

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

**Interfaces:**
- Produces: model `Subscription`, `Purchase`, `Usage`, `ApiRequestLog`; enum `SubscriptionStatus`, `PlanType`, `Platform`, `PurchaseStatus`, `Language`, `Unit`. Field mới trên `User`: `isPremium: Boolean`, `language: Language`, `unit: Unit`, `notificationsEnabled: Boolean` (KHÔNG phải `notifications` — trùng tên relation `notifications: Notification[]` đã có sẵn), relation `subscription: Subscription?`, `purchases: Purchase[]`, `usage: Usage?`, `apiRequestLogs: ApiRequestLog[]`.

- [ ] **Step 1: Đọc schema hiện tại để xác định điểm chèn**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
grep -n "^enum\|^model\|fcmTokens\|notifications Notification\[\]\|@@index(\[isDeleted\])" prisma/schema.prisma
```

- [ ] **Step 2: Thêm field mới vào `model User`**

Dùng Edit tool, tìm đoạn:

```prisma
  // Push notification device tokens
  fcmTokens String[] @default([])

  // Timestamps
  createdAt DateTime @default(now())
```

Thay bằng:

```prisma
  // Push notification device tokens
  fcmTokens String[] @default([])

  // IAP / quota state
  isPremium            Boolean  @default(false)
  language             Language @default(EN)
  unit                 Unit     @default(MM)
  notificationsEnabled Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
```

`notificationsEnabled` (không phải `notifications`) — `User` đã có sẵn relation `notifications: Notification[]`
(danh sách bản ghi thông báo, xem Step 3), một field scalar trùng tên sẽ bị Prisma từ chối compile
(`Field "notifications" is already defined on model "User"`). `notificationsEnabled` là cờ bật/tắt nhận
thông báo của user, khác hẳn khái niệm với relation `notifications`.

- [ ] **Step 3: Thêm relation mới vào `model User`**

Tìm đoạn:

```prisma
  // Relations
  refreshTokens RefreshToken[]
  auditLogs AuditLog[]
  notifications Notification[]

  // Indexes for performance optimization
```

Thay bằng:

```prisma
  // Relations
  refreshTokens RefreshToken[]
  auditLogs AuditLog[]
  notifications Notification[]
  subscription   Subscription?
  purchases      Purchase[]
  usage          Usage?
  apiRequestLogs ApiRequestLog[]

  // Indexes for performance optimization
```

- [ ] **Step 4: Thêm 6 enum mới — chèn ngay sau `enum NotificationType`**

Tìm đoạn:

```prisma
enum NotificationType {
  SYSTEM_ANNOUNCEMENT
  GENERAL
}
```

Thay bằng:

```prisma
enum NotificationType {
  SYSTEM_ANNOUNCEMENT
  GENERAL
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELED
  GRACE
}

enum PlanType {
  WEEKLY
  MONTHLY
  YEARLY
  LIFETIME
}

enum Platform {
  ANDROID
  IOS
}

enum PurchaseStatus {
  PENDING
  PURCHASED
  CANCELED
  EXPIRED
  REVOKED
}

enum Language {
  EN
  VI
}

enum Unit {
  MM
  INCH
}
```

- [ ] **Step 5: Thêm 4 model mới — chèn vào cuối file, sau `model SystemSetting`**

Tìm đoạn cuối file:

```prisma
model SystemSetting {
  id          String   @id @default(uuid())

  key         String   @unique
  value       String

  description String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Thêm vào ngay sau (giữ nguyên khối trên, append phía dưới):

```prisma

/**
 * Subscription Model
 * Trạng thái subscription HIỆN TẠI của user (1 dòng/user). Lịch sử đầy đủ từng lần
 * mua nằm ở model Purchase (khoá theo purchaseToken, không bị ghi đè khi user đổi gói).
 */
model Subscription {
  id          String   @id @default(uuid())
  userId      String   @unique

  platform    Platform?

  status      SubscriptionStatus
  plan        PlanType

  isTrial     Boolean  @default(false)

  startDate   DateTime?
  endDate     DateTime?
  expiresAt   DateTime?

  purchaseToken String? @unique
  orderId       String?

  autoRenew   Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

/**
 * Purchase Model
 * Lịch sử đầy đủ từng lần verify purchase với Google Play — append-only, không ghi đè.
 */
model Purchase {
  id            String         @id @default(uuid())

  userId        String?
  platform      Platform

  productId     String
  purchaseToken String         @unique
  orderId       String?

  isTrial       Boolean        @default(false)

  purchaseTime  DateTime?
  expiresAt     DateTime?

  status        PurchaseStatus

  rawData       Json?

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  user          User?          @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
}

/**
 * Usage Model
 * Đếm hành động miễn phí trong ngày (actionCount) + lượt thưởng từ rewarded ad
 * (rewardCount). Reset-by-computation: mỗi lần đọc so lastActionDate với hôm nay,
 * không có cron reset. Xem UsageService/RewardService.
 */
model Usage {
  id             String    @id @default(uuid())
  userId         String    @unique

  actionCount    Int       @default(0)
  lastActionDate DateTime?

  rewardCount    Int       @default(0)

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

/**
 * ApiRequestLog Model
 * Ghi mỗi HTTP request (bật qua env API_LOG_ENABLED) — dùng cho debug/audit.
 * Tự xoá bản ghi cũ hơn API_LOG_RETENTION_DAYS qua ApiLogCleanupService.
 */
model ApiRequestLog {
  id            String   @id @default(uuid())
  requestId     String?
  method        String
  path          String
  statusCode    Int
  durationMs    Int

  userId        String?
  ipAddress     String?
  userAgent     String?

  queryParams   Json?
  routeParams   Json?
  requestBody   Json?
  responseBody  Json?
  errorMessage  String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([requestId])
  @@index([method])
  @@index([path])
  @@index([statusCode])
  @@index([createdAt])
}
```

Dùng Edit tool cho cả 4 step trên (Step 2–5).

- [ ] **Step 6: Generate Prisma client, xác nhận schema hợp lệ**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
pnpm db:generate
```
Expected: thoát mã 0, không lỗi validate schema.

- [ ] **Step 7: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/prisma/schema.prisma
git commit -m "feat(backend): thêm model Subscription/Purchase/Usage/ApiRequestLog + enum IAP"
```

Không tạo migration ở task này — migration `init` sẽ tạo ở Task 15 sau khi toàn bộ module đã port xong (một migration duy nhất cho lần khởi tạo DB đầu tiên của base).

---

### Task 6: Thêm dependency `google-auth-library` + biến env IAP/api-log + thư mục `secrets/`

**Files:**
- Modify: `apps/backend/package.json`
- Modify: `apps/backend/.env.example`
- Modify: `apps/backend/.gitignore`
- Create: `apps/backend/secrets/README.md`

**Interfaces:** Không có — chuẩn bị hạ tầng cho Task 13 (subscription-api cần `google-auth-library` để lấy access token gọi Google Play Developer API).

- [ ] **Step 1: Thêm dependency vào `package.json`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
grep -n '"firebase-admin"' package.json
```
Expected: `"firebase-admin": "^13.8.0",`

Dùng Edit tool, chèn ngay sau dòng đó:

```json
    "firebase-admin": "^13.8.0",
    "google-auth-library": "^10.6.2",
```

- [ ] **Step 2: `pnpm install` để cập nhật lockfile**

```bash
cd /Volumes/Data/Product/pp09baseproduct
pnpm install
```
Expected: thoát mã 0, `pnpm-lock.yaml` có thêm entry `google-auth-library`.

- [ ] **Step 3: Thêm biến env IAP + api-log vào `.env.example`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
tail -5 .env.example
```

Dùng Edit tool, append vào cuối `.env.example`:

```bash
# Google Play — verify IAP subscription (secrets/README.md hướng dẫn tạo service account)
GOOGLE_PLAY_PACKAGE_NAME=com.izisoft.pp09base
GOOGLE_APPLICATION_CREDENTIALS=./secrets/google-play-service-account.json

# API request log — bật để ghi mọi HTTP request vào bảng ApiRequestLog
API_LOG_ENABLED=false
API_LOG_RETENTION_DAYS=7
API_LOG_CLEANUP_INTERVAL_MINUTES=60
```

- [ ] **Step 4: Tạo `secrets/` (gitignore) + hướng dẫn**

```bash
mkdir -p secrets
cat > secrets/README.md <<'EOF'
# secrets/

Thư mục này KHÔNG commit (xem `.gitignore`). Chứa key service account Google Play
dùng để verify purchase qua Google Play Developer API (module `subscription-api`).

## Tạo service account

1. Google Cloud Console → chọn project liên kết với app trên Play Console → IAM & Admin
   → Service Accounts → Create Service Account.
2. Cấp quyền trong Play Console: Settings → API access → liên kết project → mời service
   account với vai trò "Xem báo cáo tài chính" tối thiểu (financial data) để verify
   subscriptionsv2.
3. Tạo key JSON, tải về, đặt tên `google-play-service-account.json` trong thư mục này.
4. Đặt `GOOGLE_APPLICATION_CREDENTIALS=./secrets/google-play-service-account.json` trong
   `.env`.

Đổi sản phẩm (base clone) → tạo service account MỚI cho project Play Console của sản phẩm
đó, không dùng lại key cũ.
EOF
```

- [ ] **Step 5: Gitignore thư mục `secrets/`**

```bash
grep -q "^secrets/$" .gitignore || echo "secrets/" >> .gitignore
```

- [ ] **Step 6: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/package.json apps/backend/.env.example apps/backend/.gitignore apps/backend/secrets/README.md pnpm-lock.yaml
git commit -m "feat(backend): thêm google-auth-library + env IAP/api-log + secrets/README"
```

---

### Task 7: Thêm enum IAP + `USAGE_LIMITS` vào `common/constants` (chuẩn bị cho các module port ở Task 8–13)

**Files:**
- Modify: `apps/backend/src/common/constants/enums.ts`
- Modify: `apps/backend/src/common/constants/app.constants.ts`

**Interfaces:**
- Produces: enum `SubscriptionStatus`, `PlanType` (`WEEKLY|MONTHLY|YEARLY|LIFETIME`), `Platform`, `PurchaseStatus`, `Language` (`EN|VI`), `Unit` từ `common/constants` — PHẢI khớp value 1-1 với enum cùng tên trong `prisma/schema.prisma` (Task 5). Produces: `USAGE_LIMITS.MAX_FREE_ACTIONS_PER_DAY`, `USAGE_LIMITS.MAX_FREE_CHAT_PER_DAY`, `USAGE_LIMITS.CHAT_BONUS_PER_AD`.

**[Ghi chú bổ sung sau khi Task 8 phát hiện — đã áp dụng]:** `common/constants/index.ts` của base
gốc chỉ có `export * from './app.constants';`, KHÔNG re-export `enums.ts` — dù `enums.ts` đã tồn tại
sẵn (UserRole/NotificationType) từ trước. Mọi `import { SubscriptionStatus } from '../../common/constants'`
ở Task 8 trở đi sẽ không resolve được nếu thiếu dòng `export * from './enums';`. Task 8's implementer
tự phát hiện và thêm dòng này vào `common/constants/index.ts` (commit `3228bd3`) — nếu re-run Task 7
từ đầu, thêm bước sau vào cuối Task 7:

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/common/constants
grep -n "export \* from" index.ts
```
Expected hiện tại: chỉ có `export * from './app.constants';`.

```bash
cat > index.ts <<'EOF'
export * from './app.constants';
export * from './enums';
EOF
```

- [ ] **Step 1: Đọc file hiện tại**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/common/constants
cat enums.ts
```
Expected nội dung hiện tại:

```typescript
export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum NotificationType {
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  GENERAL = 'GENERAL',
}
```

- [ ] **Step 2: Append 6 enum IAP vào `enums.ts`**

Dùng Edit tool, thêm vào cuối file (giữ nguyên 2 enum hiện có):

```typescript

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  GRACE = 'GRACE',
}

export enum PlanType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  LIFETIME = 'LIFETIME',
}

export enum Platform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  PURCHASED = 'PURCHASED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum Language {
  EN = 'EN',
  VI = 'VI',
}

export enum Unit {
  MM = 'MM',
  INCH = 'INCH',
}
```

- [ ] **Step 3: Thêm `USAGE_LIMITS` vào `app.constants.ts`**

```bash
grep -n "PAGINATION_CONSTANTS = {" ../constants/app.constants.ts 2>/dev/null || grep -n "PAGINATION_CONSTANTS = {" app.constants.ts
```

Dùng Edit tool, tìm đoạn:

```typescript
// Pagination Constants
export const PAGINATION_CONSTANTS = {
```

Chèn NGAY TRƯỚC đoạn đó:

```typescript
// Usage Limit Constants (free tier daily quotas & reward bonuses)
export const USAGE_LIMITS = {
  MAX_FREE_ACTIONS_PER_DAY: 2, // Số hành động miễn phí mỗi user/ngày
  MAX_FREE_CHAT_PER_DAY: 3, // Số lượt chat miễn phí mỗi user/ngày
  CHAT_BONUS_PER_AD: 1, // Lượt chat cộng thêm mỗi lần xem rewarded ad
};

// Pagination Constants
export const PAGINATION_CONSTANTS = {
```

- [ ] **Step 4: `pnpm typecheck` để xác nhận không phá vỡ import hiện có**

```bash
cd /Volumes/Data/Product/pp09baseproduct
pnpm --filter @pp09base/backend typecheck
```
Expected: thoát mã 0.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/common/constants
git commit -m "feat(backend): thêm enum IAP + USAGE_LIMITS vào common/constants"
```

---

### Task 8: Port module `app-init` — endpoint `POST /app/init`, viết lại phần quota (không phụ thuộc bảng `Scan`)

**Files:**
- Create: `apps/backend/src/modules/app-init/app-init.module.ts`
- Create: `apps/backend/src/modules/app-init/app-init.controller.ts`
- Create: `apps/backend/src/modules/app-init/app-init.service.ts`
- Create: `apps/backend/src/modules/app-init/dto/app-init.dto.ts`
- Create: `apps/backend/src/modules/app-init/dto/index.ts`

**Interfaces:**
- Consumes: `PrismaService` (`apps/backend/src/prisma/prisma.service.ts`), `SubscriptionStatus`/`USAGE_LIMITS` từ `common/constants` (Task 7), `BaseResponseDto` (`common/dtos`), `ApiScope`/`CurrentUserId` (`common/decorators`), `JwtAuthGuard` (`common/guards`).
- Produces: `AppInitService.initApp(userId: string): Promise<{ isFirstInstall, isPremium, actionRemaining, chatRemaining, showPaywall, remoteConfig }>` — dùng lại ở Task 15 (đăng ký module).

Refer gốc (`apps/backend_pp03_refer/src/modules/app-init/app-init.service.ts`) tính `actionRemaining` bằng `prisma.scan.count()` trên bảng nghiệp vụ `Scan` — bảng này KHÔNG tồn tại trong base. Service dưới đây thay bằng `Usage.actionCount`/`Usage.lastActionDate` (cùng cơ chế reset-by-computation mà `reward` module đã dùng — xem Task 10), loại bỏ hoàn toàn phụ thuộc bảng `Scan`.

- [ ] **Step 1: Tạo thư mục + `app-init.module.ts`**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/app-init/dto
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/app-init
cat > app-init.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { AppInitController } from './app-init.controller';
import { AppInitService } from './app-init.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppInitController],
  providers: [AppInitService],
})
export class AppInitModule {}
EOF
```

- [ ] **Step 2: Tạo `dto/app-init.dto.ts` + `dto/index.ts`**

```bash
cat > dto/app-init.dto.ts <<'EOF'
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppInitRequestDto {
  @ApiProperty({ example: 'device-uuid-123' })
  @IsString()
  deviceId!: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class RemoteConfigDto {
  @ApiProperty({ example: 2 })
  maxFreeAction!: number;

  @ApiProperty({ example: 3 })
  maxFreeChat!: number;

  @ApiProperty({ example: true })
  adsEnabled!: boolean;
}

export class AppInitResponseDto {
  @ApiProperty({ example: true })
  isFirstInstall!: boolean;

  @ApiProperty({ example: false })
  isPremium!: boolean;

  @ApiProperty({ example: 2 })
  actionRemaining!: number;

  @ApiProperty({ example: 3 })
  chatRemaining!: number;

  @ApiProperty({ example: false })
  showPaywall!: boolean;

  @ApiProperty({ type: RemoteConfigDto })
  remoteConfig!: RemoteConfigDto;
}
EOF

echo "export * from './app-init.dto';" > dto/index.ts
```

- [ ] **Step 3: Tạo `app-init.service.ts`**

```bash
cat > app-init.service.ts <<'EOF'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus, USAGE_LIMITS } from '../../common/constants';

const MAX_FREE_ACTIONS_PER_DAY = USAGE_LIMITS.MAX_FREE_ACTIONS_PER_DAY;
const MAX_FREE_CHAT_PER_DAY = USAGE_LIMITS.MAX_FREE_CHAT_PER_DAY;
const CHAT_BONUS_PER_AD = USAGE_LIMITS.CHAT_BONUS_PER_AD;

@Injectable()
export class AppInitService {
  private readonly logger = new Logger('AppInitService');

  constructor(private prisma: PrismaService) {}

  async initApp(userId: string): Promise<{
    isFirstInstall: boolean;
    isPremium: boolean;
    actionRemaining: number;
    chatRemaining: number;
    showPaywall: boolean;
    remoteConfig: { maxFreeAction: number; maxFreeChat: number; adsEnabled: boolean };
  }> {
    this.logger.log(`App init for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true, isPremium: true },
    });

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, endDate: true, plan: true },
    });

    const isPremium =
      !!user?.isPremium &&
      subscription?.status === SubscriptionStatus.ACTIVE &&
      (subscription.endDate ? subscription.endDate > new Date() : true);

    const actionRemaining = await this.calculateActionRemaining(userId, isPremium);
    const chatRemaining = await this.calculateChatRemaining(userId, isPremium);

    const isFirstInstall = this.isFirstInstall(user?.createdAt);

    return {
      isFirstInstall,
      isPremium,
      actionRemaining,
      chatRemaining,
      showPaywall: !isPremium,
      remoteConfig: {
        maxFreeAction: MAX_FREE_ACTIONS_PER_DAY,
        maxFreeChat: MAX_FREE_CHAT_PER_DAY,
        adsEnabled: !isPremium,
      },
    };
  }

  private isSameDay(date1: Date | null | undefined, date2: Date): boolean {
    if (!date1) return false;
    const d1 = new Date(date1);
    return (
      d1.getFullYear() === date2.getFullYear() &&
      d1.getMonth() === date2.getMonth() &&
      d1.getDate() === date2.getDate()
    );
  }

  private getTodayRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  private async calculateChatRemaining(
    userId: string,
    isPremium: boolean,
  ): Promise<number> {
    if (isPremium) return 999;

    const { start, end } = this.getTodayRange();

    const [usedToday, rewardedToday] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'QUOTA_CHAT_USED',
          createdAt: { gte: start, lt: end },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'REWARD_CHAT_ADS',
          createdAt: { gte: start, lt: end },
        },
      }),
    ]);

    const totalAllowed = MAX_FREE_CHAT_PER_DAY + rewardedToday * CHAT_BONUS_PER_AD;
    return Math.max(0, totalAllowed - usedToday);
  }

  private isFirstInstall(createdAt?: Date): boolean {
    if (!createdAt) return false;
    const diffMs = Date.now() - createdAt.getTime();
    return diffMs < 2 * 60 * 1000;
  }

  /**
   * Đếm hành động miễn phí còn lại trong ngày dựa vào Usage.actionCount/lastActionDate
   * (reset-by-computation — không cron reset, xem RewardService.getRemainingFromUsage
   * ở module reward dùng cùng cơ chế). Base không có bảng nghiệp vụ nào tự ghi nhận
   * "hành động" — sản phẩm cụ thể gọi PATCH /usage/:userId/increment-actions mỗi khi
   * user thực hiện 1 hành động tốn quota.
   */
  private async calculateActionRemaining(
    userId: string,
    isPremium: boolean,
  ): Promise<number> {
    if (isPremium) return 999;

    const usage = await this.prisma.usage.findUnique({
      where: { userId },
      select: { actionCount: true, rewardCount: true, lastActionDate: true },
    });

    const today = new Date();
    const usedToday = this.isSameDay(usage?.lastActionDate ?? null, today)
      ? (usage?.actionCount ?? 0)
      : 0;
    const bonusActions = usage?.rewardCount ?? 0;

    return Math.max(0, MAX_FREE_ACTIONS_PER_DAY + bonusActions - usedToday);
  }
}
EOF
```

- [ ] **Step 4: Tạo `app-init.controller.ts` (có `@ApiScope('app')`)**

```bash
cat > app-init.controller.ts <<'EOF'
import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AppInitService } from './app-init.service';
import { AppInitRequestDto, AppInitResponseDto } from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { ApiScope, CurrentUserId } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';

@Controller('app')
@ApiTags('App')
@ApiScope('app')
export class AppInitController {
  private readonly logger = new Logger('AppInitController');

  constructor(private appInitService: AppInitService) {}

  /**
   * POST /app/init
   * Gọi 1 lần khi mở app. Trả trạng thái premium, quota còn lại, cờ hiện paywall, remote config.
   */
  @UseGuards(JwtAuthGuard)
  @Post('init')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize app state on launch' })
  @ApiBody({ type: AppInitRequestDto })
  @ApiResponse({ status: 200, description: 'App initialized', type: AppInitResponseDto })
  async init(
    @Body() _dto: AppInitRequestDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<AppInitResponseDto>> {
    this.logger.log(`App init for user: ${userId}`);
    const data = await this.appInitService.initApp(userId);
    return BaseResponseDto.success('App initialized', data);
  }
}
EOF
```

- [ ] **Step 5: Build kiểm chứng (chưa đăng ký vào `app.module.ts` — chỉ kiểm tra file tự nó không lỗi cú pháp/type qua `tsc --noEmit` phạm vi module)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "app-init" || echo "no app-init errors"
```
Expected: `no app-init errors` (module chưa được import ở đâu nên TS project-wide compile không tự kiểm tra nó — bước kiểm chứng thật sự diễn ra ở Task 15 sau khi đăng ký vào `AppModule`; đây chỉ là kiểm tra sớm cú pháp).

- [ ] **Step 6: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/app-init
git commit -m "feat(backend): port module app-init (POST /app/init), bỏ phụ thuộc bảng Scan"
```

---

### Task 9: Port module `usage` — copy từ refer + patch rename `scan→action`, bỏ `OwnershipGuard`, rescope `admin`

**Files:**
- Create (copy từ `apps/backend_pp03_refer/src/modules/usage/`): `apps/backend/src/modules/usage/usage.module.ts`, `usage.controller.ts`, `usage.service.ts`, `dto/create-usage.dto.ts`, `dto/update-usage.dto.ts`, `dto/query-usage.dto.ts`, `dto/index.ts`

**Interfaces:**
- Consumes: `PrismaService`, `USAGE_LIMITS`/enum từ `common/constants` (không dùng trực tiếp ở module này nhưng field `Usage.actionCount`/`lastActionDate` phải khớp Task 5).
- Produces: `UsageService.incrementActionCount(userId: string)`, `UsageService.incrementRewardCount(userId: string, amount?: number)` — module `reward`/`reward-chat` (Task 10) và bất kỳ business module tương lai PHẢI gọi 2 method này qua dependency injection (`UsageModule` export `UsageService`) thay vì để client gọi thẳng HTTP `PATCH /usage/:userId/increment-actions` — endpoint đó chỉ dành cho admin chỉnh tay.

Base KHÔNG có `OwnershipGuard` (refer có). Vì cả controller được rescope thành `@ApiScope('admin')` (chỉ admin thao tác usage của bất kỳ user nào), `OwnershipGuard` không còn cần thiết — mọi route dùng chung `JwtAuthGuard + RoleGuard + @Roles('ADMIN')`.

- [ ] **Step 1: Copy nguyên module từ refer**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/usage
cp -r /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/usage/* \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/usage/
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/usage
find . -name "*.ts"
```
Expected: 7 file — `usage.module.ts`, `usage.controller.ts`, `usage.service.ts`, `dto/create-usage.dto.ts`, `dto/update-usage.dto.ts`, `dto/query-usage.dto.ts`, `dto/index.ts`.

- [ ] **Step 2: Rename `scan → action` trên toàn bộ file (biến, hằng, comment, route path)**

```bash
find . -name "*.ts" -exec sed -i '' \
  -e 's/incrementScanCount/incrementActionCount/g' \
  -e 's/increment-scans/increment-actions/g' \
  -e 's/scanCount/actionCount/g' \
  -e 's/lastScanDate/lastActionDate/g' \
  -e 's/MAX_FREE_SCANS_PER_DAY/MAX_FREE_ACTIONS_PER_DAY/g' \
  -e 's/scan counts/action counts/g' \
  -e 's/Scan count/Action count/g' \
  -e 's/scan count/action count/g' \
  {} +
```

- [ ] **Step 3: Sửa `{ id: true, email: true, name: true }` → khớp `User` của base (không có field `name`)**

```bash
grep -rn "name: true" .
```
Expected: nhiều dòng dạng `include: { user: { select: { id: true, email: true, name: true } } }` trong `usage.service.ts`.

```bash
find . -name "*.ts" -exec sed -i '' \
  "s/{ id: true, email: true, name: true }/{ id: true, email: true, firstName: true, lastName: true }/g" \
  {} +
grep -rn "name: true" .
```
Expected sau lệnh 2: không còn dòng nào.

- [ ] **Step 4: Bỏ `OwnershipGuard`, rescope toàn controller thành admin-only + gắn `@ApiScope('admin')`**

```bash
grep -n "OwnershipGuard\|@Controller('usage')\|import { CurrentUserId }" usage.controller.ts
```
Expected 3 dòng: import `OwnershipGuard`, `@Controller('usage')`, import `CurrentUserId`.

```bash
perl -i -pe "s/import \{ JwtAuthGuard, OwnershipGuard \} from '\.\.\/\.\.\/common\/guards';/import { JwtAuthGuard, RoleGuard } from '..\/..\/common\/guards';/" usage.controller.ts
perl -i -pe "s/import \{ CurrentUserId \} from '\.\.\/\.\.\/common\/decorators';/import { ApiScope, CurrentUserId, Roles } from '..\/..\/common\/decorators';/" usage.controller.ts
perl -i -pe "s/\@UseGuards\(JwtAuthGuard, OwnershipGuard\)/\@UseGuards(JwtAuthGuard, RoleGuard)/g" usage.controller.ts
perl -i -pe "s/^  \@UseGuards\(JwtAuthGuard\)\$/  \@UseGuards(JwtAuthGuard, RoleGuard)/g" usage.controller.ts
perl -i -pe "s/\@ApiBearerAuth\(\)\nexport class UsageController/\@ApiBearerAuth()\n\@UseGuards(JwtAuthGuard, RoleGuard)\n\@Roles('ADMIN')\n\@ApiScope('admin')\nexport class UsageController/" usage.controller.ts
```

Lệnh `perl` cuối multi-line không match qua `-p` (mỗi dòng xử lý riêng) — thay bằng Edit tool cho chính xác. Đọc lại đoạn class decorator:

```bash
sed -n '/@Controller(.usage.)/,/export class UsageController/p' usage.controller.ts
```
Expected hiện tại:

```typescript
@Controller('usage')
@ApiTags('Usage')
@ApiBearerAuth()
export class UsageController {
```

Dùng Edit tool sửa thành:

```typescript
@Controller('usage')
@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
export class UsageController {
```

- [ ] **Step 5 (BUG FIX — bỏ logic tự-giới-hạn "chỉ sửa usage của chính mình" sót lại từ refer, mâu thuẫn với mục đích rescope admin-only ở Step 4)**

Refer's `create()`/`incrementActionCount()` ép `userId` phải trùng người gọi (thiết kế cho user tự thao
tác usage của họ). Sau khi rescope cả controller thành `@ApiScope('admin')` + `@Roles('ADMIN')` (Step 4),
2 chỗ này vẫn còn logic cũ — khiến admin KHÔNG THỂ tạo/tăng usage cho user khác, ngược hẳn mục đích "admin
thao tác usage của bất kỳ user nào" đã nêu ở đầu Task này.

```bash
grep -n "Force userId to be the authenticated user\|if (userId !== currentUserId)" usage.controller.ts
```
Expected: 2 dòng — 1 trong `create()`, 1 trong `incrementActionCount()`.

Dùng Edit tool sửa `create()`:

```typescript
  async create(
    @Body() createUsageDto: CreateUsageDto,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(`Creating usage record for user: ${userId}`);
    // Force userId to be the authenticated user for security
    createUsageDto.userId = userId;
    const result = await this.usageService.create(createUsageDto);
    return BaseResponseDto.success('Usage record created successfully', result);
  }
```
→
```typescript
  async create(
    @Body() createUsageDto: CreateUsageDto,
    @CurrentUserId() adminUserId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(`Admin ${adminUserId} creating usage record for user: ${createUsageDto.userId}`);
    const result = await this.usageService.create(createUsageDto);
    return BaseResponseDto.success('Usage record created successfully', result);
  }
```

Dùng Edit tool sửa `incrementActionCount()`:

```typescript
  async incrementActionCount(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<BaseResponseDto<any>> {
    // Ensure user can only increment their own usage
    if (userId !== currentUserId) {
      this.logger.warn(`Unauthorized attempt to increment action count for user: ${userId}`);
      throw new Error('Forbidden');
    }
    this.logger.log(`Incrementing action count for user: ${userId}`);
    const result = await this.usageService.incrementActionCount(userId);
    return BaseResponseDto.success('Action count incremented successfully', result);
  }
```
→
```typescript
  async incrementActionCount(
    @Param('userId') userId: string,
    @CurrentUserId() adminUserId: string,
  ): Promise<BaseResponseDto<any>> {
    this.logger.log(`Admin ${adminUserId} incrementing action count for user: ${userId}`);
    const result = await this.usageService.incrementActionCount(userId);
    return BaseResponseDto.success('Action count incremented successfully', result);
  }
```

`RoleGuard` + `@Roles('ADMIN')` (đã có ở class-level từ Step 4) đã đủ để chặn user thường — không cần
logic tự-so-sánh `userId` nữa.

- [ ] **Step 6: Verify không còn sót `scanCount`/`OwnershipGuard`/`JwtAuthGuard)$` (guard đơn lẻ không kèm RoleGuard) / logic tự-giới-hạn đã gỡ**

```bash
grep -rn "scanCount\|lastScanDate\|OwnershipGuard\|MAX_FREE_SCANS" . || echo "clean"
grep -n "@UseGuards(JwtAuthGuard)$" usage.controller.ts || echo "no bare JwtAuthGuard left"
grep -n "if (userId !== currentUserId)\|Force userId to be the authenticated user" usage.controller.ts || echo "self-only check removed"
```
Expected: cả 3 lệnh in `clean` / `no bare JwtAuthGuard left` / `self-only check removed`.

- [ ] **Step 7: Build kiểm chứng cú pháp sớm**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "modules/usage" || echo "no usage module errors"
```

- [ ] **Step 8: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/usage
git commit -m "feat(backend): port module usage, rename scan->action, rescope admin-only"
```

---

### Task 10: Port module `reward` + `reward-chat` — `POST /reward/daily`, `/reward/ads`, `/reward-chat/ads`, gắn `@ApiScope('app')`

**Files:**
- Create (copy từ refer): `apps/backend/src/modules/reward/reward.module.ts`, `reward.controller.ts`, `reward.service.ts`
- Create (copy từ refer): `apps/backend/src/modules/reward-chat/reward-chat.module.ts`, `reward-chat.controller.ts`, `reward-chat.service.ts`

**Interfaces:**
- Consumes: `PrismaService`, `USAGE_LIMITS` (Task 7).
- Produces: `RewardService.claimDaily(userId)`, `RewardService.rewardAds(userId): Promise<{ remainingAction: number }>`. `RewardChatService.rewardAds(userId): Promise<{ chatRemaining: number }>`, `RewardChatService.recordChatUsed(userId: string): Promise<void>` — method MỚI, business module tương lai (chat/AI) PHẢI gọi method này (qua DI, `RewardChatModule` export `RewardChatService`) mỗi khi user dùng hết 1 lượt chat, để `app-init`'s `calculateChatRemaining` (Task 8, đọc `AuditLog.action = 'QUOTA_CHAT_USED'`) đếm đúng.

- [ ] **Step 1: Copy `reward` module + rename `scan → action`**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/reward
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/reward/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/reward/
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/reward
sed -i '' \
  -e 's/scanCount/actionCount/g' \
  -e 's/lastScanDate/lastActionDate/g' \
  -e 's/MAX_FREE_SCANS_PER_DAY/MAX_FREE_ACTIONS_PER_DAY/g' \
  -e 's/REWARD_BONUS_SCANS/REWARD_BONUS_ACTIONS/g' \
  -e 's/remainingScan/remainingAction/g' \
  -e 's/bonus scan/bonus action/g' \
  -e 's/remaining scans/remaining actions/g' \
  -e 's/free bonus scan/free bonus action/g' \
  reward.service.ts reward.controller.ts
grep -n "scan\|Scan" reward.service.ts reward.controller.ts reward.module.ts || echo "clean"
```
Expected: `clean` (không còn từ "scan" nào, kể cả trong comment).

- [ ] **Step 2: Gắn `@ApiScope('app')` vào `reward.controller.ts`**

```bash
sed -n '1,12p' reward.controller.ts
```
Expected:

```typescript
import { Controller, Post, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RewardService } from './reward.service';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUserId } from '../../common/decorators';

@Controller('reward')
@ApiTags('Reward')
@ApiBearerAuth()
export class RewardController {
```

Dùng Edit tool sửa 2 chỗ:

```typescript
import { CurrentUserId } from '../../common/decorators';
```
→

```typescript
import { ApiScope, CurrentUserId } from '../../common/decorators';
```

```typescript
@Controller('reward')
@ApiTags('Reward')
@ApiBearerAuth()
export class RewardController {
```
→

```typescript
@Controller('reward')
@ApiTags('Reward')
@ApiBearerAuth()
@ApiScope('app')
export class RewardController {
```

- [ ] **Step 3: Copy `reward-chat` module**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/reward-chat
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/reward-chat/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/reward-chat/
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/reward-chat
cat reward-chat.service.ts
```

- [ ] **Step 4: Đổi `entityType: 'AiChat'` → `'Chat'` (trung tính) + thêm method `recordChatUsed`**

Dùng Edit tool trên `reward-chat.service.ts`, sửa:

```typescript
    await this.prisma.createAuditLog({
      action: 'REWARD_CHAT_ADS',
      entityType: 'AiChat',
      entityId: userId,
```
→

```typescript
    await this.prisma.createAuditLog({
      action: 'REWARD_CHAT_ADS',
      entityType: 'Chat',
      entityId: userId,
```

Thêm method mới vào cuối class `RewardChatService` (trước dấu `}` đóng class), ngay sau method `rewardAds`:

```typescript

  /**
   * Ghi nhận 1 lượt chat đã dùng — business module (chat/AI) tương lai gọi method
   * này qua DI mỗi khi user dùng hết 1 lượt, để app-init.calculateChatRemaining
   * đếm đúng quota còn lại trong ngày.
   */
  async recordChatUsed(userId: string): Promise<void> {
    await this.prisma.createAuditLog({
      action: 'QUOTA_CHAT_USED',
      entityType: 'Chat',
      entityId: userId,
      userId,
    });
  }
```

**(BUG FIX — `rewardAds()` (copy nguyên từ refer, KHÔNG nằm trong 2 patch ở trên) tự đếm `usedToday` bằng
cách đọc `AuditLog.count({ where: { action: 'AI_CHAT_USED', ... } })` — cùng tên hằng cũ mà `app-init`
(Task 8) và `recordChatUsed` vừa thêm ở trên đã đổi thành `'QUOTA_CHAT_USED'`. Nếu không đổi luôn chỗ đọc
này, `usedToday` sẽ LUÔN bằng 0 vì không còn ai ghi `'AI_CHAT_USED'` nữa — user luôn được cộng dư quota.)**

```bash
grep -n "AI_CHAT_USED" reward-chat.service.ts
```
Expected: 1 dòng, bên trong `rewardAds()`:
```typescript
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'AI_CHAT_USED',
          createdAt: { gte: start, lt: end },
        },
      }),
```

```bash
sed -i '' "s/action: 'AI_CHAT_USED'/action: 'QUOTA_CHAT_USED'/" reward-chat.service.ts
grep -n "AI_CHAT_USED\|QUOTA_CHAT_USED" reward-chat.service.ts
```
Expected sau lệnh 2: không còn `AI_CHAT_USED`; 2 dòng `QUOTA_CHAT_USED` (1 ở `rewardAds()` vừa sửa, 1 ở
`recordChatUsed()` vừa thêm).

- [ ] **Step 5: Export `RewardChatService` từ `reward-chat.module.ts` (đang thiếu `exports`)**

```bash
cat reward-chat.module.ts
```
Expected:

```typescript
import { Module } from '@nestjs/common';
import { RewardChatController } from './reward-chat.controller';
import { RewardChatService } from './reward-chat.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RewardChatController],
  providers: [RewardChatService],
})
export class RewardChatModule {}
```

Dùng Edit tool thêm dòng `exports`:

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [RewardChatController],
  providers: [RewardChatService],
  exports: [RewardChatService],
})
export class RewardChatModule {}
```

- [ ] **Step 6: Gắn `@ApiScope('app')` vào `reward-chat.controller.ts`** (cùng pattern Step 2)

```bash
sed -n '1,12p' reward-chat.controller.ts
```

Dùng Edit tool: thêm `ApiScope` vào import từ `common/decorators`, thêm `@ApiScope('app')` ngay trên `export class RewardChatController {`.

- [ ] **Step 7: Verify + build kiểm chứng cú pháp sớm**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules
grep -rn "scanCount\|lastScanDate\|MAX_FREE_SCANS\|REWARD_BONUS_SCANS\|AiChat\|AI_CHAT_USED" reward reward-chat || echo "clean"
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "modules/reward" || echo "no reward module errors"
```

- [ ] **Step 8: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/reward apps/backend/src/modules/reward-chat
git commit -m "feat(backend): port module reward + reward-chat, thêm recordChatUsed hook"
```

---

### Task 11: Port module `settings` + `track` — `POST /settings/update`, `POST /track/event`, gắn `@ApiScope('app')`

**Files:**
- Create (copy từ refer): `apps/backend/src/modules/settings/settings.module.ts`, `settings.controller.ts`, `settings.service.ts`, `dto/settings.dto.ts`, `dto/index.ts`
- Create (copy từ refer): `apps/backend/src/modules/track/track.module.ts`, `track.controller.ts`, `track.service.ts`, `dto/track.dto.ts`, `dto/index.ts`

**Interfaces:**
- Consumes: `PrismaService`, enum `Language`/`Unit` (Task 7) cho `settings`.
- Produces: `SettingsService.updateSettings(userId, dto): Promise<{ success: boolean }>`, `TrackService.trackEvent(userId, event, metadata?): Promise<{ success: boolean }>`.

- [ ] **Step 1: Copy 2 module**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/settings/dto
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/track/dto
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/settings/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/settings/
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/settings/dto/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/settings/dto/
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/track/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/track/
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/track/dto/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/track/dto/
```

- [ ] **Step 2 (BUG FIX — refer's `settings.service.ts`/`dto/settings.dto.ts` viết field `notifications`, nhưng Task 5 đặt tên field này trên `User` là `notificationsEnabled` để tránh trùng relation `notifications: Notification[]`)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/settings
grep -n "notifications" settings.service.ts dto/settings.dto.ts
```
Expected: mỗi file có ít nhất 1 dòng chứa `notifications` (field DTO + field ghi vào `prisma.user.update`).

```bash
sed -i '' 's/[[:<:]]notifications[[:>:]]/notificationsEnabled/g' settings.service.ts dto/settings.dto.ts
grep -n "notifications" settings.service.ts dto/settings.dto.ts
```

`[[:<:]]...[[:>:]]` (không phải `\b...\b`) — BSD `sed` trên macOS KHÔNG hỗ trợ `\b` làm ranh giới từ
(chạy im lặng, không báo lỗi, nhưng không thay thế gì — silent no-op); `[[:<:]]`/`[[:>:]]` là cú pháp ranh
giới từ đúng của BSD `sed`. Expected sau lệnh trên: mọi chỗ đã thành `notificationsEnabled`, không còn
`notifications` trần.

Đồng thời kiểm tra `settings.controller.ts` (không nằm trong 2 file sed ở trên) — nếu có doc string
`@ApiOperation` nhắc tới `notifications` (vd "Update user settings (language, unit, notifications)"),
sửa tay bằng Edit tool thành `notificationsEnabled` cho nhất quán:

```bash
grep -n "notifications" settings.controller.ts || echo "không có, bỏ qua"
```

- [ ] **Step 3: Đổi ví dụ `'scan_completed'` trong `track.dto.ts` thành ví dụ trung tính**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/track
grep -n "scan_completed" dto/track.dto.ts
```
Expected: `  @ApiProperty({ example: 'scan_completed' })`

```bash
sed -i '' "s/example: 'scan_completed'/example: 'app_opened'/" dto/track.dto.ts
```

- [ ] **Step 4: Gắn `@ApiScope('app')` vào `settings.controller.ts`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/settings
sed -n '1,12p' settings.controller.ts
```
Expected:

```typescript
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUserId } from '../../common/decorators';

@Controller('settings')
@ApiTags('Settings')
@ApiBearerAuth()
export class SettingsController {
```

Dùng Edit tool: đổi `import { CurrentUserId } from '../../common/decorators';` → `import { ApiScope, CurrentUserId } from '../../common/decorators';`; thêm `@ApiScope('app')` ngay trên `export class SettingsController {`.

- [ ] **Step 5: Gắn `@ApiScope('app')` vào `track.controller.ts`** (cùng pattern Step 4)

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/track
sed -n '1,12p' track.controller.ts
```

Dùng Edit tool: đổi import `CurrentUserId` từ `common/decorators` thành `ApiScope, CurrentUserId`; thêm `@ApiScope('app')` ngay trên `export class TrackController {`.

- [ ] **Step 6: Verify không còn `notifications` trần sót ở bất kỳ file nào trong module + build kiểm chứng cú pháp sớm**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/settings
grep -rn "notifications\b" . | grep -v "notificationsEnabled" || echo "clean"
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "modules/(settings|track)" || echo "no settings/track errors"
```
Expected: `clean` (không còn `notifications` trần ở service/dto/controller); không lỗi biên dịch.

- [ ] **Step 7: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/settings apps/backend/src/modules/track
git commit -m "feat(backend): port module settings + track, gắn @ApiScope('app')"
```

---

### Task 12: Port module `api-log` + làm `LoggingMiddleware` ghi DB thật (hiện tại chỉ log console) + xoá middleware áp dụng trùng lặp trong `main.ts`

**Files:**
- Create (copy từ refer): `apps/backend/src/modules/api-log/api-log.module.ts`, `api-log.controller.ts`, `api-log.service.ts`, `api-log-cleanup.service.ts`, `dto/api-log.dto.ts`, `dto/index.ts`
- Modify: `apps/backend/src/common/middleware/request-id.middleware.ts`
- Modify: `apps/backend/src/main.ts`

**Interfaces:**
- Consumes: `PrismaService`, `ConfigService` (`@nestjs/config`), model `ApiRequestLog` (Task 5).
- Produces: `LoggingMiddleware` (constructor `(prisma: PrismaService, configService: ConfigService)`) — dùng lại nguyên trong `app.module.ts` Task 15, KHÔNG cần đổi cách đăng ký (`consumer.apply(LoggingMiddleware).forRoutes('*')` đã đúng chuẩn NestJS DI).

`main.ts` hiện tự tạo instance middleware thủ công qua `app.use()` — khiến `RequestIdMiddleware`/`LoggingMiddleware` chạy 2 LẦN mỗi request (trùng với đăng ký DI chuẩn trong `app.module.ts configure()`). Để `LoggingMiddleware` ghi DB qua `PrismaService` inject qua DI, bước này xoá đoạn gọi thủ công trong `main.ts` — chỉ giữ đăng ký qua `configure()` (đã đúng theo NestJS pattern, và tự nó fix luôn bug double-run).

- [ ] **Step 1: Copy module `api-log`**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/api-log/dto
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/api-log/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/api-log/
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/api-log/dto/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/api-log/dto/
```

- [ ] **Step 2: Gắn `@ApiScope('admin')` vào `api-log.controller.ts`** (đã có `JwtAuthGuard, RoleGuard` + `@Roles('ADMIN')` sẵn, chỉ thiếu `@ApiScope`)

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/api-log
grep -n "@Controller\|import { Roles }" api-log.controller.ts
```
Expected:
```
import { Roles } from '../../common/decorators';
@Controller('logs/api')
```

Dùng Edit tool sửa 2 chỗ:

```typescript
import { Roles } from '../../common/decorators';
```
→
```typescript
import { ApiScope, Roles } from '../../common/decorators';
```

```typescript
@Controller('logs/api')
@ApiTags('API Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class ApiLogController {
```
→
```typescript
@Controller('logs/api')
@ApiTags('API Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
export class ApiLogController {
```

- [ ] **Step 3: Đọc `LoggingMiddleware` hiện tại trong base (chỉ log console, không ghi DB)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/common/middleware
grep -n "class LoggingMiddleware\|^}" request-id.middleware.ts
```

- [ ] **Step 4: Thay toàn bộ class `LoggingMiddleware` bằng bản có ghi DB (gated qua `API_LOG_ENABLED`)**

Dùng Edit tool, tìm khối hiện tại:

```typescript
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'];

    // Override res.json to log response
    const originalJson = res.json;
    const logger = this.logger;
    res.json = function (body) {
      const duration = Date.now() - startTime;

      // Log response with details using captured logger
      logger.log({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: Buffer.byteLength(
          typeof body === 'string' ? body : JSON.stringify(body),
        ),
      });

      return originalJson.call(this, body);
    } as any;

    next();
  }
}
```

Thay bằng:

```typescript
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private sanitizePayload(value: unknown): any {
    if (value === undefined || value === null) return null;
    try {
      const text = JSON.stringify(value);
      if (!text) return null;
      // Prevent oversized log rows while still keeping useful context.
      if (text.length > 8000) {
        return {
          _truncated: true,
          _size: text.length,
          preview: text.slice(0, 8000),
        };
      }
      return JSON.parse(text);
    } catch {
      return { _nonSerializable: true };
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'];
    const apiLogEnabled = this.configService.get<string>('API_LOG_ENABLED') === 'true';
    const requestBody = apiLogEnabled ? this.sanitizePayload(req.body) : null;
    const queryParams = apiLogEnabled ? this.sanitizePayload(req.query) : null;
    const routeParams = apiLogEnabled ? this.sanitizePayload(req.params) : null;
    let responsePayload: any = null;

    // Override res.json to log response
    const originalJson = res.json;
    const logger = this.logger;
    const self = this;
    res.json = function (body) {
      responsePayload = body;
      const duration = Date.now() - startTime;

      // Log response with details using captured logger
      logger.log({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: Buffer.byteLength(
          typeof body === 'string' ? body : JSON.stringify(body),
        ),
      });

      return originalJson.call(this, body);
    } as any;

    if (apiLogEnabled) {
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const userId = (req as any).user?.id ?? null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const method = req.method;
        const path = req.originalUrl || req.path;
        const statusCode = res.statusCode;

        void self.prisma.apiRequestLog
          .create({
            data: {
              requestId: Array.isArray(requestId)
                ? requestId[0]
                : (requestId as string | undefined) ?? null,
              method,
              path,
              statusCode,
              durationMs: duration,
              userId,
              ipAddress,
              userAgent: req.get('user-agent') ?? null,
              queryParams,
              routeParams,
              requestBody,
              responseBody: self.sanitizePayload(responsePayload),
              errorMessage: statusCode >= 500 ? `HTTP_${statusCode}` : null,
            },
          })
          .catch((error) => {
            logger.error('Failed to persist api request log', error as any);
          });
      });
    }

    next();
  }
}
```

- [ ] **Step 5: Thêm import `PrismaService` + `ConfigService` vào đầu file**

```bash
sed -n '1,5p' request-id.middleware.ts
```
Expected: `import { Injectable, NestMiddleware, Logger } from '@nestjs/common';` là dòng 1.

Dùng Edit tool, thêm sau dòng import `Sentry`/`uuid` hiện có (đầu file):

```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
```

- [ ] **Step 6: Xoá đoạn `app.use()` thủ công trong `main.ts` (bug double-run) — chỉ giữ đăng ký DI trong `app.module.ts`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src
grep -n "RequestIdMiddleware\|LoggingMiddleware" main.ts
```
Expected 3 dòng: 1 dòng import, 2 khối `app.use(...)`.

Dùng Edit tool, xoá khối:

```typescript
  // ============================================================================
  // Global Middleware
  // ============================================================================

  // Request ID middleware (for request tracing)
  app.use((req, res, next) => {
    const requestIdMiddleware = new RequestIdMiddleware();
    requestIdMiddleware.use(req, res, next);
  });

  // Logging middleware
  app.use((req, res, next) => {
    const loggingMiddleware = new LoggingMiddleware();
    loggingMiddleware.use(req, res, next);
  });

  // ============================================================================
  // Global Exception Filters
  // ============================================================================
```

Thay bằng (giữ nguyên header phần Exception Filters, xoá phần Middleware — middleware đã đăng ký qua `AppModule.configure()`):

```typescript
  // ============================================================================
  // Global Exception Filters
  // ============================================================================
```

Xoá import không dùng nữa:

```typescript
import { RequestIdMiddleware, LoggingMiddleware } from './common/middleware';
```

- [ ] **Step 7: Build kiểm chứng cú pháp sớm**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "main\.ts|middleware|modules/api-log" || echo "no errors"
```

- [ ] **Step 8: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/api-log apps/backend/src/common/middleware/request-id.middleware.ts apps/backend/src/main.ts
git commit -m "feat(backend): port module api-log, LoggingMiddleware ghi DB qua API_LOG_ENABLED, xoá middleware double-run"
```

---

### Task 13: Port module `subscription-api` (lõi IAP — verify/status/restore/webhook Google Play) + sửa 4 bug đã biết

**Files:**
- Create (copy từ refer): `apps/backend/src/modules/subscription-api/subscription-api.module.ts`, `subscription-api.controller.ts`, `subscription-api.service.ts`, `dto/subscription-api.dto.ts`, `dto/index.ts`

**Interfaces:**
- Consumes: `PrismaService`, `ConfigService` (`@nestjs/config`), `GoogleAuth` (`google-auth-library`, Task 6), enum `Platform`/`PlanType`/`PurchaseStatus`/`SubscriptionStatus` (Task 7), model `Subscription`/`Purchase` (Task 5), env `GOOGLE_PLAY_PACKAGE_NAME`/`GOOGLE_APPLICATION_CREDENTIALS` (Task 6).
- Produces: `SubscriptionApiService.verifyPurchase/getStatus/restorePurchase/syncPurchase/handleGoogleWebhook` — endpoint `POST /subscription/verify`, `GET /subscription/status`, `POST /subscription/restore`, `POST /subscription/webhook/google` (public), `POST /subscription/sync` (admin).

- [ ] **Step 1: Copy nguyên module từ refer**

```bash
mkdir -p /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/subscription-api/dto
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/subscription-api/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/subscription-api/
cp /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer/src/modules/subscription-api/dto/*.ts \
  /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/subscription-api/dto/
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/subscription-api
```

- [ ] **Step 2 (BUG FIX — autoRenew mặc định `true` khi Google không trả `autoRenewEnabled`, nên là `false` để an toàn)**

```bash
grep -n "autoRenewEnabled" subscription-api.service.ts
```
Expected:
```typescript
    const autoRenew =
      lineItem.autoRenewingPlan?.autoRenewEnabled ?? true;
```

Dùng Edit tool sửa thành:

```typescript
    const autoRenew =
      lineItem.autoRenewingPlan?.autoRenewEnabled ?? false;
```

- [ ] **Step 3 (BUG FIX — `ON_HOLD`/`PAUSED` đang map thành `PENDING`, phải là `CANCELED` vì user không dùng được app lúc này)**

```bash
grep -n "SUBSCRIPTION_STATE_ON_HOLD\|SUBSCRIPTION_STATE_PAUSED" subscription-api.service.ts
```
Expected trong `mapGoogleSubscriptionStateToPurchaseStatus`:
```typescript
      case 'SUBSCRIPTION_STATE_PENDING':
      case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
      case 'SUBSCRIPTION_STATE_ON_HOLD':
      case 'SUBSCRIPTION_STATE_PAUSED':
        return PurchaseStatus.PENDING;
      case 'SUBSCRIPTION_STATE_CANCELED':
      case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED':
        return PurchaseStatus.CANCELED;
```

Dùng Edit tool sửa thành:

```typescript
      case 'SUBSCRIPTION_STATE_PENDING':
      case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
        return PurchaseStatus.PENDING;
      case 'SUBSCRIPTION_STATE_ON_HOLD':
      case 'SUBSCRIPTION_STATE_PAUSED':
      case 'SUBSCRIPTION_STATE_CANCELED':
      case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED':
        return PurchaseStatus.CANCELED;
```

**(BUG FIX — hàm chị em `mapWebhookEventToPurchaseStatus` có CÙNG lỗi ngữ nghĩa với hàm vừa sửa ở trên,
nhưng dùng cơ chế khác (so khớp chuỗi con trên tên event webhook, không phải Google subscription state).
Event tên `'ON_HOLD'`/`'PAUSED'` (sinh từ `mapGoogleNotificationTypeToEventName`) không khớp bất kỳ
`.includes(...)` nào trong hàm này, rơi vào nhánh mặc định `return PurchaseStatus.PENDING`. Giá trị này
chỉ là ghi tạm lúc webhook đến (bị `verifyGooglePurchase()` ghi đè ngay sau đó bằng giá trị xác thực từ
Google) — nhưng nếu lệnh gọi `verifyGooglePurchase()` lỗi mạng, giá trị PENDING sai này tồn tại tới lần
sync kế tiếp. Sửa cho nhất quán với Step 3.)**

```bash
grep -n "private mapWebhookEventToPurchaseStatus" -A 20 subscription-api.service.ts
```
Expected:
```typescript
  private mapWebhookEventToPurchaseStatus(eventType: string): PurchaseStatus {
    const normalized = eventType.toUpperCase();

    if (normalized.includes('PURCHASED') || normalized.includes('RENEWED')) {
      return PurchaseStatus.PURCHASED;
    }
    if (normalized.includes('CANCELED')) {
      return PurchaseStatus.CANCELED;
    }
    if (normalized.includes('EXPIRED')) {
      return PurchaseStatus.EXPIRED;
    }
    if (normalized.includes('REVOKED')) {
      return PurchaseStatus.REVOKED;
    }
    if (normalized.includes('GRACE')) {
      return PurchaseStatus.PENDING;
    }

    return PurchaseStatus.PENDING;
  }
```

Dùng Edit tool sửa thành:

```typescript
  private mapWebhookEventToPurchaseStatus(eventType: string): PurchaseStatus {
    const normalized = eventType.toUpperCase();

    if (normalized.includes('PURCHASED') || normalized.includes('RENEWED')) {
      return PurchaseStatus.PURCHASED;
    }
    if (normalized.includes('CANCELED') || normalized.includes('ON_HOLD') || normalized.includes('PAUSED')) {
      return PurchaseStatus.CANCELED;
    }
    if (normalized.includes('EXPIRED')) {
      return PurchaseStatus.EXPIRED;
    }
    if (normalized.includes('REVOKED')) {
      return PurchaseStatus.REVOKED;
    }
    if (normalized.includes('GRACE')) {
      return PurchaseStatus.PENDING;
    }

    return PurchaseStatus.PENDING;
  }
```

```bash
grep -n "ON_HOLD\|PAUSED" subscription-api.service.ts
```
Expected: cả 2 hàm map (`mapGoogleSubscriptionStateToPurchaseStatus` và `mapWebhookEventToPurchaseStatus`)
đều xử lý `ON_HOLD`/`PAUSED` → `CANCELED`, nhất quán.

- [ ] **Step 4 (BUG FIX — thông báo lỗi IOS mơ hồ, đổi thành rõ ràng "chưa hỗ trợ")**

```bash
grep -n "Only ANDROID platform is supported" subscription-api.service.ts
```
Expected:
```typescript
    if (platform !== Platform.ANDROID) {
      throw new BadRequestException('Only ANDROID platform is supported for Google Play verification');
    }
```

Dùng Edit tool sửa thành:

```typescript
    if (platform !== Platform.ANDROID) {
      throw new BadRequestException(
        'IOS verification not yet implemented. Please use ANDROID.',
      );
    }
```

- [ ] **Step 5 (BUG FIX — `getStatus()` chỉ tự sync khi vừa hết hạn; thêm tham số `sync` để client/admin buộc verify lại với Google bất kỳ lúc nào)**

```bash
grep -n "async getStatus" subscription-api.service.ts
```
Expected chữ ký hiện tại: `async getStatus(userId: string): Promise<SubscriptionStatusResponseDto> {`

Đọc đoạn điều kiện auto-sync:

```bash
sed -n '/async getStatus/,/const isPremium = this.isPremiumByState/p' subscription-api.service.ts
```
Expected:
```typescript
  async getStatus(userId: string): Promise<SubscriptionStatusResponseDto> {
    this.logger.log(`Get subscription status for user: ${userId}`);

    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        platform: true,
        status: true,
        plan: true,
        isTrial: true,
        expiresAt: true,
        autoRenew: true,
        purchaseToken: true,
      },
    });

    // If local subscription has just expired but auto-renew is enabled,
    // fetch authoritative state from Google Play to avoid stale premium status.
    if (
      sub?.platform === Platform.ANDROID &&
      sub.autoRenew &&
      sub.expiresAt &&
      sub.expiresAt <= new Date() &&
      sub.purchaseToken
    ) {
```

Dùng Edit tool sửa chữ ký hàm và điều kiện auto-sync:

```typescript
  async getStatus(userId: string, forceSync = false): Promise<SubscriptionStatusResponseDto> {
    this.logger.log(`Get subscription status for user: ${userId}`);

    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        platform: true,
        status: true,
        plan: true,
        isTrial: true,
        expiresAt: true,
        autoRenew: true,
        purchaseToken: true,
      },
    });

    // Tự sync khi: (a) client/admin buộc qua ?sync=true, hoặc (b) subscription local
    // vừa hết hạn nhưng autoRenew=true (tránh premium status bị cũ so với Google).
    const staleExpired = !!(sub?.autoRenew && sub.expiresAt && sub.expiresAt <= new Date());
    if (
      (forceSync || staleExpired) &&
      sub?.platform === Platform.ANDROID &&
      sub.purchaseToken
    ) {
```

- [ ] **Step 6: Sửa `getMySubscription`-tương-đương ở CONTROLLER — thêm query param `sync` cho route `GET /subscription/status`, gắn `@ApiScope` per-method**

```bash
sed -n '1,20p' subscription-api.controller.ts
```
Expected import đầu file:
```typescript
import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SubscriptionApiService } from './subscription-api.service';
import {
  VerifyPurchaseDto,
  VerifyPurchaseResponseDto,
  SubscriptionStatusResponseDto,
  RestorePurchaseDto,
  RestorePurchaseResponseDto,
  SyncPurchaseDto,
  SyncPurchaseResponseDto,
} from './dto';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard, RoleGuard } from '../../common/guards';
import { CurrentUserId, Public, Roles } from '../../common/decorators';
```

Dùng Edit tool sửa 2 dòng import:

```typescript
import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
```
→
```typescript
import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
```

```typescript
import { CurrentUserId, Public, Roles } from '../../common/decorators';
```
→
```typescript
import { ApiScope, CurrentUserId, Public, Roles } from '../../common/decorators';
```

- [ ] **Step 7: Gắn `@ApiScope` theo TỪNG method (không gắn ở class — mỗi route cần scope khác nhau)**

Đọc 5 method hiện có:

```bash
grep -n "async verify\|async getStatus\|async restore\|async webhookGoogle\|async sync" subscription-api.controller.ts
```

Dùng Edit tool thêm `@ApiScope('app')` ngay trên decorator `@Post('verify')`/`@Get('status')`/`@Post('restore')` (3 method `verify`, `getStatus`, `restore`) — ví dụ với `verify`:

```typescript
  /** POST /subscription/verify */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
```
→
```typescript
  /** POST /subscription/verify */
  @ApiScope('app')
  @UseGuards(JwtAuthGuard)
  @Post('verify')
```

Áp tương tự cho `getStatus` (trên `@Get('status')`) và `restore` (trên `@Post('restore')`).

Sửa route `getStatus` để nhận query `sync`:

```typescript
  /** GET /subscription/status */
  @ApiScope('app')
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status returned', type: SubscriptionStatusResponseDto })
  async getStatus(
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<SubscriptionStatusResponseDto>> {
    this.logger.log(`Get subscription status`);
    const data = await this.subscriptionApiService.getStatus(userId);
    return BaseResponseDto.success('Subscription status retrieved', data);
  }
```
→
```typescript
  /** GET /subscription/status?sync=true */
  @ApiScope('app')
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current subscription status' })
  @ApiQuery({ name: 'sync', required: false, description: 'true để buộc verify lại với Google Play thay vì đọc cache DB' })
  @ApiResponse({ status: 200, description: 'Subscription status returned', type: SubscriptionStatusResponseDto })
  async getStatus(
    @CurrentUserId() userId: string,
    @Query('sync') sync?: string,
  ): Promise<BaseResponseDto<SubscriptionStatusResponseDto>> {
    this.logger.log(`Get subscription status`);
    const data = await this.subscriptionApiService.getStatus(userId, sync === 'true');
    return BaseResponseDto.success('Subscription status retrieved', data);
  }
```

Gắn `@ApiScope('admin')` ngay trên `@Roles('ADMIN')` của method `sync`:

```typescript
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @Post('sync')
```
→
```typescript
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @ApiScope('admin')
  @Post('sync')
```

Method `webhookGoogle` (`@Public()`) — KHÔNG thêm `@ApiScope` (đúng chủ đích: Google gọi trực tiếp, không thuộc client spec nào).

- [ ] **Step 8 (BUG FIX — `getGooglePlayConfig()` fallback về package name của app tham khảo `com.rock.ai.rock.identifier` khi thiếu env, vi phạm "không hardcode" + gây lỗi verify khó hiểu nếu quên set env)**

```bash
grep -n "getGooglePlayConfig" -A 15 subscription-api.service.ts
```
Expected:
```typescript
  private getGooglePlayConfig(): { keyFile: string; packageName: string } {
    const credentialsPath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const packageName =
      this.configService.get<string>('GOOGLE_PLAY_PACKAGE_NAME') ||
      'com.rock.ai.rock.identifier';

    if (!credentialsPath) {
      throw new BadRequestException(
        'Missing GOOGLE_APPLICATION_CREDENTIALS',
      );
    }
```

Dùng Edit tool sửa thành:

```typescript
  private getGooglePlayConfig(): { keyFile: string; packageName: string } {
    const credentialsPath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const packageName = this.configService.get<string>('GOOGLE_PLAY_PACKAGE_NAME');

    if (!credentialsPath) {
      throw new BadRequestException(
        'Missing GOOGLE_APPLICATION_CREDENTIALS',
      );
    }
    if (!packageName) {
      throw new BadRequestException('Missing GOOGLE_PLAY_PACKAGE_NAME');
    }
```

Kiểm tra dòng return cuối hàm vẫn dùng `packageName` (giờ đã chắc chắn là `string`, không còn `string | undefined`):

```bash
grep -n "return { keyFile, packageName }" subscription-api.service.ts
```
Expected: có 1 dòng như vậy ở cuối `getGooglePlayConfig()` — không cần sửa gì thêm, TypeScript tự suy luận
kiểu đúng sau 2 lệnh `throw` guard ở trên.

- [ ] **Step 9 (BUG FIX — `mapWebhookEventToPurchaseStatus` bỏ sót 3 event "đang hoạt động trở lại" — `RECOVERED`/`RESTARTED`/`DEFERRED` — rơi vào nhánh mặc định `PENDING`, khiến subscriber đã khôi phục bị hạ nhầm quyền premium tạm thời)**

```bash
grep -n "private mapWebhookEventToPurchaseStatus" -A 5 subscription-api.service.ts
```
Expected:
```typescript
  private mapWebhookEventToPurchaseStatus(eventType: string): PurchaseStatus {
    const normalized = eventType.toUpperCase();

    if (normalized.includes('PURCHASED') || normalized.includes('RENEWED')) {
      return PurchaseStatus.PURCHASED;
    }
```

Dùng Edit tool sửa thành:

```typescript
  private mapWebhookEventToPurchaseStatus(eventType: string): PurchaseStatus {
    const normalized = eventType.toUpperCase();

    if (
      normalized.includes('PURCHASED') ||
      normalized.includes('RENEWED') ||
      normalized.includes('RECOVERED') ||
      normalized.includes('RESTARTED') ||
      normalized.includes('DEFERRED')
    ) {
      return PurchaseStatus.PURCHASED;
    }
```

- [ ] **Step 10: Verify không còn sót bug cũ + build kiểm chứng cú pháp sớm**

```bash
grep -n "autoRenewEnabled ?? true\|SUBSCRIPTION_STATE_ON_HOLD.\+PENDING\|Only ANDROID platform is supported for Google\|com\.rock\.ai\.rock\.identifier" subscription-api.service.ts || echo "bug đã sửa"
grep -n "RECOVERED\|RESTARTED\|DEFERRED" subscription-api.service.ts
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "modules/subscription-api" || echo "no subscription-api errors"
```
Expected: lệnh 1 in `bug đã sửa`; lệnh 2 in ra RECOVERED/RESTARTED/DEFERRED xuất hiện cả ở
`mapGoogleNotificationTypeToEventName` (sinh tên event, không đổi) LẪN `mapWebhookEventToPurchaseStatus`
(vừa thêm ở Step 9).

- [ ] **Step 11: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/subscription-api
git commit -m "feat(backend): port module subscription-api (IAP Google Play), sửa 4 bug autoRenew/ON_HOLD/IOS-message/sync-status"
```

---

### Task 14: Viết `admin-subscriptions` (CRUD quản trị) trong `modules/admin` — thay refer's `subscription` module

**Files:**
- Create: `apps/backend/src/modules/admin/admin-subscriptions.controller.ts`
- Create: `apps/backend/src/modules/admin/admin-subscriptions.service.ts`
- Create: `apps/backend/src/modules/admin/dto/update-subscription.dto.ts`
- Create: `apps/backend/src/modules/admin/dto/query-subscriptions.dto.ts`
- Modify: `apps/backend/src/modules/admin/admin.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `PaginationResponseDto`/`BaseResponseDto` (`common/dtos`), enum `SubscriptionStatus`/`PlanType` (Task 7).
- Produces: `AdminSubscriptionsService.findAll/findById/update/delete` — route `GET/PATCH/DELETE admin/subscriptions[/:id]`, scope `admin`.

Refer's `subscription` module (route riêng `/subscriptions`, guard chỉ `JwtAuthGuard`, dùng `OwnershipGuard` mà base không có) cho phép BẤT KỲ user đã đăng nhập nào gọi `GET /subscriptions` xem TOÀN BỘ subscription của mọi user — lỗ hổng phân quyền. Viết lại thành CRUD admin-only theo đúng pattern `AdminUsersController` (`@Controller('admin')` + `@Roles('ADMIN')`), bỏ hẳn route tự-phục-vụ `POST /subscriptions` và `GET /subscriptions/my` (user lấy trạng thái subscription của chính mình qua `GET /subscription/status` — module `subscription-api`, Task 13 — không phải CRUD admin này).

- [ ] **Step 1: Tạo `dto/update-subscription.dto.ts`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/admin
cat > dto/update-subscription.dto.ts <<'EOF'
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, PlanType } from '../../../common/constants';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
EOF
```

- [ ] **Step 2: Tạo `dto/query-subscriptions.dto.ts`**

```bash
cat > dto/query-subscriptions.dto.ts <<'EOF'
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, PlanType } from '../../../common/constants';

export class QuerySubscriptionsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
EOF
```

- [ ] **Step 3: Tạo `admin-subscriptions.service.ts`**

```bash
cat > admin-subscriptions.service.ts <<'EOF'
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { PaginationResponseDto } from '../../common/dtos';

const USER_SUMMARY_SELECT = { id: true, email: true, firstName: true, lastName: true };

@Injectable()
export class AdminSubscriptionsService {
  private readonly logger = new Logger('AdminSubscriptionsService');

  constructor(private prisma: PrismaService) {}

  async findAll(query: QuerySubscriptionsDto): Promise<PaginationResponseDto<any>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    if (query.plan) where.plan = query.plan;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: USER_SUMMARY_SELECT } },
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return new PaginationResponseDto(subscriptions, page, limit, total);
  }

  async findById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { user: { select: USER_SUMMARY_SELECT } },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.findById(id);

    try {
      return await this.prisma.subscription.update({
        where: { id },
        data: {
          status: dto.status ?? subscription.status,
          plan: dto.plan ?? subscription.plan,
          startDate: dto.startDate ? new Date(dto.startDate) : subscription.startDate,
          endDate: dto.endDate ? new Date(dto.endDate) : subscription.endDate,
        },
        include: { user: { select: USER_SUMMARY_SELECT } },
      });
    } catch (error: any) {
      this.logger.error(`Error updating subscription: ${error.message}`);
      throw new BadRequestException('Failed to update subscription');
    }
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.subscription.delete({ where: { id } });
    return { message: 'Subscription deleted successfully' };
  }
}
EOF
```

- [ ] **Step 4: Tạo `admin-subscriptions.controller.ts`**

```bash
cat > admin-subscriptions.controller.ts <<'EOF'
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { PaginationResponseDto, BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles, ApiScope } from '../../common/decorators';

@ApiTags('admin - subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiScope('admin')
@Controller('admin')
export class AdminSubscriptionsController {
  constructor(private readonly service: AdminSubscriptionsService) {}

  @Get('subscriptions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List subscriptions (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'CANCELED', 'GRACE'] })
  @ApiQuery({ name: 'plan', required: false, enum: ['WEEKLY', 'MONTHLY', 'YEARLY', 'LIFETIME'] })
  async findAll(
    @Query() query: QuerySubscriptionsDto,
  ): Promise<BaseResponseDto<PaginationResponseDto<any>>> {
    const result = await this.service.findAll(query);
    return BaseResponseDto.success('Subscriptions retrieved successfully', result);
  }

  @Get('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<BaseResponseDto<any>> {
    const result = await this.service.findById(id);
    return BaseResponseDto.success('Subscription retrieved successfully', result);
  }

  @Patch('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update subscription (chỉnh tay trạng thái/gói/ngày hết hạn)' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiBody({ type: UpdateSubscriptionDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.update(id, dto);
    return BaseResponseDto.success('Subscription updated successfully', result);
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<BaseResponseDto<any>> {
    const result = await this.service.delete(id);
    return BaseResponseDto.success('Subscription deleted successfully', result);
  }
}
EOF
```

- [ ] **Step 5: Đăng ký vào `admin.module.ts`**

```bash
cat admin.module.ts
```
Expected nội dung hiện tại (xem Task hiện tại — `AdminModule` liệt kê 4 controller/service: Users, SystemSettings, Dashboard, Notifications).

Dùng Edit tool: thêm 2 dòng import mới ngay sau khối import `AdminNotificationsController`/`AdminNotificationsService`:

```typescript
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
```

Thêm `AdminSubscriptionsController` vào mảng `controllers`, `AdminSubscriptionsService` vào mảng `providers` (giữ nguyên các entry cũ):

```typescript
  controllers: [
    AdminUsersController,
    AdminSystemSettingsController,
    AdminDashboardController,
    AdminNotificationsController,
    AdminSubscriptionsController,
  ],
  providers: [
    AdminUsersService,
    AdminSystemSettingsService,
    AdminDashboardService,
    AdminNotificationsService,
    AdminSubscriptionsService,
  ],
```

- [ ] **Step 6: Build kiểm chứng**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "modules/admin" || echo "no admin module errors"
```

- [ ] **Step 7: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/backend/src/modules/admin
git commit -m "feat(backend): thêm admin-subscriptions CRUD (admin-only, thay subscription module không an toàn của refer)"
```

---

### Task 15: Đăng ký 8 module mới vào `app.module.ts`, tạo migration `init`, verify codegen sinh đủ 3 swagger spec

**Files:**
- Modify: `apps/backend/src/app.module.ts`
- Create: `apps/backend/prisma/migrations/` (migration mới, tên `init`)

**Interfaces:**
- Consumes: `AppInitModule`, `UsageModule`, `RewardModule`, `RewardChatModule`, `SettingsModule`, `TrackModule`, `ApiLogModule`, `SubscriptionApiModule` (Task 8–13).

- [ ] **Step 1: Đọc `app.module.ts` hiện tại**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src
cat app.module.ts
```

- [ ] **Step 2: Thêm 8 import module mới**

Dùng Edit tool, tìm đoạn:

```typescript
import { UploadModule } from './modules/upload/upload.module';

// Middleware
```

Thay bằng:

```typescript
import { UploadModule } from './modules/upload/upload.module';
import { AppInitModule } from './modules/app-init/app-init.module';
import { UsageModule } from './modules/usage/usage.module';
import { RewardModule } from './modules/reward/reward.module';
import { RewardChatModule } from './modules/reward-chat/reward-chat.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrackModule } from './modules/track/track.module';
import { ApiLogModule } from './modules/api-log/api-log.module';
import { SubscriptionApiModule } from './modules/subscription-api/subscription-api.module';

// Middleware
```

- [ ] **Step 3: Đăng ký 8 module vào mảng `imports` của `@Module`**

Tìm đoạn:

```typescript
    AuthModule,
    UsersModule,
    HealthModule,
    AdminModule,
    NotificationModule,
    SystemSettingModule,
    UploadModule,
  ],
  controllers: [AppController],
```

Thay bằng:

```typescript
    AuthModule,
    UsersModule,
    HealthModule,
    AdminModule,
    NotificationModule,
    SystemSettingModule,
    UploadModule,
    AppInitModule,
    UsageModule,
    RewardModule,
    RewardChatModule,
    SettingsModule,
    TrackModule,
    ApiLogModule,
    SubscriptionApiModule,
  ],
  controllers: [AppController],
```

- [ ] **Step 4: Build toàn bộ backend**

```bash
cd /Volumes/Data/Product/pp09baseproduct
pnpm --filter @pp09base/backend build
```
Expected: thoát mã 0, không lỗi TypeScript ở bất kỳ module nào trong 8 module vừa đăng ký.

- [ ] **Step 5: Tạo migration `init` đầu tiên của base (thư mục `migrations/` đang trống)**

Yêu cầu một database PostgreSQL local/dev đã cấu hình trong `apps/backend/.env` (`DATABASE_URL`). Nếu chưa có, dựng bằng `docker-compose up -d` (xem `apps/backend/docker-compose.yml`) trước khi chạy lệnh dưới.

```bash
cd /Volumes/Data/Product/pp09baseproduct
pnpm --filter @pp09base/backend db:migrate:dev --name init
```
Expected: Prisma tạo `apps/backend/prisma/migrations/<timestamp>_init/migration.sql` chứa CREATE TABLE cho toàn bộ 13 model (7 lõi + `Subscription`/`Purchase`/`Usage`/`ApiRequestLog`), thoát mã 0.

- [ ] **Step 6: Export swagger spec + kiểm tra endpoint IAP xuất hiện đúng nhóm**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend
pnpm docs:export
```
Expected: ghi lại `packages/api-contract/specs/swagger-{app,admin,user}.json`.

```bash
grep -o '"/api/v1/subscription/verify"' ../../packages/api-contract/specs/swagger-app.json
grep -o '"/api/v1/subscription/verify"' ../../packages/api-contract/specs/swagger-admin.json
grep -o '"/api/v1/admin/subscriptions"' ../../packages/api-contract/specs/swagger-admin.json
grep -o '"/api/v1/subscription/webhook/google"' ../../packages/api-contract/specs/swagger-app.json
```
Expected: 3 lệnh đầu in ra kết quả khớp; lệnh cuối (`webhook/google` trong `swagger-app.json`) KHÔNG in gì — endpoint webhook không gắn `@ApiScope` nên đúng ra phải bị loại khỏi cả 3 spec.

- [ ] **Step 7: `pnpm codegen` sinh type cho client TS (web-admin)**

```bash
cd /Volumes/Data/Product/pp09baseproduct
pnpm --filter @pp09base/backend codegen 2>/dev/null; pnpm codegen
```
Expected: thoát mã 0, `packages/api-contract/src/generated/{app,admin,user}.ts` cập nhật.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/app.module.ts apps/backend/prisma/migrations packages/api-contract
git commit -m "feat(backend): đăng ký 8 module IAP/quota vào AppModule, tạo migration init"
```

---

### Task 16: Xoá hẳn `apps/backend_pp03_refer`

**Files:**
- Delete: `apps/backend_pp03_refer/` (toàn bộ)

**Interfaces:** Không có — mọi phần dùng được đã port sang `apps/backend` ở Task 8–15.

- [ ] **Step 1: Xác nhận không còn tham chiếu nào tới `backend_pp03_refer` trong `apps/backend`**

```bash
grep -rl "backend_pp03_refer" /Volumes/Data/Product/pp09baseproduct/apps/backend 2>/dev/null || echo "clean"
```
Expected: `clean`.

- [ ] **Step 2: Xoá thư mục**

```bash
rm -rf /Volumes/Data/Product/pp09baseproduct/apps/backend_pp03_refer
```

- [ ] **Step 3: Kiểm tra thư mục có bị lỡ track vào git chưa (Task 3 dùng `git add -A`/tương tự cho commit đổi tên toàn repo — có thể đã lỡ qué luôn `backend_pp03_refer` nếu nó còn tồn tại lúc đó)**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git status --short | grep backend_pp03_refer | head -5
```

**Trường hợp A — không in gì (thư mục chưa từng track):** không có gì để commit, xong Task này.

**Trường hợp B — in ra một loạt dòng `D apps/backend_pp03_refer/...` (đã bị track, giờ hiện xoá chưa
staged):** thư mục đã lỡ lọt vào một commit trước đó. Xác nhận không có secret nào lọt theo (Task 2 đã
dọn secret trong thư mục này TRƯỚC khi Task 3 chạy, nên về lý thuyết sạch — vẫn kiểm tra lại cho chắc):

```bash
git log --oneline --all -- apps/backend_pp03_refer
git show <commit-hash-vừa-in-ra> --stat -- apps/backend_pp03_refer | grep -iE "\.env|yarn\.lock|pc-api|copilot" || echo "clean — không có secret trong commit đó"
```
Expected: `clean`.

Commit việc xoá (bắt buộc ở trường hợp B, vì git đang track các file này):

```bash
git add -A -- apps/backend_pp03_refer
git commit -m "chore: xoá apps/backend_pp03_refer (đã port xong 9 module, thư mục vô tình lọt vào commit đổi tên ở Task 3)"
git status --short | grep backend_pp03_refer || echo "clean — không còn trong git status"
```

---

## Phase 4 — Mobile: đổi package name + tách Gradle module `:core`/`:app`

### Task 17: Đổi package name toàn bộ `com.rock.ai.rock.identifier` → `com.izisoft.pp09base` + namespace/version/theme/AdMob id

**Files:**
- Modify (di chuyển + sed nội dung): toàn bộ `apps/mobile/app/src/{main,test,androidTest}/java/com/rock/ai/rock/identifier/**`
- Modify: `apps/mobile/app/build.gradle.kts` (namespace, applicationId, versionCode, versionName)
- Modify: `apps/mobile/app/src/main/AndroidManifest.xml`
- Modify: `apps/mobile/app/src/main/res/values/themes.xml`, `apps/mobile/app/src/main/res/values-v31/themes.xml`
- Modify: `apps/mobile/app/src/main/res/values/strings.xml` (chỉ 2 dòng `app_name`/`fcm_default_channel_id`)

**Interfaces:** Không có — đổi tên thuần tuý, hành vi runtime giữ nguyên (trừ AdMob App ID đổi sang test id công khai của Google — xem Step 6).

Việc tách `:core`/`:app` diễn ra ở Task 18, SAU khi đổi tên xong — tách rời 2 việc để mỗi bước dễ verify độc lập (không đổi tên + tách module cùng lúc).

- [ ] **Step 1: Đổi mọi package declaration/import trong toàn bộ source Kotlin**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -rl "com\.rock\.ai\.rock\.identifier" app/src --include="*.kt" | wc -l
```
Expected: ~420 (toàn bộ file `.kt`).

```bash
find app/src -name "*.kt" -exec sed -i '' 's/com\.rock\.ai\.rock\.identifier/com.izisoft.pp09base/g' {} +
grep -rl "com\.rock\.ai\.rock\.identifier" app/src --include="*.kt" | wc -l
```
Expected sau lệnh 2: `0`.

- [ ] **Step 2: Di chuyển cây thư mục Java package cho khớp package mới**

```bash
for src in main test androidTest; do
  dir="app/src/$src/java/com/rock/ai/rock/identifier"
  if [ -d "$dir" ]; then
    mkdir -p "app/src/$src/java/com/izisoft"
    mv "$dir" "app/src/$src/java/com/izisoft/pp09base"
    rmdir "app/src/$src/java/com/rock/ai/rock" "app/src/$src/java/com/rock/ai" "app/src/$src/java/com/rock" 2>/dev/null
  fi
done
find app/src -type d -name "identifier" || echo "không còn thư mục cũ"
find app/src -path "*com/izisoft/pp09base" -maxdepth 6
```
Expected dòng cuối: 3 đường dẫn (`main`, `test`, `androidTest`) tồn tại dưới `com/izisoft/pp09base`.

- [ ] **Step 3: Đổi `namespace`/`applicationId`/version trong `app/build.gradle.kts`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -n "namespace\|applicationId\|versionCode\|versionName" app/build.gradle.kts
```
Expected:
```
    namespace = "com.rock.ai.rock.identifier"
    ...
        applicationId = "com.rock.ai.rock.identifier"
        minSdk = 24
        targetSdk = 35
        versionCode = 135
        versionName = "1.3.5"
```

```bash
sed -i '' \
  -e 's/namespace = "com\.rock\.ai\.rock\.identifier"/namespace = "com.izisoft.pp09base"/' \
  -e 's/applicationId = "com\.rock\.ai\.rock\.identifier"/applicationId = "com.izisoft.pp09base"/' \
  -e 's/versionCode = 135/versionCode = 1/' \
  -e 's/versionName = "1\.3\.5"/versionName = "1.0.0"/' \
  app/build.gradle.kts
grep -n "namespace\|applicationId\|versionCode\|versionName" app/build.gradle.kts
```
Expected: `namespace = "com.izisoft.pp09base"`, `applicationId = "com.izisoft.pp09base"`, `versionCode = 1`, `versionName = "1.0.0"`.

- [ ] **Step 4: Đổi theme name `Theme.Pp03baseandroid_app` → `Theme.Pp09Base`**

```bash
grep -rl "Pp03baseandroid_app" app/src/main/res app/src/main/AndroidManifest.xml
```
Expected 3 file: `res/values/themes.xml`, `res/values-v31/themes.xml`, `AndroidManifest.xml`.

```bash
grep -rl "Pp03baseandroid_app" app/src/main/res app/src/main/AndroidManifest.xml | \
  xargs sed -i '' 's/Pp03baseandroid_app/Pp09Base/g'
grep -rl "Pp03baseandroid_app" app/src/main/res app/src/main/AndroidManifest.xml || echo "clean"
```

- [ ] **Step 5: Đổi `app_name` + `fcm_default_channel_id` trong `strings.xml` (tên app hiện là "Rock AI" — nghiệp vụ)**

```bash
grep -n "app_name\|fcm_default_channel_id" app/src/main/res/values/strings.xml
```
Expected:
```
    <string name="app_name">Rock AI</string>
    <string name="fcm_default_channel_id">rock_ai_fcm_default</string>
```

```bash
sed -i '' \
  -e 's/<string name="app_name">Rock AI<\/string>/<string name="app_name">PP09 Base<\/string>/' \
  -e 's/<string name="fcm_default_channel_id">rock_ai_fcm_default<\/string>/<string name="fcm_default_channel_id">pp09base_fcm_default<\/string>/' \
  app/src/main/res/values/strings.xml
grep -n "app_name\|fcm_default_channel_id" app/src/main/res/values/strings.xml
```
Expected: `PP09 Base` và `pp09base_fcm_default`.

- [ ] **Step 6: Đổi AdMob App ID trong `AndroidManifest.xml` sang test id công khai của Google** (id hiện tại `ca-app-pub-7801106730942036~7901720218` gắn với tài khoản AdMob thật của Rock Identifier)

```bash
grep -n "APPLICATION_ID" app/src/main/AndroidManifest.xml
```
Expected: `android:value="ca-app-pub-7801106730942036~7901720218"`

```bash
sed -i '' 's/ca-app-pub-7801106730942036~7901720218/ca-app-pub-3940256099942544~3347511713/' \
  app/src/main/AndroidManifest.xml
grep -n "APPLICATION_ID" app/src/main/AndroidManifest.xml
```
Expected: `android:value="ca-app-pub-3940256099942544~3347511713"` (test App ID công khai chính thức của Google — https://developers.google.com/admob/android/test-ads). Mỗi sản phẩm clone base PHẢI thay bằng App ID thật từ tài khoản AdMob của mình trước khi phát hành.

- [ ] **Step 6b (BUG FIX — `proguard-rules.pro` không nằm trong Step 1 (chỉ quét file `.kt`) nên vẫn còn 4 dòng `-keep class com.rock.ai.rock.identifier...` trỏ vào package không còn tồn tại — vô hiệu hoá ProGuard/R8 keep-rule cho network/API/DTO ở release build, chỉ lộ ra khi build `release` có bật minify, không phải `compileDebugKotlin`)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -n "com\.rock\.ai\.rock\.identifier" app/proguard-rules.pro
```
Expected 4 dòng:
```
-keep class com.rock.ai.rock.identifier.core.network.** { *; }
-keep class com.rock.ai.rock.identifier.features.**.data.api.** { *; }
-keep class com.rock.ai.rock.identifier.features.**.data.model.** { *; }
-keep class com.rock.ai.rock.identifier.features.**.data.**Dto { *; }
```

```bash
sed -i '' 's/com\.rock\.ai\.rock\.identifier/com.izisoft.pp09base/g' app/proguard-rules.pro
grep -n "com\.rock\.ai\.rock\.identifier\|com\.izisoft\.pp09base" app/proguard-rules.pro
```
Expected sau lệnh 2: không còn `com.rock.ai.rock.identifier`; 4 dòng `com.izisoft.pp09base`.

- [ ] **Step 7: Build kiểm chứng (vẫn single-module `:app`, chưa tách `:core`)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew :app:compileDebugKotlin
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 8: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile
git commit -m "chore(mobile): đổi package com.rock.ai.rock.identifier -> com.izisoft.pp09base, reset version, đổi AdMob test id"
```

---

### Task 18: Tách Gradle module `:core` — di chuyển `core/`, `paywall/`, `rating/`, `ui/theme/` ra khỏi `:app`

**Files:**
- Create: `apps/mobile/core/build.gradle.kts`
- Modify: `apps/mobile/settings.gradle.kts`
- Modify: `apps/mobile/app/build.gradle.kts`
- Modify (di chuyển): `apps/mobile/app/src/main/java/com/izisoft/pp09base/{core,paywall,rating,ui/theme}/**` → `apps/mobile/core/src/main/java/com/izisoft/pp09base/core/**`

**Interfaces:**
- Produces: module Gradle `:core` — mọi feature trong `:app` import type từ `:core` qua `implementation(project(":core"))`. `:core` expose phần lớn dependency qua `api(...)` (không phải `implementation`) vì code trong `:app` (ví dụ DTO của feature dùng `@SerializedName` của Gson, hoặc gọi thẳng `Retrofit`/`RewardedAdManager`) tham chiếu trực tiếp type từ các thư viện đó — `implementation` trong Gradle KHÔNG truyền transitive, `api` mới truyền.

- [ ] **Step 1: Di chuyển 4 thư mục từ `:app` sang `:core`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
mkdir -p core/src/main/java/com/izisoft/pp09base/core

# core/ đã đúng package com.izisoft.pp09base.core.* — chỉ cần move
mv app/src/main/java/com/izisoft/pp09base/core/* core/src/main/java/com/izisoft/pp09base/core/
rmdir app/src/main/java/com/izisoft/pp09base/core

# paywall/, rating/ -> core/paywall, core/rating (đổi package ở Step 2)
mkdir -p core/src/main/java/com/izisoft/pp09base/core/paywall
mv app/src/main/java/com/izisoft/pp09base/paywall/* core/src/main/java/com/izisoft/pp09base/core/paywall/
rmdir app/src/main/java/com/izisoft/pp09base/paywall

mkdir -p core/src/main/java/com/izisoft/pp09base/core/rating
mv app/src/main/java/com/izisoft/pp09base/rating/* core/src/main/java/com/izisoft/pp09base/core/rating/
rmdir app/src/main/java/com/izisoft/pp09base/rating

# ui/theme/ -> core/theme (gộp chung thư mục với core/theme/AppTheme.kt đã có sẵn, không trùng tên file)
mv app/src/main/java/com/izisoft/pp09base/ui/theme/* core/src/main/java/com/izisoft/pp09base/core/theme/
rmdir app/src/main/java/com/izisoft/pp09base/ui/theme
rmdir app/src/main/java/com/izisoft/pp09base/ui

find app/src/main/java/com/izisoft/pp09base -maxdepth 1 -type d
```
Expected: chỉ còn `features` (và bản thân thư mục `pp09base` chứa `AppNavigation.kt`/`MainActivity.kt`/`BaseApplication.kt` ở gốc).

- [ ] **Step 2: Đổi package declaration + mọi import tham chiếu 3 package đã di chuyển (paywall/rating/ui.theme), áp dụng trên CẢ `core/` lẫn `app/`**

```bash
find core app -name "*.kt" -exec sed -i '' \
  -e 's/com\.izisoft\.pp09base\.paywall/com.izisoft.pp09base.core.paywall/g' \
  -e 's/com\.izisoft\.pp09base\.rating/com.izisoft.pp09base.core.rating/g' \
  -e 's/com\.izisoft\.pp09base\.ui\.theme/com.izisoft.pp09base.core.theme/g' \
  {} +
grep -rl "com\.izisoft\.pp09base\.paywall\b\|com\.izisoft\.pp09base\.rating\b\|com\.izisoft\.pp09base\.ui\.theme" core app --include="*.kt" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 3: Viết `settings.gradle.kts` — thêm module `:core`**

```bash
cat settings.gradle.kts
```
Expected hiện tại: `rootProject.name = "pp09base_android"` (đã đổi ở Task 17), `include(":app")`.

```bash
cat > settings.gradle.kts <<'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "pp09base_android"
include(":core", ":app")
EOF
```

- [ ] **Step 4: Viết `core/build.gradle.kts`**

```bash
cat > core/build.gradle.kts <<'EOF'
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.kapt")
}

android {
    namespace = "com.izisoft.pp09base.core"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // api (không phải implementation): :app tham chiếu trực tiếp type từ các thư viện
    // này (Retrofit, Gson @SerializedName, RewardedAdManager, Compose UI...) nên phải
    // truyền transitive.
    api("androidx.core:core-ktx:1.10.1")
    api("androidx.activity:activity-ktx:1.7.0")
    api("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    api("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1")
    api(platform("androidx.compose:compose-bom:2023.08.00"))
    api("androidx.compose.ui:ui")
    api("androidx.compose.ui:ui-graphics")
    api("androidx.compose.material3:material3")
    api("androidx.compose.ui:ui-text-google-fonts")
    api("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-android-compiler:2.51.1")
    api("com.squareup.retrofit2:retrofit:2.11.0")
    api("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    api("io.coil-kt:coil-compose:2.6.0")
    api("com.google.android.gms:play-services-ads:23.1.0")
    api("com.android.billingclient:billing-ktx:6.2.1")
    api("com.google.android.play:review:2.0.1")
    api(platform("com.google.firebase:firebase-bom:33.7.0"))
    api("com.google.firebase:firebase-analytics-ktx")
    api("com.google.firebase:firebase-messaging-ktx")
    testImplementation("junit:junit:4.13.2")
}

kapt {
    correctErrorTypes = true
}
EOF
```

- [ ] **Step 5: Viết lại `app/build.gradle.kts` — thêm `implementation(project(":core"))`, bỏ dependency đã chuyển sang `:core`**

```bash
cat app/build.gradle.kts
```

Dùng Edit tool, thay toàn bộ khối `dependencies { ... }` (giữ nguyên phần `plugins`/`android` phía trên) bằng:

```kotlin
dependencies {
    implementation(project(":core"))

    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.activity:activity-compose:1.7.0")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-android-compiler:2.51.1")
    implementation("androidx.compose.material:material-icons-extended")
    // CameraX — chỉ feature scan_step1_camera dùng, bị xoá cùng feature đó ở Task 20
    implementation("androidx.camera:camera-camera2:1.5.3")
    implementation("androidx.camera:camera-lifecycle:1.5.3")
    implementation("androidx.camera:camera-view:1.5.3")
    implementation("androidx.camera:camera-core:1.5.3")
    // Khai báo lại BOM + analytics ở đây (dù đã có api() từ :core) vì plugin
    // com.google.gms.google-services áp dụng ở MODULE này, cần đọc google-services.json
    // đúng chỗ nó khớp applicationId.
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-analytics-ktx")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.08.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

kapt {
    correctErrorTypes = true
    javacOptions {
        option("-Xlint:-options", "true")
    }
}
```

- [ ] **Step 6: Build kiểm chứng cả 2 module**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew :core:assembleDebug
./gradlew :app:assembleDebug
```
Expected: cả hai lệnh `BUILD SUCCESSFUL`. Nếu `:app:assembleDebug` báo thiếu symbol (unresolved reference) từ package `core`/`paywall`/`rating`/`theme`, kiểm tra lại Step 2 — khả năng còn sót import chưa đổi package.

**[Ghi chú bổ sung — 3 lỗi build thật đã gặp khi chạy Task này, không bắt được bằng grep ở Step 1–5, chỉ
lộ ra khi build thật]:**

1. **`AppFirebaseMessagingService.kt`** (nay ở `:core`) tham chiếu `MainActivity`/`R` của `:app` để mở
   app khi bấm vào notification — `:core` KHÔNG được phép phụ thuộc ngược vào `:app`. Sửa: thay
   `Intent(context, MainActivity::class.java)` bằng
   `packageManager.getLaunchIntentForPackage(packageName)` (API chung, không cần biết tên class cụ thể);
   thay icon/label cứng bằng `applicationInfo.icon`/`applicationInfo.loadLabel(packageManager)`.
2. **`font_certs.xml`** (chứng chỉ Google Fonts, `AppTheme.kt` dùng) đang nằm ở `app/src/main/res/` —
   phải `git mv` sang `core/src/main/res/values/font_certs.xml` cùng lúc di chuyển `ui/theme/` ở Step 1,
   nếu không `AppTheme.kt` (giờ ở `:core`) sẽ không resolve được resource này.
3. **`core/build.gradle.kts` thiếu `material-icons-extended`** — `RatingDialog.kt` (nay ở `:core`) dùng
   icon mở rộng (`StarBorder`...), cần thêm `implementation("androidx.compose.material:material-icons-extended")`
   vào `core/build.gradle.kts` (Step 4) — `implementation`, KHÔNG phải `api`, vì chỉ dùng nội bộ trong
   `:core`, không lộ ra `:app`.

Do string `fcm_default_channel_id`/`fcm_default_channel_name` (dùng bởi `AppFirebaseMessagingService`,
nay ở `:core`) đang định nghĩa trong `app/src/main/res/values/strings.xml`, cần tạo thêm
`core/src/main/res/values/strings.xml` chứa 2 string này (di chuyển, không copy — xoá khỏi
`app/strings.xml`, để lại comment giải thích resource merge cross-module vẫn cho
`AndroidManifest.xml` ở `:app` resolve `@string/fcm_default_channel_id` bình thường).

- [ ] **Step 7: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile
git commit -m "refactor(mobile): tách Gradle module :core (IAP/IAA/network/theme) khỏi :app"
```

---

### Task 19: `RetrofitProvider.BASE_URL` đọc từ `BuildConfig`/`gradle.properties` thay vì hardcode domain của Rock Identifier

**Files:**
- Modify: `apps/mobile/core/build.gradle.kts`
- Modify: `apps/mobile/gradle.properties`
- Modify: `apps/mobile/core/src/main/java/com/izisoft/pp09base/core/network/RetrofitProvider.kt`

**Interfaces:**
- Produces: `RetrofitProvider.BASE_URL: String` — giữ nguyên tên hằng, chỉ đổi nguồn giá trị. Không đổi chữ ký nào khác — mọi feature vẫn gọi `RetrofitProvider.BASE_URL` y hệt trước.

`RetrofitProvider.kt` hiện hardcode `"https://pp03baseandroid.izisoft.io/"` — domain của app Rock Identifier, vi phạm `AI_RULES_ROOT.md` mục 5 ("KHÔNG hardcode URL/secret trong source").

- [ ] **Step 1: Đọc nội dung hiện tại (đã đổi package ở Task 17, còn URL hardcode)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
cat core/src/main/java/com/izisoft/pp09base/core/network/RetrofitProvider.kt
```
Expected:
```kotlin
package com.izisoft.pp09base.core.network

object RetrofitProvider {
    // TODO: Replace with real environment-driven base URL.
    const val BASE_URL = "https://pp03baseandroid.izisoft.io/"
}
```

- [ ] **Step 2: Thêm `buildConfigField` vào `core/build.gradle.kts`**

```bash
grep -n "defaultConfig {" -A 2 core/build.gradle.kts
```
Expected:
```kotlin
    defaultConfig {
        minSdk = 24
    }
```

Dùng Edit tool sửa thành:

```kotlin
    defaultConfig {
        minSdk = 24
        val apiBaseUrl = (project.findProperty("PP09BASE_API_BASE_URL") as String?)
            ?: "https://api.pp09base.example.com/"
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }
```

- [ ] **Step 3: Thêm placeholder vào `gradle.properties`**

```bash
tail -3 gradle.properties
```

Dùng Edit tool, append vào cuối `gradle.properties`:

```properties

# Base URL backend — mỗi sản phẩm clone base ghi đè giá trị thật ở đây (KHÔNG commit
# domain thật của sản phẩm nếu repo public; dùng gradle.properties cục bộ hoặc -P flag
# trên CI nếu cần giữ bí mật).
PP09BASE_API_BASE_URL=https://api.pp09base.example.com/
```

- [ ] **Step 4: Sửa `RetrofitProvider.kt` đọc từ `BuildConfig`**

```kotlin
package com.izisoft.pp09base.core.network

import com.izisoft.pp09base.core.BuildConfig

object RetrofitProvider {
    const val BASE_URL = BuildConfig.API_BASE_URL
}
```

`import com.izisoft.pp09base.core.BuildConfig` BẮT BUỘC — `RetrofitProvider.kt` nằm ở subpackage
`.core.network`, khác với package gốc `.core` (khớp `namespace` của module `:core`) nơi Gradle sinh ra
class `BuildConfig`. Thiếu import này sẽ lỗi biên dịch "unresolved reference: BuildConfig".

- [ ] **Step 5: Build kiểm chứng**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew :core:assembleDebug
```
Expected: `BUILD SUCCESSFUL` — `BuildConfig.API_BASE_URL` sinh tự động từ `buildConfigField` ở Step 2.

- [ ] **Step 6: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile/core/build.gradle.kts apps/mobile/gradle.properties \
  apps/mobile/core/src/main/java/com/izisoft/pp09base/core/network/RetrofitProvider.kt
git commit -m "chore(mobile): BASE_URL đọc từ BuildConfig/gradle.properties, bỏ hardcode domain Rock Identifier"
```

---

## Phase 5 — Mobile: gỡ 15 feature nghiệp vụ + viết lại navigation

### Task 20: Xoá 15 feature nghiệp vụ đá quý + dependency CameraX + layout native ad

**Files:**
- Delete: `apps/mobile/app/src/main/java/com/izisoft/pp09base/features/{home,scan_step1_camera,scan_step2_preview,scan_step3_analyzing,scan_step4_result,scan_step5_chat,collection_add,collection_detail,collection_home,collection_list,history_list,history_detail,search_explore,search_explore_list,search_explore_detail}/`
- Delete: `apps/mobile/app/src/main/res/layout/native_ad_view.xml`
- Modify: `apps/mobile/app/build.gradle.kts` (bỏ 4 dependency CameraX)

**Interfaces:** Không có ở bước này — `AppNavigation.kt`/`MainActivity.kt` vẫn còn import những feature vừa xoá, SẼ lỗi biên dịch cho tới khi Task 21–22 viết lại 2 file đó. Đây là trạng thái trung gian có chủ đích — không build kiểm chứng ở cuối task này.

- [ ] **Step 1: Xác nhận danh sách 15 feature xoá + 15 feature giữ lại (đối chiếu trước khi xoá)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/java/com/izisoft/pp09base/features
ls -d */ | sort
```
Expected 31 thư mục: 15 giữ (`splash`, `welcome`, `login`, `register`, `onboarding`, `onboarding1`,
`onboarding_final`, `subscription_paywall`, `offer_paywall`, `paywall_trigger`, `premium_success`,
`profile_subscription`, `profile`, `permission_request`, `offline_state`) + 15 xoá (danh sách dưới) + 1 rỗng
(`.gitkeep` nằm ở gốc `features/`, không phải thư mục — bỏ qua).

- [ ] **Step 2: Xoá 15 thư mục feature nghiệp vụ**

```bash
rm -rf home scan_step1_camera scan_step2_preview scan_step3_analyzing scan_step4_result scan_step5_chat \
  collection_add collection_detail collection_home collection_list \
  history_list history_detail \
  search_explore search_explore_list search_explore_detail
ls -d */ | sort
```
Expected: đúng 15 thư mục còn lại (danh sách "giữ" ở Step 1).

- [ ] **Step 3: Xoá layout XML chỉ phục vụ native ad của `scan_step3_analyzing` (đã xoá)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -rl "native_ad_view" app/src/main --include="*.kt" || echo "không còn file .kt nào tham chiếu"
rm -f app/src/main/res/layout/native_ad_view.xml
```
Expected dòng đầu: "không còn file .kt nào tham chiếu" (file Kotlin duy nhất dùng layout này —
`NativeAdCard.kt` — đã bị xoá cùng `scan_step3_analyzing` ở Step 2).

- [ ] **Step 4: Bỏ 4 dependency CameraX khỏi `app/build.gradle.kts` (chỉ `scan_step1_camera` dùng)**

```bash
grep -n "androidx.camera" app/build.gradle.kts
```
Expected 4 dòng (camera-camera2, camera-lifecycle, camera-view, camera-core).

Dùng Edit tool, xoá khối:

```kotlin
    // CameraX — chỉ feature scan_step1_camera dùng, bị xoá cùng feature đó ở Task 20
    implementation("androidx.camera:camera-camera2:1.5.3")
    implementation("androidx.camera:camera-lifecycle:1.5.3")
    implementation("androidx.camera:camera-view:1.5.3")
    implementation("androidx.camera:camera-core:1.5.3")
```

```bash
grep -n "androidx.camera" app/build.gradle.kts || echo "clean"
```
Expected: `clean`.

- [ ] **Step 5: Commit trạng thái trung gian (chưa build được — có chủ đích)**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile
git commit -m "chore(mobile): xoá 15 feature nghiệp vụ đá quý + CameraX (chưa build được, tiếp tục ở Task 21-22)"
```

---

### Task 21: Tách `Routes.kt`, viết `MainScreen.kt`, viết lại `AppNavigation.kt` chỉ còn 15 route

**Files:**
- Create: `apps/mobile/app/src/main/java/com/izisoft/pp09base/Routes.kt`
- Create: `apps/mobile/app/src/main/java/com/izisoft/pp09base/MainScreen.kt`
- Modify (viết lại từ đầu): `apps/mobile/app/src/main/java/com/izisoft/pp09base/AppNavigation.kt`

**Interfaces:**
- Consumes: `AppAnalytics`, `AdsEntryPoint`, `RatingManager`, `com.izisoft.pp09base.core.paywall.PaywallTriggerManager` (đã ở `:core` từ Task 18), 15 `Screen`/`ViewModel` của feature giữ lại (Task 20 không đụng).
- Produces: `object Routes` (top-level, KHÔNG còn nằm trong `MainActivity.kt`), `@Composable fun MainScreen(onOpenProfile: () -> Unit)`, `@Composable fun AppNavigation(...)` — chữ ký MỚI chỉ nhận 14 `ViewModel` (bỏ 12 tham số của feature đã xoá: `homeViewModel`, `searchExploreViewModel`, `scanStep1-5ViewModel`, `historyListViewModel`, `historyDetailViewModel`, `collectionHomeViewModel`, `collectionAddViewModel`, `collectionListViewModel`, `collectionDetailViewModel`) — Task 22 (`MainActivity.kt`) PHẢI gọi đúng chữ ký mới này.

`AppNavigation.kt` gốc dài 1.696 dòng, nối cả 31 feature — sửa từng dòng rủi ro cao hơn viết lại. Cách làm: SAO CHÉP các khối `composable(...)` của 15 route giữ lại bằng `sed -n` từ file gốc (đảm bảo không gõ nhầm code UI phức tạp), CHỈ tự viết phần thực sự mới (import feature giữ lại, chữ ký hàm rút gọn, `MainScreen`, route `MAIN`).

- [ ] **Step 1: Backup file gốc ra thư mục scratch, xác nhận số dòng chưa đổi**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/java/com/izisoft/pp09base
wc -l AppNavigation.kt
```
Expected: `1696` (Task 17 chỉ đổi package/import bên trong dòng, không đổi số dòng; Task 20 không đụng file này).

```bash
cp AppNavigation.kt /tmp/AppNavigation.kt.orig
```

- [ ] **Step 2: Tạo `Routes.kt` — trích từ `object Routes` hiện đang nằm cuối `MainActivity.kt`, bỏ 12 route đã xoá feature, thêm `MAIN`**

```bash
grep -n "^object Routes" MainActivity.kt
```
Expected: có 1 dòng (object Routes nằm ở cuối file).

```bash
cat > Routes.kt <<'EOF'
package com.izisoft.pp09base

object Routes {
    const val SPLASH = "splash"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val ONBOARDING = "onboarding"
    const val ONBOARDING1 = "onboarding1"
    const val ONBOARDING_FINAL = "onboarding_final"
    const val PERMISSION_REQUEST = "permission_request"
    const val SUBSCRIPTION_PAYWALL = "subscription_paywall"
    const val WELCOME = "welcome"
    const val MAIN = "main"
    const val PAYWALL_TRIGGER = "paywall_trigger"
    const val OFFER_PAYWALL = "offer_paywall"
    const val PREMIUM_SUCCESS = "premium_success"
    const val PROFILE = "profile"
    const val PROFILE_SUBSCRIPTION = "profile_subscription"
    const val PROFILE_HELP_CENTER = "profile_help_center"
    const val PROFILE_PRIVACY_POLICY = "profile_privacy_policy"
    const val OFFLINE_STATE = "offline_state"
}
EOF
```

Xoá khối `object Routes { ... }` cũ khỏi `MainActivity.kt` (đã chuyển sang file riêng) — thực hiện ở Task 22.

- [ ] **Step 3: Viết `MainScreen.kt` — placeholder màn hình đích sau đăng nhập/onboarding**

```bash
cat > MainScreen.kt <<'EOF'
package com.izisoft.pp09base

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

/**
 * Placeholder màn hình đích sau khi đăng nhập/onboarding xong. Base không có feature
 * nghiệp vụ nào — mỗi sản phẩm clone base thay hẳn composable này bằng shell thật
 * (bottom nav + màn hình chính) mà vẫn giữ nguyên route MAIN trong AppNavigation.
 */
@Composable
fun MainScreen(onOpenProfile: () -> Unit) {
    Scaffold { paddingValues ->
        Box(
            modifier = androidx.compose.ui.Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "MainScreen placeholder — thay bằng màn hình chính của sản phẩm",
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}
EOF
```

- [ ] **Step 4: Dựng `AppNavigation.kt` mới — phần 1: header framework/core import (dòng 1-25 file gốc, không đổi)**

```bash
sed -n '1,25p' /tmp/AppNavigation.kt.orig > AppNavigation.kt
tail -3 AppNavigation.kt
```
Expected 3 dòng cuối: `import androidx.navigation.compose.NavHost`, `import androidx.navigation.compose.composable`, `import androidx.navigation.compose.rememberNavController`.

- [ ] **Step 5: Phần 2 — import CHỈ 15 feature giữ lại (tự viết, xác minh so danh sách Task 20 Step 1)**

```bash
cat >> AppNavigation.kt <<'EOF'
import com.izisoft.pp09base.features.login.logic.LoginViewModel
import com.izisoft.pp09base.features.login.ui.screen.LoginScreen
import com.izisoft.pp09base.features.offline_state.ui.screen.OfflineStateScreen
import com.izisoft.pp09base.features.offline_state.ui.screen.OfflineStateScreenUiState
import com.izisoft.pp09base.features.offer_paywall.ui.screen.OfferPaywallScreen
import com.izisoft.pp09base.features.offer_paywall.ui.screen.OfferPaywallUiState as OfferPaywallScreenUiState
import com.izisoft.pp09base.features.offer_paywall.logic.OfferPaywallViewModel
import com.izisoft.pp09base.features.onboarding.logic.OnboardingViewModel
import com.izisoft.pp09base.features.onboarding.ui.screen.OnboardingScreen
import com.izisoft.pp09base.features.onboarding1.logic.Onboarding1ViewModel
import com.izisoft.pp09base.features.onboarding1.ui.screen.Onboarding1Screen
import com.izisoft.pp09base.features.onboarding_final.logic.OnboardingFinalViewModel
import com.izisoft.pp09base.features.onboarding_final.ui.screen.OnboardingFinalScreen
import com.izisoft.pp09base.features.onboarding_final.ui.screen.OnboardingFinalScreenUiState
import com.izisoft.pp09base.features.paywall_trigger.logic.PaywallTriggerViewModel
import com.izisoft.pp09base.features.paywall_trigger.ui.screen.PaywallTriggerScreen
import com.izisoft.pp09base.features.paywall_trigger.ui.screen.PaywallTriggerScreenUiState
import com.izisoft.pp09base.features.permission_request.logic.PermissionRequestViewModel
import com.izisoft.pp09base.features.permission_request.ui.screen.PermissionRequestScreen
import com.izisoft.pp09base.features.premium_success.logic.PremiumSuccessViewModel
import com.izisoft.pp09base.features.premium_success.ui.screen.DefaultPremiumOrderSummary
import com.izisoft.pp09base.features.premium_success.ui.screen.DefaultPremiumSuccessFeatures
import com.izisoft.pp09base.features.premium_success.ui.screen.PremiumSuccessScreen
import com.izisoft.pp09base.features.premium_success.ui.screen.PremiumSuccessScreenUiState
import com.izisoft.pp09base.features.profile.logic.ProfileViewModel
import com.izisoft.pp09base.features.profile.ui.component.LanguageSelectionDialog
import com.izisoft.pp09base.features.profile.ui.component.profileLanguageLabelForUi
import com.izisoft.pp09base.features.profile.ui.component.profileLanguageLocaleTag
import com.izisoft.pp09base.features.profile.ui.screen.DefaultProfileAvatarUrl
import com.izisoft.pp09base.features.profile.ui.screen.DefaultProfileSyncProviders
import com.izisoft.pp09base.features.profile.ui.screen.ProfileHelpCenterScreen
import com.izisoft.pp09base.features.profile.ui.screen.ProfilePrivacyPolicyScreen
import com.izisoft.pp09base.features.profile.ui.screen.ProfileScreen
import com.izisoft.pp09base.features.profile.ui.screen.ProfileScreenUiState
import com.izisoft.pp09base.features.profile_subscription.logic.ProfileSubscriptionViewModel
import com.izisoft.pp09base.features.profile_subscription.ui.screen.ProfileSubscriptionScreen
import com.izisoft.pp09base.features.profile_subscription.ui.screen.ProfileSubscriptionScreenUiState
import com.izisoft.pp09base.features.register.logic.RegisterViewModel
import com.izisoft.pp09base.features.register.ui.screen.RegisterScreen
import com.izisoft.pp09base.features.splash.logic.SplashViewModel
import com.izisoft.pp09base.features.splash.ui.screen.SplashScreen
import com.izisoft.pp09base.features.subscription_paywall.logic.SubscriptionPaywallViewModel
import com.izisoft.pp09base.features.subscription_paywall.ui.screen.SubscriptionPaywallScreen
import com.izisoft.pp09base.features.subscription_paywall.ui.screen.SubscriptionPaywallScreenUiState
import com.izisoft.pp09base.features.welcome.logic.WelcomeViewModel
import com.izisoft.pp09base.features.welcome.ui.screen.WelcomeScreen
EOF
wc -l AppNavigation.kt
```
Expected: `71` (25 dòng header + 46 dòng import feature giữ lại).

- [ ] **Step 6: Phần 3 — import dùng chung + helper function (dòng 117-168 file gốc, KHÔNG thuộc feature nào bị xoá, giữ nguyên)**

```bash
sed -n '117,168p' /tmp/AppNavigation.kt.orig >> AppNavigation.kt
tail -8 AppNavigation.kt
```
Expected 8 dòng cuối kết thúc bằng hàm `applyAppLocale` (đóng bằng `}`), KHÔNG kèm dòng trống + `@Composable`
đứng một mình sau đó (2 dòng đó thuộc phần mở đầu `fun AppNavigation(` — Step 7 hand-type lại, lấy dư sẽ
tạo `@Composable` trùng lặp ngay phía trên). Nếu lúc soạn plan đếm dòng bị lệch (đã từng lệch 2 dòng),
đối chiếu lại bằng `grep -n "^@Composable" /tmp/AppNavigation.kt.orig | head -1` — dòng khớp phải là dòng
NGAY SAU khoảng trích, không nằm trong khoảng.

- [ ] **Step 7: Phần 4 — chữ ký hàm rút gọn (14 ViewModel, bỏ 12 tham số feature đã xoá) + phần khởi tạo state + 3 `LaunchedEffect` (bỏ 6 dòng gọi `updatePremiumStatus` của feature đã xoá, chỉ giữ `paywallTriggerViewModel`)**

```bash
cat >> AppNavigation.kt <<'EOF'

@Composable
fun AppNavigation(
    isOnline: Boolean,
    splashViewModel: SplashViewModel,
    loginViewModel: LoginViewModel,
    registerViewModel: RegisterViewModel,
    onboardingViewModel: OnboardingViewModel,
    onboarding1ViewModel: Onboarding1ViewModel,
    onboardingFinalViewModel: OnboardingFinalViewModel,
    permissionRequestViewModel: PermissionRequestViewModel,
    subscriptionPaywallViewModel: SubscriptionPaywallViewModel,
    welcomeViewModel: WelcomeViewModel,
    paywallTriggerViewModel: PaywallTriggerViewModel,
    premiumSuccessViewModel: PremiumSuccessViewModel,
    profileViewModel: ProfileViewModel,
    profileSubscriptionViewModel: ProfileSubscriptionViewModel,
    offerPaywallViewModel: OfferPaywallViewModel,
    appAnalytics: AppAnalytics,
    ratingManager: RatingManager,
    paywallTriggerManager: com.izisoft.pp09base.core.paywall.PaywallTriggerManager
) {
    val navController = rememberNavController()
    val rootContext = LocalContext.current
    val rootActivity = rootContext as? android.app.Activity
    val rootScope = rememberCoroutineScope()
    val premiumStatusManager = remember {
        EntryPointAccessors.fromApplication(
            rootContext.applicationContext,
            AdsEntryPoint::class.java
        ).premiumStatusManager()
    }
    val isPremium by premiumStatusManager.isPremium.collectAsState()
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStackEntry?.destination?.route

    LaunchedEffect(isOnline, currentRoute) {
        if (!isOnline && currentRoute != Routes.OFFLINE_STATE) {
            navController.navigateSingleTopTo(Routes.OFFLINE_STATE)
        } else if (isOnline && currentRoute == Routes.OFFLINE_STATE) {
            navController.popBackStack()
        }
    }

    LaunchedEffect(currentRoute) {
        appAnalytics.logScreen(currentRoute)
    }

    LaunchedEffect(isPremium) {
        appAnalytics.setPremiumUser(isPremium)
        paywallTriggerViewModel.updatePremiumStatus(isPremium)
    }

    NavHost(navController = navController, startDestination = Routes.SPLASH) {
EOF
```

- [ ] **Step 8: Phần 5 — sao chép 16 khối `composable(...)` giữ lại NGUYÊN VĂN từ file gốc (đúng thứ tự xuất hiện ban đầu)**

```bash
{
  sed -n '242,252p' /tmp/AppNavigation.kt.orig   # splash
  sed -n '253,259p' /tmp/AppNavigation.kt.orig   # login
  sed -n '260,270p' /tmp/AppNavigation.kt.orig   # register
  sed -n '271,282p' /tmp/AppNavigation.kt.orig   # onboarding
  sed -n '283,294p' /tmp/AppNavigation.kt.orig   # onboarding1
  sed -n '295,330p' /tmp/AppNavigation.kt.orig   # onboarding_final
  sed -n '331,352p' /tmp/AppNavigation.kt.orig   # permission_request
  sed -n '353,447p' /tmp/AppNavigation.kt.orig   # subscription_paywall
  sed -n '448,459p' /tmp/AppNavigation.kt.orig   # welcome
  sed -n '769,785p' /tmp/AppNavigation.kt.orig   # paywall_trigger
  sed -n '786,836p' /tmp/AppNavigation.kt.orig   # offer_paywall
  sed -n '837,881p' /tmp/AppNavigation.kt.orig   # premium_success
  sed -n '1522,1595p' /tmp/AppNavigation.kt.orig # profile
  sed -n '1596,1599p' /tmp/AppNavigation.kt.orig # profile_help_center
  sed -n '1600,1603p' /tmp/AppNavigation.kt.orig # profile_privacy_policy
  sed -n '1604,1671p' /tmp/AppNavigation.kt.orig # profile_subscription
  sed -n '1672,1694p' /tmp/AppNavigation.kt.orig # offline_state (KHÔNG lấy 2 dòng đóng NavHost/fun cuối file)
} >> AppNavigation.kt
```

- [ ] **Step 9: Phần 6 — route `MAIN` mới + 2 dòng đóng `NavHost`/hàm**

```bash
cat >> AppNavigation.kt <<'EOF'

        composable(Routes.MAIN) {
            MainScreen(
                onOpenProfile = { navController.navigate(Routes.PROFILE) }
            )
        }
    }
}
EOF
```

- [ ] **Step 10: Đổi mọi `Routes.HOME` (route đã xoá) → `Routes.MAIN`**

```bash
grep -c "Routes.HOME" AppNavigation.kt
```
Expected: `5` (subscription_paywall, welcome, offer_paywall, premium_success, profile_subscription — đúng 5 chỗ đã xác định lúc phân tích).

```bash
sed -i '' 's/Routes\.HOME/Routes.MAIN/g' AppNavigation.kt
grep -c "Routes.HOME" AppNavigation.kt || echo "0 — clean"
```

- [ ] **Step 10b (BUG FIX — khối `profile_subscription` (giữ lại) có thanh bottom-nav RIÊNG của màn hình đó
  (không phải `Routes.HOME` mà là `history`/`scan`/`explore` tab), trỏ tới `Routes.HISTORY_LIST`/
  `Routes.SCAN_STEP1`/`Routes.SEARCH` — 3 route thuộc feature đã xoá, không nằm trong danh sách
  `Routes.HOME` ở Step 10 nên sed ở đó không bắt được)**

```bash
grep -n "Routes.HISTORY_LIST\|Routes.SCAN_STEP1\|Routes.SEARCH" AppNavigation.kt
```
Expected 3 dòng trong `onBottomNavClick` của `ProfileSubscriptionScreen`:
```typescript
                        "history" -> navController.navigateBottomBarTo(Routes.HISTORY_LIST)
                        "scan" -> navController.navigateBottomBarTo(Routes.SCAN_STEP1)
                        "explore" -> navController.navigateBottomBarTo(Routes.SEARCH)
```

Đọc rộng ra cả khối `bottomNavItems` phía trên (có 5 tab: `home`/`history`/`scan`/`explore`/`settings`)
và `onBottomNavClick` phía dưới. Dùng Edit tool: xoá 3 dòng khai báo tab `history`/`scan`/`explore` khỏi
`bottomNavItems` (chỉ giữ `home` và `settings`), và xoá 3 nhánh `when` tương ứng trong `onBottomNavClick`
(chỉ giữ `"home" -> ...` và `"settings" -> Unit`) — tab nào không còn feature phía sau thì bỏ thẳng khỏi
UI, không để lại tab bấm vô tác dụng hoặc trỏ nhầm route.

```bash
grep -n "Routes.HISTORY_LIST\|Routes.SCAN_STEP1\|Routes.SEARCH\|ProfileSubscriptionBottomNavItemUi(id = \"history\"\|ProfileSubscriptionBottomNavItemUi(id = \"scan\"\|ProfileSubscriptionBottomNavItemUi(id = \"explore\"" AppNavigation.kt || echo "clean"
```
Expected: `clean`.

- [ ] **Step 11: Verify không còn tham chiếu route/feature đã xoá**

```bash
grep -nE "Routes\.(HOME|SEARCH|SCAN_STEP|HISTORY_|COLLECTION_)" AppNavigation.kt || echo "clean — không còn route đã xoá"
grep -n "features\.(home|scan_step|collection_|history_|search_explore)" AppNavigation.kt || echo "clean — không còn import feature đã xoá"
```
Expected: cả 2 lệnh in `clean`.

- [ ] **Step 12: Xoá file backup, build kiểm chứng**

```bash
rm /tmp/AppNavigation.kt.orig
wc -l AppNavigation.kt
```
Expected: giảm mạnh từ 1.696 dòng (con số cụ thể phụ thuộc độ dài thật của 16 khối `composable` giữ lại —
lần chạy đầu ra ~690 dòng, không phải lỗi, chỉ là ước lượng ban đầu hơi thấp).

Chưa build được ở task này — `MainActivity.kt` (Task 22) vẫn còn gọi `AppNavigation(...)` với chữ ký CŨ (27 tham số) và còn khai báo 12 `ViewModel` của feature đã xoá. Build kiểm chứng thật sự ở Task 22 Step cuối.

- [ ] **Step 13: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile/app/src/main/java/com/izisoft/pp09base/Routes.kt \
  apps/mobile/app/src/main/java/com/izisoft/pp09base/MainScreen.kt \
  apps/mobile/app/src/main/java/com/izisoft/pp09base/AppNavigation.kt
git commit -m "refactor(mobile): viết lại AppNavigation.kt chỉ còn 15 route, tách Routes.kt, thêm MainScreen placeholder"
```

---

### Task 22: Viết lại `MainActivity.kt` — bỏ 12 `ViewModel` + import feature đã xoá, bỏ `object Routes` (đã chuyển sang `Routes.kt`), khớp chữ ký `AppNavigation` mới

**Files:**
- Modify (viết lại toàn bộ): `apps/mobile/app/src/main/java/com/izisoft/pp09base/MainActivity.kt`

**Interfaces:**
- Consumes: `AppNavigation(...)` chữ ký mới từ Task 21 (14 `ViewModel` + `isOnline`/`appAnalytics`/`ratingManager`/`paywallTriggerManager`), `NetworkMonitor`/`AppTheme` (`:core`), `RatingManager`/`PaywallTriggerManager` (`:core`, package đổi sau Task 18).

- [ ] **Step 1: Đọc file hiện tại (vẫn còn 27 tham số/import cũ)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/java/com/izisoft/pp09base
wc -l MainActivity.kt
grep -c "^import com.izisoft.pp09base.features" MainActivity.kt
```
Expected: `166` dòng, `23` import feature (14 giữ + 9 gộp từ collection/history/home/scan/search — một số feature như `collection_add` chỉ có 1 import logic).

- [ ] **Step 2: Ghi đè toàn bộ file bằng bản đã bỏ 12 ViewModel/import của feature đã xoá + bỏ `object Routes`**

```bash
cat > MainActivity.kt <<'EOF'
package com.izisoft.pp09base

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.izisoft.pp09base.core.firebase.AppAnalytics
import com.izisoft.pp09base.core.network.NetworkMonitor
import com.izisoft.pp09base.core.theme.AppTheme
import com.izisoft.pp09base.features.login.logic.LoginViewModel
import com.izisoft.pp09base.features.offer_paywall.logic.OfferPaywallViewModel
import com.izisoft.pp09base.features.onboarding.logic.OnboardingViewModel
import com.izisoft.pp09base.features.onboarding1.logic.Onboarding1ViewModel
import com.izisoft.pp09base.features.onboarding_final.logic.OnboardingFinalViewModel
import com.izisoft.pp09base.features.paywall_trigger.logic.PaywallTriggerViewModel
import com.izisoft.pp09base.features.permission_request.logic.PermissionRequestViewModel
import com.izisoft.pp09base.features.premium_success.logic.PremiumSuccessViewModel
import com.izisoft.pp09base.features.profile.logic.ProfileViewModel
import com.izisoft.pp09base.features.profile_subscription.logic.ProfileSubscriptionViewModel
import com.izisoft.pp09base.features.register.logic.RegisterViewModel
import com.izisoft.pp09base.features.splash.logic.SplashViewModel
import com.izisoft.pp09base.features.subscription_paywall.logic.SubscriptionPaywallViewModel
import com.izisoft.pp09base.features.welcome.logic.WelcomeViewModel
import com.izisoft.pp09base.core.rating.RatingManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var networkMonitor: NetworkMonitor

    @Inject
    lateinit var appAnalytics: AppAnalytics

    @Inject
    lateinit var ratingManager: RatingManager

    @Inject
    lateinit var paywallTriggerManager: com.izisoft.pp09base.core.paywall.PaywallTriggerManager

    private val splashViewModel: SplashViewModel by viewModels()
    private val loginViewModel: LoginViewModel by viewModels()
    private val registerViewModel: RegisterViewModel by viewModels()
    private val onboardingViewModel: OnboardingViewModel by viewModels()
    private val onboarding1ViewModel: Onboarding1ViewModel by viewModels()
    private val onboardingFinalViewModel: OnboardingFinalViewModel by viewModels()
    private val permissionRequestViewModel: PermissionRequestViewModel by viewModels()
    private val subscriptionPaywallViewModel: SubscriptionPaywallViewModel by viewModels()
    private val welcomeViewModel: WelcomeViewModel by viewModels()
    private val paywallTriggerViewModel: PaywallTriggerViewModel by viewModels()
    private val premiumSuccessViewModel: PremiumSuccessViewModel by viewModels()
    private val profileViewModel: ProfileViewModel by viewModels()
    private val profileSubscriptionViewModel: ProfileSubscriptionViewModel by viewModels()
    private val offerPaywallViewModel: OfferPaywallViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        ratingManager.onAppOpened()
        setContent {
            val isOnline by networkMonitor.isOnline.collectAsState()

            AppTheme {
                AppNavigation(
                        isOnline = isOnline,
                        splashViewModel = splashViewModel,
                        loginViewModel = loginViewModel,
                        registerViewModel = registerViewModel,
                        onboardingViewModel = onboardingViewModel,
                        onboarding1ViewModel = onboarding1ViewModel,
                        onboardingFinalViewModel = onboardingFinalViewModel,
                        permissionRequestViewModel = permissionRequestViewModel,
                        subscriptionPaywallViewModel = subscriptionPaywallViewModel,
                        welcomeViewModel = welcomeViewModel,
                        paywallTriggerViewModel = paywallTriggerViewModel,
                        premiumSuccessViewModel = premiumSuccessViewModel,
                        profileViewModel = profileViewModel,
                        profileSubscriptionViewModel = profileSubscriptionViewModel,
                        offerPaywallViewModel = offerPaywallViewModel,
                        appAnalytics = appAnalytics,
                        ratingManager = ratingManager,
                        paywallTriggerManager = paywallTriggerManager
                )
            }
        }
    }
}
EOF
wc -l MainActivity.kt
```
Expected: ~85 dòng (giảm từ 166; `object Routes` — 33 dòng — đã chuyển hẳn sang `Routes.kt` ở Task 21, không xuất hiện lại ở đây).

- [ ] **Step 3: Verify không còn tham chiếu feature đã xoá + build kiểm chứng TOÀN BỘ (lần đầu tiên từ đầu Phase 5)**

```bash
grep -nE "collection_|history_|scan_step|search_explore|features\.home\." MainActivity.kt || echo "clean"
```

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew :app:assembleDebug
```
Expected: `BUILD SUCCESSFUL`. Nếu lỗi `unresolved reference`, đối chiếu tên tham số giữa `MainActivity.kt` (Step 2) và chữ ký `fun AppNavigation(...)` viết ở Task 21 Step 7 — 2 file này PHẢI khớp tên/thứ tự tham số (Kotlin cho phép named argument nên thứ tự không bắt buộc khớp, nhưng TÊN phải khớp chính xác).

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile/app/src/main/java/com/izisoft/pp09base/MainActivity.kt
git commit -m "refactor(mobile): MainActivity chỉ còn 14 ViewModel, bỏ object Routes (đã tách file), build xanh lần đầu sau Phase 5"
```

---

### Task 23: Lọc `strings.xml` (5 locale) chỉ còn key đang dùng + thêm `values-vi`

**Files:**
- Modify: `apps/mobile/app/src/main/res/values/strings.xml`, `values-es/strings.xml`, `values-ja/strings.xml`, `values-ko/strings.xml`, `values-pt-rBR/strings.xml`
- Create: `apps/mobile/app/src/main/res/values-vi/strings.xml`

**Interfaces:** Không có — thuần lọc resource, không đổi code Kotlin.

`strings.xml` gốc 215 key phục vụ cả 31 feature (15 giữ + 15 đã xoá ở Task 20 + `ratting` rỗng). Lọc theo tập key THỰC SỰ còn được `R.string.*` tham chiếu trong source Kotlin còn lại (`core/` + `app/` sau Task 20–22), không đoán tay để tránh xoá nhầm key còn dùng hoặc để sót key rác.

- [ ] **Step 1: Tính tập key còn được tham chiếu**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -rohE 'R\.string\.[a-zA-Z0-9_]+' core/src app/src --include="*.kt" \
  | sed 's/^R\.string\.//' | sort -u > /tmp/used_string_keys.txt
wc -l /tmp/used_string_keys.txt
cat /tmp/used_string_keys.txt
```
Expected: một danh sách vài chục key (đọc qua để xác nhận hợp lý — toàn bộ đều thuộc 15 feature giữ lại/`core`, không có tên nào gợi liên quan đá quý như `stone_`/`gemstone_`/`rock_`/`scan_`).

- [ ] **Step 2: Viết script lọc XML (giữ `app_name`/`fcm_default_channel_id` dù không qua `R.string.` — dùng trong `AndroidManifest.xml`/`themes.xml`)**

```bash
cat > /tmp/filter_strings.py <<'EOF'
import re
import sys

with open('/tmp/used_string_keys.txt', encoding='utf-8') as f:
    allow = set(f.read().split())
allow |= {'app_name', 'fcm_default_channel_id'}

path = sys.argv[1]
with open(path, encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'[ \t]*<string\s+name="([^"]+)"[^>]*>.*?</string>\n?', re.DOTALL)

removed = []

def keep(m):
    key = m.group(1)
    if key in allow:
        return m.group(0)
    removed.append(key)
    return ''

new_content = pattern.sub(keep, content)
new_content = re.sub(r'\n{3,}', '\n\n', new_content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"{path}: xoá {len(removed)} key")
EOF
```

- [ ] **Step 3: Chạy script trên cả 5 file locale hiện có**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
for f in app/src/main/res/values/strings.xml \
         app/src/main/res/values-es/strings.xml \
         app/src/main/res/values-ja/strings.xml \
         app/src/main/res/values-ko/strings.xml \
         "app/src/main/res/values-pt-rBR/strings.xml"; do
  python3 /tmp/filter_strings.py "$f"
done
```
Expected: 5 dòng `<path>: xoá N key` — N gần bằng `215 - $(wc -l < /tmp/used_string_keys.txt) - 2` cho mỗi file (trừ 2 cho `app_name`/`fcm_default_channel_id` luôn giữ).

- [ ] **Step 4: Xác nhận số key CÒN LẠI khớp nhau giữa 5 locale (không lệch bộ key giữa các ngôn ngữ)**

```bash
for f in app/src/main/res/values/strings.xml \
         app/src/main/res/values-es/strings.xml \
         app/src/main/res/values-ja/strings.xml \
         app/src/main/res/values-ko/strings.xml \
         "app/src/main/res/values-pt-rBR/strings.xml"; do
  echo "$f: $(grep -c '<string name=' "$f")"
done
```
Expected: cả 5 dòng in RA CÙNG MỘT SỐ. Nếu lệch — một locale đang thiếu/thừa key so với `values/strings.xml` gốc (vốn dĩ đã có thể lệch từ trước, xem Step 5).

- [ ] **Step 5: Nếu số ở Step 4 lệch nhau, đối chiếu tập key giữa các file và điền bù thủ công**

```bash
for f in app/src/main/res/values-es/strings.xml app/src/main/res/values-ja/strings.xml \
         app/src/main/res/values-ko/strings.xml "app/src/main/res/values-pt-rBR/strings.xml"; do
  echo "=== thiếu trong $f so với values/strings.xml ==="
  comm -23 \
    <(grep -oE 'name="[a-zA-Z0-9_]+"' app/src/main/res/values/strings.xml | sort -u) \
    <(grep -oE 'name="[a-zA-Z0-9_]+"' "$f" | sort -u)
done
```
Với mỗi key thiếu in ra, copy dòng `<string name="KEY">...</string>` tương ứng từ `values/strings.xml` (bản tiếng Anh) sang file locale đang thiếu — chấp nhận tạm thời chưa dịch, đánh dấu bằng comment `<!-- TODO: dịch -->` phía trên dòng vừa thêm.

- [ ] **Step 6: Tạo `values-vi/strings.xml` (locale mới) — copy bản tiếng Anh đã lọc làm nền, dịch sau**

```bash
mkdir -p app/src/main/res/values-vi
cp app/src/main/res/values/strings.xml app/src/main/res/values-vi/strings.xml
```

- [ ] **Step 7: Dọn file tạm, build kiểm chứng resource hợp lệ**

```bash
rm -f /tmp/filter_strings.py /tmp/used_string_keys.txt
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew :app:assembleDebug
```
Expected: `BUILD SUCCESSFUL` — Android Gradle Plugin sẽ tự báo lỗi nếu XML hỏng cú pháp hoặc còn key bị `R.string.*` tham chiếu mà đã lỡ xoá (compile error "unresolved reference: string.xxx" hoặc AAPT resource-linking error).

- [ ] **Step 8: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile/app/src/main/res/values*/strings.xml
git commit -m "chore(mobile): lọc strings.xml theo 15 feature giữ lại, thêm values-vi"
```

---

## Phase 6 — Nối lại API thật giữa feature giữ lại và backend đã port

Rà 14 file `data/api/*.kt` của 15 feature giữ lại phát hiện: hầu hết ĐÃ gọi đúng endpoint thật
(`LoginApi`→`auth/login`, `RegisterApi`→`auth/register`, `ProfileApi.updateSettings`→`/api/v1/settings/update`,
`ProfileSubscriptionApi`→`/api/v1/subscription/status`, `SubscriptionApi`/`OfferPaywallApi`→`/api/v1/subscription/verify`
— không cần sửa). 7 file còn lại (`Onboarding1Api`, `OnboardingFinalApi`, `OnboardingApi`, `PermissionApi`,
`PremiumSuccessApi`, `PaywallTriggerApi`, `WelcomeApi`) tự đánh dấu `// TODO: replace with real endpoint` —
đây là quy ước có chủ đích của chính codebase này (`AI_RULES.md` mục 13: luôn scaffold đủ lớp API dù chưa nối,
đánh dấu TODO cho bước sau), KHÔNG phải lỗi cần sửa ở plan restructuring này — nội dung tĩnh (bước onboarding,
lời chào welcome, thông điệp xin quyền...) do từng sản phẩm tự viết.

Duy nhất **`SplashApi`** là vấn đề thật: gọi `POST /api/v1/auth/guest` — route KHÔNG tồn tại trong
`AuthModule` của base (`apps/backend/src/modules/auth/auth.controller.ts` chỉ có `register`/`login`/`refresh`/
`logout`/OTP..., không có `guest`) dù route này CÓ tồn tại ở `apps/backend_pp03_refer` (module core, không
dính nghiệp vụ đá — đáng lẽ phải nằm trong danh sách port ở Phase 3 nhưng bị bỏ sót). Thiếu route này, màn
`Splash` — điểm vào đầu tiên của app — sẽ 401/404 ngay khi mở app, chặn toàn bộ luồng ở Task 26.

### Task 24: Thêm `POST /auth/guest` vào `AuthModule` của base (port từ refer, module core bị bỏ sót ở Phase 3)

**Files:**
- Modify: `apps/backend/src/modules/auth/dto/auth.dto.ts`
- Modify: `apps/backend/src/modules/auth/auth.service.ts`
- Modify: `apps/backend/src/modules/auth/auth.controller.ts`

**Interfaces:**
- Consumes: `AuthService.generateTokens(payload: JwtPayloadDto)` (private helper đã có sẵn, dùng lại y hệt
  `login()`), `UserStatusEnum` (`common/constants`), `AuthResponseDto` (đã có, dùng lại y hệt `login()`/`register()`).
- Produces: `AuthService.guestLogin(deviceId: string): Promise<AuthResponseDto>` — route `POST /auth/guest`,
  scope `app, user`, public (không cần token sẵn có).

- [ ] **Step 1: Thêm `GuestLoginDto` vào `dto/auth.dto.ts`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/backend/src/modules/auth
grep -n "^export class LoginDto" dto/auth.dto.ts
```

Dùng Edit tool, thêm ngay TRƯỚC `export class LoginDto` (hoặc bất kỳ vị trí nào cùng file, miễn cùng export):

```typescript
/**
 * GuestLoginDto — POST /auth/guest
 * Tạo/dùng lại tài khoản khách gắn với deviceId, cho phép trải nghiệm app trước khi
 * đăng ký thật.
 */
export class GuestLoginDto {
  @ApiProperty({ example: 'device-uuid-abc123' })
  @IsString()
  deviceId: string;
}

export class LoginDto {
```
(giữ nguyên toàn bộ nội dung `LoginDto` gốc phía sau, chỉ chèn khối `GuestLoginDto` phía trước)

- [ ] **Step 2: Thêm `guestLogin()` vào `auth.service.ts` — tái dùng `generateTokens()` sẵn có (giống hệt `login()`)**

```bash
grep -n "private async generateTokens" auth.service.ts
```
Expected: 1 dòng — xác nhận helper đã tồn tại.

Dùng Edit tool, thêm method mới vào class `AuthService`, ngay TRƯỚC `private async generateTokens(...)`:

```typescript
  /**
   * Guest login — POST /auth/guest
   * Tạo hoặc dùng lại tài khoản khách gắn với deviceId (KHÔNG cần email/password).
   */
  async guestLogin(deviceId: string): Promise<AuthResponseDto> {
    const guestEmail = `guest_${deviceId}@guest.internal`;

    let user = await this.prisma.user.findUnique({ where: { email: guestEmail } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          status: 'ACTIVE',
          emailVerified: false,
        },
      });
      this.logger.log(`Guest account created: ${user.id} (device: ${deviceId})`);
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

```

- [ ] **Step 2b (BUG FIX — kẽ hở chiếm đoạt account: bất kỳ ai gọi `POST /auth/register` với
  `email: "guest_<deviceId nạn nhân>@guest.internal"` sẽ CHIẾM TRƯỚC địa chỉ email khách — lần sau
  đúng thiết bị đó gọi `POST /auth/guest`, `findUnique` khớp trúng account của kẻ tấn công và trả
  token của account đó, không hề kiểm tra mật khẩu)**

`register()` LUÔN hash + lưu `password` (bắt buộc trong `RegisterDto`); tài khoản do `guestLogin()` tự
tạo KHÔNG BAO GIỜ set `password` (giữ `null`, field `password String?` optional trong schema). Đây là
điểm phân biệt sẵn có, không cần thêm field/migration mới — chỉ cần kiểm tra trước khi tái dùng account
tìm được.

```bash
grep -n "let user = await this.prisma.user.findUnique" auth.service.ts
```
Expected: 1 dòng, ngay đầu `guestLogin()`.

Dùng Edit tool, tìm đoạn (ngay sau dòng `findUnique` vừa tìm):

```typescript
    let user = await this.prisma.user.findUnique({ where: { email: guestEmail } });

    if (!user) {
```

Thay bằng:

```typescript
    let user = await this.prisma.user.findUnique({ where: { email: guestEmail } });

    if (user && user.password) {
      // Email khách bị "chiếm" bởi một lượt đăng ký thật (user thật LUÔN có password) —
      // không tái dùng account đó, tránh trả token cho đúng thiết bị nhưng SAI account.
      throw new UnauthorizedException('Guest session unavailable for this device');
    }

    if (!user) {
```

`UnauthorizedException` đã có sẵn trong import của `auth.service.ts` (dùng ở `login()`), không cần
thêm import.

```bash
grep -n "Guest session unavailable" auth.service.ts
```
Expected: 1 dòng khớp.

- [ ] **Step 3: Thêm route `POST /auth/guest` vào `auth.controller.ts` — theo đúng pattern `register()` (cùng file)**

```bash
grep -n "@Post('register')" -B 2 auth.controller.ts
```
Expected:
```typescript
  @Public()
  @ApiScope('app', 'user')
  @Post('register')
```

Dùng Edit tool: thêm `GuestLoginDto` vào import từ `./dto` (cùng khối với `LoginDto, RegisterDto, ...`), thêm method mới ngay TRƯỚC method `register(...)`:

```typescript
  @Public()
  @ApiScope('app', 'user')
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guest login by deviceId' })
  async guestLogin(
    @Body() dto: GuestLoginDto,
  ): Promise<BaseResponseDto<AuthResponseDto>> {
    this.logger.log(`Guest login for device: ${dto.deviceId}`);
    const result = await this.authService.guestLogin(dto.deviceId);
    return BaseResponseDto.success('Guest session created', result);
  }

```

- [ ] **Step 4: Build + verify route xuất hiện đúng scope 'app' + sinh lại swagger spec/type**

```bash
cd /Volumes/Data/Product/pp09baseproduct
pnpm --filter @pp09base/backend build
pnpm --filter @pp09base/backend docs:export
grep -o '"/api/v1/auth/guest"' packages/api-contract/specs/swagger-app.json
pnpm codegen
```
Expected: build thoát mã 0; `grep` in ra kết quả khớp.

`docs:export` VÀ `codegen` ghi đè các file trong `packages/api-contract/` — 2 thư mục này ĐÃ được commit
từ Task 15 (đăng ký module vào AppModule), nên route mới ở Task này sẽ khiến chúng thay đổi. PHẢI commit
cùng lúc với code, nếu không `packages/api-contract/specs/*.json`/`src/generated/*.ts` đã commit sẽ lệch
(thiếu route `/auth/guest`) so với backend thật — xem Step 5.

- [ ] **Step 5: Commit (kèm spec/type vừa sinh lại — KHÔNG chỉ code auth)**

```bash
git status --short packages/api-contract
```
Expected: có thay đổi ở `packages/api-contract/specs/swagger-app.json`, `swagger-user.json` (route
`/auth/guest` gắn scope `app, user`), và tương ứng trong `src/generated/`.

```bash
git add apps/backend/src/modules/auth packages/api-contract
git commit -m "feat(backend): thêm POST /auth/guest (port từ refer, bỏ sót ở Phase 3) — Splash mobile cần route này"
```

---

### Task 25: Sửa DTO của `splash` — khớp field đã đổi tên ở Task 8 + khớp response shape `POST /auth/guest`

**Files:**
- Modify: `apps/mobile/app/src/main/java/com/izisoft/pp09base/features/splash/data/model/SplashStatusDto.kt`
- Modify: `apps/mobile/app/src/main/java/com/izisoft/pp09base/features/splash/data/model/SplashStatus.kt`
- Modify: `apps/mobile/app/src/main/java/com/izisoft/pp09base/features/splash/data/model/SplashMapper.kt`

**Interfaces:**
- Consumes: `POST /auth/guest` (Task 24, trả `AuthResponseDto{accessToken,refreshToken,user:{id,...}}`), `POST /app/init` (Task 8, trả `actionRemaining`/`maxFreeAction` thay vì `scanRemaining`/`maxFreeScan`).
- Produces: `GuestSession(userId, accessToken)`, `AppInitConfig(isFirstInstall, isPremium, actionRemaining, showPaywall, remoteConfig)` — `SplashRepository.kt` (không đổi) tiếp tục dùng 2 domain model này y hệt tên cũ, chỉ đổi NGUỒN field ánh xạ vào.

Task này chạy SAU Task 17 (package đã đổi `com.rock.ai.rock.identifier` → `com.izisoft.pp09base`) nên mọi
đường dẫn file/package dưới đây dùng tên MỚI.

- [ ] **Step 1: Đọc DTO hiện tại**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/java/com/izisoft/pp09base/features/splash/data/model
cat SplashStatusDto.kt
```
Expected: có `GuestSessionDto(userId, accessToken)` phẳng, và `AppInitDataDto.scanRemaining`/`RemoteConfigDto.maxFreeScan`.

- [ ] **Step 2: Sửa `GuestSessionDto` khớp response lồng `data.user.id` của `AuthResponseDto` (Task 24) + đổi 2 field theo Task 8**

Dùng Edit tool sửa 3 chỗ trong `SplashStatusDto.kt`:

Tìm:
```kotlin
data class GuestSessionDto(
    @SerializedName("userId")
    val userId: String,
    @SerializedName("accessToken")
    val accessToken: String
)
```
Thay bằng:
```kotlin
data class GuestSessionDto(
    @SerializedName("user")
    val user: GuestUserDto,
    @SerializedName("accessToken")
    val accessToken: String
)

data class GuestUserDto(
    @SerializedName("id")
    val id: String
)
```

Tìm:
```kotlin
data class AppInitDataDto(
    @SerializedName("isFirstInstall")
    val isFirstInstall: Boolean,
    @SerializedName("isPremium")
    val isPremium: Boolean,
    @SerializedName("scanRemaining")
    val scanRemaining: Int,
    @SerializedName("showPaywall")
    val showPaywall: Boolean,
    @SerializedName("remoteConfig")
    val remoteConfig: RemoteConfigDto
)

data class RemoteConfigDto(
    @SerializedName("maxFreeScan")
    val maxFreeScan: Int,
    @SerializedName("adsEnabled")
    val adsEnabled: Boolean
)
```
Thay bằng:
```kotlin
data class AppInitDataDto(
    @SerializedName("isFirstInstall")
    val isFirstInstall: Boolean,
    @SerializedName("isPremium")
    val isPremium: Boolean,
    @SerializedName("actionRemaining")
    val actionRemaining: Int,
    @SerializedName("showPaywall")
    val showPaywall: Boolean,
    @SerializedName("remoteConfig")
    val remoteConfig: RemoteConfigDto
)

data class RemoteConfigDto(
    @SerializedName("maxFreeAction")
    val maxFreeAction: Int,
    @SerializedName("adsEnabled")
    val adsEnabled: Boolean
)
```

- [ ] **Step 3: Sửa domain model `SplashStatus.kt` (đổi tên field theo DTO mới)**

```bash
cat SplashStatus.kt
```

Dùng Edit tool sửa:
```kotlin
data class RemoteConfig(
    val maxFreeScan: Int,
    val adsEnabled: Boolean
)

data class AppInitConfig(
    val isFirstInstall: Boolean,
    val isPremium: Boolean,
    val scanRemaining: Int,
    val showPaywall: Boolean,
    val remoteConfig: RemoteConfig
)
```
Thành:
```kotlin
data class RemoteConfig(
    val maxFreeAction: Int,
    val adsEnabled: Boolean
)

data class AppInitConfig(
    val isFirstInstall: Boolean,
    val isPremium: Boolean,
    val actionRemaining: Int,
    val showPaywall: Boolean,
    val remoteConfig: RemoteConfig
)
```

- [ ] **Step 4: Sửa `SplashMapper.kt` — cập nhật 2 hàm `toDomain()` khớp field mới**

```bash
cat SplashMapper.kt
```

Dùng Edit tool sửa:
```kotlin
fun GuestLoginResponseDto.toDomain(): GuestSession {
    return GuestSession(
        userId = data.userId,
        accessToken = data.accessToken
    )
}

fun AppInitResponseDto.toDomain(): AppInitConfig {
    return AppInitConfig(
        isFirstInstall = data.isFirstInstall,
        isPremium = data.isPremium,
        scanRemaining = data.scanRemaining,
        showPaywall = data.showPaywall,
        remoteConfig = RemoteConfig(
            maxFreeScan = data.remoteConfig.maxFreeScan,
            adsEnabled = data.remoteConfig.adsEnabled
        )
    )
}
```
Thành:
```kotlin
fun GuestLoginResponseDto.toDomain(): GuestSession {
    return GuestSession(
        userId = data.user.id,
        accessToken = data.accessToken
    )
}

fun AppInitResponseDto.toDomain(): AppInitConfig {
    return AppInitConfig(
        isFirstInstall = data.isFirstInstall,
        isPremium = data.isPremium,
        actionRemaining = data.actionRemaining,
        showPaywall = data.showPaywall,
        remoteConfig = RemoteConfig(
            maxFreeAction = data.remoteConfig.maxFreeAction,
            adsEnabled = data.remoteConfig.adsEnabled
        )
    )
}
```

`SplashRepository.kt` KHÔNG cần sửa: nó chỉ truyền nguyên `appInitConfig` vào `SplashLaunchResult.initConfig`
mà không tự destructure `scanRemaining`/`maxFreeScan`, nên đổi tên field ở Step 3–4 không ảnh hưởng file này
— xác nhận lại bằng grep ở Step 5.

- [ ] **Step 5: Verify không còn tham chiếu field cũ + build kiểm chứng**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -rn "scanRemaining\|maxFreeScan\|data\.userId\b" app/src/main/java/com/izisoft/pp09base/features/splash/ || echo "clean"
./gradlew :app:assembleDebug
```
Expected: `clean`; `BUILD SUCCESSFUL`.

- [ ] **Step 6: Commit**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile/app/src/main/java/com/izisoft/pp09base/features/splash
git commit -m "fix(mobile): splash DTO khớp field actionRemaining/maxFreeAction (Task 8) + response guest login lồng user.id (Task 24)"
```

---

### Task 26: Build sạch từ đầu + cài lên thiết bị/emulator + kiểm tra luồng chính bằng tay

**Files:** Task xác nhận cuối cùng của toàn bộ Phase 4–5 — về nguyên tắc không tạo/sửa file, NHƯNG có 2
bug thật thường lộ ra ở đây (Step 2b, Step 5b) cần sửa trước khi coi task hoàn tất.

**Interfaces:** Không có.

- [ ] **Step 1: Clean build toàn bộ 2 module**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
./gradlew clean
./gradlew :core:assembleDebug :app:assembleDebug
```
Expected: `BUILD SUCCESSFUL`, APK sinh ra ở `app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 2: Chạy `lint` để bắt cảnh báo còn sót (import không dùng, resource thiếu...)**

```bash
./gradlew :app:lintDebug :core:lintDebug
```
Expected: thoát mã 0 cho cả 2. Cảnh báo (không phải lỗi) về unused resource là chấp nhận được ở base
template; lỗi (`ERROR` severity) PHẢI sửa trước khi coi Phase 5 hoàn tất. `:core:lintDebug` thường FAIL
lần đầu với 8 lỗi `MissingPermission` — xem Step 2b.

- [ ] **Step 2b (BUG FIX — `:core:lintDebug` báo 8 lỗi `MissingPermission` ở `firebase/AppAnalytics.kt`,
  `firebase/AppFirebaseMessagingService.kt`, `ads/BannerAdView.kt`, `ads/RewardedAdManager.kt`,
  `network/NetworkMonitor.kt` — KHÔNG phải bug thật, mà vì `:core` là Android library module không có
  `AndroidManifest.xml` riêng khai báo permission, nên lint chạy cô lập trên `:core` không thấy được
  permission mà `:app` khai báo. `:app:lintDebug` (thấy manifest đã merge) báo 0 lỗi — xác nhận app chạy
  đúng, chỉ là lint module cô lập báo sai. Sửa đúng cách: cho `:core` tự khai báo permission nó cần, thay
  vì chỉ dựa vào `:app` khai hộ — đúng thông lệ Android library, không phải suppress lint cho qua chuyện)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
ls core/src/main/AndroidManifest.xml 2>/dev/null || echo "chưa có — AGP tự sinh manifest rỗng"
```

Tạo `core/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permission mà code trong :core thật sự dùng (Firebase Analytics/Messaging, AdMob,
         NetworkMonitor) — khai báo ở đây để lint hiểu đúng contract của module, và để module
         này tự đủ nếu sau này được dùng lại ở app khác (không dựa hoàn toàn vào app tiêu thụ
         khai hộ). android.permission.WAKE_LOCK không cần khai ở đây — đến từ merge manifest
         của thư viện Firebase Messaging, không phải code của :core gọi trực tiếp. CAMERA và
         com.android.vending.BILLING vẫn chỉ khai ở app/ (không có API nào trong :core bị lint
         gắn cờ thiếu 2 permission này). -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

</manifest>
```

```bash
./gradlew :core:lintDebug
```
Expected: thoát mã 0, 0 lỗi `MissingPermission` (cảnh báo khác không tính).

```bash
./gradlew :app:assembleDebug
```
Expected: `BUILD SUCCESSFUL` — thêm permission khai trùng vào `:core` không đổi manifest merge cuối cùng
của `:app` (AGP tự khử trùng lặp), APK không đổi hành vi.

- [ ] **Step 3: Cài lên emulator/thiết bị đã kết nối (yêu cầu `adb devices` thấy ít nhất 1 thiết bị)**

```bash
adb devices
./gradlew :app:installDebug
```
Expected: `BUILD SUCCESSFUL`, package `com.izisoft.pp09base` xuất hiện trong `adb shell pm list packages | grep pp09base`.

- [ ] **Step 4: Kiểm tra tay luồng chính (không tự động hoá được — Compose UI)**

Mở app trên thiết bị, xác nhận đúng theo thứ tự:

1. `SplashScreen` hiện ra, không crash.
2. Điều hướng tới `WelcomeScreen` hoặc `OnboardingScreen` (tuỳ trạng thái first-install).
3. Đăng nhập/đăng ký (`LoginScreen`/`RegisterScreen`) — gọi API `POST /auth/login` (backend phải đang chạy, xem Phase 3).
4. Sau đăng nhập thành công → tới `MainScreen` placeholder (Task 21), có nút "Xem hồ sơ" điều hướng sang `ProfileScreen`.
5. Từ `ProfileScreen`, vào `ProfileSubscriptionScreen` → `SubscriptionPaywallScreen`/`OfferPaywallScreen` hiện đúng danh sách gói (gọi `GET /subscription/status`, Task 13).
6. Tắt wifi/data trên thiết bị → `OfflineStateScreen` tự hiện (Task 21 Step 7, `LaunchedEffect(isOnline, ...)`); bật lại mạng → tự quay về màn trước đó.

Ghi lại bằng tay bước nào fail (nếu có) — đây là bước duy nhất trong toàn bộ plan không kiểm chứng được qua lệnh, cần người review xác nhận trực tiếp trên thiết bị.

- [ ] **Step 5: Xác nhận không còn tham chiếu nghiệp vụ đá quý nào sót lại trong toàn bộ `apps/mobile`**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -rniE "rock.?ai|gemstone|rarity|stone_" app/src core/src --include="*.kt" || echo "clean"
grep -rl "com.rock.ai.rock.identifier" . --include="*.kt" --include="*.xml" --include="*.kts" --include="*.pro" 2>/dev/null || echo "clean"
```
Expected: cả 2 lệnh in `clean`. Lệnh đầu KHÔNG clean ở lần chạy đầu tiên — xem Step 5b.

- [ ] **Step 5b (BUG FIX — 16 chỗ text hiển thị/contentDescription còn nhắc "Rock AI"/gemstone trong 8 feature
  giữ lại; đây là những màn hình CHÍNH người dùng thấy đầu tiên — splash, paywall, premium success,
  offline — không phải nghiệp vụ TODO-stub như onboarding/welcome/permission nên KHÔNG bỏ qua được)**

Dùng Edit tool sửa từng file, đổi ĐÚNG chuỗi hiển thị (giữ nguyên tên biến/param, chỉ đổi giá trị mặc định):

`features/splash/ui/component/SplashLogoSection.kt`:
```kotlin
contentDescription = "Rock AI Logo"     →  contentDescription = "App Logo"
text = "ROCK AI"                        →  text = "PP09 BASE"
```

`features/onboarding_final/ui/component/OnboardingFinalHeroSection.kt`:
```kotlin
contentDescription = "Diverse Gemstones Display"  →  contentDescription = "Onboarding Hero Image"
```

`features/profile_subscription/ui/screen/ProfileSubscriptionScreen.kt`:
```kotlin
val brandName: String = "Rock AI"       →  val brandName: String = "PP09 Base"
```

`features/paywall_trigger/ui/component/PaywallTriggerHeroSection.kt`:
```kotlin
contentDescription = "Rock AI Premium"  →  contentDescription = "Premium Hero Image"
```

`features/premium_success/ui/screen/PremiumSuccessScreen.kt`:
```kotlin
val brandLabel: String = "Rock AI Premium"  →  val brandLabel: String = "Premium"
val heroDescription: String = "Your transaction was successful. Explore the full power of Rock AI."
  →  val heroDescription: String = "Your transaction was successful. Enjoy the full premium experience."
```

`features/subscription_paywall/ui/component/PaywallBackground.kt`:
```kotlin
contentDescription = "Premium gemstone background"  →  contentDescription = "Premium Background"
```

`features/subscription_paywall/ui/screen/SubscriptionPaywallScreen.kt`:
```kotlin
val title: String = "Unlock Rock AI"    →  val title: String = "Unlock Premium"
```
(dòng dùng `R.string.rock_ai_premium` không đổi ở đây — sửa GIÁ TRỊ resource ở bước dưới)

`features/offline_state/ui/screen/OfflineStateScreen.kt`:
```kotlin
val description: String = "Rock AI needs a server connection to analyze your images and provide valuation data."
  →  val description: String = "This app needs a server connection to sync your data."
val watermarkText: String = "ROCK AI"   →  val watermarkText: String = "PP09 BASE"
```

`features/onboarding1/ui/component/Onboarding1HeroImage.kt`:
```kotlin
contentDescription = "Mineral Rarity Analysis"     →  contentDescription = "Onboarding Hero Image"
// HUD Overlay: top row with Rarity + Market Est badges  →  // HUD Overlay: top row with stat badges
// Rarity badge                                     →  // Stat badge
text = "RARITY: ULTRA"                              →  text = "FEATURED"
```

Sửa GIÁ TRỊ 2 string resource (KHÔNG đổi key, tránh phải sửa lại chỗ tham chiếu) — áp dụng cho cả 6 file
locale (`values`, `values-es`, `values-ja`, `values-ko`, `values-pt-rBR`, `values-vi`):

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/res
for f in values*/strings.xml; do
  sed -i '' \
    -e 's|<string name="rock_ai_premium">.*</string>|<string name="rock_ai_premium">Premium</string>|' \
    -e 's|<string name="start_scanning_now">.*</string>|<string name="start_scanning_now">Get Started</string>|' \
    "$f"
done
grep -rn "rock_ai_premium\|start_scanning_now" values*/strings.xml
```
Expected: 12 dòng (2 string × 6 locale), tất cả giá trị đã đổi, không còn `TODO: dịch` trên 2 dòng này (vì
tiếng Anh gốc đã đổi, các locale đang copy y hệt tiếng Anh — chấp nhận được, đây vốn là string tiếng Anh
chưa dịch có sẵn từ trước, không phải lỗi Task này gây ra).

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
grep -rniE "rock.?ai|gemstone|rarity|stone_" app/src core/src --include="*.kt" || echo "clean"
```
Expected: `clean`.

```bash
./gradlew :app:assembleDebug
```
Expected: `BUILD SUCCESSFUL` (đổi string literal/resource value, không đổi logic — không có lý do build lỗi).

- [ ] **Step 5c (BUG FIX — Step 5b chỉ sửa GIÁ TRỊ MẶC ĐỊNH của tham số Kotlin (`val title: String = "..."`),
  nhưng `AppNavigation.kt` LUÔN truyền `title = stringResource(id = R.string.paywall_title)` (và tương tự
  cho 3 màn khác) ghi đè giá trị mặc định đó — nghĩa là Step 5b không đổi được text THẬT SỰ hiển thị trên
  máy. Phải sửa đúng GIÁ TRỊ RESOURCE trong `strings.xml`, không phải default param trong Kotlin)**

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/res
grep -c '<string name="paywall_title">\|<string name="offline_description">\|<string name="premium_success_brand_label">\|<string name="premium_success_hero_description">\|<string name="profile_version_text">\|<string name="app_name">\|<string name="onboarding1_title">\|<string name="onboarding1_description">' values*/strings.xml
```
Expected: mỗi file 8 dòng (cả 6 file đều có đủ 8 key — `values-vi/strings.xml` được Task 23 tạo bằng cách
copy `values/strings.xml` đã lọc, nên cũng có sẵn `app_name`).

Viết script Python thay GIÁ TRỊ 8 key trên bằng text trung tính GIỐNG NHAU ở cả 6 locale (các key này vốn
đã có sẵn text tiếng Anh y hệt ở nhiều locale — xem `onboarding1_title`/`onboarding1_description` — không
phải bản dịch thật, nên chuẩn hoá về 1 giá trị tiếng Anh trung tính; `app_name`/`profile_version_text` đã
đúng sẵn ở `values/` + `values-vi/` từ Task 17, ghi đè lại giá trị GIỐNG HỆT cũng không sao):

```bash
cat > /tmp/fix_brand_strings.py <<'EOF'
import re, sys

REPLACEMENTS = {
    "app_name": "PP09 Base",
    "profile_version_text": "App Version 1.0.0",
    "paywall_title": "Unlock Premium",
    "offline_description": "This app needs a server connection to sync your data.",
    "premium_success_brand_label": "Premium",
    "premium_success_hero_description": "Your transaction was successful. Enjoy the full premium experience.",
    "onboarding1_title": "Discover Key Insights",
    "onboarding1_description": "Get real-time insights and detailed analysis for your content.",
}

path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    content = f.read()

for key, new_value in REPLACEMENTS.items():
    pattern = re.compile(
        r'([ \t]*)<string name="' + re.escape(key) + r'">.*?</string>',
        re.DOTALL,
    )
    content, _ = pattern.subn(
        lambda m, v=new_value, k=key: f'{m.group(1)}<string name="{k}">{v}</string>',
        content,
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
EOF
for f in values/strings.xml values-es/strings.xml values-ja/strings.xml values-ko/strings.xml values-pt-rBR/strings.xml values-vi/strings.xml; do
  python3 /tmp/fix_brand_strings.py "$f"
done
rm -f /tmp/fix_brand_strings.py
```

Sửa 2 email đặt chỗ (chỉ thay đúng chuỗi email, giữ nguyên câu văn đã dịch xung quanh — an toàn vì email
không phụ thuộc ngữ pháp từng ngôn ngữ):

```bash
for f in values*/strings.xml; do
  sed -i '' \
    -e 's/support@rockai\.app/support@pp09base.example.com/g' \
    -e 's/privacy@rockai\.app/privacy@pp09base.example.com/g' \
    "$f"
done
```

Verify toàn diện — quét CẢ `res/` (không chỉ `.kt`) lần này:

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile/app/src/main/res
grep -rniE "rock.?ai|gemstone|rarity|stone_|rockai\.app" values*/strings.xml || echo "clean"
```
Expected: `clean`.

```bash
cd /Volumes/Data/Product/pp09baseproduct/apps/mobile
python3 -c "
import xml.etree.ElementTree as ET
import glob
for f in glob.glob('app/src/main/res/values*/strings.xml'):
    ET.parse(f)
    print(f, 'OK')
"
./gradlew :app:assembleDebug
```
Expected: cả 6 file parse XML thành công, `BUILD SUCCESSFUL`.

- [ ] **Step 6: Commit riêng cho Step 5b/5c (Step 1-5 chỉ verify, không tạo thay đổi để commit)**

```bash
cd /Volumes/Data/Product/pp09baseproduct
git add apps/mobile
git commit -m "chore(mobile): dọn nốt text hiển thị nhắc thương hiệu Rock AI/gemstone ở 8 feature giữ lại"
```

- [ ] **Step 7: Không commit gì thêm ở phần verify (Step 1-5) — nếu Step 4 phát hiện lỗi, quay lại Task tương ứng sửa rồi lặp lại Task 26 từ Step 1**

---

## Ghi chú ngoài phạm vi tự động hoá của plan này

- **Icon launcher** (`res/mipmap-*`): vẫn là icon gốc của app Rock Identifier (ảnh bitmap, không phải code) — plan này KHÔNG tự sinh icon thay thế (cần công cụ thiết kế, không hợp lý làm qua script shell). Trước khi dùng base cho sản phẩm thật, thay `ic_launcher.png`/`ic_launcher_round.png`/`ic_launcher_foreground.xml` ở 6 thư mục `mipmap-*` bằng icon riêng (Android Studio → New → Image Asset).
- **Rotate Google Play service account key**: key thật của Rock Identifier đã nằm trong thư mục làm việc trước khi Task 2/16 xoá — nếu app Rock Identifier còn phát hành, nên rotate key trên Google Cloud Console (hành động ngoài repo, không phải việc của code).
- **Google Play product ID thật**: `PlanType` enum đã có `MONTHLY`/`LIFETIME` (Task 7) nhưng `mapProductIdToPlan` (Task 13) vẫn suy luận qua `includes('week'|'month'|'year')` trong `productId` — mỗi sản phẩm clone base cần tự đặt tên product ID trên Play Console khớp quy ước này, hoặc sửa lại hàm map nếu đặt tên khác.


