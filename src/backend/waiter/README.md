# Waiter Service

## 📋 Tổng quan

Waiter Service là microservice quản lý luồng duyệt đơn hàng trong hệ thống Smart Restaurant. Service này đóng vai trò trung gian giữa Order Service và Kitchen Service, cho phép waiter review và approve/reject các món ăn trước khi gửi xuống bếp.

### Chức năng chính

✅ Nhận thông báo đơn hàng mới từ Order Service  
✅ Lưu trữ và quản lý notifications  
✅ Cung cấp API cho waiter app để xem pending orders  
✅ Xử lý accept/reject order items  
✅ Gửi approved items xuống Kitchen Service  
✅ Cập nhật item status về Order Service  
✅ Retry logic và Dead Letter Queue handling  

---

## 🏗️ Kiến trúc

```
┌──────────────────┐
│  Order Service   │
│  (emit events)   │
└────────┬─────────┘
         │ order.new_items
         ↓
    ┌────────────────────┐
    │   RabbitMQ Queue   │ ← local_waiter_queue
    │                    │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │  Waiter Service    │
    │  (handle & store)  │
    └────────┬───────────┘
             │
    ┌────────┴───────────┐
    │                    │
    ↓                    ↓
┌────────────┐    ┌──────────────┐
│   Order    │    │   Kitchen    │
│  Service   │    │   Service    │
│ (update)   │    │  (prepare)   │
└────────────┘    └──────────────┘
```

---

## 📚 Documentation

Xem tài liệu chi tiết tại: [Waiter Service Guide](../../docs/WAITER_SERVICE_GUIDE.md)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run in development mode
npm run start:dev

# Run in production mode
npm run build
npm run start:prod
```

---

## 📡 API Endpoints

### Message Patterns (RPC)

| Pattern | Description |
|---------|-------------|
| `waiter.get_pending_notifications` | Lấy danh sách notifications chờ xử lý |
| `waiter.mark_viewed` | Đánh dấu notification đã xem |
| `waiter.accept_items` | Duyệt các món và gửi bếp |
| `waiter.reject_items` | Từ chối các món |

### Event Patterns

| Event | Direction | Description |
|-------|-----------|-------------|
| `order.new_items` | Incoming | Nhận thông báo items mới từ Order Service |
| `order.items_accepted_by_waiter` | Outgoing | Thông báo items đã được duyệt |
| `order.items_rejected_by_waiter` | Outgoing | Thông báo items bị từ chối |
| `kitchen.new_items` | Outgoing | Gửi items xuống Kitchen Service |

---

## 🔧 Environment Variables

```env
PORT=8088
CONNECTION_AMQP=amqp://localhost:5672
NAME_QUEUE=local_waiter
WAITER_API_KEY=your_secret_key
HOST_DB=localhost
PORT_DB=5432
USERNAME_DB=postgres
PASSWORD_DB=password
DATABASE_DB=smart_restaurant
```

---

## 📁 Project Structure

```
src/
├── common/
│   ├── entities/           # Database entities
│   ├── enums/             # Status enums
│   └── logger.ts          # Custom logger
├── waiter/
│   ├── dtos/              # Request/Response DTOs
│   ├── waiter.controller.ts
│   ├── waiter.service.ts
│   └── waiter.module.ts
├── app.module.ts
└── main.ts
```

---

## 🛠️ Technology Stack

- **Framework:** NestJS
- **Database:** PostgreSQL + TypeORM
- **Message Queue:** RabbitMQ
- **Language:** TypeScript
- **Validation:** class-validator

---

## 📊 Database Schema

### order_notifications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Reference to order |
| table_id | VARCHAR | Table identifier |
| tenant_id | VARCHAR | Restaurant/tenant ID |
| waiter_id | UUID | Assigned waiter |
| status | INT | PENDING/VIEWED/ACCEPTED/REJECTED |
| item_ids | JSONB | List of order item IDs |
| metadata | JSONB | Additional context |
| created_at | TIMESTAMP | Creation time |
| expires_at | TIMESTAMP | Expiry time |

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📈 Monitoring

### Key Metrics

- **Response Time:** Time from notification creation to waiter response (Target: < 2 min)
- **Acceptance Rate:** % of accepted vs rejected items (Target: > 95%)
- **Queue Depth:** Number of pending messages (Alert if > 100)

---

## 🐛 Troubleshooting

### Service không nhận messages

```bash
# Check RabbitMQ
docker ps | grep rabbitmq

# Check queue
rabbitmqadmin list queues

# Check logs
tail -f logs/waiter-service.log
```

### Database connection issues

```bash
# Test connection
psql -h $HOST_DB -p $PORT_DB -U $USERNAME_DB -d $DATABASE_DB

# Check credentials
cat .env | grep DB
```

---

## 🤝 Contributing

1. Create feature branch
2. Make changes with tests
3. Submit pull request

---

## 📚 Related Services

- [Order Service](../order/README.md)
- [Kitchen Service](../kitchen/README.md)
- [API Gateway](../api-gateway/README.md)

---

**Version:** 1.0.0  
**Maintainers:** Smart Restaurant Team
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
