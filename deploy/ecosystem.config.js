// PM2 Ecosystem Configuration
// Chạy tất cả microservices với PM2 process manager

module.exports = {
  apps: [
    // Identity Service - Port 8080
    {
      name: "identity-service",
      cwd: "./src/backend/identity",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.IDENTITY_PORT || 8080,
        HOST_DB: process.env.DATABASE_HOST,
        PORT_DB: process.env.DATABASE_PORT || 6543,
        USERNAME_DB: process.env.DATABASE_USERNAME,
        PASSWORD_DB: process.env.DATABASE_PASSWORD,
        DATABASE_DB: process.env.DATABASE_NAME || "postgres",
        IDENTITY_API_KEY:
          process.env.IDENTITY_API_KEY || "identity-service-secret-key-2024",
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || "7d",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || "30d",
      },
    },

    // Profile Service - Port 8081
    {
      name: "profile-service",
      cwd: "./src/backend/profile",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PROFILE_PORT || 8081,
        HOST_DB: process.env.DATABASE_HOST,
        PORT_DB: process.env.DATABASE_PORT || 6543,
        USERNAME_DB: process.env.DATABASE_USERNAME,
        PASSWORD_DB: process.env.DATABASE_PASSWORD,
        DATABASE_DB: process.env.DATABASE_NAME || "postgres",
        PROFILE_API_KEY:
          process.env.PROFILE_API_KEY || "profile-service-secret-key-2024",
      },
    },

    // Product Service - Port 8082
    {
      name: "product-service",
      cwd: "./src/backend/product",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PRODUCT_PORT || 8082,
        HOST_DB: process.env.DATABASE_HOST,
        PORT_DB: process.env.DATABASE_PORT || 6543,
        USERNAME_DB: process.env.DATABASE_USERNAME,
        PASSWORD_DB: process.env.DATABASE_PASSWORD,
        DATABASE_DB: process.env.DATABASE_NAME || "postgres",
        PRODUCT_API_KEY:
          process.env.PRODUCT_API_KEY || "product-service-secret-key-2024",
      },
    },

    // Table Service - Port 8083
    {
      name: "table-service",
      cwd: "./src/backend/table",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.TABLE_PORT || 8083,
        HOST_DB: process.env.DATABASE_HOST,
        PORT_DB: process.env.DATABASE_PORT || 6543,
        USERNAME_DB: process.env.DATABASE_USERNAME,
        PASSWORD_DB: process.env.DATABASE_PASSWORD,
        DATABASE_DB: process.env.DATABASE_NAME || "postgres",
        TABLE_API_KEY:
          process.env.TABLE_API_KEY || "table-service-secret-key-2024",
      },
    },

    // API Gateway - Port 8888 (start last với wait_ready)
    {
      name: "api-gateway",
      cwd: "./src/backend/api-gateway",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
        PORT: process.env.API_GATEWAY_PORT || 8888,
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT || 6543,
        DATABASE_USERNAME: process.env.DATABASE_USERNAME,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME || "postgres",
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || "7d",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || "30d",

        // Microservices connection (localhost vì cùng container)
        IDENTITY_SERVICE_HOST: "localhost",
        IDENTITY_SERVICE_PORT: process.env.IDENTITY_PORT || 8080,
        PROFILE_SERVICE_HOST: "localhost",
        PROFILE_SERVICE_PORT: process.env.PROFILE_PORT || 8081,
        PRODUCT_SERVICE_HOST: "localhost",
        PRODUCT_SERVICE_PORT: process.env.PRODUCT_PORT || 8082,
        TABLE_SERVICE_HOST: "localhost",
        TABLE_SERVICE_PORT: process.env.TABLE_PORT || 8083,
      },
    },
  ],
};
