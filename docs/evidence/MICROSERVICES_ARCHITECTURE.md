# Kiến trúc Microservices - Smart Restaurant

## Tổng quan Kiến trúc

Smart Restaurant sử dụng kiến trúc Microservices Multi-Tenant với hơn 10 dịch vụ được phân chia theo chức năng.

## Sơ đồ Kiến trúc Tổng quan

```
                                    ┌─────────────────┐
                                    │     Client      │
                                    │  (React + Vite) │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │   (Port 8888)   │
                                    └────────┬────────┘
                                             │
            ┌────────────────────────────────┼────────────────────────────────┐
            │                    │           │           │                    │
            ▼                    ▼           ▼           ▼                    ▼
    ┌───────────────┐   ┌───────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐
    │   Identity    │   │    Profile    │ │  Product  │ │   Table   │ │     Order     │
    │  (Port 8084)  │   │  (Port 8081)  │ │(Port 8082)│ │(Port 8083)│ │  (Port 8087)  │
    └───────┬───────┘   └───────────────┘ └───────────┘ └───────────┘ └───────┬───────┘
            │                                                                  │
            │                    ┌───────────────────────────────┐            │
            │                    │          RabbitMQ             │            │
            │                    │      (Message Broker)         │◄───────────┘
            │                    └───────────────┬───────────────┘
            │                                    │
            │           ┌────────────────────────┼────────────────────────┐
            │           │                        │                        │
            │           ▼                        ▼                        ▼
            │   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
            │   │    Kitchen    │       │    Waiter     │       │ Notification  │
            │   │  (Port 8086)  │       │  (Port 8088)  │       │  (Port 8085)  │
            │   └───────────────┘       └───────────────┘       └───────────────┘
            │
            └──────────────────────────────────────────────────────────────────────┐
                                                                                   │
                                    External Services                              │
            ┌──────────────────────────────────────────────────────────────────────┼──┐
            │                                                                      │  │
            │   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐          │  │
            │   │  File Service │   │  Mail Service │   │    Payment    │          │  │
            │   │               │   │               │   │    Service    │◄─────────┘  │
            │   └───────────────┘   └───────────────┘   └───────────────┘             │
            │                                                                         │
            │   ┌───────────────┐   ┌───────────────┐                                 │
            │   │     Redis     │   │  PostgreSQL   │                                 │
            │   │    (Cache)    │   │  (Database)   │                                 │
            │   └───────────────┘   └───────────────┘                                 │
            └─────────────────────────────────────────────────────────────────────────┘
```

## Các Dịch vụ Chính (9 Dịch vụ)

### 1. API Gateway (Port 8888)

- **Chức năng:** Điểm vào duy nhất cho tất cả request
- **Công nghệ:** NestJS
- **Trách nhiệm:**
  - Routing request đến các service
  - Xác thực JWT token
  - Rate limiting
  - Request/Response transformation
  - WebSocket proxy cho real-time

### 2. Identity Service (Port 8084)

- **Chức năng:** Xác thực và quản lý người dùng
- **Công nghệ:** NestJS, Passport.js, JWT
- **Trách nhiệm:**
  - Đăng ký/Đăng nhập
  - JWT token generation/validation
  - Password hashing (bcrypt)
  - Google OAuth integration
  - Email verification
  - Password reset

### 3. Profile Service (Port 8081)

- **Chức năng:** Quản lý hồ sơ người dùng và tenant
- **Công nghệ:** NestJS, TypeORM
- **Trách nhiệm:**
  - CRUD user profiles
  - Tenant management
  - Avatar upload

### 4. Product Service (Port 8082)

- **Chức năng:** Quản lý menu, danh mục, món ăn
- **Công nghệ:** NestJS, TypeORM
- **Trách nhiệm:**
  - CRUD categories
  - CRUD menu items
  - Modifier groups và options
  - Fuzzy search
  - Popularity tracking (order count)

### 5. Table Service (Port 8083)

- **Chức năng:** Quản lý bàn và mã QR
- **Công nghệ:** NestJS, qrcode library
- **Trách nhiệm:**
  - CRUD tables
  - QR code generation (HMAC-SHA256 signed)
  - Token versioning cho revocation
  - QR download as PNG

### 6. Order Service (Port 8087)

- **Chức năng:** Quản lý đơn hàng và vòng đời
- **Công nghệ:** NestJS, TypeORM, RabbitMQ
- **Trách nhiệm:**
  - Order state machine
  - Order item management
  - Status tracking
  - Event emission to RabbitMQ
  - Bill generation

### 7. Kitchen Service (Port 8086)

- **Chức năng:** Hệ thống hiển thị bếp (KDS)
- **Công nghệ:** NestJS, RabbitMQ
- **Trách nhiệm:**
  - Receive order events
  - Update item preparation status
  - Timer tracking (warning/critical thresholds)
  - Notify when items ready

### 8. Waiter Service (Port 8088)

- **Chức năng:** Quản lý đơn hàng cho waiter
- **Công nghệ:** NestJS, RabbitMQ
- **Trách nhiệm:**
  - Accept/Reject order items
  - View pending orders
  - Monitor order progress

### 9. Notification Service (Port 8085)

- **Chức năng:** Thông báo thời gian thực
- **Công nghệ:** NestJS, Socket.IO, RabbitMQ
- **Trách nhiệm:**
  - WebSocket connections management
  - Real-time status updates
  - Email notifications
  - Push notifications

## Dịch vụ Bên ngoài

### File Service (External - Render)

- **URL:** https://file-service-cdal.onrender.com
- **Chức năng:** Lưu trữ và quản lý hình ảnh
- **Features:**
  - Image upload
  - Image optimization
  - CDN delivery

### Mail Service

- **Chức năng:** Gửi email
- **Features:**
  - Email verification
  - Password reset
  - Order notifications
  - Template-based emails

### Payment Service

- **Chức năng:** Xử lý thanh toán
- **Features:**
  - QR payment integration
  - Payment status tracking
  - Bill generation

### Redis Cache

- **Port:** 46271
- **Chức năng:** Caching và session management
- **Features:**
  - Cart caching
  - Session storage
  - Rate limiting data

### RabbitMQ

- **Port:** 46270
- **Chức năng:** Message broker
- **Queues:**
  - `local_notification` - Notification events
  - `local_kitchen` - Kitchen events
  - `local_api_gateway` - API Gateway events

## Giao tiếp giữa các Service

### Synchronous (HTTP/REST)

- API Gateway → All Services
- Identity → Profile (user creation)

### Asynchronous (RabbitMQ)

- Order → Kitchen (new order events)
- Order → Notification (status updates)
- Order → API Gateway (WebSocket broadcast)
- Kitchen → Notification (item ready)
- Payment → Order (payment completed)

## Database Architecture

Mỗi service có database PostgreSQL riêng:

- `identity_db`
- `profile_db`
- `product_db`
- `table_db`
- `order_db`

## Công nghệ Sử dụng

| Component         | Technology                    |
| ----------------- | ----------------------------- |
| Backend Framework | NestJS                        |
| Frontend          | React 19 + Vite + TailwindCSS |
| Database          | PostgreSQL                    |
| Cache             | Redis                         |
| Message Broker    | RabbitMQ                      |
| WebSocket         | Socket.IO                     |
| Authentication    | JWT + Passport.js             |
| Containerization  | Docker + Docker Compose       |
| CI/CD             | GitHub Actions                |

## Multi-Tenant Architecture

- Mỗi tenant (nhà hàng) được định danh bằng `tenant_id`
- Row-Level Security đảm bảo cô lập dữ liệu
- Shared infrastructure, isolated data
- Tenant-specific configurations (timezone, currency)
