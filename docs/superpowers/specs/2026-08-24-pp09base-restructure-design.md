# Design: Chuẩn hoá pp09baseproduct — mobile chuyển sang Android Kotlin

**Ngày:** 2026-08-24
**Trạng thái:** Đã chốt design, chờ viết implementation plan

---

## 1. Mục tiêu

`pp09baseproduct` là **base template dùng lại** cho các dự án izisoft: khung sạch không nghiệp vụ,
mỗi sản phẩm mới clone ra rồi đổi tên. Ba việc cần làm:

1. **Chuẩn hoá monorepo** — đổi tên `pp00base` → `pp09base`, sửa mọi tài liệu/script còn ghi
   mobile là Flutter (thực tế đã là Android Kotlin).
2. **Gỡ nghiệp vụ khỏi app Android** — `apps/mobile` là bản copy nguyên của app thương mại
   *Rock Identifier*. Giữ core (IAP, IAA, analytics, network, theme, paywall, rating) + 15 feature
   lõi; bỏ 15 feature nghiệp vụ đá quý.
3. **Ghép phần IAP/IAA vào backend** — lấy 9 module dùng lại được từ `apps/backend_pp03_refer`
   (backend của app Rock Identifier), đặc biệt là module verify Google Play subscription.

### Không nằm trong scope

- Không code feature nghiệp vụ mới.
- Không refactor `apps/web-admin` (ngoài việc đổi tên scope package).
- Không hỗ trợ IAP iOS (chỉ chuẩn bị enum `Platform.IOS`, chưa implement verify).
- Không đổi schema `User` của base theo refer (xem mục 5.2).

---

## 2. Hiện trạng

### 2.1 Monorepo

| Vấn đề | Chi tiết |
|---|---|
| Tên cũ | `pp00base` xuất hiện ở 18 file: `package.json`, scope `@pp00base/*`, `ecosystem.config.js`, README, AI_RULES |
| Workspace sai | `pnpm-workspace.yaml` khai báo `apps/web-user` — thư mục không tồn tại |
| Tài liệu sai | README + AI_RULES_ROOT ghi mobile = Flutter/Riverpod/`swagger_parser`; `pnpm mobile` = `flutter run` |
| Backend thiếu | Chỉ có 7 module lõi (auth, users, admin, notification, system-setting, upload, health) — chưa có subscription/IAP/remote-config |

### 2.2 `apps/mobile` — Android Kotlin (copy từ `pp03baseandroid_app`)

- 420 file `.kt`, ~28.000 LOC. Single-module Gradle `:app`.
- Package `com.rock.ai.rock.identifier`, `versionCode 135 / versionName 1.3.5`.
- `AppNavigation.kt` 1.696 dòng nối toàn bộ 31 thư mục feature — chỗ gỡ nghiệp vụ khó nhất.
- Core chỉ ~2.100 LOC; feature ~24.000 LOC (giữ 10.377 / bỏ 13.547).
- Rác đi kèm ≈ 511MB: `app/build/` (471MB), `.gradle/` (40MB), `.idea/`, `.kotlin/`, `.vscode/`,
  `output.log`, `docs-json.json`, `local.properties`, `app/.DS_Store`, `.github/` (CI trỏ GitLab
  repo cũ), `README.md` (template GitLab mặc định).
- `features/ratting/` là thư mục rỗng (gõ nhầm của `rating/`).

### 2.3 `apps/backend_pp03_refer` — backend của app Rock Identifier

- NestJS riêng, DB `pp02basedb`, 22 module.
- **Thiếu** cơ chế multi-scope của base: `@ApiScope` decorator, `scope-filter.ts`, `export-specs.ts`.
- **Thiếu** `notification`, `system-setting`, `admin`.
- → Là **nguồn để lấy code**, không phải để thay `apps/backend`.

---

## 3. Rủi ro bảo mật (ưu tiên cao nhất)

`apps/` chưa từng được commit (`git status: ?? apps/`) nên dọn trước commit đầu tiên là sạch tuyệt
đối, không cần rewrite history. Bắt buộc xử lý trước khi commit:

| File | Nội dung | Xử lý |
|---|---|---|
| `apps/mobile/app/rock-identifier-keystore.jks` | Keystore ký release thật của app Rock Identifier | Xoá |
| `apps/mobile/key.properties` | Mật khẩu plaintext (`storePassword=rockidentifier`) | Xoá, thay `key.properties.example` |
| `apps/mobile/app/google-services.json` | Firebase project thật | Xoá, thay `google-services.json.example` |
| `apps/backend_pp03_refer/pc-api-6069487326580261483-172-b4c556e09e40.json` | **Private key service account Google Play** | Xoá |
| `apps/backend_pp03_refer/.env` | Env production thật | Xoá |
| `apps/backend_pp03_refer/.env.example` | Mật khẩu DB production: `postgresql://appuser:Phuong@123@160.250.130.70:5432/pp02basedb` | Xoá |

`.gitignore` của mobile đã chặn `*.jks` / `key.properties`, nhưng file đang nằm sẵn trong cây thư
mục nên vẫn cần xoá tay.

**Hành động kèm theo (ngoài repo):** keystore + service account key đã lộ trong thư mục làm việc
nên nếu app Rock Identifier còn đang phát hành, cần rotate service account key trên Google Cloud
Console. Ghi lại đây để không bị bỏ sót; không phải việc của code.

---

## 4. Kiến trúc đích

```
pp09baseproduct/
├── apps/
│   ├── backend      NestJS + Prisma + PostgreSQL   (pnpm workspace, port 22090)
│   ├── web-admin    Next.js 15 + shadcn/ui         (pnpm workspace, port 32090)
│   └── mobile       Android Kotlin + Compose       (Gradle — NGOÀI pnpm workspace)
│       ├── core/    → Gradle module :core
│       └── app/     → Gradle module :app
├── packages/
│   ├── api-contract  3 swagger spec + types generate từ backend
│   └── shared-ts     Type dùng chung cho TS client
├── scripts/
└── ai_prompts/
```

`apps/backend_pp03_refer` **bị xoá** sau khi port xong.

### 4.1 Đổi tên

| Chỗ | Từ | Thành |
|---|---|---|
| Scope package | `@pp00base/*` | `@pp09base/*` |
| PM2 process | `pp00base-backend`, `pp00base-web-admin` | `pp09base-backend`, `pp09base-web-admin` |
| Cổng nội bộ | 22000 / 32000 | **22090 / 32090** |
| Android namespace + applicationId | `com.rock.ai.rock.identifier` | `com.izisoft.pp09base` |
| Gradle rootProject | `pp03baseandroid_app` | `pp09base_android` |
| Android version | `135` / `1.3.5` | `1` / `1.0.0` |

### 4.2 Sửa tài liệu / script

- `pnpm-workspace.yaml`: bỏ `apps/web-user`; ghi chú `apps/mobile` là Gradle/Android.
- `package.json`: script `mobile` từ `cd apps/mobile && flutter run` → `cd apps/mobile && ./gradlew :app:installDebug`.
- `ecosystem.config.js`: comment "apps/mobile là Flutter" → "là Android Gradle, build ra APK/AAB".
- `AI_RULES_ROOT.md` mục 1 & 4: Flutter/Riverpod/`swagger_parser` → Android Kotlin/Compose/Retrofit;
  mục 5 bỏ `String.fromEnvironment`, thay bằng `BuildConfig` + `gradle.properties`.
- `README.md`: viết lại mục cấu trúc + mục "Bắt đầu dự án mới" (bỏ `flutterfire configure`, `pubspec.yaml`).
- `apps/mobile/AI_RULES.md`: bổ sung ranh giới `:core` vs `:app` (mục 9 hiện chỉ nói "core/" chung).

---

## 5. Backend: port 9 module từ refer

### 5.1 Module lấy / không lấy

**Lấy (9 module, ~3.500 LOC):**

| Module | LOC | Lý do |
|---|---|---|
| `subscription-api` | 1.194 | Trọng tâm IAP. Verify purchase token qua Google Play Developer API v3, acknowledge, restore, webhook Pub/Sub (13 notification type), sync thủ công. Không dính nghiệp vụ đá. |
| `usage` | 666 | Đếm quota theo ngày + bonus từ rewarded ad |
| `subscription` | 609 | CRUD admin cho Subscription — ghép vào `modules/admin` |
| `api-log` | 366 | Xem/lọc log request + auto-cleanup theo TTL |
| `app-init` | 226 | Gọi 1 lần lúc mở app: `isPremium`, quota còn lại, `showPaywall`, `remoteConfig{adsEnabled}` |
| `reward` | 156 | `POST /reward/daily`, `POST /reward/ads` |
| `reward-chat` | 124 | Cùng pattern, quota cho chat |
| `settings` | 97 | `POST /settings/update` (language/unit/notifications) |
| `track` | 75 | `POST /track/event` — hiện log + TODO, giữ làm khung |

Tổng 3.513 LOC.

**Không lấy (nghiệp vụ đá quý):** `ai`, `scan`, `scan-core`, `collection`, `collection-api`,
`collection-item`, `history`, `search`.

### 5.2 Ba việc phải sửa khi port (không copy nguyên)

**(a) Gắn `@ApiScope`.** Refer không có cơ chế 3 spec. Theo `AI_RULES_ROOT.md` mục 3, controller
không gắn scope sẽ bị loại khỏi cả 3 file swagger:

- `@ApiScope('app')`: `app-init`, `reward`, `reward-chat`, `settings`, `track`, `subscription-api`
- `@ApiScope('admin')`: `subscription` (CRUD), `api-log`, `usage`
- `POST /subscription/webhook/google`: `@Public()`, **không** gắn scope (Google gọi, không phải client)

**(b) Bỏ coupling `scan`.** `app-init.service.ts:124` gọi `prisma.scan.count()` — bảng `Scan` là
nghiệp vụ, base không có. Đổi sang đọc `Usage.actionCount`. Đổi tên khái niệm cho trung tính:

| Refer | Base |
|---|---|
| `Usage.scanCount` / `Usage.lastScanDate` | `Usage.actionCount` / `Usage.lastActionDate` |
| `USAGE_LIMITS.MAX_FREE_SCANS_PER_DAY` | `USAGE_LIMITS.MAX_FREE_ACTIONS_PER_DAY` |
| response `scanRemaining` / `maxFreeScan` | `actionRemaining` / `maxFreeAction` |
| `usage.incrementScanCount()` | `usage.incrementActionCount()` |
| `PATCH /usage/:userId/increment-scans` | `PATCH /usage/:userId/increment-actions` |

`chatRemaining` giữ nguyên tên — chat là khái niệm trung tính. Lưu ý: quota chat **không** lưu ở
`Usage` mà đếm gián tiếp qua `AuditLog` với `action: 'AI_CHAT_USED'` / `'REWARD_CHAT_ADS'`
(`app-init.service.ts:79-99`). Giữ nguyên cách này, chỉ đổi 2 hằng action thành
`'QUOTA_CHAT_USED'` / `'REWARD_CHAT_ADS'` cho khỏi dính chữ "AI".

**(c) `mapProductIdToPlan` hardcode.** Hiện đoán chuỗi `includes('week')` / `includes('year')`,
enum `PlanType` chỉ có `WEEKLY|YEARLY`. Base: thêm `MONTHLY` + `LIFETIME`, map productId → plan
qua env thay vì đoán chuỗi.

### 5.3 Bug đã biết — sửa luôn lúc port

Refer tự ghi trong `SUBSCRIPTION_REVIEW.md`. Sửa lúc port rẻ hơn nhiều so với sửa sau:

| Mức | Vấn đề | Cách sửa |
|---|---|---|
| HIGH | `Subscription.userId @unique` → user mua 2 gói thì gói cũ bị ghi đè mất | Bỏ `@unique` trên `userId`, thêm `@@unique([userId, purchaseToken])` |
| HIGH | `autoRenew = lineItem.autoRenewingPlan?.autoRenewEnabled ?? true` | Đổi default thành `?? false` |
| MEDIUM | `ON_HOLD` / `PAUSED` map thành `PurchaseStatus.PENDING` | Map thành `CANCELED` (user không dùng được) |
| MEDIUM | `getStatus()` trả cache DB, không sync Google → user cancel trên Play mà DB vẫn ACTIVE | Thêm query param `?sync=true` gọi lại Google |
| CRITICAL | DTO nhận `Platform.IOS` nhưng service ném lỗi khó hiểu | Trả `BadRequestException('IOS verification not yet implemented')` |
| LOW | `GRACE` mang 2 nghĩa (canceled-còn-hạn vs không-tự-gia-hạn) | Tách rõ nhánh theo `purchaseStatus`, ghi comment |

### 5.4 Prisma

`apps/backend/prisma/schema.prisma`: 223 → ~370 dòng.

Thêm 3 model + 4 enum:
- `Subscription`, `Purchase`, `Usage`, `ApiRequestLog`
- `enum SubscriptionStatus { ACTIVE EXPIRED CANCELED GRACE }`
- `enum PlanType { WEEKLY MONTHLY YEARLY LIFETIME }` (refer chỉ có WEEKLY|YEARLY)
- `enum Platform { ANDROID IOS }`
- `enum PurchaseStatus { PENDING PURCHASED CANCELED EXPIRED REVOKED }`
- `enum Language { EN VI }` (refer là `EN|ES|PT|HI` theo thị trường app đá)
- `enum Unit { MM INCH }`

`User` thêm: `isPremium`, `language`, `unit`, `notifications` + relation `subscription`,
`purchases`, `usage`, `apiRequestLogs`.

**Giữ chuẩn base cho `User`, không đổi theo refer:**

| Field | Base (giữ) | Refer (bỏ) |
|---|---|---|
| `email` | `String @unique` (bắt buộc) | `String? @unique` |
| tên | `firstName String` + `lastName String` (bắt buộc) | `name String?` + `firstName/lastName` optional |
| `provider` | không có | `AuthProvider?` |

→ DTO của module port sang phải sửa để khớp `User` của base.

Prisma migration: thư mục `migrations/` của base đang trống (schema lõi chưa có migration nào).
Sau khi ghép schema, tạo migration đầu tiên `init` gộp cả phần lõi + phần subscription.

### 5.5 Dependency & env

Thêm vào `apps/backend/package.json`: `google-auth-library@^10.6.2`.

Thêm vào `apps/backend/.env.example` (chỉ placeholder):

```
# Google Play — verify IAP subscription
GOOGLE_PLAY_PACKAGE_NAME=com.izisoft.pp09base
GOOGLE_APPLICATION_CREDENTIALS=./secrets/google-play-service-account.json

# API request log
API_LOG_ENABLED=false
API_LOG_RETENTION_DAYS=7
API_LOG_CLEANUP_INTERVAL_MINUTES=60
```

Tạo `apps/backend/secrets/` (gitignore) + `secrets/README.md` hướng dẫn tạo service account
Google Play.

### 5.6 Ghi log request

Module `api-log` chỉ **đọc** `ApiRequestLog`; phần **ghi** nằm trong `LoggingMiddleware`
(`common/middleware/request-id.middleware.ts:106`) của refer. Base có class `LoggingMiddleware`
cùng tên nhưng **không ghi DB**. Cần port đoạn ghi `prisma.apiRequestLog.create(...)` (refer dòng
~169), có cờ tắt qua `API_LOG_ENABLED`.

**Kết quả:** backend base có 16 module — 7 cũ + 9 mới.

---

## 6. App Android

### 6.1 Tách `:core` + `:app`

Lý do: compiler cưỡng chế `core` không import được `features`. Lần sau clone base chỉ cần xoá thư
mục `features/`, `:core` bất biến — đúng cái đau đang phải dọn tay lần này.

```
apps/mobile/
├── settings.gradle.kts          include(":core", ":app")
├── build.gradle.kts
├── core/                        Gradle module :core
│   ├── build.gradle.kts
│   └── src/main/java/com/izisoft/pp09base/core/
│       ├── iap/                 IAP — GooglePlayBillingManager, IapConfig, AppActivityProvider
│       ├── ads/                 IAA — AdConfig, Banner/Interstitial/Rewarded, PremiumStatusManager
│       ├── network/             Retrofit, AuthInterceptor, TokenStore, NetworkMonitor
│       ├── analytics/           AnalyticsService, FirebaseAnalyticsService, AnalyticsPrefs
│       ├── firebase/            AppAnalytics, AppFirebaseMessagingService
│       ├── paywall/             PaywallPrefs, PaywallTriggerManager
│       ├── rating/              RatingDialog, RatingManager, RatingPrefs
│       ├── theme/               AppTheme, Color, Type
│       └── di/                  AppModule, AnalyticsModule
└── app/                         Gradle module :app
    ├── build.gradle.kts         implementation(project(":core"))
    └── src/main/java/com/izisoft/pp09base/
        ├── BaseApplication.kt
        ├── MainActivity.kt
        ├── navigation/          AppNavigation.kt (viết lại) + Routes.kt
        └── features/            15 feature lõi
```

`paywall/` và `rating/` hiện nằm ở gốc package (ngoài `core/`) — chuyển vào `:core` vì là hạ tầng
monetization dùng lại, không phải feature. `ui/theme/` gộp vào `core/theme/`.

Dependency chia lại:
- `:core` — Retrofit, OkHttp, Gson, Hilt, billing-ktx, play-services-ads, play-review,
  firebase-bom (analytics + messaging), Compose BOM + material3 (cho theme/BannerAdView)
- `:app` — Compose UI, navigation-compose, hilt-navigation-compose, coil, material-icons-extended
- **Bỏ** CameraX (4 artifact) — chỉ dùng bởi `scan_step1_camera` đã bỏ

### 6.2 Feature: giữ 15 / bỏ 15

**Giữ (200 file, 10.377 LOC):**

| Nhóm | Feature |
|---|---|
| Khởi động | `splash`, `welcome` |
| Onboarding | `onboarding`, `onboarding1`, `onboarding_final` |
| Auth | `login`, `register` |
| Monetization | `subscription_paywall`, `offer_paywall`, `paywall_trigger`, `premium_success`, `profile_subscription` |
| Hệ thống | `profile`, `permission_request`, `offline_state` |

**Bỏ (185 file, 13.547 LOC):**

| Nhóm | Feature |
|---|---|
| Luồng scan | `scan_step1_camera`, `scan_step2_preview`, `scan_step3_analyzing`, `scan_step4_result`, `scan_step5_chat` |
| Bộ sưu tập | `collection_home`, `collection_list`, `collection_detail`, `collection_add` |
| Lịch sử | `history_list`, `history_detail` |
| Khám phá | `search_explore`, `search_explore_list`, `search_explore_detail` |
| Shell | `home` |

Xoá thêm: `features/ratting/` (thư mục rỗng, gõ nhầm của `rating`).

Bỏ `home` nghĩa là không còn màn hình đích sau login → thêm `MainScreen` placeholder ~30 dòng ngay
trong `navigation/`, không phải một feature đầy đủ. Mỗi sản phẩm tự thay bằng shell thật.

### 6.3 Viết lại `AppNavigation.kt`

File hiện tại 1.696 dòng, import cả 31 feature. Không sửa từng dòng — viết lại từ đầu:

- `navigation/Routes.kt` — hằng route dạng sealed/const, thay chuỗi rải rác
- `navigation/AppNavigation.kt` — chỉ 15 feature + `MainScreen`, dự kiến ~400 dòng
- Giữ nguyên các LaunchedEffect gọi `AdsEntryPoint` / `AppAnalytics` cho các route còn lại
- Bỏ toàn bộ analytics event nghiệp vụ (`scan_*`, `rewarded_ad_step3/4/5`, `rarity_score`,
  `total_scans`, `chat_message_sent`...); giữ event trung tính (`paywall_*`, `profile_*`,
  `home_bottom_nav_click`)

### 6.4 Res / asset

- `res/values-es`, `values-ja`, `values-ko`, `values-pt-rBR` — chuỗi dịch của app đá. Giữ **cấu trúc**
  thư mục nhưng lọc lại `strings.xml` chỉ còn key của 15 feature giữ lại. Thêm `values-vi`.
- `res/drawable`, `mipmap-*` — icon/ảnh nghiệp vụ đá: thay bằng placeholder launcher icon mặc định.
- `res/layout` — kiểm tra, nếu chỉ phục vụ native ad của `scan_step3` thì bỏ.

### 6.5 API client khớp endpoint backend

Sau mục 5, các feature giữ lại gọi endpoint thật, không để TODO:

| Feature Kotlin | Endpoint |
|---|---|
| `splash` | `GET /app-init` |
| `login` / `register` | `/auth/*` (base có sẵn) |
| `subscription_paywall`, `offer_paywall` | `POST /subscription/verify`, `GET /subscription/status` |
| `profile_subscription` | `GET /subscription/status`, `POST /subscription/restore` |
| `premium_success` | `GET /subscription/status` |
| `profile` | `POST /settings/update` |
| `core/ads` rewarded | `POST /reward/ads` |

`paywall_trigger` gọi `PaywallTriggerApi` — endpoint này **không tồn tại** ở cả hai backend; logic
thật nằm client-side trong `PaywallTriggerManager.kt`. Bỏ lớp API rỗng đó, giữ manager + prefs.

Đổi tên DTO/field theo mục 5.2(b): `scanRemaining` → `actionRemaining`, `maxFreeScan` →
`maxFreeAction` trong `AppInitDto`, `RewardAdsDto`.

### 6.6 Signing & Firebase

- `key.properties.example` — placeholder, kèm hướng dẫn `keytool -genkey`.
- `app/build.gradle.kts`: khối `signingConfigs.release` hiện crash nếu thiếu `key.properties`
  (`as String` trên null). Sửa thành: thiếu file thì bỏ qua signing config, chỉ build được debug.
- `google-services.json.example` — placeholder; README ghi rõ phải tạo Firebase project mới.

---

## 7. Thứ tự thực hiện

Chia 5 giai đoạn, mỗi giai đoạn kết thúc ở trạng thái build được:

| # | Giai đoạn | Kiểm chứng |
|---|---|---|
| 1 | **Dọn rác + bịt secret** — xoá 511MB rác mobile, xoá 6 file secret, thêm `.example` | `git status` không còn file secret; `du -sh apps/mobile` < 10MB |
| 2 | **Đổi tên monorepo** — `pp00base` → `pp09base`, sửa workspace/README/AI_RULES/ecosystem | `pnpm install && pnpm typecheck` pass; `grep -r pp00base` chỉ còn `pnpm-lock.yaml` |
| 3 | **Backend: ghép 9 module** — prisma + deps + env + port module + gắn `@ApiScope` + sửa 6 bug | `pnpm --filter @pp09base/backend build`; `db:migrate:dev --name init`; `pnpm codegen` sinh đủ 3 spec, `swagger-app.json` có `/subscription/verify` |
| 4 | **Mobile: tách `:core` + `:app`** — di chuyển core/paywall/rating/theme, đổi package, chia deps | `./gradlew :core:assembleDebug` pass |
| 5 | **Mobile: gỡ 15 feature + viết lại navigation** — xoá feature, `Routes.kt`, `AppNavigation.kt` mới, lọc `strings.xml`, khớp DTO | `./gradlew :app:assembleDebug` pass; chạy được splash → onboarding → login → MainScreen → paywall |

Sau giai đoạn 3: **xoá `apps/backend_pp03_refer`**.

---

## 8. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Viết lại `AppNavigation.kt` (1.696 dòng) làm hỏng luồng điều hướng | Giai đoạn 5 làm sau cùng, khi đã build xanh. Test tay đúng luồng ở bảng kiểm chứng. |
| Đổi tên `scanCount` → `actionCount` xuyên backend + mobile, dễ sót | Đổi ở Prisma trước, để compiler TS/Kotlin chỉ ra hết chỗ sai. Chưa có migration nào nên không cần migration đổi tên cột. |
| Sửa 6 bug subscription lúc port có thể làm sai logic khác | Mỗi bug sửa kèm unit test cho `toSubscriptionStatus`, `getEffectiveAutoRenew`, `mapGoogleSubscriptionStateToPurchaseStatus` — 3 hàm thuần, dễ test. |
| `strings.xml` 5 ngôn ngữ, lọc tay dễ lệch key giữa các locale | Lọc theo `values/strings.xml` (nguồn) rồi script check các locale khác có cùng tập key. |
| Tách Gradle module làm Hilt hỏng (`@InstallIn(SingletonComponent)` xuyên module) | Hilt hỗ trợ multi-module sẵn; `:core` cần plugin Hilt + kapt riêng trong `core/build.gradle.kts`. Kiểm chứng ở giai đoạn 4 trước khi sang giai đoạn 5. |

---

## 9. Quyết định đã chốt

| Câu hỏi | Chốt |
|---|---|
| Vai trò repo | Base template dùng lại (không code sản phẩm trong đây) |
| `home`, `scan_step1_camera`, `scan_step5_chat` | Bỏ hết cả 3 |
| Backend IAP | Thêm cả `subscription` + `subscription-api` + `app-init` (làm trọn, có verify Google Play) |
| Cấu trúc Gradle | Tách `:core` + `:app` |
| `apps/backend_pp03_refer` | Xoá hẳn sau khi port |
| Quota/reward (`usage`, `reward`, `reward-chat`, `app-init`) | Thuộc base, đổi tên `scan` → `action` cho trung tính |
