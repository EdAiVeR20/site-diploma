import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
    },
    build: {
      target: 'esnext',
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
            ui: ['@lobehub/ui'],
            form: ['react-hook-form', '@hookform/resolvers', 'zod'],
            query: ['@tanstack/react-query'],
          },
        },
      },
      // Set chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    // Remove console.log in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  }
})
