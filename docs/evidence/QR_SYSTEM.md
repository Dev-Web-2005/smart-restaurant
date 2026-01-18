# Hệ thống Mã QR - Smart Restaurant

## Tổng quan

Hệ thống QR Code cho phép khách hàng quét mã tại bàn để truy cập menu và đặt món trực tiếp mà không cần tải ứng dụng.

## Kiến trúc Bảo mật

### Token Generation

Mỗi mã QR chứa một token được ký bằng HMAC-SHA256:

```
Token Structure:
{tenant_id}.{table_id}.{version}.{signature}

Signature = HMAC-SHA256(
  key: QR_SECRET_KEY,
  data: tenant_id + table_id + version
)
```

### Token Versioning

- Mỗi bàn có `qr_token_version` để quản lý vòng đời token
- Khi regenerate QR, version tăng lên → token cũ invalid ngay lập tức
- Cho phép thu hồi mã QR bị lộ hoặc bị đánh cắp

## Quy trình Tạo Mã QR

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Admin tạo   │────>│ Table Service│────>│ Generate QR  │
│ bàn mới     │     │ create table │     │ với token    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ Lưu vào DB   │
                                          │ qr_token     │
                                          │ qr_version   │
                                          └──────────────┘
```

## Quy trình Quét Mã QR

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Khách quét  │────>│ Verify token │────>│ Load menu    │
│ QR tại bàn  │     │ HMAC-SHA256  │     │ của tenant   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                            │                     │
                            │ Invalid?            │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │ Hiển thị     │     │ Menu page    │
                     │ error page   │     │ với table_id │
                     └──────────────┘     └──────────────┘
```

## API Endpoints

### Tạo/Regenerate QR Code

```
POST /api/v1/tables/{tableId}/generate-qr
Authorization: Bearer {admin_token}

Response:
{
  "qr_code_url": "https://...",
  "qr_token": "tenant123.table456.1.abc123...",
  "download_url": "/api/v1/tables/{tableId}/qr-download"
}
```

### Tải xuống QR Code (PNG)

```
GET /api/v1/tables/{tableId}/qr-download
Authorization: Bearer {admin_token}

Response: PNG image file
```

### Verify QR Token

```
GET /api/v1/menu?token={qr_token}

Response (valid):
{
  "tenant": {...},
  "table": {...},
  "categories": [...],
  "items": [...]
}

Response (invalid):
{
  "error": "Invalid or expired QR code"
}
```

## Cấu trúc URL của QR Code

```
{BASE_URL}/menu?token={qr_token}&table={table_id}

Example:
http://localhost:5173/menu?token=abc123...&table=5
```

## Tính năng Bảo mật

### 1. Token Signing

- HMAC-SHA256 với secret key
- Không thể giả mạo token

### 2. Version Control

- Cho phép thu hồi ngay lập tức
- Không cần đợi token expire

### 3. Tenant Isolation

- Token chứa tenant_id
- Đảm bảo chỉ truy cập menu của tenant đúng

### 4. Table Binding

- Session được gắn với table cụ thể
- Đơn hàng tự động liên kết với bàn

## Cấu hình

Các biến môi trường cần thiết:

```env
# Table Service
QR_SECRET_KEY=your-secret-key-min-32-chars
QR_BASE_URL=http://localhost:5173

# Độ dài secret key tối thiểu: 32 ký tự
# Khuyến nghị: Sử dụng random string generator
```

## Use Cases

### UC1: Khách quét QR lần đầu

1. Quét QR → Verify token
2. Token valid → Load menu với table context
3. Có thể đặt món ngay không cần đăng nhập

### UC2: Thu hồi QR bị lộ

1. Admin vào quản lý bàn
2. Click "Regenerate QR"
3. Version tăng → Token cũ invalid
4. In QR mới để thay thế

### UC3: Bàn bị vô hiệu hóa

1. Admin disable table
2. Token vẫn valid nhưng table inactive
3. Khách thấy thông báo "Bàn không khả dụng"

## Ghi chú Triển khai

- QR code được generate dạng PNG
- Kích thước mặc định: 300x300 pixels
- Có thể tùy chỉnh màu sắc và logo
- Hỗ trợ in trực tiếp hoặc download
