// PM2 config cho pp09base (3 apps: backend, admin, web) trên 1 server.
//
// Cách dùng (chạy từ gốc repo):
//   pm2 start ecosystem.config.js                      # khởi động cả 3 app
//   pm2 start ecosystem.config.js --only pp09base-backend
//   pm2 start ecosystem.config.js --only pp09base-web-admin
//   pm2 start ecosystem.config.js --only pp09base-web
//   pm2 reload ecosystem.config.js                     # deploy lại cả 3 app (zero-downtime)
//
// Cổng sản xuất nội bộ 3 app:
//   1. apps/backend   : Port 22090 (NestJS API)
//   2. apps/admin     : Port 32090 (Next.js Admin Dashboard)
//   3. apps/web       : Port 42090 (Next.js Web User)
//
// ⚠️ Tên PHẢI kết thúc bằng `.config.js` để PM2 nhận diện đúng làm file config.

const path = require("path");
const fs = require("fs");

const appsDir = path.join(__dirname, "apps");

// Tự động tìm thư mục admin (apps/admin hoặc fallback apps/web-admin)
const adminFolder = fs.existsSync(path.join(appsDir, "admin"))
  ? "admin"
  : fs.existsSync(path.join(appsDir, "web-admin"))
  ? "web-admin"
  : "admin";

const adminDir = path.join(appsDir, adminFolder);
const webDir = path.join(appsDir, "web");

// Binary Next.js trong node_modules monorepo
const nextBinPath = fs.existsSync(path.join(__dirname, "node_modules", "next", "dist", "bin", "next"))
  ? path.join(__dirname, "node_modules", "next", "dist", "bin", "next")
  : path.join(__dirname, "node_modules", ".bin", "next");

module.exports = {
  apps: [
    {
      name: "pp09base-backend",
      cwd: path.join(appsDir, "backend"),
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: 22090,
      },
    },
    {
      name: "pp09base-web-admin",
      cwd: adminDir,
      script: nextBinPath,
      args: "start -p 32090",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 32090,
      },
    },
    {
      name: "pp09base-web",
      cwd: webDir,
      script: nextBinPath,
      args: "start -p 42090",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 42090,
      },
    },
  ],
};

