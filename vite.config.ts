import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/all-online-tools/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        date: resolve(rootDir, 'date.html'),
        pdf: resolve(rootDir, 'pdf.html'),
        json: resolve(rootDir, 'json.html'),
        model: resolve(rootDir, 'model.html'),
        face: resolve(rootDir, 'face.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib', 'pica', 'three', '@mediapipe/tasks-vision'],
  },
})
