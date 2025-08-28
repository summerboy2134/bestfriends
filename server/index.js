const express = require('express')
const cors = require('cors')
const path = require('path')
const Database = require('./database/db')
const membersRouter = require('./routes/members')
const messagesRouter = require('./routes/messages')
const tokensRouter = require('./routes/tokens')
const uploadRouter = require('./routes/upload')

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务（用于头像等）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 路由
app.use('/api/members', membersRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/tokens', tokensRouter)
app.use('/api/upload', uploadRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await Database.init()
    console.log('✅ 数据库初始化成功')
    
    // 启动服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`)
      console.log(`📱 局域网访问: http://[YOUR_IP]:${PORT}`)
      console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...')
  await Database.close()
  process.exit(0)
})
