# Lịch sử Git - Smart Restaurant

## Thống kê Tổng quan

- **Tổng số commits:** 389
- **Tổng số nhánh:** 27 (5 local + 22 remote)
- **Số Pull Requests:** 15+

## Thống kê theo Người đóng góp

| Tài khoản Git | Tên thật          | Commits | Vai trò             |
| ------------- | ----------------- | ------- | ------------------- |
| oppaii230205  | Nguyễn Hưng Thịnh | 194     | Backend Developer   |
| LeThanhCong   | Lê Thành Công     | 132     | Team Leader         |
| vctchinh      | Võ Cao Tâm Chính  | 62      | Frontend Developer  |
| ltchcmus      | Lê Thành Công     | 1       | (Alternate account) |

## Danh sách Nhánh

### Nhánh Local (5)

- `allfeatures` (HEAD) - Nhánh làm việc chính
- `develop` - Nhánh tích hợp development
- `feat-kitchen` - Tính năng bếp
- `feature-websocket` - WebSocket
- `master` - Production

### Nhánh Remote (22)

- `remotes/origin/allfeatures`
- `remotes/origin/develop`
- `remotes/origin/feat-kitchen`
- `remotes/origin/feat-notification`
- `remotes/origin/feat-reviews`
- `remotes/origin/feature-kitchen`
- `remotes/origin/feature-menu-management`
- `remotes/origin/feature-orders`
- `remotes/origin/feature-orders-cart`
- `remotes/origin/feature-orders-ui`
- `remotes/origin/feature-waiter`
- `remotes/origin/feature-websocket`
- `remotes/origin/frontend`
- `remotes/origin/hotfix`
- `remotes/origin/init-identity`
- `remotes/origin/init-product`
- `remotes/origin/init-profile`
- `remotes/origin/master`
- `remotes/origin/release`
- `remotes/origin/reorganize-register-api`
- `remotes/origin/upgrade-feat-auth-and-notification`

## Lịch sử Pull Request

| PR # | Tiêu đề             | Tác giả      | Trạng thái |
| ---- | ------------------- | ------------ | ---------- |
| #15  | feat-reviews        | oppaii230205 | Merged     |
| #14  | feature-kitchen     | oppaii230205 | Merged     |
| #13  | feature-websocket   | LeThanhCong  | Merged     |
| #12  | feature-waiter      | oppaii230205 | Merged     |
| #11  | feature-orders-cart | oppaii230205 | Merged     |
| #10  | fix-qr-redirect     | LeThanhCong  | Merged     |

## Mẫu Commits Gần đây

| Commit   | Tác giả      | Nội dung                                            |
| -------- | ------------ | --------------------------------------------------- |
| e4c8e69f | LeThanhCong  | Merge branch 'allfeatures'                          |
| d099ded9 | LeThanhCong  | feat: add report                                    |
| 7754eff1 | vctchinh     | feat: Update kitchen display components             |
| 84b2ca26 | oppaii230205 | Merge pull request #15 feat-reviews                 |
| 4077f64d | oppaii230205 | Merge branch 'allfeatures' into feat-reviews        |
| be2dee12 | oppaii230205 | fix: camelCase -> snake_case by default             |
| 4b833807 | oppaii230205 | feat: Implement Data Enrichment                     |
| 0bf6eb6a | oppaii230205 | fix: Receive userId in EventPattern                 |
| 8efbd109 | oppaii230205 | refactor: Only generate bill for paid order         |
| 7450e301 | oppaii230205 | feat: Add listener to RabbitMQ from Payment Service |
| 43fcbaf7 | oppaii230205 | feat: Init QR Code payment feature                  |
| 905b8706 | oppaii230205 | feat: Increase orderCount when generating bill      |
| 82154a16 | vctchinh     | feat: glassmorphism style for QR page               |
| 2120ddbd | vctchinh     | feat: Owner Profile                                 |
| b3b72e08 | oppaii230205 | feat: Init bill generation feature                  |
| 18601d45 | vctchinh     | feat: hoan thien socket voi waiter                  |
| 1acc1be1 | LeThanhCong  | feat: add docker                                    |
| bbfb7718 | oppaii230205 | feat: Implement review feature                      |
| fe768907 | vctchinh     | feat: Init KDS UI/UX                                |
| 095ad546 | oppaii230205 | feat: Implement fuzzy search                        |

## Commits theo Tính năng

### Identity & Authentication (LeThanhCong)

- `feat: add docker`
- `feat: setup CI/CD pipeline`
- `feat: implement JWT authentication`
- `feat: Google OAuth integration`
- `feat: email verification`

### Order & Kitchen Service (oppaii230205)

- `feat: Init QR Code payment feature`
- `feat: Init bill generation feature`
- `feat: Implement review feature`
- `feat: Implement Data Enrichment`
- `feat: Add listener to RabbitMQ from Payment Service`
- `feat: Implement fuzzy search`

### Frontend Development (vctchinh)

- `feat: Update kitchen display components`
- `feat: glassmorphism style for QR page`
- `feat: Owner Profile`
- `feat: hoan thien socket voi waiter`
- `feat: Init KDS UI/UX`

## Quy ước Commit Message

Nhóm sử dụng Conventional Commits:

- `feat:` - Tính năng mới
- `fix:` - Sửa lỗi
- `refactor:` - Refactor code
- `docs:` - Cập nhật tài liệu
- `chore:` - Công việc maintenance
- `test:` - Thêm/sửa tests

## Git Workflow

```
master ← release ← develop ← feature/*
                          ← hotfix/*
```

1. Tạo feature branch từ `develop`
2. Commit changes với conventional commits
3. Tạo Pull Request
4. Code review
5. Merge vào `develop`
6. Khi ready: merge vào `release` → `master`

## Tags

- `v.4.test` - Version 4 testing (commit 095ad546)

## Repository URL

https://github.com/Dev-Web-2005/smart-restaurant
