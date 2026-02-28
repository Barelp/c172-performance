import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { viteSingleFile } from "vite-plugin-singlefile"
import packageJson from "./package.json"

export default defineConfig({
  // השורה הזו קריטית כדי שהדפדפן ידע לחפש נתיבים יחסיים לקובץ עצמו
  base: "./",
  plugins: [react(), viteSingleFile()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
  },
  server: {
    host: '127.0.0.1', // Force IPv4 to avoid Node.js IPv6 ECONNREFUSED issues
    proxy: {
      '/api/notamdata': {
        target: 'https://www.notammap.org/notamdata',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/notamdata/, '')
      },
      '/api/weather': {
        target: 'https://ims.gov.il/he/aviation_data',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/weather/, '')
      }
    }
  }
})