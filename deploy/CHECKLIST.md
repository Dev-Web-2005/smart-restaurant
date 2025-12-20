# Deploy Checklist

## Pre-Deployment

- [ ] Code đã push lên GitHub
- [ ] Database Supabase đã setup
- [ ] Generate JWT_SECRET và JWT_REFRESH_SECRET
- [ ] Generate API Keys cho tất cả services
- [ ] Test local bằng docker-compose

## Deploy Services trên Render

### Option 1: Separate Services

- [ ] Deploy Identity Service

  - [ ] URL: ********\_\_\_********
  - [ ] Health check passed
  - [ ] Environment variables configured

- [ ] Deploy Profile Service

  - [ ] URL: ********\_\_\_********
  - [ ] Health check passed
  - [ ] Environment variables configured

- [ ] Deploy Product Service

  - [ ] URL: ********\_\_\_********
  - [ ] Health check passed
  - [ ] Environment variables configured

- [ ] Deploy Table Service

  - [ ] URL: ********\_\_\_********
  - [ ] Health check passed
  - [ ] Environment variables configured

- [ ] Deploy API Gateway
  - [ ] URL: ********\_\_\_********
  - [ ] All microservices URLs configured
  - [ ] Health check passed

### Option 2: All-in-One

- [ ] Deploy All-in-One service
  - [ ] URL: ********\_\_\_********
  - [ ] All environment variables configured
  - [ ] PM2 processes running

## Deploy Frontend

- [ ] Deploy Frontend Static Site
  - [ ] URL: ********\_\_\_********
  - [ ] VITE_API_URL configured correctly
  - [ ] Build successful

## Testing

- [ ] Test Register endpoint
- [ ] Test Login endpoint
- [ ] Test Profile endpoints (CRUD)
- [ ] Test Product endpoints (CRUD)
- [ ] Test Table endpoints (CRUD)
- [ ] Test JWT authentication
- [ ] Test public endpoints (without auth)

## Post-Deployment

- [ ] Setup monitoring (Render logs)
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Configure custom domain (optional)
- [ ] Enable auto-deploy từ GitHub
- [ ] Backup database
- [ ] Document production URLs
- [ ] Update documentation với production URLs

## URLs to Save

```
API Gateway: _______________________________________
Identity:    _______________________________________
Profile:     _______________________________________
Product:     _______________________________________
Table:       _______________________________________
Frontend:    _______________________________________
Database:    _______________________________________
```

## Credentials to Save (Keep Secure!)

```
JWT_SECRET:           _______________________________________
JWT_REFRESH_SECRET:   _______________________________________
IDENTITY_API_KEY:     _______________________________________
PROFILE_API_KEY:      _______________________________________
PRODUCT_API_KEY:      _______________________________________
TABLE_API_KEY:        _______________________________________
DATABASE_PASSWORD:    _______________________________________
```

---

**Date deployed:** ******\_\_\_******
**Deployed by:** ******\_\_\_******
**Environment:** Production / Staging
