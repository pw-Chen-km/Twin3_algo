import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/msmm': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/ultu': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/metadata': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})