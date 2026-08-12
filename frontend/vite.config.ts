import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/accounts': 'http://localhost:8080',
      '/transactions': 'http://localhost:8080',
      '/actuator': 'http://localhost:8080'
    }
  }
})
