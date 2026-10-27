import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Provide fallback empty defaults for optional tracking pixel IDs so Vite doesn't warn if omitted
process.env.VITE_META_PIXEL_ID = process.env.VITE_META_PIXEL_ID || ''
process.env.VITE_TIKTOK_PIXEL_ID = process.env.VITE_TIKTOK_PIXEL_ID || ''

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor'
            }
            if (id.includes('lucide-react')) {
              return 'ui'
            }
            if (id.includes('@supabase') || id.includes('zustand')) {
              return 'backend'
            }
          }
        }
      }
    }
  }
})
