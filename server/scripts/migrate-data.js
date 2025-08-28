const path = require('path')
const fs = require('fs')

const db = require('../database/db')
const mockMembers = [
  // 上海成员 (15人)
  {
    id: 1,
    name: '张三',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: '前端工程师，喜欢 Vue.js 和新技术',
    location: '上海市浦东新区张江高科技园区',
    coordinates: [121.5994, 31.2047],
    joinDate: '2023-01-15',
    tags: ['技术', '摄影', '旅行'],
    social: { wechat: 'zhangsan_wx' }
  },
  {
    id: 2,
    name: '李四',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=150&h=150&fit=crop&crop=face',
    bio: '产品经理，关注用户体验和产品设计',
    location: '上海市浦东新区陆家嘴环路',
    coordinates: [121.5057, 31.2453],
    joinDate: '2023-02-20',
    tags: ['产品', '设计', '用户体验'],
    social: { wechat: 'lisi_pm' }
  },
  {
    id: 3,
    name: '王五',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: '后端开发工程师，专注于微服务架构',
    location: '上海市杨浦区五角场',
    coordinates: [121.5118, 31.2965],
    joinDate: '2022-12-01',
    tags: ['后端', '云计算', '运动'],
    social: { wechat: 'wangwu_dev' }
  },
  {
    id: 4,
    name: '赵六',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'UI/UX 设计师，热爱创意和美学',
    location: '上海市徐汇区徐家汇',
    coordinates: [121.4352, 31.1993],
    joinDate: '2023-03-10',
    tags: ['设计', '艺术', '音乐'],
    social: { wechat: 'zhaoliu_design' }
  },
  {
    id: 5,
    name: '钱七',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: '数据分析师，用数据驱动决策',
    location: '上海市静安区南京西路',
    coordinates: [121.4648, 31.2422],
    joinDate: '2023-01-05',
    tags: ['数据', '分析', '咖啡'],
    social: { wechat: 'qianqi_data' }
  }
]

async function migrateData() {
  try {
    console.log('🚀 开始数据迁移...')
    
    // 初始化数据库
    await db.init()
    
    // 添加 is_group_leader 字段（如果不存在）
    try {
      await db.run('ALTER TABLE members ADD COLUMN is_group_leader INTEGER DEFAULT 0')
      console.log('✅ 添加 is_group_leader 字段')
    } catch (error) {
      // 字段可能已存在，忽略错误
      console.log('ℹ️  is_group_leader 字段已存在')
    }
    
    // 清空现有数据
    await db.run('DELETE FROM messages')
    await db.run('DELETE FROM edit_tokens')
    await db.run('DELETE FROM members')
    
    console.log('🗑️  清空现有数据完成')
    
    // 插入成员数据
    for (const member of mockMembers) {
      try {
        const result = await db.run(`
          INSERT INTO members (id, name, avatar, bio, location, coordinates, wechat, tags, join_date, is_group_leader)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          member.id,
          member.name,
          member.avatar || '',
          member.bio || '',
          member.location,
          JSON.stringify(member.coordinates || []),
          member.social?.wechat || '',
          JSON.stringify(member.tags || []),
          member.joinDate || new Date().toISOString().split('T')[0],
          member.id === 1 ? 1 : 0 // 设置第一个成员为群主
        ])
        
        console.log(`✅ 插入成员: ${member.name} (ID: ${result.id})`)
        

        const sampleMessages = [
          '很高兴认识大家！',
          '期待更多交流机会',
          '技术大佬请多指教',
          '周末一起喝茶吗？',
          '分享一个好玩的项目'
        ]
        

        const messageCount = Math.floor(Math.random() * 3) + 1
        for (let i = 0; i < messageCount; i++) {
          const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)]
          await db.run(`
            INSERT INTO messages (member_id, content, created_at)
            VALUES (?, ?, datetime('now', '-' || ? || ' hours'))
          `, [
            result.id || member.id,
            randomMessage,
            Math.floor(Math.random() * 72)
          ])
        }
        
      } catch (error) {
        console.error(`❌ 插入成员失败: ${member.name}`, error)
      }
    }
    
    // 统计迁移结果
    const memberCount = await db.get('SELECT COUNT(*) as count FROM members')
    const messageCount = await db.get('SELECT COUNT(*) as count FROM messages')
    
    console.log('\n📊 迁移完成统计:')
    console.log(`   成员数量: ${memberCount.count}`)
    console.log(`   留言数量: ${messageCount.count}`)
    console.log('🎉 数据迁移完成！')
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error)
    process.exit(1)
  } finally {
    await db.close()
  }
}

// 运行迁移
if (require.main === module) {
  migrateData()
}

module.exports = { migrateData }
