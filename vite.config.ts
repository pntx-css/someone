import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

interface LocalApiRequest extends IncomingMessage {
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

interface LocalApiResponse extends ServerResponse {
  status(code: number): this
  json(body: unknown): this
  send(body: string): this
}

const localApi = () => ({
  name: 'local-vercel-api',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = new URL(req.url ?? '/', 'http://localhost')
      if (!requestUrl.pathname.startsWith('/api/')) {
        next()
        return
      }

      try {
        const path = requestUrl.pathname
        let modulePath: string
        const idMatch = path.match(/^\/api\/admin\/messages\/([^/]+)$/)
        const planIdMatch = path.match(/^\/api\/admin\/plans\/([^/]+)$/)
        if (path === '/api/birthday/verify') modulePath = '/api/birthday/verify.ts'
        else if (path === '/api/wishlist') modulePath = '/api/wishlist/index.ts'
        else if (path === '/api/place-plans') modulePath = '/api/place-plans/index.ts'
        else if (path === '/api/admin/birthday/verify') modulePath = '/api/admin/birthday/verify.ts'
        else if (path === '/api/admin/login') modulePath = '/api/admin/login.ts'
        else if (path === '/api/admin/session') modulePath = '/api/admin/session.ts'
        else if (path === '/api/admin/gate') modulePath = '/api/admin/gate.ts'
        else if (path === '/api/admin/logout') modulePath = '/api/admin/logout.ts'
        else if (path === '/api/admin/messages') modulePath = '/api/admin/messages/index.ts'
        else if (path === '/api/admin/plans') modulePath = '/api/admin/plans/index.ts'
        else if (path === '/api/admin/export') modulePath = '/api/admin/export.ts'
        else if (idMatch) {
          modulePath = '/api/admin/messages/[id].ts'
          const query = Object.fromEntries(requestUrl.searchParams.entries())
          query.id = decodeURIComponent(idMatch[1])
          ;(req as LocalApiRequest).query = query
        } else if (planIdMatch) {
          modulePath = '/api/admin/plans/[id].ts'
          const query = Object.fromEntries(requestUrl.searchParams.entries())
          query.id = decodeURIComponent(planIdMatch[1])
          ;(req as LocalApiRequest).query = query
        } else {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'API route not found.' }))
          return
        }

        if (!(req as LocalApiRequest).query) {
          ;(req as LocalApiRequest).query = Object.fromEntries(requestUrl.searchParams.entries())
        }

        if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            size += buffer.byteLength
            if (size > 16 * 1024) {
              res.statusCode = 413
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Request body is too large.' }))
              return
            }
            chunks.push(buffer)
          }
          if (chunks.length > 0) {
            const rawBody = Buffer.concat(chunks).toString('utf8')
            try {
              ;(req as LocalApiRequest).body = JSON.parse(rawBody)
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Request body must be valid JSON.' }))
              return
            }
          }
        }

        const { default: handler } = await server.ssrLoadModule(modulePath)
        const apiResponse = res as LocalApiResponse
        apiResponse.status = function status(code: number) {
          this.statusCode = code
          return this
        }
        apiResponse.json = function json(body: unknown) {
          if (!this.hasHeader('Content-Type')) {
            this.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          this.end(JSON.stringify(body))
          return this
        }
        apiResponse.send = function send(body: string) {
          this.end(body)
          return this
        }

        await handler(req as LocalApiRequest, apiResponse)
      } catch (error) {
        server.config.logger.error(
          `Local API request failed: ${error instanceof Error ? error.stack : String(error)}`
        )
        if (!res.headersSent) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'The request could not be completed.' }))
        }
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const localEnvironment = loadEnv(mode, process.cwd(), '')
  for (const [name, value] of Object.entries(localEnvironment)) {
    if (process.env[name] === undefined) process.env[name] = value
  }

  return {
    plugins: [react(), localApi()],
  }
})
