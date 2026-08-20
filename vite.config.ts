import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to GitHub Pages at /astrolive-sutra/
export default defineConfig({
  plugins: [react()],
  base: '/astrolive-sutra/',
})
