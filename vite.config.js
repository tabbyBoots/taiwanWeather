import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/taiwanWeather/', // Set base path for GitHub Pages
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port:5173,
    proxy: {
      '/api': {
        target: 'https://opendata.cwa.gov.tw',
        changeOrigin: true,
      },
    },
  },
})
