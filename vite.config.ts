import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "client", "src", "assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('wouter')) {
              return 'router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('date-fns')) {
              return 'dates';
            }
            if (id.includes('leaflet')) {
              return 'maps';
            }
            return 'vendor-misc';
          }

          // Feature chunks baseados no caminho do arquivo
          if (id.includes('/pages/admin/') || id.includes('/pages/Admin')) {
            return 'admin';
          }
          if (id.includes('/pages/workshop/') || id.includes('/pages/Workshop')) {
            return 'workshop';
          }
          if (id.includes('Login') || id.includes('use-auth')) {
            return 'auth';
          }
          if (id.includes('/pages/Home') || id.includes('/pages/Landing') || id.includes('/pages/Map') || id.includes('/pages/Blog')) {
            return 'public';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true
      }
    },
    sourcemap: false, // Desabilita source maps em produção para reduzir tamanho
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
