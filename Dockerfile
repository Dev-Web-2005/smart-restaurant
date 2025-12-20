# All-in-One Dockerfile - Chạy tất cả services trong 1 container
# Sử dụng cho staging/development environment trên Render

FROM node:20-alpine AS builder

WORKDIR /app

# Copy toàn bộ backend source
COPY src/backend ./src/backend

# Build shared module
WORKDIR /app/src/backend/shared
RUN npm install && npm run build

# Build từng service với npx để tránh permission issues
WORKDIR /app/src/backend/api-gateway
RUN npm install && chmod -R +x node_modules/.bin && npx nest build

WORKDIR /app/src/backend/identity
RUN npm install && chmod -R +x node_modules/.bin && npx nest build

WORKDIR /app/src/backend/profile
RUN npm install && chmod -R +x node_modules/.bin && npx nest build

WORKDIR /app/src/backend/product
RUN npm install && chmod -R +x node_modules/.bin && npx nest build

WORKDIR /app/src/backend/table
RUN npm install && chmod -R +x node_modules/.bin && npx nest build

# Stage 2: Production
FROM node:20-alpine

# Install PM2 để manage multiple processes
RUN npm install -g pm2

WORKDIR /app

# Copy tất cả built services
COPY --from=builder /app/src/backend ./src/backend

# Copy PM2 ecosystem file
COPY deploy/ecosystem.config.js ./ecosystem.config.js

WORKDIR /app

# Expose API Gateway port
EXPOSE 8888

# Start services with delay using sh inline commands
CMD ["sh", "-c", "pm2 start ecosystem.config.js --only identity-service && sleep 5 && pm2 start ecosystem.config.js --only profile-service && pm2 start ecosystem.config.js --only product-service && pm2 start ecosystem.config.js --only table-service && sleep 5 && pm2 start ecosystem.config.js --only api-gateway && pm2 logs"]
