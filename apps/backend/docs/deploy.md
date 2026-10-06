**GUIDELINE TỔNG HỢP – PM2 + GitLab CI/CD + Staging/Production tách riêng (Production Ready)**
Dùng **yarn**, source đặt trong:

# Deploy nhanh
# deploy lần đầu
cd /home && git clone git@gitlab.com:izisoftware2020/cloudpulse-backend.git -b develop && cd /home/cloudpulse-backend && yarn && yarn build && pm2 start ecosystem.config.js && pm2 save 

# deploy các lần sau
cd /home/cloudpulse-backend && git pull && yarn && yarn build && yarn db:generate && yarn db:migrate && pm2 reload cloudpulse-backend
 