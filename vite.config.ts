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
          // Vendor chunks - estratégia simplificada
          if (id.includes('node_modules')) {
            // Separar apenas mapas (muito grandes)
            if (id.includes('leaflet') && !id.includes('react-leaflet')) {
              return 'vendor-maps';
            }

            // TODO O RESTO EM UM ÚNICO CHUNK VENDOR
            // Isso garante que React e todas as dependências estejam juntas
            return 'vendor';
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
