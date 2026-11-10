import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: they change rarely, so browsers keep
        // them cached across app deployments.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react-vendor'
          if (/node_modules\/(@tanstack|axios)\//.test(id)) return 'data-vendor'
          if (/node_modules\/(radix-ui|@radix-ui|cmdk|embla-carousel|lucide-react|sonner)\//.test(id)) return 'ui-vendor'
          return undefined
        },
      },
    },
  },
})
