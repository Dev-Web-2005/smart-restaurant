# Hướng Dẫn Deploy Smart Restaurant Microservices trên Render

## Kiến Trúc Hệ Thống

Hệ thống Smart Restaurant sử dụng kiến trúc microservices với các thành phần:

- **API Gateway** (Port 8888): HTTP REST API - điểm vào duy nhất cho frontend
- **Identity Service** (Port 8080): Quản lý authentication & authorization (TCP)
- **Profile Service** (Port 8081): Quản lý profile người dùng (TCP)
- **Product Service** (Port 8082): Quản lý menu, categories, items (TCP)
- **Table Service** (Port 8083): Quản lý bàn ăn và QR codes (TCP)
- **Frontend**: React/Vite application
- **Database**: PostgreSQL (Supabase)

## Yêu Cầu Trước Khi Deploy

1. Tài khoản Render (https://render.com)
2. Database PostgreSQL đã setup (Supabase hoặc Render PostgreSQL)
3. Code đã push lên GitHub repository

## Chiến Lược Deploy trên Render

### Option 1: Deploy từng service riêng biệt (Recommended)

Mỗi microservice deploy như một **Web Service** riêng trên Render.

**Ưu điểm:**

- Scale độc lập từng service
- Debug dễ dàng
- Restart/redeploy không ảnh hưởng services khác

**Nhược điểm:**

- Cần configure nhiều services
- Chi phí cao hơn (mỗi service 1 instance)

### Option 2: Deploy tất cả services trong 1 Docker container

Chạy tất cả services trong 1 container bằng docker-compose.

**Ưu điểm:**

- Dễ setup
- Chi phí thấp hơn (1 instance duy nhất)
- Phù hợp môi trường development/staging

**Nhược điểm:**

- Không scale được từng service
- Restart 1 service = restart tất cả
- Khó debug khi có lỗi

## Hướng Dẫn Deploy Chi Tiết

## OPTION 1: Deploy Từng Service Riêng (Production)

### 1. Setup Database trên Render (hoặc sử dụng Supabase hiện tại)

Nếu chưa có database:

1. Vào Render Dashboard → New → PostgreSQL
2. Tên: `smart-restaurant-db`
3. Plan: Free (hoặc trả phí)
4. Lưu lại connection string: `postgresql://user:password@host:port/database`

### 2. Deploy API Gateway (Web Service)

#### 2.1. Tạo Web Service mới

- Render Dashboard → New → Web Service
- Connect GitHub repository
- Name: `smart-restaurant-api-gateway`
- Region: Singapore (hoặc gần user nhất)
- Branch: `main` (hoặc branch deploy của bạn)
- Root Directory: `src/backend/api-gateway`
- Environment: `Node`
- Build Command:
  ```bash
  npm install && npm run build
  ```
- Start Command:
  ```bash
  npm run start:prod
  ```

#### 2.2. Environment Variables

```
NODE_ENV=production
PORT=8888
DATABASE_HOST=<supabase-host>
DATABASE_PORT=6543
DATABASE_USERNAME=<supabase-username>
DATABASE_PASSWORD=<supabase-password>
DATABASE_NAME=postgres
JWT_SECRET=<random-secret-key>
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=<another-random-secret>
JWT_REFRESH_EXPIRATION=30d

# Microservices URLs (sẽ update sau khi deploy xong các services)
IDENTITY_SERVICE_HOST=smart-restaurant-identity.onrender.com
IDENTITY_SERVICE_PORT=8080
PROFILE_SERVICE_HOST=smart-restaurant-profile.onrender.com
PROFILE_SERVICE_PORT=8081
PRODUCT_SERVICE_HOST=smart-restaurant-product.onrender.com
PRODUCT_SERVICE_PORT=8082
TABLE_SERVICE_HOST=smart-restaurant-table.onrender.com
TABLE_SERVICE_PORT=8083
```

#### 2.3. Health Check (Optional)

- Health Check Path: `/api/v1/health` (nếu có endpoint health check)

### 3. Deploy Identity Service (Web Service)

#### 3.1. Tạo Web Service

- Name: `smart-restaurant-identity`
- Root Directory: `src/backend/identity`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

#### 3.2. Environment Variables

```
NODE_ENV=production
PORT=8080
HOST_DB=<supabase-host>
PORT_DB=6543
USERNAME_DB=<supabase-username>
PASSWORD_DB=<supabase-password>
DATABASE_DB=postgres
IDENTITY_API_KEY=identity-service-secret-key-2024
JWT_SECRET=<same-as-api-gateway>
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=<same-as-api-gateway>
JWT_REFRESH_EXPIRATION=30d
```

### 4. Deploy Profile Service (Web Service)

#### 4.1. Tạo Web Service

- Name: `smart-restaurant-profile`
- Root Directory: `src/backend/profile`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

#### 4.2. Environment Variables

```
NODE_ENV=production
PORT=8081
HOST_DB=<supabase-host>
PORT_DB=6543
USERNAME_DB=<supabase-username>
PASSWORD_DB=<supabase-password>
DATABASE_DB=postgres
PROFILE_API_KEY=profile-service-secret-key-2024
```

### 5. Deploy Product Service (Web Service)

#### 5.1. Tạo Web Service

- Name: `smart-restaurant-product`
- Root Directory: `src/backend/product`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

#### 5.2. Environment Variables

```
NODE_ENV=production
PORT=8082
HOST_DB=<supabase-host>
PORT_DB=6543
USERNAME_DB=<supabase-username>
PASSWORD_DB=<supabase-password>
DATABASE_DB=postgres
PRODUCT_API_KEY=product-service-secret-key-2024
```

### 6. Deploy Table Service (Web Service)

#### 6.1. Tạo Web Service

- Name: `smart-restaurant-table`
- Root Directory: `src/backend/table`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

#### 6.2. Environment Variables

```
NODE_ENV=production
PORT=8083
HOST_DB=<supabase-host>
PORT_DB=6543
USERNAME_DB=<supabase-username>
PASSWORD_DB=<supabase-password>
DATABASE_DB=postgres
TABLE_API_KEY=table-service-secret-key-2024
```

### 7. Deploy Frontend (Static Site)

#### 7.1. Tạo Static Site

- Render Dashboard → New → Static Site
- Name: `smart-restaurant-frontend`
- Root Directory: `src/frontend`
- Build Command:
  ```bash
  npm install && npm run build
  ```
- Publish Directory: `dist`

#### 7.2. Environment Variables

```
VITE_API_URL=https://smart-restaurant-api-gateway.onrender.com/api/v1
```

### 8. Update API Gateway với URLs của các services

Sau khi deploy xong tất cả microservices, quay lại **API Gateway Environment Variables** và update:

```
IDENTITY_SERVICE_HOST=smart-restaurant-identity.onrender.com
PROFILE_SERVICE_HOST=smart-restaurant-profile.onrender.com
PRODUCT_SERVICE_HOST=smart-restaurant-product.onrender.com
TABLE_SERVICE_HOST=smart-restaurant-table.onrender.com
```

Sau đó **Manual Deploy** lại API Gateway.

---

## OPTION 2: Deploy All-in-One với Docker (Development/Staging)

### 1. Tạo Web Service

- Name: `smart-restaurant-all-in-one`
- Environment: `Docker`
- Root Directory: `/`
- Dockerfile Path: `deploy/Dockerfile.all-in-one`

### 2. Environment Variables

```
NODE_ENV=production

# Database
DATABASE_HOST=<supabase-host>
DATABASE_PORT=6543
DATABASE_USERNAME=<supabase-username>
DATABASE_PASSWORD=<supabase-password>
DATABASE_NAME=postgres

# JWT
JWT_SECRET=<random-secret>
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=<another-secret>
JWT_REFRESH_EXPIRATION=30d

# API Keys
IDENTITY_API_KEY=identity-service-secret-key-2024
PROFILE_API_KEY=profile-service-secret-key-2024
PRODUCT_API_KEY=product-service-secret-key-2024
TABLE_API_KEY=table-service-secret-key-2024

# Service Ports
API_GATEWAY_PORT=8888
IDENTITY_PORT=8080
PROFILE_PORT=8081
PRODUCT_PORT=8082
TABLE_PORT=8083
```

### 3. Exposed Port

- Port: `8888` (API Gateway)

---

## Kiểm Tra Sau Khi Deploy

### 1. Kiểm tra Health của từng service

```bash
# API Gateway
curl https://smart-restaurant-api-gateway.onrender.com/api/v1/health

# Identity Service (nếu có health endpoint)
curl https://smart-restaurant-identity.onrender.com/health
```

### 2. Test Authentication Flow

```bash
# Register
curl -X POST https://smart-restaurant-api-gateway.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'

# Login
curl -X POST https://smart-restaurant-api-gateway.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'
```

### 3. Test Microservices Communication

```bash
# Get Profile (requires JWT token)
curl https://smart-restaurant-api-gateway.onrender.com/api/v1/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Troubleshooting

### 1. Service không kết nối được với nhau

**Vấn đề:** API Gateway không kết nối được với Identity/Profile/Product services

**Giải pháp:**

- Kiểm tra Environment Variables `*_SERVICE_HOST` và `*_SERVICE_PORT`
- Render services phải expose port TCP
- Sử dụng internal URL của Render: `<service-name>.onrender.com`

### 2. Database connection failed

**Vấn đề:** TypeORM không connect được database

**Giải pháp:**

- Kiểm tra DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD
- Supabase: Port là `6543` cho connection pooling
- Whitelist IP của Render trên Supabase (hoặc allow all `0.0.0.0/0`)

### 3. Build failed - Cannot find module '@shared/\*'

**Vấn đề:** Các services không tìm thấy shared module

**Giải pháp:**

- Sử dụng Dockerfile multi-stage để copy shared module
- Hoặc publish `@shared` lên npm private registry
- Xem `deploy/Dockerfile.identity` để biết cách copy shared module

### 4. Service sleep sau 15 phút (Free tier)

**Vấn đề:** Render free tier sleep services không active

**Giải pháp:**

- Upgrade lên paid plan ($7/month per service)
- Hoặc sử dụng uptime monitoring services (UptimeRobot, Pingdom) để ping mỗi 10 phút

### 5. Cold start chậm

**Vấn đề:** Service khởi động lâu sau khi sleep

**Giải pháp:**

- Reduce dependencies trong package.json
- Sử dụng build cache của Render
- Upgrade lên paid plan

---

## Chi Phí Ước Tính (Render Pricing)

### Free Tier

- **Services:** 5 services x $0 = $0/month
- **Giới hạn:**
  - 750 hours/month (services sleep sau 15 phút không active)
  - 100GB bandwidth/month
  - Shared CPU
  - 512MB RAM

### Starter Plan (Recommended cho Production)

- **API Gateway:** $7/month (always on)
- **Identity Service:** $7/month
- **Profile Service:** $7/month
- **Product Service:** $7/month
- **Table Service:** $7/month
- **Frontend (Static):** Free
- **Total:** ~$35/month

### Pro Plan (High Traffic)

- **Services:** 5 services x $25/month = $125/month
- **Features:**
  - 2 vCPU, 2GB RAM per service
  - Auto-scaling
  - Priority support

---

## Best Practices

### 1. Security

- Sử dụng strong secrets cho JWT_SECRET và API_KEYS
- Enable HTTPS only (Render tự động cung cấp SSL)
- Whitelist IP cho database nếu có thể
- Không commit secrets vào Git

### 2. Monitoring

- Setup health check endpoints cho tất cả services
- Sử dụng Render logs để debug
- Consider thêm logging service (LogDNA, Datadog)

### 3. Performance

- Enable HTTP/2 trên API Gateway
- Implement caching (Redis) nếu cần
- Optimize database queries
- Use CDN cho static assets (frontend)

### 4. CI/CD

- Setup auto-deploy từ GitHub
- Test locally với docker-compose trước khi push
- Sử dụng staging environment
- Implement health checks trước khi switch production traffic

---

## Scripts Hữu Ích

### Generate Strong Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate API_KEYS
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Local Docker Build

```bash
# Build image
docker build -t smart-restaurant-identity -f deploy/Dockerfile.identity .

# Run container
docker run -p 8080:8080 --env-file src/backend/identity/.env smart-restaurant-identity
```

---

## Liên Hệ & Support

Nếu gặp vấn đề trong quá trình deploy:

1. Check Render logs: Dashboard → Service → Logs
2. Check database connectivity: `psql <connection-string>`
3. Test local với docker-compose: `docker-compose -f deploy/docker-compose.yml up`

---

**Tài liệu được tạo: 18/12/2025**
