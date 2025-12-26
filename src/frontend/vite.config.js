import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory
	const env = loadEnv(mode, process.cwd(), '')

	return {
		plugins: [react(), tailwindcss()],
		build: {
			// No need to externalize Node modules for browser build
			// This was causing build errors on Vercel
			rollupOptions: {},
		},
		server: {
			proxy: {
				// Proxy backend API requests to avoid CORS issues
				'/api/v1': {
					target: env.VITE_API_GATEWAY_URL || 'http://localhost:8888',
					changeOrigin: true,
					configure: (proxy, options) => {
						proxy.on('proxyReq', (proxyReq, req, res) => {
							// Add x-api-key header to proxied request
							proxyReq.setHeader(
								'x-api-key',
								env.VITE_API_KEY || 'smart-restaurant-2025-secret-key',
							)
						})
					},
				},
			},
		},
	}
})
