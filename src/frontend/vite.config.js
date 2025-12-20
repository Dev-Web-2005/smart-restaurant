import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		rollupOptions: {
			external: [
				'node:path',
				'node:fs',
				'node:url',
				'node:crypto',
				'node:stream',
				'node:util',
			],
		},
	},
	server: {
		proxy: {
			// Proxy backend API requests to avoid CORS issues
			'/api/v1': {
				target: 'http://localhost:8888',
				// target: 'https://smart-restaurant-gateway.onrender.com',
				changeOrigin: true,
				configure: (proxy, options) => {
					proxy.on('proxyReq', (proxyReq, req, res) => {
						// Add x-api-key header to proxied request
						proxyReq.setHeader('x-api-key', 'smart-restaurant-2025-secret-key')
					})
				},
			},
			// Proxy file upload requests to avoid CORS
			'/api/file': {
				target: 'https://file-service-cdal.onrender.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/file/, '/api/v1/file'),
				configure: (proxy, options) => {
					proxy.on('proxyReq', (proxyReq, req, res) => {
						// Add x-api-key header to proxied request
						proxyReq.setHeader('x-api-key', 'smart-restaurant-2025-secret-key')
					})
				},
			},
			// Proxy Didit KYC API to avoid CORS
			'/api/kyc': {
				target: 'https://verification.didit.me',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/kyc/, '/v2'),
				configure: (proxy, options) => {
					proxy.on('proxyReq', (proxyReq, req, res) => {
						// Add X-Api-Key header for Didit authentication
						proxyReq.setHeader('X-Api-Key', '7hwmBAe7gzf8RECVEc5oZWQc8Sp9_SDpX9lkLiHUyMs')
					})
				},
			},
		},
	},
})
