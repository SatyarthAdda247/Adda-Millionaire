import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    middlewareMode: false,
  },
  plugins: [
    react(),
    // Custom plugin to handle /health endpoint
    {
      name: "health-check",
      configureServer(server) {
        server.middlewares.use("/health", (req, res, next) => {
          if (req.method === "GET" && req.url === "/health") {
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                status: "ok",
                service: "Partners Portal Frontend",
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 8080,
  },
});
