// PM2 config cho cloudpulse (3 apps: backend, admin, web) trên 1 server.
//
// Cách dùng (chạy từ gốc repo):
//   pm2 start ecosystem.config.js                      # khởi động cả 3 app
//   pm2 start ecosystem.config.js --only cloudpulse-backend
//   pm2 start ecosystem.config.js --only cloudpulse-web-admin
//   pm2 start ecosystem.config.js --only cloudpulse-web
//   pm2 reload ecosystem.config.js                     # deploy lại cả 3 app (zero-downtime)
//
// Cổng sản xuất nội bộ 3 app:
//   1. apps/backend   : Port 22090 (NestJS API)
//   2. apps/admin     : Port 32090 (Next.js Admin Dashboard)
//   3. apps/web       : Port 42090 (Next.js Web User)
//
// ⚠️ Tên PHẢI kết thúc bằng `.config.js` để PM2 nhận diện đúng làm file config.

const path = require('path');
const fs = require('fs');

const appsDir = path.join(__dirname, 'apps');

// Tự động tìm thư mục admin (apps/admin hoặc fallback apps/web-admin)
const backendFolder = fs.existsSync(path.join(appsDir, 'backend')) ? 'backend' : '';
const adminFolder = fs.existsSync(path.join(appsDir, 'admin')) ? 'admin' : '';
const webFolder = fs.existsSync(path.join(appsDir, 'web')) ? 'web' : '';

const backendDir = path.join(appsDir, backendFolder);
const adminDir = path.join(appsDir, adminFolder);
const webDir = path.join(appsDir, webFolder);

const BACKEND_PORT = 22090;
const ADMIN_PORT = 32090;
const WEB_PORT = 42090;

// Binary Next.js trong node_modules monorepo
const nextBinPath = fs.existsSync(
  path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'),
)
  ? path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next')
  : path.join(__dirname, 'node_modules', '.bin', 'next');

module.exports = {
  apps: [
    {
      name: 'cloudpulse-backend',
      cwd: backendDir,
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        PORT: BACKEND_PORT,
      },
    },
    {
      name: 'cloudpulse-web-admin',
      cwd: adminDir,
      script: nextBinPath,
      args: `start -p ${ADMIN_PORT}`,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: ADMIN_PORT,
      },
    },
    {
      name: 'cloudpulse-web',
      cwd: webDir,
      script: nextBinPath,
      args: `start -p ${WEB_PORT}`,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: WEB_PORT,
      },
    },
  ],
};
