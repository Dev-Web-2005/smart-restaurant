# Biểu đồ ER - Smart Restaurant

## Tổng quan Cơ sở dữ liệu

Hệ thống sử dụng PostgreSQL với kiến trúc Multi-Tenant, mỗi microservice có database riêng.

## Các Bảng Chính

### 1. Identity Service (identity_db)

```
┌─────────────────────┐
│       USERS         │
├─────────────────────┤
│ id (PK)             │
│ email (UNIQUE)      │
│ password_hash       │
│ role                │
│ tenant_id (FK)      │
│ is_active           │
│ is_verified         │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│       ROLES         │
├─────────────────────┤
│ id (PK)             │
│ name (UNIQUE)       │
│ permissions[]       │
│ created_at          │
└─────────────────────┘
```

### 2. Profile Service (profile_db)

```
┌─────────────────────┐        ┌─────────────────────┐
│      TENANTS        │        │   USER_PROFILES     │
├─────────────────────┤        ├─────────────────────┤
│ id (PK)             │───────<│ id (PK)             │
│ name                │        │ tenant_id (FK)      │
│ slug (UNIQUE)       │        │ user_id (FK)        │
│ email               │        │ first_name          │
│ phone               │        │ last_name           │
│ address             │        │ avatar_url          │
│ logo_url            │        │ phone               │
│ timezone            │        │ created_at          │
│ currency            │        │ updated_at          │
│ created_at          │        └─────────────────────┘
│ updated_at          │
└─────────────────────┘
```

### 3. Product Service (product_db)

```
┌─────────────────────┐        ┌─────────────────────┐
│   MENU_CATEGORIES   │        │     MENU_ITEMS      │
├─────────────────────┤        ├─────────────────────┤
│ id (PK)             │───────<│ id (PK)             │
│ tenant_id           │        │ category_id (FK)    │
│ name                │        │ tenant_id           │
│ description         │        │ name                │
│ image_url           │        │ description         │
│ display_order       │        │ price               │
│ is_published        │        │ image_url           │
│ created_at          │        │ is_available        │
│ updated_at          │        │ is_recommended      │
└─────────────────────┘        │ order_count         │
                               │ display_order       │
                               │ is_published        │
                               │ created_at          │
                               │ updated_at          │
                               └─────────────────────┘

┌─────────────────────┐        ┌─────────────────────┐
│   MODIFIER_GROUPS   │        │  MODIFIER_OPTIONS   │
├─────────────────────┤        ├─────────────────────┤
│ id (PK)             │───────<│ id (PK)             │
│ item_id (FK)        │        │ group_id (FK)       │
│ name                │        │ label               │
│ type (SINGLE/MULTI) │        │ price_delta         │
│ is_required         │        │ is_default          │
│ created_at          │        │ display_order       │
└─────────────────────┘        │ created_at          │
                               └─────────────────────┘
```

### 4. Table Service (table_db)

```
┌─────────────────────┐
│       TABLES        │
├─────────────────────┤
│ id (PK)             │
│ tenant_id           │
│ name                │
│ capacity            │
│ location            │
│ qr_token            │
│ qr_token_version    │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

### 5. Order Service (order_db)

```
┌─────────────────────┐        ┌─────────────────────┐
│       ORDERS        │        │    ORDER_ITEMS      │
├─────────────────────┤        ├─────────────────────┤
│ id (PK)             │───────<│ id (PK)             │
│ tenant_id           │        │ order_id (FK)       │
│ table_id            │        │ item_id             │
│ user_id             │        │ item_name           │
│ status              │        │ quantity            │
│ total               │        │ unit_price          │
│ currency            │        │ modifiers (JSON)    │
│ special_instructions│        │ special_request     │
│ created_at          │        │ status              │
│ updated_at          │        │ created_at          │
└─────────────────────┘        └─────────────────────┘

┌─────────────────────┐
│  ORDER_STATUS_LOG   │
├─────────────────────┤
│ id (PK)             │
│ order_id (FK)       │
│ from_status         │
│ to_status           │
│ changed_by          │
│ created_at          │
└─────────────────────┘
```

### 6. Review Service

```
┌─────────────────────┐
│      REVIEWS        │
├─────────────────────┤
│ id (PK)             │
│ tenant_id           │
│ item_id             │
│ user_id             │
│ order_id            │
│ rating (1-5)        │
│ comment             │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## Quan hệ giữa các Service

```
                    ┌─────────────────┐
                    │    TENANTS      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    USERS      │   │   PRODUCTS    │   │    TABLES     │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │           ┌───────┴───────┐           │
        │           │               │           │
        ▼           ▼               ▼           ▼
┌───────────────────────────────────────────────────────┐
│                       ORDERS                          │
├───────────────────────────────────────────────────────┤
│  References: user_id, table_id, item_ids              │
└───────────────────────────────────────────────────────┘
```

## Chiến lược Cô lập Dữ liệu

- Tất cả bảng chính đều có `tenant_id`
- Row-Level Security (RLS) đảm bảo cô lập dữ liệu
- Mỗi service sử dụng database riêng biệt
- Giao tiếp giữa service thông qua RabbitMQ events

## Trạng thái Đơn hàng (State Machine)

```
DRAFT → SUBMITTED → ACCEPTED → PREPARING → READY → COMPLETED
                 ↘ REJECTED
```

## Ghi chú

- PK = Primary Key
- FK = Foreign Key
- JSON = Lưu trữ dạng JSONB trong PostgreSQL
- Timestamps sử dụng UTC timezone
