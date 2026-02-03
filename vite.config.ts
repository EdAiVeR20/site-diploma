import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
    },
    build: {
      // Disable source maps for production
      sourcemap: false,
      // Use esbuild for minification (default, faster than terser)
      minify: 'esbuild',
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            vendor: ['react', 'react-dom', 'react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
          },
        },
      },
      // Set chunk size warning limit
      chunkSizeWarningLimit: 500,
    },
    // Remove console.log in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    define: {
      // Make env variables available in the app
      'import.meta.env.VITE_YANDEX_MAPS_API_KEY': JSON.stringify(env.VITE_YANDEX_MAPS_API_KEY),
    },
  }
})
