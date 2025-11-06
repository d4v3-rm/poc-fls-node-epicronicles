import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@store': path.resolve(__dirname, 'src/store'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@three': path.resolve(__dirname, 'src/three'),
    },
  },
})
