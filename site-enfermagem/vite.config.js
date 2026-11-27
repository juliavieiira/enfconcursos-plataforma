import { Buffer } from 'node:buffer'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function createSupabaseDevBridgePlugin(supabaseTarget, supabaseAnonKey) {
  return {
    name: 'supabase-dev-bridge',
    configureServer(server) {
      server.middlewares.use('/api/sb', async (req, res) => {
        try {
          if (!supabaseTarget || !supabaseTarget.startsWith('https://')) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'VITE_SUPABASE_URL não configurada' }))
            return
          }

          let payload
          if (req.method === 'GET') {
            const parsedUrl = new URL(req.url || '/', 'http://localhost')
            const encoded = parsedUrl.searchParams.get('d') || ''
            const jsonStr = Buffer.from(encoded, 'base64url').toString('utf-8')
            payload = JSON.parse(jsonStr)
          } else {
            const chunks = []
            for await (const chunk of req) {
              chunks.push(chunk)
            }
            const rawBody = Buffer.concat(chunks).toString('utf-8')
            payload = rawBody ? JSON.parse(rawBody) : {}
          }

          const targetPath = typeof payload.path === 'string' && payload.path.startsWith('/')
            ? payload.path
            : '/rest/v1/'
          const method = (payload.method || 'GET').toUpperCase()
          const forwardHeaders = { ...(payload.headers || {}) }

          // Garante credenciais públicas caso omitidas
          if (!forwardHeaders.apikey && !forwardHeaders.Apikey) {
            forwardHeaders.apikey = supabaseAnonKey
          }
          if (!forwardHeaders.authorization && !forwardHeaders.Authorization) {
            forwardHeaders.Authorization = `Bearer ${supabaseAnonKey}`
          }

          const fetchInit = {
            method,
            headers: forwardHeaders,
          }
          if (payload.body !== undefined && payload.body !== null && method !== 'GET' && method !== 'HEAD') {
            fetchInit.body = typeof payload.body === 'string'
              ? payload.body
              : JSON.stringify(payload.body)
          }

          const upstreamRes = await fetch(`${supabaseTarget.replace(/\/$/, '')}${targetPath}`, fetchInit)
          const responseText = await upstreamRes.text()

          const responseHeaders = {}
          upstreamRes.headers.forEach((value, key) => {
            const k = key.toLowerCase()
            if (['content-type', 'content-range', 'content-location', 'preference-applied'].includes(k)) {
              responseHeaders[k] = value
            }
          })

          console.log(`[supabase-bridge] ${method} ${targetPath.slice(0, 90)} -> ${upstreamRes.status}`)

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({
            status: upstreamRes.status,
            statusText: upstreamRes.statusText || 'OK',
            headers: responseHeaders,
            body: responseText,
          }))
        } catch (err) {
          console.error('[supabase-bridge] ERROR:', err)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            status: 502,
            statusText: 'Bad Gateway',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ message: err?.message || 'Erro no bridge Supabase' }),
          }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseTarget = env.VITE_SUPABASE_URL || ''
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || ''

  return {
    plugins: [
      react(),
      createSupabaseDevBridgePlugin(supabaseTarget, supabaseAnonKey),
    ],
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react'
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide'
              }
              return 'vendor-other'
            }
          },
        },
      },
    },
    server: {
      port: 8080,
      host: '0.0.0.0',
      allowedHosts: true,
      cors: true,
    },
    preview: {
      port: 8080,
      host: '0.0.0.0',
      allowedHosts: true,
      cors: true,
    },
  }
})
