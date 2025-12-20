# TỔNG HỢP DỰ ÁN — Smart Restaurant (QR Ordering, Multi-tenant)

Ngày cập nhật: 2025-11-14
Phiên bản: 1.0

Mục tiêu: Tài liệu này tổng hợp nhanh các ý quan trọng, điều cần lưu ý, và danh sách việc cần làm dựa trên toàn bộ bộ tài liệu trong repo. Dùng như một “bản đồ dự án” cho tất cả các nhóm (Product, Tech, QA, Ops…).

## 1) Tầm nhìn & OKRs

- Tầm nhìn: Nền tảng đặt món tại bàn bằng QR, dễ dùng cho nhà hàng độc lập, giúp giảm thời gian phục vụ và tăng doanh thu.
- OKRs (ví dụ):
  - KR: 100 tenant tham gia pilot
  - KR: Tỷ lệ chuyển đổi QR → Order ≥ 10%
  - KR: Median time-to-serve < 20 phút

## 2) Phạm vi MVP

- In-scope: Tenant signup & onboarding; QR theo bàn → xem menu → giỏ hàng → checkout; quản lý menu (category/item/modifier/price); xử lý order cho staff (KDS/Order list); thanh toán cơ bản (card hoặc pay-later/bill-to-table).
- Out-of-scope: Loyalty/promo nâng cao; analytics đa chi nhánh; offline kiosk.
- Ranh giới chấp nhận: Mobile-first (Chrome/Safari); Admin dùng desktop web.

## 3) Thành phần & Kiến trúc tổng quan

- Thành phần cốt lõi: Super Admin Panel; Tenant Admin Dashboard; Customer Web App (QR); Kitchen Display System (KDS).
- Công nghệ định hướng: FE React/Next.js; BE Node/NestJS; DB PostgreSQL (hoặc MongoDB); Hosting AWS/GCP/Azure.
- Đa tenant: Tách dữ liệu theo schema hoặc Row-Level Security (cần chọn chiến lược chuẩn, xem mục Bảo mật).

## 4) Luồng chính (Flows)

- QR Ordering: Khách quét QR → token đã ký → xác thực token → tải menu → tạo order → staff được thông báo (WebSocket/poll) → cập nhật trạng thái theo thời gian thực.
- QR Generation: Admin tạo bàn → backend ký token (per-tenant/global secret, có version) → sinh QR PNG/SVG → lưu metadata → regenerate làm tăng version để hủy token cũ.
- Order State Machine: Draft → Submitted → PaymentPending → (PaymentFailed|Received) → Preparing → Ready → Completed | Cancelled. Quy tắc chuyển trạng thái và side-effects đã nêu rõ trong sơ đồ.

## 5) Yêu cầu chức năng (SRS — tóm tắt)

- FR-1 Tenant Management: Đăng ký tenant, cô lập dữ liệu, Super Admin quản lý/deactivate.
- FR-2 AuthN/AuthZ: JWT, RBAC (Admin/Staff/Customer).
- FR-3 Menu Management: CRUD category/item/modifier, publish/unpublish.
- FR-4 QR Management: QR duy nhất cho mỗi bàn, public URL + signed token.
- FR-5 Customer Ordering: Scan → menu → giỏ hàng → đặt món → thông báo.
- FR-6 Order Processing: Hiển thị real-time trên KDS, staff cập nhật trạng thái.
- FR-7 Payment & Billing: Tích hợp cổng thanh toán, báo cáo giao dịch.
- FR-8 Reporting & Analytics: Báo cáo nhà hàng; Super Admin xem analytics cấp tenant.

## 6) Yêu cầu phi chức năng (NFR — tóm tắt)

- Hiệu năng: ~1000 concurrent/tenant.
- Bảo mật: HTTPS, JWT, cô lập tenant.
- Sẵn sàng: ≥ 99.9% uptime.
- Mở rộng: Auto-scaling.
- Dễ dùng: Đặt món ≤ 3 thao tác.
- Dễ bảo trì: Kiến trúc module/dịch vụ.
- Địa phương hóa: Đa ngôn ngữ/đơn vị tiền.

## 7) API & Hợp đồng

- Chiến lược: Contract-first (OpenAPI). File `02-api/openapi.yaml` hiện là stub → cần hoàn thiện.
- Gợi ý endpoint (MVP): Auth, Tenants, Tables, QR, Menu (categories/items/modifiers), Orders (create/status), Payments (create/webhooks), Analytics (tối thiểu).

## 8) Dữ liệu & Trạng thái

- ER Diagram: cần hoàn thiện chi tiết entity (Tenant, User, Table, MenuCategory, MenuItem, Modifier, Order, OrderItem, Payment…).
- Order State Machine: Bắt buộc tuân thủ các transition hợp lệ; lưu audit; đo KPI time-to-serve từ Received → Preparing → Ready.

## 9) Bảo mật & Đa tenant (Điểm lưu ý)

- Chiến lược cô lập: Schema-per-tenant hoặc RLS-per-tenant (quyết định sớm để tránh refactor lớn).
- QR Token: HMAC-SHA256; payload gồm tenantId, tableId, iat, exp, version; version trong DB để revoke ngay lập tức khi regenerate.
- Secrets: Quản lý qua KMS/Secret Manager; không check-in .env nhạy cảm.
- PII/GDPR: Tối thiểu hóa lưu trữ dữ liệu cá nhân; mã hóa at-rest & in-transit.

## 10) Metrics & KPIs

- Activation: % tenant hoàn tất onboarding trong 7 ngày (target 70%).
- Conversion: % scan → order (target 10%).
- AOV: Giá trị đơn trung bình.
- Time to Serve: Median < 20 phút.
- Error Rates: 5xx/1k req; failed payments/100 orders.
- Instrumentation: Sử dụng schema sự kiện `11-analytics/EVENT_SCHEMA.md`, thêm correlation ids (requestId, tenantId, orderId).

## 11) Kiểm thử & Chất lượng

- Chiến lược test: Unit/Integration/E2E/Performance; Acceptance test dựa trên Gherkin từ User Stories.
- Trọng tâm E2E: QR scan → order → staff notify → cập nhật trạng thái → thanh toán.
- Performance: Kiểm tra concurrent ~1000/tenant; WebSocket tải cao.

## 12) Vận hành & Giám sát

- Observability: Logs, metrics, traces; cảnh báo error rate, latency, payment failures.
- On-call: Runbook sự cố, kênh liên lạc, tiêu chí escalations.
- SLO/SLA: Định nghĩa rõ cho uptime, latency endpoint quan trọng.

## 13) Hạ tầng & Triển khai

- CI/CD: Pipeline build/test/lint/scan; deploy canary/rollback (theo Runbook).
- IaC: Khuyến nghị Terraform/CloudFormation; staging/prod tách biệt.
- Zero-downtime: Chiến lược migrate schema (DB migrations) và publish/unpublish menu.

## 14) UX & Accessibility

- Mobile-first cho Customer Web App; Desktop cho Admin.
- A11y: Tiêu chí cơ bản (contrast, keyboard nav, aria, focus states…).
- Empty/Error states: Trang lỗi QR invalid/expired thân thiện + hướng dẫn hỗ trợ.

## 15) User Journeys & Tài liệu người dùng

- Hành trình chính: Chủ quán/Staff/Customer theo các flow đã mô tả.
- Tài liệu: `ADMIN_GUIDE.md`, `CUSTOMER_FAQ.md` (cần điền nội dung cụ thể theo MVP).

## 16) Kinh doanh & Thanh toán

- Billing: Mô hình subscription, invoicing; báo cáo giao dịch.
- Payments: Stripe/PayPal/Momo; webhook và xử lý lỗi/thanh toán treo.

## 17) Rủi ro & Giả định

- Giả định: Kết nối Internet ổn định; cổng thanh toán sẵn sàng; QR đặt đúng bàn.
- Rủi ro thường gặp:
  - Sai chiến lược đa tenant → khó mở rộng/chi phí cao.
  - QR token lộ/không revoke đúng cách → đặt món trái phép.
  - WebSocket không ổn định → cần cơ chế fallback/poll.
  - Payment webhook không idempotent → double-charge.
  - Thiếu observability → khó xử lý sự cố nhanh.

## 18) Quy trình làm việc

- Git/Release workflow: Nhánh, PR rule, review, release notes (template có sẵn).
- Sprints & DoD: Nhịp sprint, tiêu chí Done, liên kết acceptance criteria.

## 19) Danh sách việc cần làm (ưu tiên theo MVP)

- Product
  - Điền Owner và Success Criteria cho tất cả Epics (05-EPICS.md).
  - Chuyển các User Stories ưu tiên cao thành tickets (link FR IDs → SRS).
  - Hoàn thiện 07-ACCEPTANCE_CRITERIA.md dựa trên stories đã có.
  - Cập nhật 03-SRS_CHANGELOG.md mỗi khi sửa 02-SRS.md.
- Architecture/Data
  - Chốt chiến lược đa tenant (Schema vs RLS) + ADR.
  - Hoàn thiện `03-architecture/ER_DIAGRAM.md` và `ARCHITECTURE.md` (thành phần, boundary, integration).
  - Xác định mô hình sự kiện và idempotency cho payments/webhooks.
- API/Backend
  - Hoàn thiện `02-api/openapi.yaml` (Auth, Tenants, Tables, QR, Menu, Orders, Payments, Analytics).
  - Implement QR signing/versioning + public scan endpoint + error page.
  - Implement Order Service + state machine + audit log + WebSocket gateway.
  - Payment integration (sandbox) + webhook idempotent + retry/backoff.
- Frontend
  - Customer App mobile-first: Menu, Cart, Checkout, Order Status realtime.
  - Admin Dashboard: Menu CRUD, Tables/QR, Orders list/KDS, Staff roles.
  - A11y cơ bản + i18n tối thiểu.
- DevEx/Infra
  - Viết `04-dev/SETUP.md` chi tiết (yêu cầu tool, Node/Python, Docker, env vars mẫu).
  - Thiết lập CI (lint/test/build), secret scanning, container scan.
  - Tạo môi trường Staging; chiến lược DB migration an toàn.
- QA
  - Sinh test cases từ acceptance criteria; kịch bản E2E cho QR→Order→KDS→Payment.
  - Thiết lập dữ liệu mẫu và test fixtures (tenants/tables/menu).
  - Báo cáo chất lượng sprint, theo dõi lỗi và mức độ chấp nhận.
- Ops/SRE
  - Hoàn thiện `MONITORING.md`: metrics, alert rules (error rate/latency/payment).
  - On-call runbook: quy trình sự cố, contact, RACI.
  - Định nghĩa SLO/SLA ban đầu cho các API quan trọng.
- Security
  - Hoàn thiện `THREAT_MODEL.md`: threat/risk, kiểm soát, hardening.
  - Kế hoạch quản lý secrets (KMS/Secret Manager); quy tắc quay vòng key.
  - Pentest/threat simulation tối thiểu trước khi go-live.
- Analytics
  - Hoàn thiện `EVENT_SCHEMA.md`; gắn event vào FE/BE; dashboard MVP.
- Docs/Governance
  - Cross-link các tài liệu; đảm bảo `ORDERED_FOLDERS.md` phản ánh đúng ưu tiên.
  - Bổ sung `ADR/` và chỉ mục nếu chưa có file thực tế trong repo.

## 20) Các lưu ý quan trọng

- Quyết định đa tenant là “one-way door” → làm ADR sớm.
- Token QR phải có expiry + version và revoke instant qua DB metadata.
- Order state machine là hợp đồng nội bộ giữa BE/FE/Analytics/QA → không tự ý thay đổi.
- Payment: luôn idempotent (key theo orderId/paymentIntent), xử lý retry, không double-charge.
- Observability phải bật từ đầu: log cấu trúc, trace, correlation ids.

## 21) Tài liệu nguồn (ưu tiên đọc)

- 01-product: `02-SRS.md`, `04-MVP_SCOPE.md`, `05-EPICS.md`, `06-USER_STORIES.md`, `08-METRICS_KPIS.md`, `09-ROADMAP.md`, `10-VISION_AND_OKRS.md`, thư mục `diagrams/`.
- 02-api: `OPENAPI.md`, `openapi.yaml` (cần hoàn thiện).
- 03-architecture: `ARCHITECTURE.md`, `ER_DIAGRAM.md`.
- 04-dev, 05-infra, 06-qa, 07-ops, 08-security, 09-ux, 10-user, 11-analytics, 12-business, 13-releases, 14-risks, 15-research, 16-legal, 17-maintenance, 18-techdebt, process/.

## 22) Phụ lục — Mapping nhanh

- FR-3-001 (User Story) ↔ SRS FR-4 (QR Management).
- FR-4-001 (Ordering Flow) ↔ SRS FR-5/6; Diagrams ordering-flow + order-state-machine.
- Payment flows ↔ SRS FR-7; cần OpenAPI + webhook spec.

Kết luận: Bộ tài liệu khung đã đầy đủ cấu trúc. Trọng tâm ngắn hạn là: (1) ra quyết định đa tenant + ADR; (2) hoàn thiện OpenAPI + ER; (3) dựng flow QR→Order→KDS end-to-end; (4) bật observability và test E2E sớm để kiểm chứng KPIs.
