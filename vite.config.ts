import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const stripLovableAttributes = (): any => ({
  name: 'strip-lovable-attributes',
  enforce: 'post' as const,
  transform(code: string, id: string) {
    if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
      return null;
    }
    if (!code.includes('data-lov-')) {
      return null;
    }
    const cleaned = code.replace(/\sdata-lov-[^=]*="[^"]*"/g, '');
    return {
      code: cleaned,
      map: null,
    };
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use relative paths in production so Capacitor (file assets) can load bundles
  base: mode === 'production' ? './' : '/',
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    stripLovableAttributes(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
