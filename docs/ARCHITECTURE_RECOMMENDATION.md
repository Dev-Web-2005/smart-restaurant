# 🎯 Đề xuất Kiến trúc Microservices - Smart Restaurant

**Prepared by:** Technical Architecture Team  
**Date:** December 6, 2025  
**Status:** Architecture Proposal

---

## 📋 Executive Summary

Dựa trên phân tích tài liệu yêu cầu (SRS, User Stories, ER Diagram, API Spec), hệ thống Smart Restaurant cần **8 microservices** để đáp ứng đầy đủ yêu cầu MVP.

**Current Status:**

- ✅ Đã hoàn thành: 3/8 services (37.5%)
- 🔄 Đang thực hiện: 1/8 services (12.5%)
- ❌ Cần thực hiện: 4/8 services (50%)

---

## 🏗️ Kiến trúc Services - Đầy đủ

### Group 1: Authentication & User Management ✅

#### 1. Identity Service (Port 3001) - ✅ DONE

**Responsibilities:**

- User authentication (login/logout)
- JWT token generation & validation
- User CRUD operations
- Role & Authority management (RBAC)
- Super Admin operations

**Entities:** User, Role, Authority, RemoveToken  
**Status:** ✅ Production ready

---

#### 2. Profile Service (Port 3002) - ✅ DONE

**Responsibilities:**

- User profile management
- Tenant profile management
- Tenant settings (timezone, currency, opening hours)
- Onboarding status tracking

**Entities:** Profile, TenantProfile  
**Status:** ✅ Production ready

---

### Group 2: Menu & Table Management

#### 3. Product Service (Port 3003) - 🔄 IN PROGRESS

**Responsibilities:**

- Menu category management (CRUD)
- Menu item management (CRUD)
- Modifier management (groups & options)
- Publish/unpublish menu
- Menu availability control
- Public menu API for customers

**Entities:**

- `MenuCategory` (id, tenant_id, name, description, published, display_order)
- `MenuItem` (id, tenant_id, category_id, name, description, price, currency, image_url, available, published)
- `ModifierGroup` (id, item_id, name, type, required)
- `ModifierOption` (id, group_id, label, price_delta)

**Key APIs:**

```
GET/POST /tenants/:tenantId/menu/categories
GET/POST /tenants/:tenantId/menu/items
POST /items/:id/modifiers
POST /categories/:id/publish
GET /public/menu/:tenantId (for customers)
```

**Status:** 🔄 ~70% complete
**Remaining Work:**

- Modifier implementation
- Publish/unpublish logic
- Public menu API
- Item availability logic

**Estimated Completion:** 1 sprint

---

#### 4. Table Service (Port 3004) - ❌ TO DO - **PRIORITY 1**

**Responsibilities:**

- Table management (CRUD)
- QR code generation (PNG/SVG)
- QR token signing (HMAC-SHA256)
- QR token validation
- QR regeneration (token versioning)
- Table status management (active/inactive)

**Entities:**

- `Table` (id, tenant_id, name, capacity, location, status, qr_token_version)
- `QRToken` (optional cache for metadata)

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

**Key APIs:**

```
GET/POST /tenants/:tenantId/tables
PUT /tables/:id
POST /tables/:id/qr/generate (returns signed token + QR image)
GET /public/scan/:token (validate & redirect)
```

**Business Rules:**

- Token signed with HMAC-SHA256
- Version increments on regenerate → invalidates old QRs
- Token expiry: 1 year (configurable)
- Validation checks: signature, expiry, version match DB

**Why Critical:**

- Blockers cho customer ordering flow
- Core feature của QR ordering system
- Required by Order Service để validate tables

**Estimated Effort:** 1-2 sprints

---

### Group 3: Order & Payment Processing

#### 5. Order Service (Port 3005) - ❌ TO DO - **PRIORITY 2**

**Responsibilities:**

- Order lifecycle management
- Order state machine implementation
- Order items với modifiers
- Real-time order updates (WebSocket)
- Order history & audit trail
- KPI tracking (time-to-serve)

**Entities:**

- `Order` (id, tenant_id, table_id, status, total, currency, customer_name, notes, created_at, updated_at)
- `OrderItem` (id, order_id, item_id, quantity, unit_price, line_total, modifiers JSONB)
- `OrderStatusHistory` (id, order_id, from_status, to_status, changed_by, changed_at)

**State Machine:**

```
Draft → Submitted → PaymentPending → Received → Preparing → Ready → Completed
                                  ↓
                              PaymentFailed → Retry or Cancel

Cancellation paths: Any state → Cancelled (with rules)
```

**Key APIs:**

```
POST /orders (create from cart)
GET /orders/:id
GET /tenants/:tenantId/orders (list for staff)
PATCH /orders/:id/status (state transitions)
POST /orders/:id/cancel
GET /orders/:id/history
WS /orders/subscribe/:tenantId (real-time)
```

**State Transition Rules:**

- Customer can only: Draft → Submitted
- Staff can: Received → Preparing → Ready → Completed
- System can: PaymentPending → Received/Failed
- Timer starts at: Received → Preparing (for KPI)

**Service Dependencies:**

- → Product Service (validate menu items)
- → Table Service (validate table token)
- → Payment Service (check payment status)
- → Notification Service (emit events)

**Why Critical:**

- Core business logic của toàn bộ hệ thống
- Handle ordering flow từ đầu đến cuối
- Real-time updates cho staff & customers

**Estimated Effort:** 2-3 sprints

---

#### 6. Payment Service (Port 3006) - ❌ TO DO - **PRIORITY 3**

**Responsibilities:**

- Payment intent creation
- Payment gateway integration (Stripe, PayPal, Momo)
- Webhook handling (idempotent)
- Payment status tracking
- Refund processing
- Bill-to-table support (pay later)

**Entities:**

- `Payment` (id, order_id, tenant_id, amount, currency, method, status, provider, provider_transaction_id)
- `PaymentIntent` (id, payment_id, intent_id, client_secret, expires_at)
- `Refund` (id, payment_id, amount, reason, status)

**Payment Flow:**

```
1. Customer chooses payment method
2. Create PaymentIntent → Stripe/PayPal
3. Customer confirms payment → Provider
4. Webhook received → Validate & update
5. Update Order status → Order Service
```

**Key APIs:**

```
POST /payments/intent (create payment)
GET /payments/:id (get status)
POST /payments/:id/confirm
POST /payments/:id/refund
POST /webhooks/stripe (idempotent)
POST /webhooks/paypal
POST /webhooks/momo
```

**Business Rules:**

- Payment intent expires: 30 minutes
- Webhooks must be idempotent (check duplicate events)
- Refund only for completed payments
- Bill-to-table creates payment with status=pending

**External Integrations:**

- Stripe SDK
- PayPal SDK
- Momo API

**Why Critical:**

- Money transactions - zero tolerance for errors
- Required cho order completion
- Complex webhook handling

**Estimated Effort:** 1-2 sprints

---

### Group 4: Communication & Notifications

#### 7. Notification Service (Port 3007) - ❌ TO DO - **PRIORITY 4**

**Responsibilities:**

- WebSocket server (real-time updates)
- Email notifications (SendGrid/AWS SES)
- SMS notifications (Twilio) - optional
- Browser push notifications
- Event broadcasting

**Notification Types:**

**Staff Notifications:**

- New order received
- Order cancelled by customer
- Payment received

**Customer Notifications:**

- Order confirmed
- Order preparing
- Order ready for pickup
- Payment success/failed

**Key APIs:**

```
WS /ws/staff/:tenantId (WebSocket for staff)
WS /ws/customer/:orderId (WebSocket for customers)
POST /notifications/email
POST /notifications/sms
POST /notifications/push
```

**Event Sources:**

- Order Service → order status changes
- Payment Service → payment status changes

**Infrastructure:**

- Redis Pub/Sub for event distribution
- Socket.io for WebSocket
- Email queue for reliability

**Why Important:**

- Real-time experience cho staff & customers
- Critical cho KDS (Kitchen Display System)
- Improve customer satisfaction

**Estimated Effort:** 1-2 sprints

---

### Group 5: Analytics & Reporting (Phase 2) 📋

#### 8. Analytics Service (Port 3008) - FUTURE

**Responsibilities:**

- KPI calculations (conversion rate, AOV, time-to-serve)
- Tenant analytics dashboard data
- Super Admin analytics (cross-tenant)
- Event tracking & aggregation

**Status:** Phase 2 - Nice to have

---

#### 9. Reporting Service (Port 3009) - FUTURE

**Responsibilities:**

- Sales reports generation
- Transaction reports
- Export functionality (CSV, PDF)
- Scheduled reports

**Status:** Phase 2 - Nice to have

---

## 🎯 Đánh giá & Recommendations

### ✅ Services đã thực hiện tốt:

1. **API Gateway** - Solid foundation, tốt
2. **Identity Service** - Complete authentication flow, excellent
3. **Profile Service** - Basic profile management, good

### 🔄 Service đang thực hiện:

4. **Product Service** - Cần complete modifier logic & public API

### ❌ Critical Missing Services (BLOCKERS):

#### **Table Service - BLOCKER #1**

**Why:**

- Không có Table Service = Không có QR ordering
- Toàn bộ customer flow bị block
- FR-3 (Table Management) và FR-4 (QR Ordering) không thể thực hiện

**Impact:** HIGH 🔴  
**Urgency:** IMMEDIATE  
**Recommendation:** Bắt đầu ngay sau khi complete Product Service

---

#### **Order Service - BLOCKER #2**

**Why:**

- Core business logic của hệ thống
- Handle toàn bộ order lifecycle
- Real-time updates critical cho UX

**Impact:** HIGH 🔴  
**Urgency:** CRITICAL  
**Recommendation:** Parallel development với Table Service nếu có resource

---

#### **Payment Service - BLOCKER #3**

**Why:**

- Không có payment = Không thể complete order
- Money transaction yêu cầu high reliability
- Integration complexity cao

**Impact:** HIGH 🔴  
**Urgency:** HIGH  
**Recommendation:** Start sau Order Service, but before launch

---

#### **Notification Service - IMPORTANT**

**Why:**

- Real-time UX cho staff và customers
- Critical cho KDS functionality
- Email confirmations cho orders

**Impact:** MEDIUM 🟡  
**Urgency:** MEDIUM  
**Recommendation:** Có thể start với basic polling, upgrade to WebSocket later

---

## 📅 Recommended Implementation Timeline

### Sprint Current: Hoàn thiện Product Service

**Tasks:**

- [ ] Complete modifier implementation
- [ ] Publish/unpublish logic
- [ ] Public menu API
- [ ] Integration tests
- [ ] API documentation

**Deliverable:** Product Service production ready

---

### Sprint Next: Table Service (Priority 1)

**Tasks:**

- [ ] Table CRUD endpoints
- [ ] QR token signing implementation (HMAC-SHA256)
- [ ] QR code generation (PNG/SVG)
- [ ] Token validation endpoint
- [ ] Token versioning & regeneration
- [ ] Integration with Identity Service
- [ ] Unit + E2E tests

**Deliverable:** Customer có thể scan QR và validate table

---

### Sprint N+2: Order Service - Part 1 (Core)

**Tasks:**

- [ ] Order entity & database schema
- [ ] State machine implementation
- [ ] Order creation endpoint
- [ ] Basic order listing
- [ ] Integration with Product Service
- [ ] Integration with Table Service

**Deliverable:** Basic order creation flow

---

### Sprint N+3: Order Service - Part 2 (Real-time)

**Tasks:**

- [ ] Order status update endpoints
- [ ] State transition validation
- [ ] Audit trail implementation
- [ ] Basic WebSocket setup (or start Notification Service)
- [ ] Staff notification flow

**Deliverable:** Complete order lifecycle

---

### Sprint N+4: Payment Service

**Tasks:**

- [ ] Stripe integration
- [ ] Payment intent creation
- [ ] Webhook handler (idempotent)
- [ ] Payment status tracking
- [ ] Integration with Order Service
- [ ] Bill-to-table support

**Deliverable:** Payment processing functional

---

### Sprint N+5: Notification Service

**Tasks:**

- [ ] WebSocket server setup
- [ ] Redis Pub/Sub integration
- [ ] Email integration (SendGrid/SES)
- [ ] Event handlers for Order/Payment
- [ ] Staff & Customer channels

**Deliverable:** Real-time notifications working

---

### Sprint N+6: Integration & Testing

**Tasks:**

- [ ] End-to-end integration tests
- [ ] Performance testing
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation completion

**Deliverable:** MVP ready for staging

---

## 🚨 Critical Considerations

### 1. Multi-tenant Data Isolation

**Current Approach:** Row-Level Security (RLS) with tenant_id  
**Recommendation:** ✅ Good for MVP, consider schema-per-tenant for scale

### 2. Service-to-Service Authentication

**Options:**

- API Keys (Simple, good for MVP)
- mTLS (Production grade, complex)
- Service Account JWT (Balance)

**Recommendation:** Start với API Keys, plan migration to mTLS

### 3. Database Strategy

**Current:** Separate DB per service  
**Recommendation:** ✅ Correct approach, maintain separation

### 4. Real-time Communication

**Options:**

- Polling (Simple, inefficient)
- WebSocket (Complex, efficient)
- Server-Sent Events (Middle ground)

**Recommendation:** WebSocket cho production UX, polling cho MVP nếu tight timeline

### 5. Event-Driven Architecture

**Current:** Synchronous HTTP calls  
**Future:** Asynchronous events with message queue

**Recommendation:**

- MVP: Sync HTTP calls acceptable
- Phase 2: Introduce RabbitMQ/Kafka for events

---

## 📊 Resource Allocation Suggestion

### Minimum Team Size for Timeline Above:

- **Backend Developers:** 3-4 people
  - 1 lead (architecture + code review)
  - 2-3 developers (feature implementation)
- **DevOps:** 0.5 FTE (setup CI/CD, infrastructure)
- **QA:** 1 person (testing, E2E scenarios)

### Parallel Work Streams:

1. **Stream 1:** Product Service completion → Table Service
2. **Stream 2:** Order Service design → Payment Service
3. **Stream 3:** Infrastructure (Docker, CI/CD, monitoring)

---

## ✅ Success Criteria

### Technical:

- [ ] All 8 services deployable independently
- [ ] 80%+ test coverage per service
- [ ] API documentation complete
- [ ] Security audit passed
- [ ] Performance benchmarks met (1000 concurrent users/tenant)

### Functional:

- [ ] Customer có thể scan QR → order → pay
- [ ] Staff có thể receive → prepare → complete orders
- [ ] Admin có thể manage menu, tables, users
- [ ] Real-time notifications working
- [ ] Multi-tenant isolation verified

### Non-functional:

- [ ] Response time P95 < 500ms
- [ ] Uptime > 99.9%
- [ ] Zero data leakage between tenants
- [ ] Payment success rate > 99%

---

## 📚 Next Actions

### Immediate (This Week):

1. ✅ Review architecture proposal với team
2. ✅ Finalize Product Service scope
3. ✅ Create detailed specs cho Table Service
4. ✅ Setup development environment cho new services

### Short-term (Next 2 Weeks):

1. Complete Product Service
2. Start Table Service development
3. Design Order Service state machine
4. Setup Stripe sandbox account

### Medium-term (Next Month):

1. Table Service complete
2. Order Service Part 1 complete
3. Payment Service design finalized
4. Infrastructure automation

---

## 📞 Contacts & References

**Documentation:**

- Architecture: `/docs/03-architecture/MICROSERVICES_ARCHITECTURE.md`
- Service Diagram: `/src/backend/service-architecture-diagram.md`
- ER Diagram: `/docs/03-architecture/ER_DIAGRAM.md`
- API Spec: `/docs/02-api/openapi.yaml`

**Code:**

- API Gateway: `/src/backend/api-gateway`
- Identity: `/src/backend/identity`
- Profile: `/src/backend/profile`
- Product: `/src/backend/product`

---

**END OF RECOMMENDATION**

_Prepared with analysis of SRS, User Stories, ER Diagram, and existing codebase._
