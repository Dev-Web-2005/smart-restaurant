# 📊 BẢNG TỔNG HỢP MICROSERVICES ARCHITECTURE

## 🎯 Tóm tắt nhanh

Để hoàn thiện hệ thống Smart Restaurant theo yêu cầu, bạn cần **THÊM 4 SERVICES** ngoài 3 services đã thực hiện.

---

## ✅ ĐÃ THỰC HIỆN (3 services)

| #   | Service              | Port | Status  | Mô tả                                 |
| --- | -------------------- | ---- | ------- | ------------------------------------- |
| 1   | **API Gateway**      | 8888 | ✅ Done | Entry point, routing, auth validation |
| 2   | **Identity Service** | 3001 | ✅ Done | Auth, Users, Roles, JWT               |
| 3   | **Profile Service**  | 3002 | ✅ Done | User & Tenant profiles                |

---

## 🔄 ĐANG THỰC HIỆN (1 service)

| #   | Service             | Port | Status         | Mô tả                              | Completion |
| --- | ------------------- | ---- | -------------- | ---------------------------------- | ---------- |
| 4   | **Product Service** | 3003 | 🔄 In Progress | Menu, Categories, Items, Modifiers | ~70%       |

**Còn lại:**

- Modifier implementation
- Publish/unpublish logic
- Public menu API

**Estimated:** 1 sprint

---

## ❌ CẦN BỔ SUNG (4 services - CRITICAL cho MVP)

| #   | Service                  | Port | Priority | Effort      | Blocker Level |
| --- | ------------------------ | ---- | -------- | ----------- | ------------- |
| 5   | **Table Service**        | 3004 | 🔴 P1    | 1-2 sprints | **BLOCKER**   |
| 6   | **Order Service**        | 3005 | 🔴 P2    | 2-3 sprints | **BLOCKER**   |
| 7   | **Payment Service**      | 3006 | 🔴 P3    | 1-2 sprints | **BLOCKER**   |
| 8   | **Notification Service** | 3007 | 🟡 P4    | 1-2 sprints | Important     |

---

## 📋 CHI TIẾT 4 SERVICES CẦN BỔ SUNG

### 5️⃣ TABLE SERVICE (Port 3004) - 🔴 PRIORITY 1

**Tại sao cần:**

- Core feature: QR Ordering
- Không có service này = Customers không thể scan QR
- Blocker cho toàn bộ customer ordering flow

**Chức năng chính:**

- ✅ Quản lý bàn (CRUD)
- ✅ Generate QR code (PNG/SVG)
- ✅ Sign QR token với HMAC-SHA256
- ✅ Validate QR token (public endpoint)
- ✅ Regenerate QR (tăng version, invalidate old tokens)
- ✅ Table status management

**Entities:**

```typescript
Table {
  id: uuid
  tenant_id: uuid
  name: string
  capacity: number
  location: string
  status: 'active' | 'inactive'
  qr_token_version: number
}
```

**QR Token Structure:**

```json
{
  "tenantId": "uuid",
  "tableId": "uuid",
  "version": 1,
  "iat": 1234567890,
  "exp": 1702766890
}
```

**API Endpoints:**

- `POST /tenants/:id/tables` - Create table
- `GET /tenants/:id/tables` - List tables
- `POST /tables/:id/qr/generate` - Generate QR
- `GET /public/scan/:token` - Validate token (public)

**Dependencies:**

- Call Identity Service để validate tenant exists

**Estimate:** 1-2 sprints

---

### 6️⃣ ORDER SERVICE (Port 3005) - 🔴 PRIORITY 2

**Tại sao cần:**

- Core business logic của toàn bộ hệ thống
- Không có service này = Không thể đặt món
- Handle toàn bộ order lifecycle

**Chức năng chính:**

- ✅ Order creation từ customer cart
- ✅ Order state machine (10 states, 15+ transitions)
- ✅ Order items với modifiers (JSONB)
- ✅ Real-time order updates (WebSocket)
- ✅ Order history & audit trail
- ✅ KPI tracking (time-to-serve)

**Entities:**

```typescript
Order {
  id: uuid
  tenant_id: uuid
  table_id: uuid
  status: OrderStatus // State machine
  total: decimal
  currency: string
  customer_name?: string
  notes?: string
  created_at: timestamp
  updated_at: timestamp
}

OrderItem {
  id: uuid
  order_id: uuid
  item_id: uuid
  quantity: number
  unit_price: decimal
  line_total: decimal
  modifiers: jsonb // Selected modifiers
}

OrderStatusHistory {
  id: uuid
  order_id: uuid
  from_status: string
  to_status: string
  changed_by: uuid
  changed_at: timestamp
}
```

**Order State Machine:**

```
Draft → Submitted → PaymentPending → Received
                                   ↓
                              Preparing → Ready → Completed
                                   ↓
                              Cancelled
```

**API Endpoints:**

- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update status
- `GET /tenants/:id/orders` - List orders (staff)
- `WS /orders/subscribe/:tenantId` - Real-time updates

**Dependencies:**

- → Product Service (validate menu items)
- → Table Service (validate table token)
- → Payment Service (check payment)
- → Notification Service (emit events)

**Estimate:** 2-3 sprints

---

### 7️⃣ PAYMENT SERVICE (Port 3006) - 🔴 PRIORITY 3

**Tại sao cần:**

- Xử lý thanh toán - critical cho revenue
- Integration với payment gateways
- Không có service này = Orders không thể complete

**Chức năng chính:**

- ✅ Payment intent creation
- ✅ Stripe integration
- ✅ PayPal integration (optional)
- ✅ Momo integration (optional)
- ✅ Webhook handling (idempotent)
- ✅ Refund processing
- ✅ Bill-to-table support

**Entities:**

```typescript
Payment {
  id: uuid
  order_id: uuid
  tenant_id: uuid
  amount: decimal
  currency: string
  method: 'card' | 'cash' | 'bill-to-table'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  provider: 'stripe' | 'paypal' | 'momo'
  provider_transaction_id: string
}

PaymentIntent {
  id: uuid
  payment_id: uuid
  intent_id: string
  client_secret: string
  expires_at: timestamp
}
```

**API Endpoints:**

- `POST /payments/intent` - Create payment intent
- `GET /payments/:id` - Get payment status
- `POST /payments/:id/refund` - Process refund
- `POST /webhooks/stripe` - Stripe webhook
- `POST /webhooks/paypal` - PayPal webhook

**External Integrations:**

- Stripe API
- PayPal API
- Momo API

**Dependencies:**

- Update Order Service khi payment complete/failed

**Estimate:** 1-2 sprints

---

### 8️⃣ NOTIFICATION SERVICE (Port 3007) - 🟡 PRIORITY 4

**Tại sao cần:**

- Real-time UX cho staff & customers
- Critical cho Kitchen Display System
- Email confirmations cho orders

**Chức năng chính:**

- ✅ WebSocket server (Socket.io)
- ✅ Email notifications (SendGrid/SES)
- ✅ SMS notifications (Twilio) - optional
- ✅ Browser push notifications
- ✅ Event broadcasting (Redis Pub/Sub)

**Notification Types:**

**Staff:**

- New order received → Sound + Badge
- Order cancelled → Alert
- Payment received → Notification

**Customer:**

- Order confirmed → Email
- Order preparing → Push
- Order ready → Push + SMS
- Payment success/failed → Email

**API Endpoints:**

- `WS /ws/staff/:tenantId` - WebSocket cho staff
- `WS /ws/customer/:orderId` - WebSocket cho customers
- `POST /notifications/email` - Send email
- `POST /notifications/sms` - Send SMS

**Infrastructure:**

- Redis Pub/Sub
- Socket.io
- Email queue

**Dependencies:**

- Subscribe events từ Order Service
- Subscribe events từ Payment Service

**Estimate:** 1-2 sprints

---

## 🔗 SERVICE DEPENDENCIES MAP

```
Customer Flow:
┌─────────┐
│Customer │
└────┬────┘
     │ Scan QR
     ▼
┌─────────────────┐
│  Table Service  │ ← Validate tenant (Identity)
└────┬────────────┘
     │ Get menu
     ▼
┌──────────────────┐
│ Product Service  │
└────┬─────────────┘
     │ Create order
     ▼
┌─────────────────┐
│  Order Service  │ ← Get items (Product)
└────┬────────────┘  ← Validate table (Table)
     │ Process payment
     ▼
┌──────────────────┐
│ Payment Service  │ ← External APIs
└────┬─────────────┘
     │ Notify
     ▼
┌───────────────────────┐
│ Notification Service  │ → Staff (WebSocket)
└───────────────────────┘ → Customer (Email/Push)
```

---

## 📅 RECOMMENDED IMPLEMENTATION TIMELINE

### Week 1-2: Complete Product Service

- Finish modifiers
- Public menu API
- Testing

### Week 3-4: Table Service

- Table CRUD
- QR generation & signing
- Token validation
- Testing

### Week 5-8: Order Service (Complex)

- Week 5-6: Order creation & state machine
- Week 7-8: Real-time updates & integrations

### Week 9-10: Payment Service

- Stripe integration
- Webhook handling
- Refund logic

### Week 11-12: Notification Service

- WebSocket setup
- Email integration
- Event handlers

### Week 13-14: Integration & Testing

- E2E tests
- Performance testing
- Bug fixes

**Total MVP Timeline:** 14 weeks (~3.5 months) với 3-4 developers

---

## 🎯 WHY THESE 4 SERVICES ARE CRITICAL

### ❌ Không có Table Service:

- ❌ Customers không thể scan QR
- ❌ FR-3 (Table Management) failed
- ❌ FR-4 (QR Ordering) failed
- **Impact:** 100% blocking

### ❌ Không có Order Service:

- ❌ Không thể tạo orders
- ❌ Không có order tracking
- ❌ Staff không thể manage orders
- **Impact:** 100% blocking

### ❌ Không có Payment Service:

- ❌ Orders không thể complete
- ❌ Không có revenue
- ❌ FR-7 (Payment & Billing) failed
- **Impact:** 90% blocking (có thể dùng bill-to-table tạm)

### ❌ Không có Notification Service:

- ❌ Không có real-time updates
- ❌ Staff bị delay trong việc nhận orders
- ❌ UX kém
- **Impact:** 60% blocking (có thể dùng polling tạm)

---

## ✅ CURRENT ARCHITECTURE ASSESSMENT

### Strengths:

- ✅ Solid foundation với API Gateway, Identity, Profile
- ✅ Multi-tenant isolation strategy clear
- ✅ Good separation of concerns
- ✅ Database per service approach

### Gaps:

- ❌ Missing core ordering flow (Table → Order → Payment)
- ❌ No real-time communication infrastructure
- ❌ Payment integration not started

### Recommendations:

1. **Immediate:** Complete Product Service
2. **Next:** Parallel development:
   - Stream 1: Table Service
   - Stream 2: Order Service design
3. **Then:** Payment Service → Notification Service
4. **Finally:** Integration testing & optimization

---

## 📊 EFFORT SUMMARY

| Service              | Complexity | Effort    | Team Size | Duration     |
| -------------------- | ---------- | --------- | --------- | ------------ |
| Product (remaining)  | Medium     | 2 weeks   | 1 dev     | 2 weeks      |
| Table Service        | Medium     | 3-4 weeks | 1 dev     | 1 month      |
| Order Service        | High       | 6-8 weeks | 2 devs    | 1-1.5 months |
| Payment Service      | High       | 3-4 weeks | 1 dev     | 1 month      |
| Notification Service | Medium     | 3-4 weeks | 1 dev     | 1 month      |

**Total (with parallel work):** ~3-4 months với 3-4 developers

---

## 🚀 QUICK START GUIDE

Để bắt đầu implement các services còn lại:

### 1. Table Service Template

```bash
cd src/backend
npx @nestjs/cli new table
cd table
npm install @nestjs/typeorm typeorm pg qrcode jsonwebtoken
```

### 2. Order Service Template

```bash
cd src/backend
npx @nestjs/cli new order
cd order
npm install @nestjs/typeorm typeorm pg @nestjs/websockets socket.io
```

### 3. Payment Service Template

```bash
cd src/backend
npx @nestjs/cli new payment
cd payment
npm install @nestjs/typeorm typeorm pg stripe @paypal/checkout-server-sdk
```

### 4. Notification Service Template

```bash
cd src/backend
npx @nestjs/cli new notification
cd notification
npm install @nestjs/websockets socket.io redis @sendgrid/mail twilio
```

---

## 📚 DOCUMENTATION REFERENCES

Tất cả requirements chi tiết có trong:

1. **Architecture:** `/docs/03-architecture/MICROSERVICES_ARCHITECTURE.md`
2. **Service Diagram:** `/src/backend/service-architecture-diagram.md`
3. **User Stories:** `/docs/01-product/06-USER_STORIES.md`
4. **ER Diagram:** `/docs/03-architecture/ER_DIAGRAM.md`
5. **API Spec:** `/docs/02-api/openapi.yaml`
6. **State Machine:** `/docs/01-product/diagrams/order-state-machine.md`
7. **Ordering Flow:** `/docs/01-product/diagrams/ordering-flow.md`

---

## ✅ CHECKLIST BEFORE MVP LAUNCH

### Services:

- [x] API Gateway
- [x] Identity Service
- [x] Profile Service
- [ ] Product Service (70% done)
- [ ] Table Service
- [ ] Order Service
- [ ] Payment Service
- [ ] Notification Service

### Features:

- [ ] Customer can scan QR → view menu
- [ ] Customer can create order with modifiers
- [ ] Payment processing works (Stripe)
- [ ] Staff receives real-time order notifications
- [ ] Staff can update order status
- [ ] Customer sees order status updates
- [ ] Email confirmations sent

### Non-functional:

- [ ] Multi-tenant isolation tested
- [ ] Performance tested (1000 concurrent/tenant)
- [ ] Security audit passed
- [ ] E2E tests passing
- [ ] Monitoring & logging setup

---

**TÓM LẠI: Bạn cần implement THÊM 4 SERVICES để hoàn thiện MVP:**

1. 🔴 **Table Service** - CRITICAL
2. 🔴 **Order Service** - CRITICAL
3. 🔴 **Payment Service** - CRITICAL
4. 🟡 **Notification Service** - IMPORTANT

**Timeline:** ~3-4 months với 3-4 backend developers

---

_Document prepared: December 6, 2025_  
_Based on analysis of project requirements and existing codebase_
