const express = require('express')
const db = require('../database/db')
const router = express.Router()

// 获取所有成员
router.get('/', async (req, res) => {
  try {
    const members = await db.all('SELECT * FROM members ORDER BY created_at DESC')
    
    // 解析JSON字段
    const formattedMembers = members.map(member => ({
      ...member,
      coordinates: member.coordinates ? JSON.parse(member.coordinates) : null,
      tags: member.tags ? JSON.parse(member.tags) : [],
      isGroupLeader: !!member.is_group_leader,
      social: {
        wechat: member.wechat || ''
      }
    }))
    
    res.json({ members: formattedMembers })
  } catch (error) {
    console.error('获取成员列表失败:', error)
    res.status(500).json({ error: '获取成员列表失败' })
  }
})

// 获取指定成员
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const member = await db.get('SELECT * FROM members WHERE id = ?', [id])
    
    if (!member) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    // 解析JSON字段
    const formattedMember = {
      ...member,
      coordinates: member.coordinates ? JSON.parse(member.coordinates) : null,
      tags: member.tags ? JSON.parse(member.tags) : [],
      isGroupLeader: !!member.is_group_leader,
      social: {
        wechat: member.wechat || ''
      }
    }
    
    res.json(formattedMember)
  } catch (error) {
    console.error('获取成员信息失败:', error)
    res.status(500).json({ error: '获取成员信息失败' })
  }
})

// 添加成员
router.post('/', async (req, res) => {
  try {
    const { name, avatar, bio, location, coordinates, tags, joinDate, social } = req.body
    
    // 验证必填字段
    if (!name || !location) {
      return res.status(400).json({ error: '姓名和地区为必填字段' })
    }
    
    const result = await db.run(`
      INSERT INTO members (name, avatar, bio, location, coordinates, wechat, tags, join_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      avatar || '',
      bio || '',
      location,
      coordinates ? JSON.stringify(coordinates) : null,
      social?.wechat || '',
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      joinDate || new Date().toISOString().split('T')[0]
    ])
    
    // 获取刚添加的成员信息
    const newMember = await db.get('SELECT * FROM members WHERE id = ?', [result.id])
    const formattedMember = {
      ...newMember,
      coordinates: newMember.coordinates ? JSON.parse(newMember.coordinates) : null,
      tags: newMember.tags ? JSON.parse(newMember.tags) : [],
      isGroupLeader: !!newMember.is_group_leader,
      social: {
        wechat: newMember.wechat || ''
      }
    }
    
    res.status(201).json({ 
      member: formattedMember,
      message: '成员添加成功' 
    })
  } catch (error) {
    console.error('添加成员失败:', error)
    res.status(500).json({ error: '添加成员失败' })
  }
})

// 更新成员
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, avatar, bio, location, coordinates, tags, joinDate, social } = req.body
    
    // 验证成员是否存在
    const existingMember = await db.get('SELECT id FROM members WHERE id = ?', [id])
    if (!existingMember) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    // 验证必填字段
    if (!name || !location) {
      return res.status(400).json({ error: '姓名和地区为必填字段' })
    }
    
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
      id
    ])
    
    // 获取更新后的成员信息
    const updatedMember = await db.get('SELECT * FROM members WHERE id = ?', [id])
    const formattedMember = {
      ...updatedMember,
      coordinates: updatedMember.coordinates ? JSON.parse(updatedMember.coordinates) : null,
      tags: updatedMember.tags ? JSON.parse(updatedMember.tags) : [],
      isGroupLeader: !!updatedMember.is_group_leader,
      social: {
        wechat: updatedMember.wechat || ''
      }
    }
    
    res.json({ member: formattedMember, message: '成员信息更新成功' })
  } catch (error) {
    console.error('更新成员失败:', error)
    res.status(500).json({ error: '更新成员失败' })
  }
})

// 删除成员
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 验证成员是否存在
    const existingMember = await db.get('SELECT id FROM members WHERE id = ?', [id])
    if (!existingMember) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    await db.run('DELETE FROM members WHERE id = ?', [id])
    
    res.json({ message: '成员删除成功' })
  } catch (error) {
    console.error('删除成员失败:', error)
    res.status(500).json({ error: '删除成员失败' })
  }
})

// 获取成员的留言
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params
    
    // 验证成员是否存在
    const member = await db.get('SELECT id FROM members WHERE id = ?', [id])
    if (!member) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    const messages = await db.all(`
      SELECT * FROM messages 
      WHERE member_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [id])
    
    res.json(messages)
  } catch (error) {
    console.error('获取留言失败:', error)
    res.status(500).json({ error: '获取留言失败' })
  }
})

// 为成员添加留言
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    
    // 验证输入
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '留言内容不能为空' })
    }
    
    if (content.length > 20) {
      return res.status(400).json({ error: '留言内容不能超过20个字符' })
    }
    
    // 验证成员是否存在
    const member = await db.get('SELECT id FROM members WHERE id = ?', [id])
    if (!member) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    const result = await db.run(`
      INSERT INTO messages (member_id, content)
      VALUES (?, ?)
    `, [id, content.trim()])
    
    res.status(201).json({ 
      id: result.id, 
      message: '留言添加成功' 
    })
  } catch (error) {
    console.error('添加留言失败:', error)
    res.status(500).json({ error: '添加留言失败' })
  }
})

// 设置群主
router.post('/set-group-leader', async (req, res) => {
  try {
    const { memberId } = req.body
    
    if (!memberId) {
      return res.status(400).json({ error: '成员ID为必填字段' })
    }
    
    // 验证成员是否存在
    const member = await db.get('SELECT id FROM members WHERE id = ?', [memberId])
    if (!member) {
      return res.status(404).json({ error: '成员不存在' })
    }
    
    // 先清除所有成员的群主标识
    await db.run('UPDATE members SET is_group_leader = 0')
    
    // 设置新的群主
    await db.run('UPDATE members SET is_group_leader = 1 WHERE id = ?', [memberId])
    
    res.json({ message: '群主设置成功' })
  } catch (error) {
    console.error('设置群主失败:', error)
    res.status(500).json({ error: '设置群主失败' })
  }
})

module.exports = router
