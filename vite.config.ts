import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, 'env')
  const env = loadEnv(mode, envDir, '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    // Base path configurable via env files in /env (development/production).
    base,
    envDir,
    plugins: [react()],
    resolve: {
      alias: {
        '@app': path.resolve(__dirname, 'src/app'),
        '@store': path.resolve(__dirname, 'src/app/store'),
        '@domain': path.resolve(__dirname, 'src/domain'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@windows': path.resolve(__dirname, 'src/features/windows'),
        '@panels': path.resolve(__dirname, 'src/features/panels'),
        '@hud': path.resolve(__dirname, 'src/features/hud'),
        '@docks': path.resolve(__dirname, 'src/features/docks'),
        '@hooks': path.resolve(__dirname, 'src/shared/hooks'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@config': path.resolve(__dirname, 'src/app/config'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@three': path.resolve(__dirname, 'src/shared/three'),
        '@pages': path.resolve(__dirname, 'src/features/pages'),
        '@styles': path.resolve(__dirname, 'src/shared/styles'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            react: ['react', 'react-dom'],
          },
        },
      },
    },
  }
})
