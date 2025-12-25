// PM2 Ecosystem Configuration for Development
// Run all microservices in development mode with hot-reload

const path = require("path");

module.exports = {
	apps: [
		// Identity Service - Port 8080
		{
			name: "identity-service",
			cwd: "./src/backend/identity",
			script: "npm",
			args: "run start:dev",
			interpreter: "none",
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			env: {
				PORT: 8080,
			},
		},

		// Profile Service - Port 8081
		{
			name: "profile-service",
			cwd: "./src/backend/profile",
			script: "npm",
			args: "run start:dev",
			interpreter: "none",
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			env: {
				PORT: 8081,
			},
		},

		// Product Service - Port 8082
		{
			name: "product-service",
			cwd: "./src/backend/product",
			script: "npm",
			args: "run start:dev",
			interpreter: "none",
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			env: {
				PORT: 8082,
			},
		},

		// Table Service - Port 8083
		{
			name: "table-service",
			cwd: "./src/backend/table",
			script: "npm",
			args: "run start:dev",
			interpreter: "none",
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			env: {
				PORT: 8083,
			},
		},

		// API Gateway - Port 8888 (start last)
		{
			name: "api-gateway",
			cwd: "./src/backend/api-gateway",
			script: "npm",
			args: "run start:dev",
			interpreter: "none",
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			wait_ready: true,
			listen_timeout: 10000,
			kill_timeout: 5000,
			env: {
				PORT: 8888,
			},
		},
	],
};
