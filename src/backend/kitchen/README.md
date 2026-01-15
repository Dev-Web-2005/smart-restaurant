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
                              RabbitMQ Exchange
                           (order_events_exchange)
                                    │
                     ┌──────────────┼──────────────┐
                     │              │              │
                     ▼              ▼              ▼
┌──────────────┐  events   ┌──────────────┐  events   ┌──────────────┐
│ Order Service│ ─────────▶│Kitchen Service│◀─────────│ Waiter Service│
└──────────────┘           └──────────────┘           └──────────────┘
       │                          │                          │
       │ kitchen.prepare_items    │ kitchen.ticket.*         │
       └──────────────────────────┼──────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────┐
                         │ API Gateway  │
                         │ (WebSocket)  │
                         └──────────────┘
                                  │
                        ┌─────────┼─────────┐
                        ▼         ▼         ▼
                    Kitchen    Waiter   Customer
                     (KDS)    Dashboard   App
```

### Event Flow (Synchronized with Order Service)

1. **Customer orders items** → Order Service creates order with PENDING items
2. **Waiter accepts items** → Order Service emits `kitchen.prepare_items`
3. **Kitchen creates ticket** → Kitchen emits `kitchen.ticket.new`
4. **Cook starts preparing** → Kitchen emits `kitchen.ticket.started` + `order.items.preparing`
5. **Items ready** → Kitchen emits `kitchen.ticket.ready` + `order.items.ready`
6. **Ticket bumped** → Kitchen emits `kitchen.ticket.completed`
7. **API Gateway** receives all events and broadcasts via WebSocket

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

### Event Patterns (Inbound)

| Pattern                 | Description                      |
| ----------------------- | -------------------------------- |
| `kitchen.prepare_items` | Receive items from Order Service |

### Event Patterns (Outbound to RabbitMQ → API Gateway → WebSocket)

| Pattern                    | Target Rooms                      | Description                    |
| -------------------------- | --------------------------------- | ------------------------------ |
| `kitchen.ticket.new`       | kitchen, waiters                  | New ticket created             |
| `kitchen.ticket.started`   | kitchen, order:{orderId}          | Cook started preparing         |
| `kitchen.ticket.ready`     | kitchen, waiters, order:{orderId} | All items ready for pickup     |
| `kitchen.ticket.completed` | kitchen, waiters                  | Ticket bumped/completed        |
| `kitchen.ticket.priority`  | kitchen                           | Priority changed (fire/urgent) |
| `kitchen.items.recalled`   | kitchen, waiters                  | Items need remake              |
| `kitchen.items.preparing`  | order_events_exchange             | Notify Order Service           |
| `kitchen.items.ready`      | order_events_exchange             | Notify Order Service           |
| `kitchen.timers.update`    | kitchen                           | Timer updates (every 5 sec)    |

## ⏱️ Timer System

The kitchen service implements real-time timer tracking:

1. **Automatic Timer Start**: Timer begins when ticket is created
2. **Color Thresholds**:
   - 🟢 Green: Under warning threshold (default < 10 min)
   - 🟡 Yellow: Between warning and critical (default 10-15 min)
   - 🔴 Red: Over critical threshold (default > 15 min)
3. **Pause/Resume**: Timers can be paused (e.g., waiting for customer)
4. **Per-Item Tracking**: Each item tracks its own prep time

## 📡 Event Flow (Complete Lifecycle)

### Order Accepted → Kitchen Ticket Created

```
1. Customer orders → Order created with PENDING items
2. Waiter accepts items → Order Service emits 'kitchen.prepare_items'
3. Kitchen Service receives event → Creates ticket
4. Kitchen Service publishes 'kitchen.ticket.new' to RabbitMQ
5. API Gateway receives → Broadcasts to WebSocket (kitchen room)
6. KDS Frontend displays new ticket
```

### Cook Prepares → Item Ready → Waiter Notified

```
1. Cook clicks "Start" on KDS → Kitchen Service updates ticket
2. Kitchen publishes 'kitchen.ticket.started' + 'kitchen.items.preparing'
3. API Gateway broadcasts to WebSocket (kitchen + order rooms)
4. Order Service receives 'kitchen.items.preparing' → Updates OrderItem status
5. Cook marks items ready → Kitchen publishes 'kitchen.items.ready'
6. API Gateway broadcasts to waiter room → Waiter notified for pickup
7. Order Service updates OrderItem status to READY
```

### WebSocket Room Targets

| Room Pattern                   | Recipients                   |
| ------------------------------ | ---------------------------- |
| `tenant:{tenantId}:kitchen`    | KDS displays, kitchen staff  |
| `tenant:{tenantId}:waiters`    | Waiter tablets/apps          |
| `tenant:{tenantId}:order:{id}` | Customer viewing their order |

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
