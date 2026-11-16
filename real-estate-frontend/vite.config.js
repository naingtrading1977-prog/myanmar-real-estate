import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 👈 ၁။ Import လုပ်ပါ

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 ၂။ Plugins ထဲသို့ ထည့်ပါ
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
