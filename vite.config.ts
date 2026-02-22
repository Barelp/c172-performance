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
  }
})