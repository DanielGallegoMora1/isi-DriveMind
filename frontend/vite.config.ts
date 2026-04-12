import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [tailwindcss(), react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_AUTH_PROXY_TARGET ?? 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/core-api': {
          target: env.VITE_CORE_PROXY_TARGET ?? 'http://127.0.0.1:8002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/core-api/, '/api'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
      css: true,
    },
  }
})
