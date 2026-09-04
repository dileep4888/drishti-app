import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execSync } from 'child_process'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-api-data',
      buildStart() {
        try {
          execSync('node scripts/generate-api-data.js', { cwd: process.cwd() })
        } catch (e) {
          console.warn('Warning: Could not generate API data:', e.message)
        }
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
  }
})
