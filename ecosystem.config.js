// PM2 config cho pp09base (backend + web-admin) trên 1 server.
//
// Dùng (chạy từ gốc repo):
//   pm2 start ecosystem.config.js                      # khởi động cả 2 app
//   pm2 start ecosystem.config.js --only pp09base-backend
//   pm2 reload ecosystem.config.js                     # deploy lại sau khi build
//
// ⚠️ Tên PHẢI kết thúc bằng `.config.js` — nếu không PM2 sẽ chạy file này như một
//    script Node thường thay vì đọc làm file config (khi đó `pm2 status` chỉ hiện 1
//    process tên "ecosystem", không phải 2 app).
//
// Repo chỉ có 2 app chạy trên server: backend (NestJS) và web-admin (Next.js).
// `apps/mobile` là Android (Kotlin) — build ra APK, KHÔNG chạy bằng PM2.
//
// Cổng nội bộ đặt ở dải x000 để tránh trùng với các dự án khác trên cùng server.
// cwd dùng __dirname nên chạy đúng dù repo clone ở bất kỳ đâu.
const path = require("path");
const appsDir = path.join(__dirname, "apps");

module.exports = {
  apps: [
    {
      name: "pp09base-backend",
      // cwd BẮT BUỘC là apps/backend: backend đọc `.env` và serve `/uploads`
      // từ `process.cwd()/public/uploads`.
      cwd: path.join(appsDir, "backend"),
      // `nest build` biên dịch cả prisma.config.ts nên entry nằm ở dist/src/main.js
      // (KHÔNG phải dist/main.js).
      script: "dist/src/main.js",
      // Giữ 1 instance: OTP đăng nhập lưu in-memory trong AuthService, chạy nhiều
      // instance thì mã gửi ở process này không verify được ở process kia.
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "768M",
      env: { NODE_ENV: "production", PORT: 22090 },
    },
    {
      name: "pp09base-web-admin",
      cwd: path.join(appsDir, "web-admin"),
      // `.npmrc` đặt node-linker=hoisted → binary `next` chỉ nằm ở node_modules/.bin
      // của GỐC repo, không có trong apps/web-admin/node_modules/.bin.
      script: path.join(__dirname, "node_modules", ".bin", "next"),
      args: "start -p 32090",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: { NODE_ENV: "production", PORT: 32090 },
    },
  ],
};
