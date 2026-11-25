import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Luôn dùng cổng 5173 cho cả dev lẫn bản chạy chính thức:
// dữ liệu học trong trình duyệt gắn với địa chỉ http://localhost:5173
export default defineConfig({
  base: './', // đường dẫn tương đối: chạy được ở localhost lẫn GitHub Pages/Netlify
  plugins: [react()],
  server: { port: 5173, strictPort: true, open: true },
  preview: { port: 5173, strictPort: true, open: true },
})
