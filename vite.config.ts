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
        ;(req as LocalApiRequest).query = Object.fromEntries(requestUrl.searchParams.entries())

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

        const { default: handler } = await server.ssrLoadModule('/api/[...path].ts')
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
