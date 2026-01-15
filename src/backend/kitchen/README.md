# Kitchen Service - Kitchen Display System (KDS)

## 📋 Overview

The Kitchen Service implements a professional **Kitchen Display System (KDS)** for the Smart Restaurant multi-tenant platform. It follows industry best practices from Toast POS, Square KDS, and Oracle MICROS systems.

## 🎯 Key Features

### Core Functionality

- **Ticket Management**: Create and manage kitchen tickets from accepted orders
- **Real-time Timers**: Track elapsed preparation time with color-coded thresholds
- **Priority System**: NORMAL → HIGH → URGENT → FIRE priority levels
- **Station Routing**: Route items to specific kitchen stations (Grill, Fry, Cold, etc.)
- **Bump Screen Workflow**: Complete tickets when all items are ready

### Item-Level Tracking

- Individual item status: PENDING → PREPARING → READY
- Recall/remake functionality with reason tracking
- Allergy and rush item flags
- Per-item elapsed time tracking

### Multi-Tenant Support

- Complete tenant isolation
- Per-tenant timer thresholds
- Tenant-specific statistics

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Order Service   │────────▶│  Kitchen Service │────────▶│ Notification Svc │
│ (Accept Items)   │  event  │  (KDS Tickets)   │  event  │  (WebSocket)     │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
   RabbitMQ              PostgreSQL Database              KDS Frontend
 (order_events)          (kitchen_tickets)               (Real-time UI)
```

## 📊 Database Entities

### KitchenTicket

| Field             | Type   | Description                                       |
| ----------------- | ------ | ------------------------------------------------- |
| id                | UUID   | Primary key                                       |
| tenantId          | UUID   | Multi-tenant isolation                            |
| orderId           | UUID   | Reference to order                                |
| tableId           | String | Table identifier                                  |
| ticketNumber      | String | Daily sequential number (#001, #002)              |
| status            | Enum   | PENDING, IN_PROGRESS, READY, COMPLETED, CANCELLED |
| priority          | Enum   | NORMAL (0), HIGH (1), URGENT (2), FIRE (3)        |
| elapsedSeconds    | Int    | Timer tracking                                    |
| warningThreshold  | Int    | Seconds before yellow alert (default: 600)        |
| criticalThreshold | Int    | Seconds before red alert (default: 900)           |

### KitchenTicketItem

| Field       | Type    | Description                                               |
| ----------- | ------- | --------------------------------------------------------- |
| id          | UUID    | Primary key                                               |
| ticketId    | UUID    | Parent ticket                                             |
| orderItemId | UUID    | Reference to order item                                   |
| name        | String  | Menu item name                                            |
| quantity    | Int     | Number of items                                           |
| status      | Enum    | PENDING, PREPARING, READY, CANCELLED, RECALLED            |
| station     | Enum    | GRILL, FRY, SAUTE, COLD, DESSERT, BEVERAGE, GENERAL, EXPO |
| modifiers   | JSONB   | Selected modifiers for display                            |
| isAllergy   | Boolean | Allergy alert flag                                        |
| isRush      | Boolean | Rush item flag                                            |

## 🔄 Ticket Lifecycle

```
PENDING ──────┬──────▶ IN_PROGRESS ──────▶ READY ──────▶ COMPLETED
              │                             │
              │                             │ (recall)
              │                             ▼
              └──────▶ CANCELLED         RECALLED ───▶ PENDING
```

## 🎛️ RPC Patterns (Message Patterns)

### Query Endpoints

| Pattern               | Description                 |
| --------------------- | --------------------------- |
| `kitchen:get-display` | Get active KDS display data |
| `kitchen:get-tickets` | Get tickets with filtering  |
| `kitchen:get-ticket`  | Get single ticket by ID     |
| `kitchen:get-stats`   | Get kitchen statistics      |

### Ticket Operations

| Pattern                    | Description                             |
| -------------------------- | --------------------------------------- |
| `kitchen:start-ticket`     | Start preparing (PENDING → IN_PROGRESS) |
| `kitchen:start-items`      | Start specific items                    |
| `kitchen:mark-items-ready` | Mark items as ready                     |
| `kitchen:bump-ticket`      | Complete/bump ticket                    |
| `kitchen:recall-items`     | Recall items for remake                 |
| `kitchen:cancel-items`     | Cancel specific items                   |
| `kitchen:cancel-ticket`    | Cancel entire ticket                    |
| `kitchen:update-priority`  | Change ticket priority                  |
| `kitchen:toggle-timer`     | Pause/resume timer                      |

### Event Patterns

| Pattern                 | Description                      |
| ----------------------- | -------------------------------- |
| `kitchen.prepare_items` | Receive items from Order Service |

## ⏱️ Timer System

The kitchen service implements real-time timer tracking:

1. **Automatic Timer Start**: Timer begins when ticket is created
2. **Color Thresholds**:
   - 🟢 Green: Under warning threshold (default < 10 min)
   - 🟡 Yellow: Between warning and critical (default 10-15 min)
   - 🔴 Red: Over critical threshold (default > 15 min)
3. **Pause/Resume**: Timers can be paused (e.g., waiting for customer)
4. **Per-Item Tracking**: Each item tracks its own prep time

## 📡 Event Flow

### Order Accepted → Kitchen Ticket Created

```
1. Waiter accepts items in Order Service
2. Order Service emits 'kitchen.prepare_items' to RabbitMQ
3. Kitchen Service creates ticket with items
4. Kitchen Service emits 'kitchen.ticket.new' for WebSocket
5. KDS Frontend displays new ticket
```

### Item Ready → Order Service Updated

```
1. Cook marks item ready in KDS
2. Kitchen Service updates item status
3. Kitchen Service emits 'kitchen.items.ready' to RabbitMQ
4. Order Service updates OrderItem status
5. Waiter notified item is ready for pickup
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd src/backend/kitchen
npm install
```

### 2. Configure Environment

```env
PORT=8086
CONNECTION_AMQP=amqp://user:pass@localhost:5672
KITCHEN_API_KEY=your-api-key
ORDER_API_KEY=order-service-api-key

HOST_DB=localhost
PORT_DB=5432
USERNAME_DB=postgres
PASSWORD_DB=password
DATABASE_DB=kitchen_db

WARNING_THRESHOLD=600
CRITICAL_THRESHOLD=900
```

### 3. Start Service

```bash
npm run start:dev
```

## 📈 Statistics & KPIs

The kitchen service tracks:

- Average preparation time
- Average wait time (before cooking starts)
- Tickets/items per hour
- On-time completion percentage
- Recall rate (quality metric)
- Hourly distribution (for staffing)

## 🔐 Security

- API key validation for all operations
- Tenant isolation on all queries
- RabbitMQ message authentication

## 📖 API Examples

### Get Kitchen Display

```json
{
	"kitchenApiKey": "your-api-key",
	"tenantId": "tenant-uuid"
}
```

### Start Ticket

```json
{
	"kitchenApiKey": "your-api-key",
	"tenantId": "tenant-uuid",
	"ticketId": "ticket-uuid",
	"cookId": "cook-uuid",
	"cookName": "John"
}
```

### Mark Items Ready

```json
{
	"kitchenApiKey": "your-api-key",
	"tenantId": "tenant-uuid",
	"ticketId": "ticket-uuid",
	"itemIds": ["item-1", "item-2"]
}
```

### Update Priority (Fire!)

```json
{
	"kitchenApiKey": "your-api-key",
	"tenantId": "tenant-uuid",
	"ticketId": "ticket-uuid",
	"priority": 3
}
```

## 🔧 Maintenance

### Health Check

GET `http://localhost:8086/`

### Logs

Located in `logs-kitchen/` directory with daily rotation.

---

**Version:** 1.0.0  
**Author:** Smart Restaurant Team  
**Last Updated:** January 2026
