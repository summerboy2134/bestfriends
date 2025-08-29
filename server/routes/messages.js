const express = require('express')
const db = require('../database/db')
const router = express.Router()

// 获取所有留言（管理员功能）
router.get('/', async (req, res) => {
  try {
    const messages = await db.all(`
      SELECT m.*, mb.name as member_name 
      FROM messages m
      LEFT JOIN members mb ON m.member_id = mb.id
      ORDER BY m.created_at DESC
    `)
    
    res.json(messages)
  } catch (error) {
    console.error('获取留言列表失败:', error)
    res.status(500).json({ error: '获取留言列表失败' })
  }
})

// 清空指定成员的所有留言
router.delete('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params
    
    // 验证成员是否存在
    const member = await db.get('SELECT id FROM members WHERE id = ?', [memberId])
    if (!member) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    const result = await db.run('DELETE FROM messages WHERE member_id = ?', [memberId])
    
    res.json({ 
      message: '成员留言清空成功',
      deletedCount: result.changes
    })
  } catch (error) {
    console.error('清空成员留言失败:', error)
    res.status(500).json({ error: '清空成员留言失败' })
  }
})

// 清空所有留言
router.delete('/all', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM messages')
    
    res.json({ 
      message: '所有留言清空成功',
      deletedCount: result.changes || 0
    })
  } catch (error) {
    console.error('清空所有留言失败:', error)
    res.status(500).json({ error: '清空所有留言失败' })
  }
})

// 获取留言统计信息
router.get('/stats', async (req, res) => {
  try {
    const totalMessages = await db.get('SELECT COUNT(*) as count FROM messages')
    const todayMessages = await db.get(`
      SELECT COUNT(*) as count FROM messages 
      WHERE DATE(created_at) = DATE('now')
    `)
    const activeMembers = await db.get(`
      SELECT COUNT(DISTINCT member_id) as count FROM messages
    `)
    
    res.json({
      totalMessages: totalMessages.count,
      todayMessages: todayMessages.count,
      activeMembers: activeMembers.count
    })
  } catch (error) {
    console.error('获取留言统计失败:', error)
    res.status(500).json({ error: '获取留言统计失败' })
  }
})

// 删除留言（放在最后，避免与其他路由冲突）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 验证留言是否存在
    const message = await db.get('SELECT id FROM messages WHERE id = ?', [id])
    if (!message) {
      return res.status(404).json({ error: '留言不存在' })
    }
    
    await db.run('DELETE FROM messages WHERE id = ?', [id])
    
    res.json({ message: '留言删除成功' })
  } catch (error) {
    console.error('删除留言失败:', error)
    res.status(500).json({ error: '删除留言失败' })
  }
})

module.exports = router
