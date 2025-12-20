# Quick Start - Deploy trên Render

## Chuẩn Bị

1. **Push code lên GitHub** (nếu chưa)

   ```bash
   git add .
   git commit -m "Add deployment files"
   git push origin main
   ```

2. **Generate Secrets**

   ```bash
   # JWT Secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # API Keys
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Option 1: Deploy Từng Service Riêng (Recommended)

### Bước 1: Deploy Identity Service

1. Render Dashboard → **New** → **Web Service**
2. Connect GitHub repository
3. Settings:

   - Name: `smart-restaurant-identity`
   - Region: `Singapore`
   - Branch: `main`
   - Root Directory: `src/backend/identity`
   - Environment: `Docker`
   - Dockerfile Path: `deploy/Dockerfile.identity`
   - Plan: `Free` hoặc `Starter ($7/mo)`

4. Environment Variables (copy tất cả):

   ```
   NODE_ENV=production
   PORT=8080
   HOST_DB=aws-0-ap-south-1.pooler.supabase.com
   PORT_DB=6543
   USERNAME_DB=postgres.vzfhpiietyrgfobaxwhj
   PASSWORD_DB=<your-password>
   DATABASE_DB=postgres
   IDENTITY_API_KEY=<your-generated-api-key>
   JWT_SECRET=<your-generated-jwt-secret>
   JWT_EXPIRATION=7d
   JWT_REFRESH_SECRET=<your-generated-refresh-secret>
   JWT_REFRESH_EXPIRATION=30d
   ```

5. Click **Create Web Service**
6. Đợi deploy xong (~5-10 phút)
7. **Lưu lại URL**: `https://smart-restaurant-identity.onrender.com`

### Bước 2: Deploy Profile Service

1. New → Web Service
2. Settings:

   - Name: `smart-restaurant-profile`
   - Root Directory: `src/backend/profile`
   - Dockerfile Path: `deploy/Dockerfile.profile`

3. Environment Variables:

   ```
   NODE_ENV=production
   PORT=8081
   HOST_DB=aws-0-ap-south-1.pooler.supabase.com
   PORT_DB=6543
   USERNAME_DB=postgres.vzfhpiietyrgfobaxwhj
   PASSWORD_DB=<your-password>
   DATABASE_DB=postgres
   PROFILE_API_KEY=<your-generated-api-key>
   ```

4. Create → Lưu URL

### Bước 3: Deploy Product Service

1. New → Web Service
2. Settings:

   - Name: `smart-restaurant-product`
   - Root Directory: `src/backend/product`
   - Dockerfile Path: `deploy/Dockerfile.product`

3. Environment Variables:

   ```
   NODE_ENV=production
   PORT=8082
   HOST_DB=aws-0-ap-south-1.pooler.supabase.com
   PORT_DB=6543
   USERNAME_DB=postgres.vzfhpiietyrgfobaxwhj
   PASSWORD_DB=<your-password>
   DATABASE_DB=postgres
   PRODUCT_API_KEY=<your-generated-api-key>
   ```

4. Create → Lưu URL

### Bước 4: Deploy Table Service

1. New → Web Service
2. Settings:

   - Name: `smart-restaurant-table`
   - Root Directory: `src/backend/table`
   - Dockerfile Path: `deploy/Dockerfile.table`

3. Environment Variables:

   ```
   NODE_ENV=production
   PORT=8083
   HOST_DB=aws-0-ap-south-1.pooler.supabase.com
   PORT_DB=6543
   USERNAME_DB=postgres.vzfhpiietyrgfobaxwhj
   PASSWORD_DB=<your-password>
   DATABASE_DB=postgres
   TABLE_API_KEY=<your-generated-api-key>
   ```

4. Create → Lưu URL

### Bước 5: Deploy API Gateway

1. New → Web Service
2. Settings:

   - Name: `smart-restaurant-api-gateway`
   - Root Directory: `src/backend/api-gateway`
   - Dockerfile Path: `deploy/Dockerfile.api-gateway`

3. Environment Variables (thay `<service-url>` bằng URLs đã lưu ở bước 1-4):

   ```
   NODE_ENV=production
   PORT=8888

   # Database
   DATABASE_HOST=aws-0-ap-south-1.pooler.supabase.com
   DATABASE_PORT=6543
   DATABASE_USERNAME=postgres.vzfhpiietyrgfobaxwhj
   DATABASE_PASSWORD=<your-password>
   DATABASE_NAME=postgres

   # JWT (same as Identity)
   JWT_SECRET=<same-as-identity>
   JWT_EXPIRATION=7d
   JWT_REFRESH_SECRET=<same-as-identity>
   JWT_REFRESH_EXPIRATION=30d

   # Microservices URLs (QUAN TRỌNG!)
   IDENTITY_SERVICE_HOST=smart-restaurant-identity.onrender.com
   IDENTITY_SERVICE_PORT=443
   PROFILE_SERVICE_HOST=smart-restaurant-profile.onrender.com
   PROFILE_SERVICE_PORT=443
   PRODUCT_SERVICE_HOST=smart-restaurant-product.onrender.com
   PRODUCT_SERVICE_PORT=443
   TABLE_SERVICE_HOST=smart-restaurant-table.onrender.com
   TABLE_SERVICE_PORT=443
   ```

4. Create Web Service

### Bước 6: Test

```bash
# Test API Gateway
curl https://smart-restaurant-api-gateway.onrender.com/api/v1/health

# Test Register
curl -X POST https://smart-restaurant-api-gateway.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123456"}'
```

---

## Option 2: Deploy All-in-One (Đơn Giản Hơn)

### Bước 1: Deploy All Services trong 1 Container

1. Render Dashboard → **New** → **Web Service**
2. Connect GitHub
3. Settings:

   - Name: `smart-restaurant-all-in-one`
   - Region: `Singapore`
   - Branch: `main`
   - Root Directory: `/` (root của project)
   - Environment: `Docker`
   - Dockerfile Path: `deploy/Dockerfile.all-in-one`
   - Plan: `Starter ($7/mo)` - cần ít nhất 1GB RAM

4. Environment Variables:

   ```
   NODE_ENV=production

   # Database
   DATABASE_HOST=aws-0-ap-south-1.pooler.supabase.com
   DATABASE_PORT=6543
   DATABASE_USERNAME=postgres.vzfhpiietyrgfobaxwhj
   DATABASE_PASSWORD=<your-password>
   DATABASE_NAME=postgres

   # JWT
   JWT_SECRET=<your-jwt-secret>
   JWT_EXPIRATION=7d
   JWT_REFRESH_SECRET=<your-refresh-secret>
   JWT_REFRESH_EXPIRATION=30d

   # API Keys
   IDENTITY_API_KEY=<generated-key-1>
   PROFILE_API_KEY=<generated-key-2>
   PRODUCT_API_KEY=<generated-key-3>
   TABLE_API_KEY=<generated-key-4>

   # Ports (optional, có default values)
   API_GATEWAY_PORT=8888
   IDENTITY_PORT=8080
   PROFILE_PORT=8081
   PRODUCT_PORT=8082
   TABLE_PORT=8083
   ```

5. Click **Create Web Service**
6. URL: `https://smart-restaurant-all-in-one.onrender.com`

### Bước 2: Test

```bash
curl https://smart-restaurant-all-in-one.onrender.com/api/v1/health
```

---

## Deploy Frontend (Static Site)

1. Render Dashboard → **New** → **Static Site**
2. Settings:

   - Name: `smart-restaurant-frontend`
   - Root Directory: `src/frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

3. Environment Variables:

   ```
   # Nếu dùng Option 1 (separate services)
   VITE_API_URL=https://smart-restaurant-api-gateway.onrender.com/api/v1

   # Nếu dùng Option 2 (all-in-one)
   VITE_API_URL=https://smart-restaurant-all-in-one.onrender.com/api/v1
   ```

4. Create Static Site

---

## Troubleshooting

### Lỗi: Cannot find module '@shared/\*'

**Nguyên nhân:** Dockerfile không copy shared module đúng cách

**Fix:** Kiểm tra lại Dockerfile có copy `src/backend/shared` chưa

### Lỗi: Connection refused khi API Gateway gọi microservices

**Nguyên nhân:**

- Environment variables `*_SERVICE_HOST` sai
- Render service chưa deploy xong
- Port không đúng (phải dùng 443 cho HTTPS)

**Fix:**

```bash
# Kiểm tra service đã chạy chưa
curl https://smart-restaurant-identity.onrender.com/health

# Update environment variables
IDENTITY_SERVICE_HOST=smart-restaurant-identity.onrender.com
IDENTITY_SERVICE_PORT=443
```

### Service sleep sau 15 phút (Free tier)

**Fix:**

- Upgrade lên Starter plan ($7/mo)
- Hoặc dùng UptimeRobot để ping service mỗi 10 phút

---

## Chi Phí

### Option 1 (Separate Services)

- Free tier: $0 (nhưng services sẽ sleep)
- Starter: $7/service x 5 = **$35/month**

### Option 2 (All-in-One)

- Starter: **$7/month** (cần ít nhất 1GB RAM)

### Frontend (Static)

- **Free**

---

**Done! 🎉**

Hệ thống của bạn đã deploy xong trên Render.
