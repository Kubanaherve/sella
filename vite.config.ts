import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.png",
        "favicon.ico",
        "brand/sella-icon.png",
        "brand/sella-logo.png",
      ],
      manifest: {
        name: "Sella",
        short_name: "Sella",
        description: "Gukurikirana amadeni, igurisha n'ibicuruzwa bya business yawe",
        theme_color: "#1A6FFF",
        background_color: "#040816",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/brand/sella-icon.png",
            sizes: "any",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}", "brand/sella-icon.png", "pwa-*.png"],
        globIgnores: [
          "**/brand/*.pdf",
          "**/brand/*specimen*",
          "**/brand/*processor*",
          "**/brand/*raw*",
          "icons/apple-splash-*",
          "**/brand/sella-splash*",
          "**/brand/*wordmark*",
          "**/brand/*stamp*",
          "**/brand/*script*",
          "**/brand/sella-bag*",
          "**/brand/sella-kare*",
          "**/brand/sella-brand/**",
          "**/brand/payments/**",
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        mode: "production",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/jspdf") ||
            id.includes("node_modules/pdfjs-dist") ||
            id.includes("node_modules/html2canvas")
          ) {
            return "vendor-pdf";
          }
          if (
            id.includes("node_modules/xlsx") ||
            id.includes("node_modules/papaparse")
          ) {
            return "vendor-sheets";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
