# 🔧 Migration & Setup Guide

## 📋 Pre-requisites

- Node.js 18+
- PostgreSQL 14+
- Running RabbitMQ instance

---

## 🚀 Identity Service Setup

### 1. Install Dependencies

```bash
cd src/backend/identity
npm install
```

Thêm package nếu chưa có:

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

### 2. Update Database Schema

```bash
# Option 1: Chạy migration SQL
psql -U your_user -d identity_db -f migrations/update-remove-token-table.sql

# Option 2: TypeORM auto-sync (development only)
# Set in .env: TYPEORM_SYNCHRONIZE=true
npm run start:dev
```

### 3. Environment Variables

```env
# Identity Service .env
JWT_SECRET_KEY=your-very-secret-key-minimum-256-bits-please-change-this
IDENTITY_API_KEY=internal-service-key-for-api-gateway
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=identity_db
```

### 4. Start Service

```bash
npm run start:dev
```

Verify:

```bash
# Health check
curl http://localhost:3001/health
```

---

## 🌐 API Gateway Setup

### 1. Update Dependencies

```bash
cd src/backend/api-gateway
npm install
```

**Remove old JWT dependencies** (optional cleanup):

```bash
npm uninstall @nestjs/passport passport passport-jwt
```

**Keep only:**

- `@nestjs/microservices` (for RabbitMQ)
- `cookie-parser` (for cookies)

### 2. Environment Variables

```env
# API Gateway .env
IDENTITY_API_KEY=internal-service-key-for-api-gateway
MOD=development  # or production
RABBITMQ_URL=amqp://localhost:5672
```

### 3. Start Gateway

```bash
npm run start:dev
```

Verify:

```bash
curl http://localhost:8888/health
```

---

## 🧪 Testing the Implementation

### Test 1: Login

```bash
curl -X POST http://localhost:8888/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -c cookies.txt \
  -v
```

**Expected Response:**

```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "userId": "...",
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["ADMIN"],
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Check cookies:**

```bash
cat cookies.txt
# Should see: refreshToken (httpOnly)
```

---

### Test 2: Authenticated Request

```bash
# Extract token from previous response
ACCESS_TOKEN="your-access-token-here"

curl -X GET http://localhost:8888/identity/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -v
```

**Expected:** User info returned

---

### Test 3: Auto-Refresh (after 5+ minutes)

```bash
# Wait 5 minutes for access token to expire
sleep 300

# Use expired access token
curl -X GET http://localhost:8888/identity/users/my-user \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -v
```

**Expected:**

- Response: User data
- Header: `X-New-Access-Token: <new_token>`

---

### Test 4: Manual Refresh

```bash
curl -X GET http://localhost:8888/identity/auth/refresh \
  -b cookies.txt
```

**Expected:**

```json
{
  "code": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_token...",
    ...
  }
}
```

---

### Test 5: Logout

```bash
curl -X GET http://localhost:8888/identity/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt
```

**Expected:**

```json
{
  "code": 200,
  "message": "Logout successful"
}
```

**Verify blacklist:**

```sql
SELECT * FROM remove_token ORDER BY created_at DESC LIMIT 5;
```

Should see 2 entries (access + refresh token)

---

### Test 6: Verify Blacklist Works

```bash
# Try using logged-out token
curl -X GET http://localhost:8888/identity/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt
```

**Expected:** 401 Unauthorized

---

## 🔍 Verification Checklist

- [ ] Identity Service starts without errors
- [ ] API Gateway starts without errors
- [ ] Login returns accessToken
- [ ] RefreshToken cookie is set (httpOnly)
- [ ] Authenticated requests work
- [ ] Auto-refresh works after 5 minutes
- [ ] Manual refresh endpoint works
- [ ] Logout blacklists both tokens
- [ ] Blacklisted tokens are rejected
- [ ] Role-based access control works
- [ ] Database schema updated correctly

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@nestjs/jwt'"

```bash
cd src/backend/identity
npm install @nestjs/jwt
```

### Issue: "Column 'token_type' does not exist"

```bash
# Run migration
psql -U your_user -d identity_db -f migrations/update-remove-token-table.sql
```

### Issue: "IDENTITY_API_KEY mismatch"

- Check both `.env` files have same `IDENTITY_API_KEY`
- Restart both services after change

### Issue: Cookies not being set

- Check `MOD` environment variable
- In development: `sameSite: 'lax'`
- In production: `sameSite: 'none'` + `secure: true` + HTTPS

### Issue: CORS errors with cookies

API Gateway needs:

```typescript
app.enableCors({
  origin: "http://localhost:3000", // Your frontend
  credentials: true,
});
```

Frontend needs:

```javascript
axios.defaults.withCredentials = true;
```

---

## 📊 Database Cleanup Job

Create cron job để cleanup expired tokens:

```bash
# Crontab entry (chạy mỗi ngày lúc 2AM)
0 2 * * * psql -U your_user -d identity_db -c "DELETE FROM remove_token WHERE expiry_date < NOW();"
```

Hoặc tạo scheduled task trong NestJS:

```typescript
// src/auth/auth.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_2AM)
async cleanupExpiredTokens() {
  const result = await this.removeTokenRepository
    .createQueryBuilder()
    .delete()
    .where('expiryDate < :now', { now: new Date() })
    .execute();

  this.logger.log(`Cleaned up ${result.affected} expired tokens`);
}
```

---

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET_KEY to strong random value
- [ ] Set MOD=production
- [ ] Enable HTTPS
- [ ] Update cookie settings (secure: true, sameSite: 'none')
- [ ] Set up database backups
- [ ] Configure monitoring & alerting
- [ ] Set up log aggregation
- [ ] Configure rate limiting
- [ ] Set up cleanup cron job
- [ ] Test all flows in staging
- [ ] Document emergency procedures

---

## 📈 Performance Optimization

### 1. Token Blacklist Query Optimization

```sql
-- Add compound index
CREATE INDEX idx_remove_token_lookup
ON remove_token(token, expiry_date)
WHERE expiry_date > NOW();
```

### 2. Caching Strategy (Optional)

```typescript
// Cache validated tokens for 30 seconds to reduce DB load
@Cacheable({ ttl: 30 })
async isTokenBlacklisted(token: string): Promise<boolean> {
  // ...
}
```

### 3. Connection Pooling

```typescript
// TypeORM config
{
  type: 'postgres',
  poolSize: 10,
  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  }
}
```

---

## 📝 Next Steps

1. ✅ Complete this migration
2. ⏭️ Update frontend to use new auth flow
3. ⏭️ Implement token refresh interceptor in frontend
4. ⏭️ Add monitoring for auth metrics
5. ⏭️ Write E2E tests for auth flows
6. ⏭️ Document for frontend team
7. ⏭️ Setup staging environment testing

---

**Good luck with the migration! 🚀**
