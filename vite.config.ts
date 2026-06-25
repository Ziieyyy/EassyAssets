import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-generator';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@supabase') || id.includes('@tanstack') || id.includes('postgrest') || id.includes('realtime-js') || id.includes('storage-js') || id.includes('functions-js')) {
              return 'supabase-client';
            }
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul') || id.includes('embla-carousel-react') || id.includes('react-resizable-panels')) {
              return 'ui-components';
            }
            if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform/resolvers')) {
              return 'form-utils';
            }
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-utils';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler') || id.includes('react-router') || id.includes('react-router-dom')) {
              return 'react-core';
            }
            return 'vendor';
          }
        }
      }
    }
  }
}));
