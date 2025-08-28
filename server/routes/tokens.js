const express = require('express')
const crypto = require('crypto')
const db = require('../database/db')
const router = express.Router()

// 生成编辑令牌
router.post('/generate', async (req, res) => {
  try {
    const { memberId, expiresInHours = 24 } = req.body
    
    // 验证成员是否存在
    const member = await db.get('SELECT id, name FROM members WHERE id = ?', [memberId])
    if (!member) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    // 生成随机令牌
    const token = crypto.randomBytes(32).toString('hex')
    
    // 计算过期时间
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresInHours)
    
    // 删除该成员的旧令牌
    await db.run('DELETE FROM edit_tokens WHERE member_id = ?', [memberId])
    
    // 插入新令牌
    await db.run(`
      INSERT INTO edit_tokens (member_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [memberId, token, expiresAt.toISOString()])
    
    res.json({ 
      token,
      expiresAt: expiresAt.toISOString(),
      message: '编辑令牌生成成功'
    })
  } catch (error) {
    console.error('生成编辑令牌失败:', error)
    res.status(500).json({ error: '生成编辑令牌失败' })
  }
})

// 验证令牌并获取成员信息
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params
    
    // 查询令牌信息
    const tokenInfo = await db.get(`
      SELECT et.*, m.* 
      FROM edit_tokens et
      JOIN members m ON et.member_id = m.id
      WHERE et.token = ? AND et.expires_at > datetime('now')
    `, [token])
    
    if (!tokenInfo) {
      return res.status(401).json({ error: '令牌无效或已过期' })
    }
    
    // 解析JSON字段
    const memberInfo = {
      id: tokenInfo.id,
      name: tokenInfo.name,
      avatar: tokenInfo.avatar,
      bio: tokenInfo.bio,
      location: tokenInfo.location,
      coordinates: tokenInfo.coordinates ? JSON.parse(tokenInfo.coordinates) : null,
      tags: tokenInfo.tags ? JSON.parse(tokenInfo.tags) : [],
      joinDate: tokenInfo.join_date,
      social: {
        wechat: tokenInfo.wechat || ''
      },
      tokenExpiresAt: tokenInfo.expires_at
    }
    
    res.json({
      valid: true,
      member: memberInfo
    })
  } catch (error) {
    console.error('验证令牌失败:', error)
    res.status(500).json({ error: '验证令牌失败' })
  }
})

// 通过令牌更新成员信息
router.put('/update/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { name, avatar, bio, location, coordinates, tags, social } = req.body
    
    // 验证令牌
    const tokenInfo = await db.get(`
      SELECT member_id 
      FROM edit_tokens 
      WHERE token = ? AND expires_at > datetime('now')
    `, [token])
    
    if (!tokenInfo) {
      return res.status(401).json({ error: '令牌无效或已过期' })
    }
    
    // 验证必填字段
    if (!name || !location) {
      return res.status(400).json({ error: '姓名和地区为必填字段' })
    }
    
    // 更新成员信息（不包括join_date，普通用户不能修改）
    await db.run(`
      UPDATE members 
      SET name = ?, avatar = ?, bio = ?, location = ?, coordinates = ?, 
          wechat = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      avatar || '',
      bio || '',
      location,
      coordinates ? JSON.stringify(coordinates) : null,
      social?.wechat || '',
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      tokenInfo.member_id
    ])
    
    res.json({ message: '个人信息更新成功' })
  } catch (error) {
    console.error('更新个人信息失败:', error)
    res.status(500).json({ error: '更新个人信息失败' })
  }
})

// 管理员通过令牌更新成员信息（包括join_date）
router.put('/admin-update/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { name, avatar, bio, location, coordinates, tags, joinDate, social } = req.body
    
    // 验证令牌
    const tokenInfo = await db.get(`
      SELECT member_id 
      FROM edit_tokens 
      WHERE token = ? AND expires_at > datetime('now')
    `, [token])
    
    if (!tokenInfo) {
      return res.status(401).json({ error: '令牌无效或已过期' })
    }
    
    // 验证必填字段
    if (!name || !location) {
      return res.status(400).json({ error: '姓名和地区为必填字段' })
    }
    
    // 更新成员信息（包括join_date）
    await db.run(`
      UPDATE members 
      SET name = ?, avatar = ?, bio = ?, location = ?, coordinates = ?, 
          wechat = ?, tags = ?, join_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      avatar || '',
      bio || '',
      location,
      coordinates ? JSON.stringify(coordinates) : null,
      social?.wechat || '',
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      joinDate || new Date().toISOString().split('T')[0],
      tokenInfo.member_id
    ])
    
    res.json({ message: '成员信息更新成功（管理员模式）' })
  } catch (error) {
    console.error('管理员更新成员信息失败:', error)
    res.status(500).json({ error: '管理员更新成员信息失败' })
  }
})

// 撤销令牌
router.delete('/:token', async (req, res) => {
  try {
    const { token } = req.params
    
    const result = await db.run('DELETE FROM edit_tokens WHERE token = ?', [token])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '令牌不存在' })
    }
    
    res.json({ message: '令牌撤销成功' })
  } catch (error) {
    console.error('撤销令牌失败:', error)
    res.status(500).json({ error: '撤销令牌失败' })
  }
})

// 清理过期令牌
router.delete('/cleanup/expired', async (req, res) => {
  try {
    const result = await db.run(`
      DELETE FROM edit_tokens 
      WHERE expires_at <= datetime('now')
    `)
    
    res.json({ 
      message: '过期令牌清理完成',
      deletedCount: result.changes
    })
  } catch (error) {
    console.error('清理过期令牌失败:', error)
    res.status(500).json({ error: '清理过期令牌失败' })
  }
})

module.exports = router
