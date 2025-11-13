import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Permite hosts externos (ngrok, etc)
      host: true,
      allowedHosts: [
        '242e1c90071c.ngrok-free.app',
        '.ngrok-free.app',
        '.ngrok.io',
        'localhost',
      ],
      // Proxy para a API local (opcional, mas recomendado para evitar CORS)
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})

