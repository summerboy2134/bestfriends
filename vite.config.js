import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    target: 'es2015', // 更好的移动端兼容性
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 生态系统保持在一起，避免循环依赖
          'vue-ecosystem': ['vue', 'vue-router', 'pinia'],
          
          // Element Plus 相关保持在一起
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          
          // 地图相关独立分离
          'map': ['@amap/amap-jsapi-loader'],
          
          // 其他工具库
          'utils': ['axios']
        }
      }
    }
  }
})
