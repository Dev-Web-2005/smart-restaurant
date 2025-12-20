# Deploy All-in-One Docker trên Render

## Bước 1: Xóa các services riêng lẻ trên Render

Vào Render Dashboard → Xóa tất cả services:

- smart-restaurant-identity
- smart-restaurant-profile
- smart-restaurant-product
- smart-restaurant-table

Giữ lại:

- smart-restaurant-api-gateway (sẽ đổi thành all-in-one)

## Bước 2: Update service API Gateway thành All-in-One

1. Vào service `smart-restaurant-api-gateway`
2. Settings → General
3. Thay đổi:
   - **Root Directory:** `/` (root của repo)
   - **Dockerfile Path:** `deploy/Dockerfile.all-in-one`
4. Save Changes

## Bước 3: Update Environment Variables

Settings → Environment → Add tất cả biến sau:

```
NODE_ENV=production
DATABASE_HOST=aws-0-ap-south-1.pooler.supabase.com
DATABASE_PORT=6543
DATABASE_USERNAME=postgres.vzfhpiietyrgfobaxwhj
DATABASE_PASSWORD=Cong2642005@@
DATABASE_NAME=postgres
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRATION=30d
IDENTITY_API_KEY=lethanhcong
PROFILE_API_KEY=lethanhcong
PRODUCT_API_KEY=lethanhcong
TABLE_API_KEY=lethanhcong
API_GATEWAY_PORT=8888
IDENTITY_PORT=8080
PROFILE_PORT=8081
PRODUCT_PORT=8082
TABLE_PORT=8083
```

## Bước 4: Manual Deploy

Click **Manual Deploy** → Deploy latest commit

## Bước 5: Test

```bash
curl https://smart-restaurant-api-gateway.onrender.com
```

Done!
