import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The API base URL is read from VITE_API_BASE at build/dev time (see .env.example).
// The dev server runs on 5173, which the backend's CORS config already allows.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
