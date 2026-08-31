import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'recharts': ['recharts'],
          'leaflet': ['leaflet', 'react-leaflet'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
