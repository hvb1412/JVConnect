import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Bất kỳ request nào bắt đầu bằng /api sẽ được đẩy sang backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})