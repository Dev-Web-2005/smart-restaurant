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
						proxyReq.setHeader(
							'x-api-key',
							'lT0O|c_/4<{;K|.Ann[Cuib+7l+LL#W_-Y,T>w}8Mmeu}Z[el<1*|v.p&Wg}Mp%y:0$]4m&;5,8m5JN-,S<h#}',
						)
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
						proxyReq.setHeader(
							'x-api-key',
							'lT0O|c_/4<{;K|.Ann[Cuib+7l+LL#W_-Y,T>w}8Mmeu}Z[el<1*|v.p&Wg}Mp%y:0$]4m&;5,8m5JN-,S<h#}',
						)
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
