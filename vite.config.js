import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'node:os'

/** Печатает в терминале прямые ссылки для телефона в той же Wi‑Fi-сети */
function truepayLanHint() {
  return {
    name: 'truepay-lan-hint',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address()
        if (!addr || typeof addr === 'string') return
        const port = addr.port
        const lines = []
        for (const list of Object.values(os.networkInterfaces())) {
          for (const net of list ?? []) {
            if (net?.family === 'IPv4' && !net.internal) {
              lines.push(`http://${net.address}:${port}/`)
            }
          }
        }
        if (!lines.length) return
        const log = server.config.logger.info.bind(server.config.logger)
        log('')
        log('\x1b[1m  📱 TruePay — на телефоне (та же Wi‑Fi) откройте один из адресов:\x1b[0m')
        for (const u of lines) log(`     ${u}`)
        log('')
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), truepayLanHint()],
  server: {
    // Явный IPv4 «все интерфейсы». Иначе на macOS сервер часто слушает только localhost / ::1 — телефон не достучится.
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    cors: true,
    allowedHosts: true,
  },
})
