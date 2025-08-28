const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const router = express.Router()

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 配置multer
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只能上传图片文件'))
    }
  }
})

// 头像上传
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const filename = `avatar_${timestamp}_${randomSuffix}.jpg`
    const filepath = path.join(uploadsDir, filename)

    // 使用sharp处理图片
    await sharp(req.file.buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 90,
        progressive: true 
      })
      .toFile(filepath)

    // 返回可访问的URL
    const imageUrl = `/uploads/${filename}`
    
    res.json({
      success: true,
      url: imageUrl,
      filename: filename,
      message: '头像上传成功'
    })
  } catch (error) {
    console.error('头像上传失败:', error)
    res.status(500).json({ error: '头像上传失败: ' + error.message })
  }
})

// Base64头像上传（兼容前端现有实现）
router.post('/avatar-base64', async (req, res) => {
  try {
    const { imageData, filename } = req.body
    
    if (!imageData) {
      return res.status(400).json({ error: '没有图片数据' })
    }

    // 解析base64数据
    let base64Data = imageData
    if (imageData.startsWith('data:')) {
      base64Data = imageData.split(',')[1]
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const ext = filename ? path.extname(filename) : '.jpg'
    const newFilename = `avatar_${timestamp}_${randomSuffix}${ext}`
    const filepath = path.join(uploadsDir, newFilename)

    // 将base64转换为buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // 使用sharp处理图片
    await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 90,
        progressive: true 
      })
      .toFile(filepath)

    // 返回可访问的URL
    const imageUrl = `/uploads/${newFilename}`
    
    res.json({
      success: true,
      url: imageUrl,
      filename: newFilename,
      message: '头像上传成功'
    })
  } catch (error) {
    console.error('Base64头像上传失败:', error)
    res.status(500).json({ error: 'Base64头像上传失败: ' + error.message })
  }
})

// 删除头像
router.delete('/avatar/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    const filepath = path.join(uploadsDir, filename)
    
    // 检查文件是否存在
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: '文件不存在' })
    }
    
    // 删除文件
    fs.unlinkSync(filepath)
    
    res.json({ message: '头像删除成功' })
  } catch (error) {
    console.error('删除头像失败:', error)
    res.status(500).json({ error: '删除头像失败: ' + error.message })
  }
})

// 清理未使用的头像文件
router.post('/cleanup-unused', async (req, res) => {
  try {
    const db = require('../database/db')
    
    // 获取所有正在使用的头像文件名
    const members = await db.all('SELECT avatar FROM members WHERE avatar IS NOT NULL AND avatar != ""')
    const usedAvatars = new Set()
    
    members.forEach(member => {
      if (member.avatar && member.avatar.startsWith('/uploads/')) {
        const filename = path.basename(member.avatar)
        usedAvatars.add(filename)
      }
    })
    
    // 获取uploads目录中的所有文件
    const files = fs.readdirSync(uploadsDir)
    let deletedCount = 0
    
    for (const file of files) {
      if (file.startsWith('avatar_') && !usedAvatars.has(file)) {
        const filepath = path.join(uploadsDir, file)
        fs.unlinkSync(filepath)
        deletedCount++
      }
    }
    
    res.json({ 
      message: '清理完成',
      deletedCount: deletedCount
    })
  } catch (error) {
    console.error('清理未使用头像失败:', error)
    res.status(500).json({ error: '清理未使用头像失败: ' + error.message })
  }
})

module.exports = router
