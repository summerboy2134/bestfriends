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
  // 需要你启动后端服务器并更新这个URL
  API_BASE_URL = 'https://sudden-andreas-certified-right.trycloudflare.com/api'
} else if (isVercel) {
  // Vercel环境 - 使用环境变量或相对路径
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
} else {
  // 其他环境 - 优先使用环境变量，否则使用相对路径
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
}

export { API_BASE_URL }
