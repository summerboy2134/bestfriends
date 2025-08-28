// API配置
// 检测不同的部署环境
const hostname = window.location.hostname
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
const isCloudflare = hostname.includes('.trycloudflare.com')
const isVercel = hostname.includes('.vercel.app')

// 根据环境自动选择API地址
let API_BASE_URL

if (isLocalhost) {
  // 本地开发环境
  API_BASE_URL = 'http://localhost:3001/api'
} else if (isCloudflare) {
  // Cloudflare 隧道环境
  API_BASE_URL = 'https://firm-ve-informal-holiday.trycloudflare.com/api'
} else {
  // 生产环境（Vercel 等）- 使用环境变量
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
}

export { API_BASE_URL }
