# Hướng dẫn Deploy với PM2

# Deploy nhanh
# deploy lần đầu
cd /home && git clone git@gitlab.com:izisoftware2020/cloudpulse-admin.git -b develop
cd /home/cloudpulse-admin && npm install && npm run build && npm run pm2:start

# deploy các lần sau
cd /home/cloudpulse-admin && git pull && npm i && npm run deploy

# Config nginx
cd /etc/nginx/conf.d/
nano cloudpulse-admin.izisoft.io.conf
server {
  listen 80;
  listen [::]:80;

  server_name  cloudpulse-admin.izisoft.io;

  location / {
    proxy_pass http://localhost:11123;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
sudo systemctl restart nginx

## Yêu cầu

- Node.js >= 18
- PM2 cài global: `npm install -g pm2`

---

## Lần đầu deploy lên server

```bash
# 1. Clone repo và cài dependencies
git clone <repo-url>
cd pp02-admin
npm install

# 2. Tạo file môi trường
cp .env.example .env.local
# Điền các biến môi trường cần thiết

# 3. Build và khởi động
npm run build
npm run pm2:start

# 4. Cấu hình tự khởi động khi reboot
pm2 startup
pm2 save
```

---

## Deploy cập nhật (thông thường)

```bash
git pull
npm run deploy
```

Lệnh `deploy` thực hiện: `build` → `pm2 reload` (zero-downtime, không mất request).

---

## Các lệnh PM2 thường dùng

| Lệnh | Tác dụng |
|------|----------|
| `npm run deploy` | Build + reload không downtime |
| `npm run pm2:start` | Khởi động app lần đầu |
| `npm run pm2:stop` | Dừng app |
| `npm run pm2:restart` | Restart app (có downtime ngắn) |
| `npm run pm2:reload` | Reload app (zero-downtime) |
| `npm run pm2:delete` | Xoá process khỏi PM2 |
| `npm run pm2:logs` | Xem logs realtime |
| `pm2 status` | Xem trạng thái tất cả process |
| `pm2 monit` | Dashboard monitoring |
| `pm2 save` | Lưu danh sách process hiện tại |

---

## File cấu hình: `ecosystem.config.js`

```
name          : pp02-admin       — tên process trong PM2
port          : 3000             — port mặc định
instances     : 1                — số instance (tăng lên nếu cần scale)
max_memory    : 512MB            — tự restart nếu vượt quá
watch         : false            — không watch file (production)
```

Để thay đổi port, sửa `PORT` trong `ecosystem.config.js`:

```js
env: {
  NODE_ENV: "production",
  PORT: 3000, // đổi ở đây
},
```

Sau đó reload lại: `npm run pm2:reload`

---

## Xem logs

```bash
# Realtime
npm run pm2:logs

# Logs có filter
pm2 logs pp02-admin --lines 100

# Xoá logs cũ
pm2 flush pp02-admin
```

Logs được lưu tại `~/.pm2/logs/`:
- `pp02-admin-out.log` — stdout
- `pp02-admin-error.log` — stderr

---

## Scale (nếu cần nhiều instance)

Sửa `instances` trong `ecosystem.config.js`:

```js
instances: "max",  // dùng hết CPU cores
// hoặc
instances: 2,      // cố định 2 instance
```

Khi chạy nhiều instance, PM2 tự dùng load balancer. Sau khi sửa:

```bash
npm run pm2:delete
npm run pm2:start
```

---

## Troubleshooting

**App không khởi động được:**
```bash
npm run pm2:logs   # xem lỗi chi tiết
```

**Port bị chiếm:**
```bash
lsof -i :3000      # xem process nào đang dùng port 3000
kill -9 <PID>
```

**Build lỗi:**
```bash
npm run build      # chạy riêng để xem lỗi
```

**Reset hoàn toàn:**
```bash
npm run pm2:delete
npm run build
npm run pm2:start
```
