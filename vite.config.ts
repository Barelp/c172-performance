import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  // השורה הזו קריטית כדי שהדפדפן ידע לחפש נתיבים יחסיים לקובץ עצמו
  base: "./",
  plugins: [react(), viteSingleFile()],
})