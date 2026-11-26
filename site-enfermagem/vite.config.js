import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseTarget = env.VITE_SUPABASE_URL || ''

  const proxy = supabaseTarget && supabaseTarget.startsWith('https://') && !supabaseTarget.includes('seu-projeto')
    ? {
        '/supabase-proxy': {
          target: supabaseTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
        },
      }
    : undefined

  return {
    plugins: [react()],
    server: {
      port: 8080,
      host: '0.0.0.0',
      proxy,
    },
  }
})
