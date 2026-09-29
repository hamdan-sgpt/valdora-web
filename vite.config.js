import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleApiRequest, initAutoSync } from './server/apiMiddleware.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'valdora-api-middleware',
      configureServer(server) {
        // Mulai background auto-sync berkala dari live server Raznar setiap 30 detik
        initAutoSync(30000)

        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            handleApiRequest(req, res, next)
          } else {
            next()
          }
        })
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/server/live_data/**', '**/server/live_data/**/*', '**/*.db*']
    }
  }
})
