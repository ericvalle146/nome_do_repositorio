import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // IMPORTANTE: Carrega variáveis de ambiente baseado no modo
  // No build, mode será 'production', então carrega .env.production ou .env
  const env = loadEnv(mode, process.cwd(), '')
  
  // Log para debug (apenas em build)
  if (process.env.NODE_ENV === 'production' || mode === 'production') {
    console.log('🔍 [vite.config] Modo:', mode)
    console.log('🔍 [vite.config] VITE_API_URL carregado:', env.VITE_API_URL || 'NÃO DEFINIDO')
    console.log('🔍 [vite.config] NODE_ENV:', process.env.NODE_ENV)
    console.log('🔍 [vite.config] Todas as variáveis VITE_*:', 
      Object.keys(env).filter(k => k.startsWith('VITE_')).map(k => `${k}=${env[k]}`).join(', '))
  }
  
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
          target: env.BACKEND_PORT
            ? `http://localhost:${env.BACKEND_PORT}`
            : 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Configuração de build para garantir que variáveis sejam substituídas corretamente
    build: {
      // Força a substituição de variáveis de ambiente
      define: {
        // Garante que import.meta.env seja substituído no build
        'import.meta.env.MODE': JSON.stringify(mode),
        'import.meta.env.PROD': JSON.stringify(mode === 'production'),
        'import.meta.env.DEV': JSON.stringify(mode === 'development'),
      },
      // Loga o que está sendo embedado (apenas em build)
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignora warnings comuns
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
          warn(warning)
        },
      },
    },
  }
})

