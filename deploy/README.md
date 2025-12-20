# README - Deploy Folder

## Tổng Quan

Folder này chứa tất cả files cần thiết để deploy Smart Restaurant microservices lên Render (hoặc platform khác).

## Cấu Trúc Files

```
deploy/
├── RENDER_DEPLOYMENT_GUIDE.md   # Hướng dẫn chi tiết deploy trên Render
├── QUICK_START.md                # Hướng dẫn nhanh, từng bước cụ thể
├── CHECKLIST.md                  # Checklist để track quá trình deploy
├── .env.example                  # Template cho environment variables
├── docker-compose.yml            # Chạy tất cả services local
├── ecosystem.config.js           # PM2 config cho all-in-one deployment
├── Dockerfile.api-gateway        # Docker image cho API Gateway
├── Dockerfile.identity           # Docker image cho Identity Service
├── Dockerfile.profile            # Docker image cho Profile Service
├── Dockerfile.product            # Docker image cho Product Service
├── Dockerfile.table              # Docker image cho Table Service
└── Dockerfile.all-in-one         # Chạy tất cả services trong 1 container
```

## Quick Links

- **[QUICK_START.md](./QUICK_START.md)** - Bắt đầu đây nếu bạn chưa deploy bao giờ
- **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)** - Đọc để hiểu kiến trúc và options
- **[CHECKLIST.md](./CHECKLIST.md)** - Dùng để track progress khi deploy

## Hai Cách Deploy

### Option 1: Deploy Từng Service Riêng ⭐ Recommended

**Ưu điểm:**

- Scale độc lập
- Debug dễ
- Production-ready

**Chi phí:** ~$35/tháng (5 services x $7)

**Phù hợp:** Production environment, team lớn

### Option 2: Deploy All-in-One

**Ưu điểm:**

- Setup đơn giản
- Rẻ hơn

**Chi phí:** $7/tháng

**Phù hợp:** Staging, development, dự án cá nhân

## Test Local Trước Khi Deploy

```bash
# 1. Copy environment template
cp deploy/.env.example deploy/.env

# 2. Điền thông tin database và secrets vào .env

# 3. Build và run bằng docker-compose
cd deploy
docker-compose up --build

# 4. Test
curl http://localhost:8888/api/v1/health
```

## Generate Secrets

```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# API Keys (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Render URLs Pattern

Sau khi deploy, các services sẽ có URLs:

- API Gateway: `https://smart-restaurant-api-gateway.onrender.com`
- Identity: `https://smart-restaurant-identity.onrender.com`
- Profile: `https://smart-restaurant-profile.onrender.com`
- Product: `https://smart-restaurant-product.onrender.com`
- Table: `https://smart-restaurant-table.onrender.com`
- Frontend: `https://smart-restaurant-frontend.onrender.com`

## Environment Variables Summary

### Required for All Services

- `NODE_ENV=production`
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`

### Required for API Gateway

- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- All `*_SERVICE_HOST` và `*_SERVICE_PORT` variables

### Required for Each Microservice

- Service-specific `*_API_KEY`
- For Identity service: cũng cần JWT secrets

## Support

Nếu gặp vấn đề:

1. Check [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) → Troubleshooting section
2. Check Render logs: Dashboard → Service → Logs tab
3. Test local với docker-compose để isolate issue

## Next Steps

1. Đọc [QUICK_START.md](./QUICK_START.md)
2. Chọn deployment option (1 hoặc 2)
3. Generate secrets
4. Deploy theo hướng dẫn
5. Dùng [CHECKLIST.md](./CHECKLIST.md) để track

---

**Good luck! 🚀**
