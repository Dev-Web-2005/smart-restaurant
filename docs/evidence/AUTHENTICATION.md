# Xác thực và Phân quyền - Smart Restaurant

## Tổng quan

Hệ thống sử dụng JWT (JSON Web Token) kết hợp với Passport.js để xác thực và RBAC (Role-Based Access Control) để phân quyền.

## Kiến trúc Xác thực

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────>│ API Gateway  │────>│  Identity    │
│   Request    │     │ JWT Verify   │     │   Service    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           │ Valid JWT?
                           ▼
                    ┌──────────────┐
                    │   Forward    │
                    │ to Service   │
                    └──────────────┘
```

## Các Phương thức Xác thực

### 1. Email/Password

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh-token
```

### 2. Google OAuth

```
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
```

### 3. Password Reset

```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

## JWT Token Structure

### Access Token

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "ADMIN",
  "tenantId": "tenant_id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Cấu hình:**

- Expiry: 5 phút
- Algorithm: HS256
- Secret: JWT_SECRET_KEY_ACCESS

### Refresh Token

```json
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Cấu hình:**

- Expiry: 7 ngày
- Algorithm: HS256
- Secret: JWT_SECRET_KEY_REFRESH
- Stored: HttpOnly Cookie

## Hệ thống Vai trò (RBAC)

### Các Vai trò

| Role     | Mô tả             | Quyền hạn        |
| -------- | ----------------- | ---------------- |
| ADMIN    | Quản trị hệ thống | Tất cả quyền     |
| USER     | Chủ nhà hàng      | Quản lý nhà hàng |
| STAFF    | Nhân viên         | Xem đơn hàng     |
| CHEF     | Nhân viên bếp     | Cập nhật món     |
| WAITER   | Phục vụ           | Quản lý đơn      |
| CUSTOMER | Khách hàng        | Đặt món, xem đơn |

### Ma trận Quyền

```
┌─────────────┬───────┬───────┬───────┬───────┬───────┬──────────┐
│ Resource    │SUPER  │ADMIN  │STAFF  │KITCHEN│WAITER │CUSTOMER  │
├─────────────┼───────┼───────┼───────┼───────┼───────┼──────────┤
│ Users       │ CRUD  │ CRU   │ R     │ -     │ -     │ R(self)  │
│ Tenants     │ CRUD  │ RU    │ R     │ R     │ R     │ -        │
│ Categories  │ CRUD  │ CRUD  │ R     │ R     │ R     │ R        │
│ Menu Items  │ CRUD  │ CRUD  │ R     │ R     │ R     │ R        │
│ Tables      │ CRUD  │ CRUD  │ R     │ -     │ R     │ R        │
│ Orders      │ CRUD  │ CRUD  │ RU    │ RU    │ RU    │ CR(own)  │
│ Reviews     │ CRUD  │ RD    │ R     │ -     │ -     │ CR(own)  │
└─────────────┴───────┴───────┴───────┴───────┴───────┴──────────┘

C = Create, R = Read, U = Update, D = Delete
```

## Password Security

### Hashing

```typescript
// Sử dụng bcrypt với salt rounds = 10
const hashedPassword = await bcrypt.hash(password, 10);
```

### Validation Rules

- Độ dài tối thiểu: 8 ký tự
- Phải chứa: chữ hoa, chữ thường, số
- Có thể chứa: ký tự đặc biệt

## Email Verification

### Flow

```
1. User đăng ký
2. Hệ thống gửi email verification link
3. Link chứa token (expire: 24h)
4. User click link → Account activated
```

### Verification Token

```
/api/v1/auth/verify-email?token={verification_token}
```

## Google OAuth Integration

### Configuration

```env
CLIENT_ID=xxx.apps.googleusercontent.com
CLIENT_SECRET=GOCSPX-xxx
REDIRECT_URI=http://localhost:5173/google-authenticate
```

### Flow

```
1. User click "Login with Google"
2. Redirect to Google OAuth consent
3. Google callback với auth code
4. Exchange code lấy tokens
5. Get user info từ Google
6. Create/Update user trong DB
7. Issue JWT tokens
```

## Guards và Decorators

### @Public()

```typescript
@Public()
@Get('menu')
getPublicMenu() { ... }
```

### @Roles()

```typescript
@Roles('ADMIN')
@Get('admin/users')
getUsers() { ... }
```

### @CurrentUser()

```typescript
@Get('profile')
getProfile(@CurrentUser() user: User) { ... }
```

## Token Storage (Client)

### Access Token

- Stored: Memory (không persist)
- Used: Authorization header

```
Authorization: Bearer {access_token}
```

### Refresh Token

- Stored: HttpOnly Cookie
- Auto-refresh khi access token expire

## Cấu hình Bảo mật

```env
# JWT
ACCESS_TOKEN_EXPIRY=5m
REFRESH_TOKEN_EXPIRY=7d
JWT_SECRET_KEY_ACCESS=long-random-string-1
JWT_SECRET_KEY_REFRESH=long-random-string-2
JWT_SECRET_KEY_RESET_PASSWORD=long-random-string-3

# Cookie
REFRESH_TOKEN_EXPIRES_IN=604800000  # 7 days in ms
COOKIE_DOMAIN=.lethanhcong.site

# Google OAuth
CLIENT_ID=xxx
CLIENT_SECRET=xxx
REDIRECT_URI=http://localhost:5173/google-authenticate
```

## Best Practices đã áp dụng

1. **Short-lived Access Token** - Giảm window of attack
2. **HttpOnly Refresh Cookie** - Chống XSS
3. **Token Rotation** - Refresh token đổi sau mỗi lần dùng
4. **Password Hashing** - bcrypt với salt
5. **Role-based Access** - Phân quyền chi tiết
6. **Input Validation** - Validate tất cả input
7. **Rate Limiting** - Chống brute force
