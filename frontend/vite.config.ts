import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In dev mode, proxy /api to the backend so the browser never hits CORS.
  // The proxy target is read from VITE_API_PROXY_TARGET (defaults to Docker
  // service name for docker-compose usage).
  const devProxy = mode === 'development'
    ? {
        '/api': {
          target: env.VITE_API_PROXY_TARGET ?? 'http://backend:8000',
          changeOrigin: true,
        },
      }
    : {}

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react:  ['react', 'react-dom', 'react-router-dom'],
            query:  ['@tanstack/react-query', '@tanstack/react-table'],
            charts: ['recharts', 'date-fns'],
            forms:  ['react-hook-form', 'zod', '@hookform/resolvers'],
          },
        },
      },
    },
    server: {
      port: 5173,
      // 0.0.0.0 needed so Vite is reachable inside Docker; fine for local dev.
      host: '0.0.0.0',
      proxy: devProxy,
    },
  }
})
