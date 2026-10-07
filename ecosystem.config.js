// PM2 config cho Monorepo (3 apps: backend, admin, web) trên 1 server.
// Cổng mặc định: Backend (22090), Admin (32090), Web (42090)

const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const appsDir = path.join(rootDir, 'apps');

// Tìm chính xác tên thư mục của từng sub-app
const backendFolder = ['backend', 'cloudpulse-backend', 'api', 'server']
  .find((f) => fs.existsSync(path.join(appsDir, f))) || 'backend';

const adminFolder = ['admin', 'web-admin', 'cloudpulse-web-admin', 'dashboard']
  .find((f) => fs.existsSync(path.join(appsDir, f))) || 'admin';

const webFolder = ['web', 'cloudpulse-web', 'client', 'frontend']
  .find((f) => fs.existsSync(path.join(appsDir, f))) || 'web';

const backendDir = path.join(appsDir, backendFolder);
const adminDir = path.join(appsDir, adminFolder);
const webDir = path.join(appsDir, webFolder);

// Cổng ưu tiên lấy từ process.env hoặc fallback mặc định
const BACKEND_PORT = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 22090;
const ADMIN_PORT = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 32090;
const WEB_PORT = process.env.WEB_PORT ? Number(process.env.WEB_PORT) : 42090;

// Tìm đường dẫn Next.js binary linh hoạt trong monorepo
const findNextBin = (appDir) => {
  const candidates = [
    path.join(rootDir, 'node_modules', '.bin', 'next'),
    path.join(appDir, 'node_modules', '.bin', 'next'),
    path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next'),
  ];
  return candidates.find((c) => fs.existsSync(c)) || 'next';
};

const appsList = [];

// 1. Backend App
if (fs.existsSync(backendDir)) {
  const mainScript = fs.existsSync(path.join(backendDir, 'dist', 'src', 'main.js'))
    ? 'dist/src/main.js'
    : fs.existsSync(path.join(backendDir, 'dist', 'main.js'))
    ? 'dist/main.js'
    : 'dist/src/main.js';

  appsList.push({
    name: 'cloudpulse-backend',
    cwd: backendDir,
    script: mainScript,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '768M',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: BACKEND_PORT,
    },
  });
}

// 2. Web Admin App
if (fs.existsSync(adminDir)) {
  appsList.push({
    name: 'cloudpulse-admin',
    cwd: adminDir,
    script: findNextBin(adminDir),
    args: `start -p ${ADMIN_PORT}`,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: ADMIN_PORT,
    },
  });
}

// 3. Web User App
if (fs.existsSync(webDir)) {
  appsList.push({
    name: 'cloudpulse-web',
    cwd: webDir,
    script: findNextBin(webDir),
    args: `start -p ${WEB_PORT}`,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: WEB_PORT,
    },
  });
}

module.exports = {
  apps: appsList,
};
