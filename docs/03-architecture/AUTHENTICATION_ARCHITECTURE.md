# 🔐 Authentication & Authorization Architecture - Refactored

**Version:** 2.0  
**Date:** December 6, 2025  
**Status:** Implemented - Dual Token Strategy

---

## 📋 Tổng quan thay đổi

### ❌ Trước (Old Architecture)

- JWT logic ở API Gateway
- Single token (lưu trong cookie)
- Expiry: 7 ngày
- Không có refresh mechanism
- Security risk: JWT secret exposed ở Gateway

### ✅ Sau (New Architecture - Dual Token)

- JWT logic hoàn toàn ở Identity Service
- Dual tokens: Access Token (5 phút) + Refresh Token (7 ngày)
- Access token trả trong response body
- Refresh token lưu trong httpOnly cookie
- Auto-refresh: Nếu access token expired → dùng refresh token tạo mới
- Security: JWT secret chỉ ở Identity Service
- Blacklist: Cả 2 tokens khi logout

---

## 🏗️ Kiến trúc Dual Token

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/App)                  │
└────────┬────────────────────────────────────────────┬────┘
         │                                            │
         │ 1. Login (username/password)               │
         │                                            │
         ▼                                            │
┌─────────────────────────────────────────────────────┐   │
│              API GATEWAY (Port 8888)                 │   │
│  - Route requests                                    │   │
│  - Set refresh token vào cookie                     │   │
│  - AuthGuard: Validate tokens qua Identity Service  │   │
└────────┬────────────────────────────────────────────┘   │
         │                                                 │
         │ 2. Forward to Identity Service                 │
         │                                                 │
         ▼                                                 │
┌──────────────────────────────────────────────────────┐  │
│           IDENTITY SERVICE (Port 3001)                │  │
│  ✅ JWT logic tập trung tại đây                      │  │
│  - Generate access token (5 phút)                    │  │
│  - Generate refresh token (7 ngày)                   │  │
│  - Validate tokens                                    │  │
│  - Auto-refresh nếu access expired                   │  │
│  - Blacklist tokens khi logout                       │  │
└────────┬─────────────────────────────────────────────┘  │
         │                                                 │
         │ 3. Return tokens                                │
         │                                                 │
         ▼                                                 │
┌─────────────────────────────────────────────────────┐   │
│                  RESPONSE                            │   │
│  Body:                                               │   │
│    - userId, username, email, roles                  │   │
│    - accessToken ← Client lưu (localStorage/memory) │   │
│  Cookie:                                             │   │
│    - refreshToken (httpOnly, 7 days) ───────────────┼───┘
└──────────────────────────────────────────────────────┘
```

---

## 🔑 Token Specifications

### Access Token

```json
{
  "userId": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "roles": ["ADMIN", "USER"],
  "type": "access",
  "iat": 1702000000,
  "exp": 1702000300 // 5 phút sau
}
```

- **Expiry:** 5 phút
- **Storage:** Client-side (localStorage, memory, hoặc state)
- **Usage:** Gửi trong Authorization header: `Bearer <accessToken>`
- **Purpose:** Ngắn hạn, minimize risk nếu bị đánh cắp

### Refresh Token

```json
{
  "userId": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "roles": ["ADMIN", "USER"],
  "type": "refresh",
  "iat": 1702000000,
  "exp": 1702604800 // 7 ngày sau
}
```

- **Expiry:** 7 ngày
- **Storage:** HttpOnly cookie (không thể access từ JavaScript)
- **Usage:** Tự động gửi trong cookie
- **Purpose:** Tạo access token mới khi expired

---

## 🔄 Authentication Flows

### 1. Login Flow

```
Client                    API Gateway              Identity Service
  │                            │                         │
  ├─── POST /auth/login ──────>│                         │
  │    { username, password }  │                         │
  │                            │                         │
  │                            ├── auth:login ─────────> │
  │                            │                         │
  │                            │                   ┌─────┴─────┐
  │                            │                   │ 1. Verify │
  │                            │                   │    user   │
  │                            │                   │ 2. Create │
  │                            │                   │   access  │
  │                            │                   │   token   │
  │                            │                   │ 3. Create │
  │                            │                   │  refresh  │
  │                            │                   │   token   │
  │                            │                   └─────┬─────┘
  │                            │<─── Return tokens ──────┤
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ Set cookie │                 │
  │                      │ refreshToken│                 │
  │                      └─────┬──────┘                 │
  │<─── Response ──────────────┤                         │
  │    {                       │                         │
  │      accessToken,          │                         │
  │      user info             │                         │
  │    }                       │                         │
  │    Cookie: refreshToken    │                         │
```

**Client action sau login:**

```javascript
// Save access token
localStorage.setItem("accessToken", response.data.accessToken);
// refreshToken đã tự động lưu trong cookie
```

---

### 2. Authenticated Request Flow

```
Client                    API Gateway              Identity Service
  │                            │                         │
  ├─── GET /api/resource ─────>│                         │
  │    Header:                 │                         │
  │    Authorization: Bearer   │                         │
  │      <accessToken>         │                         │
  │    Cookie: refreshToken    │                         │
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ AuthGuard  │                 │
  │                      │ extracts   │                 │
  │                      │ tokens     │                 │
  │                      └─────┬──────┘                 │
  │                            │                         │
  │                            ├─ auth:validate-token ─>│
  │                            │  {                      │
  │                            │    accessToken,         │
  │                            │    refreshToken         │
  │                            │  }                      │
  │                            │                   ┌─────┴──────┐
  │                            │                   │ 1. Check   │
  │                            │                   │   blacklist│
  │                            │                   │ 2. Verify  │
  │                            │                   │   signature│
  │                            │                   │ 3. Check   │
  │                            │                   │   expiry   │
  │                            │                   └─────┬──────┘
  │                            │                         │
  │                            │<─── Valid ──────────────┤
  │                            │     { userId, roles }   │
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ Attach     │                 │
  │                      │ user to    │                 │
  │                      │ request    │                 │
  │                      └─────┬──────┘                 │
  │                            │                         │
  │                            ├─── Forward to ─────────>│
  │                            │     Resource Service    │
  │                            │     (with x-api-key)    │
```

**Headers gửi đi:**

```http
GET /api/resource HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. Auto-Refresh Flow (Access Token Expired)

```
Client                    API Gateway              Identity Service
  │                            │                         │
  ├─── GET /api/resource ─────>│                         │
  │    Authorization: Bearer   │                         │
  │      <expired_access_token>│                         │
  │    Cookie: refreshToken    │                         │
  │                            │                         │
  │                            ├─ auth:validate-token ─>│
  │                            │                   ┌─────┴──────┐
  │                            │                   │ 1. Access  │
  │                            │                   │   EXPIRED  │
  │                            │                   │ 2. Check   │
  │                            │                   │   refresh  │
  │                            │                   │   token    │
  │                            │                   │ 3. Verify  │
  │                            │                   │   refresh  │
  │                            │                   │ 4. Generate│
  │                            │                   │   new      │
  │                            │                   │   access   │
  │                            │                   └─────┬──────┘
  │                            │<─── Valid + New ────────┤
  │                            │     {                   │
  │                            │       valid: true,      │
  │                            │       newAccessToken,   │
  │                            │       userId, roles     │
  │                            │     }                   │
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ Set header │                 │
  │                      │ X-New-     │                 │
  │                      │ Access-    │                 │
  │                      │ Token      │                 │
  │                      └─────┬──────┘                 │
  │                            │                         │
  │<─── Response ──────────────┤                         │
  │    Data: { ... }           │                         │
  │    Header:                 │                         │
  │      X-New-Access-Token:   │                         │
  │        <new_access_token>  │                         │
```

**Client interceptor để handle:**

```javascript
// Axios interceptor
axios.interceptors.response.use(
  (response) => {
    // Check nếu có new access token
    const newToken = response.headers["x-new-access-token"];
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

---

### 4. Manual Refresh Flow

```
Client                    API Gateway              Identity Service
  │                            │                         │
  ├─── GET /auth/refresh ────>│                         │
  │    Cookie: refreshToken    │                         │
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ Extract    │                 │
  │                      │ refresh    │                 │
  │                      │ from cookie│                 │
  │                      └─────┬──────┘                 │
  │                            │                         │
  │                            ├─ auth:refresh-token ──>│
  │                            │                   ┌─────┴──────┐
  │                            │                   │ Verify     │
  │                            │                   │ refresh    │
  │                            │                   │ Generate   │
  │                            │                   │ new access │
  │                            │                   └─────┬──────┘
  │                            │<─── New access ─────────┤
  │<─── Response ──────────────┤                         │
  │    {                       │                         │
  │      accessToken,          │                         │
  │      user info             │                         │
  │    }                       │                         │
```

---

### 5. Logout Flow

```
Client                    API Gateway              Identity Service
  │                            │                         │
  ├─── GET /auth/logout ─────>│                         │
  │    Authorization: Bearer   │                         │
  │      <accessToken>         │                         │
  │    Cookie: refreshToken    │                         │
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ AuthGuard  │                 │
  │                      │ validates  │                 │
  │                      └─────┬──────┘                 │
  │                            │                         │
  │                            ├─── auth:logout ───────>│
  │                            │  {                      │
  │                            │    accessToken,         │
  │                            │    refreshToken,        │
  │                            │    userId               │
  │                            │  }                      │
  │                            │                   ┌─────┴──────┐
  │                            │                   │ Blacklist  │
  │                            │                   │ both       │
  │                            │                   │ tokens     │
  │                            │                   │ in DB      │
  │                            │                   └─────┬──────┘
  │                            │<─── Success ────────────┤
  │                            │                         │
  │                      ┌─────┴──────┐                 │
  │                      │ Clear      │                 │
  │                      │ cookies    │                 │
  │                      └─────┬──────┘                 │
  │<─── 200 OK ────────────────┤                         │
│
Client clears localStorage
```

**Client action:**

```javascript
// Clear access token
localStorage.removeItem("accessToken");
// Cookies đã được xóa bởi server
```

---

## 🗄️ Database Schema

### RemoveToken Entity (Blacklist)

```typescript
@Entity()
export class RemoveToken {
  @PrimaryColumn()
  token: string; // Hashed token value

  @Column({ type: "varchar", length: 20 })
  tokenType: "access" | "refresh";

  @Column({ type: "timestamp" })
  expiryDate: Date; // Để cleanup sau khi expired

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  userId: string; // Track user
}
```

**Cleanup Strategy:**

```sql
-- Cron job chạy hàng ngày để xóa expired tokens
DELETE FROM remove_token
WHERE expiryDate < NOW();
```

---

## 🛡️ Security Benefits

### 1. Short-lived Access Tokens (5 phút)

- ✅ Minimize window of attack nếu token bị đánh cắp
- ✅ Buộc re-validate thường xuyên
- ✅ Giảm thiểu privilege escalation risk

### 2. HttpOnly Refresh Token

- ✅ Không thể đọc từ JavaScript → XSS safe
- ✅ Chỉ gửi qua HTTPS → MITM protected
- ✅ SameSite attribute → CSRF protected

### 3. Token Blacklisting

- ✅ Immediate revocation khi logout
- ✅ Prevent token reuse
- ✅ Audit trail

### 4. JWT Secret Isolation

- ✅ Chỉ Identity Service biết secret
- ✅ Không expose ở API Gateway
- ✅ Dễ rotate secrets

### 5. Auto-refresh Mechanism

- ✅ UX tốt - Không bắt login lại thường xuyên
- ✅ Security tốt - Short access token lifetime
- ✅ Transparent cho user

---

## 📡 API Endpoints

### Identity Service (Internal - via RabbitMQ)

| Pattern               | Description             | Request                                 | Response                              |
| --------------------- | ----------------------- | --------------------------------------- | ------------------------------------- |
| `auth:login`          | Login user              | `{ username, password }`                | `{ accessToken, refreshToken, user }` |
| `auth:validate-token` | Validate & auto-refresh | `{ accessToken, refreshToken? }`        | `{ valid, user, newAccessToken? }`    |
| `auth:refresh-token`  | Manual refresh          | `{ refreshToken }`                      | `{ accessToken, user }`               |
| `auth:logout`         | Blacklist tokens        | `{ accessToken, refreshToken, userId }` | `{ success }`                         |
| `auth:me`             | Get current user        | `{ userId }`                            | `{ user }`                            |

### API Gateway (Public - REST)

| Endpoint                 | Method | Auth     | Description          |
| ------------------------ | ------ | -------- | -------------------- |
| `/identity/auth/login`   | POST   | ❌       | Login                |
| `/identity/auth/refresh` | GET    | ❌       | Refresh access token |
| `/identity/auth/me`      | GET    | ✅       | Current user info    |
| `/identity/auth/logout`  | GET    | ✅       | Logout & blacklist   |
| `/identity/users/*`      | \*     | ✅       | User operations      |
| `/identity/roles/*`      | \*     | ✅ Admin | Role operations      |

---

## 🔧 Implementation Details

### Environment Variables

**Identity Service (.env):**

```env
JWT_SECRET_KEY=your-super-secret-key-change-in-production
# No need JWT_EXPIRES_IN - hardcoded in code for clarity
```

**API Gateway (.env):**

```env
IDENTITY_API_KEY=your-internal-service-api-key
# Không cần JWT config - đã move sang Identity
```

### AuthGuard Logic (API Gateway)

```typescript
// src/guard/auth.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 1. Extract access token from Authorization header
  const accessToken = extractFromHeader(request);

  // 2. Extract refresh token from cookie
  const refreshToken = request.cookies?.refreshToken;

  // 3. Call Identity Service
  const result = await identityService.validateToken({
    accessToken,
    refreshToken
  });

  // 4. If valid, attach user to request
  if (result.valid) {
    request.user = result.user;

    // 5. If new access token, set header
    if (result.newAccessToken) {
      response.setHeader('X-New-Access-Token', result.newAccessToken);
    }

    return true;
  }

  throw new UnauthorizedException();
}
```

---

## 🚀 Testing Guide

### 1. Test Login

```bash
curl -X POST http://localhost:8888/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt  # Save cookies

# Response:
{
  "code": 200,
  "data": {
    "userId": "...",
    "accessToken": "eyJhbG...",
    ...
  }
}

# Cookie set: refreshToken (httpOnly)
```

### 2. Test Authenticated Request

```bash
ACCESS_TOKEN="eyJhbG..."

curl -X GET http://localhost:8888/identity/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt  # Send cookies
```

### 3. Test Auto-Refresh (wait 5+ minutes)

```bash
# Access token expired, but refresh token still valid
curl -X GET http://localhost:8888/identity/users/my-user \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -v  # Verbose để xem headers

# Response headers sẽ có:
# X-New-Access-Token: eyJhbG...
```

### 4. Test Manual Refresh

```bash
curl -X GET http://localhost:8888/identity/auth/refresh \
  -b cookies.txt

# Response:
{
  "accessToken": "new_token_here"
}
```

### 5. Test Logout

```bash
curl -X GET http://localhost:8888/identity/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

1. **Token Refresh Rate**

   - How often tokens are auto-refreshed
   - High rate → consider longer access token lifetime

2. **Token Blacklist Size**

   - Number of tokens in blacklist
   - Growth rate

3. **Failed Validation Rate**

   - Invalid tokens attempts
   - Potential attack indicator

4. **Logout Rate**
   - Active session terminations

### Logging Strategy

```typescript
// Log important auth events
logger.info("User logged in", { userId, ip, userAgent });
logger.info("Token refreshed", { userId, oldTokenExp, newTokenExp });
logger.warn("Invalid token attempt", { token: hash(token), ip });
logger.info("User logged out", { userId, tokensBlacklisted: 2 });
```

---

## ⚠️ Security Considerations

### 1. HTTPS is MANDATORY

```
❌ NEVER use HTTP in production
✅ ALWAYS enforce HTTPS for cookies to work securely
```

### 2. Cookie Configuration

```javascript
// Production
{
  httpOnly: true,      // XSS protection
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  domain: '.yourdomain.com',  // Subdomain support
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

### 3. JWT Secret Management

- ✅ Use strong random secrets (256-bit minimum)
- ✅ Store in environment variables / secrets manager
- ✅ Rotate regularly (có blacklist nên rotate dễ)
- ❌ Never commit to git

### 4. Token Storage Best Practices

**Access Token:**

- ✅ Memory (React state, Vuex)
- ✅ SessionStorage (if needed)
- ⚠️ LocalStorage (acceptable but less secure)
- ❌ Cookies (already used for refresh)

**Refresh Token:**

- ✅ HttpOnly Cookie (implemented)
- ❌ LocalStorage
- ❌ SessionStorage
- ❌ Accessible from JS

---

## 🔄 Migration từ Old System

### Step 1: Deploy Identity Service với JWT logic

```bash
cd src/backend/identity
npm install
npm run migration:run  # Update RemoveToken schema
npm run start:dev
```

### Step 2: Deploy API Gateway với AuthGuard mới

```bash
cd src/backend/api-gateway
npm install
# Remove JwtModule dependencies (optional cleanup)
npm run start:dev
```

### Step 3: Update Frontend

```javascript
// Old: Không có access token trong response
// New: Lưu access token
const response = await axios.post("/auth/login", credentials);
localStorage.setItem("accessToken", response.data.accessToken);

// Add interceptor
axios.interceptors.response.use((res) => {
  const newToken = res.headers["x-new-access-token"];
  if (newToken) localStorage.setItem("accessToken", newToken);
  return res;
});
```

### Step 4: Test thoroughly

- [ ] Login flow
- [ ] Authenticated requests
- [ ] Auto-refresh after 5 minutes
- [ ] Manual refresh
- [ ] Logout
- [ ] Role-based access

---

## 🎯 Best Practices

### DO ✅

- Use HTTPS in production
- Set proper cookie attributes
- Implement token refresh on client
- Log auth events for audit
- Clean up expired blacklist tokens
- Handle token refresh failures gracefully
- Use correlation IDs for tracing

### DON'T ❌

- Store refresh token in localStorage
- Ignore X-New-Access-Token header
- Skip token validation
- Hard-code secrets
- Allow HTTP in production
- Forget to blacklist on logout

---

## 🐛 Troubleshooting

### Problem: "Unauthorized" ngay sau login

**Cause:** AccessToken không được gửi trong header  
**Solution:** Check client code - đảm bảo set `Authorization: Bearer <token>`

### Problem: Token refresh không hoạt động

**Cause:** Cookie không được gửi  
**Solution:**

- Check CORS settings: `credentials: 'include'`
- Check cookie domain & path
- Verify SameSite attribute

### Problem: "Token expired" mặc dù vừa refresh

**Cause:** Clock skew giữa services  
**Solution:** Sync server times (NTP)

### Problem: Blacklist table quá lớn

**Cause:** Không cleanup expired tokens  
**Solution:** Setup cron job cleanup

---

## 📚 References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Token Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**END OF DOCUMENTATION**

_Kiến trúc này đảm bảo security tốt nhất với UX tối ưu. JWT secret được bảo vệ, tokens ngắn hạn, và có khả năng auto-refresh seamless._
