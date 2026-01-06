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
			rollupOptions: {
				output: {
					// Add hash to filenames for cache busting
					entryFileNames: 'assets/[name].[hash].js',
					chunkFileNames: 'assets/[name].[hash].js',
					assetFileNames: 'assets/[name].[hash].[ext]',
				},
			},
		},
		// Backend có CORS, gọi trực tiếp không cần proxy
		server: {
			port: 5173,
		},
	}
})
