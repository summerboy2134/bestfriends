<template>
  <div class="message-management">
    <el-card class="page-card">
      <template #header>
        <div class="header-content">
          <h2>留言管理</h2>
          <p class="header-description">管理所有成员的留言板数据</p>
        </div>
      </template>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="总留言数" :value="totalMessages" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="活跃成员" :value="activeMembers" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="今日新增" :value="todayMessages" />
          </el-col>
          <el-col :span="6">
            <el-button type="danger" @click="clearAllMessages" :loading="clearing">
              <el-icon><Delete /></el-icon>
              清空所有留言
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 成员留言列表 -->
      <div class="member-messages">
        <h3>成员留言详情</h3>
        
        <el-table 
          :data="membersWithMessages" 
          style="width: 100%"
          row-key="id"
        >
          <el-table-column prop="name" label="成员姓名" width="120" />
          <el-table-column prop="messageCount" label="留言数量" width="100" align="center" />
          <el-table-column prop="latestMessage" label="最新留言" min-width="200" />
          <el-table-column prop="latestTime" label="最新时间" width="150" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="viewMessages(row)"
              >
                查看
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="clearMemberMessages(row)"
              >
                清空
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 留言详情对话框 -->
      <el-dialog
        v-model="showMessageDetail"
        :title="`${selectedMember?.name} 的留言板`"
        width="600px"
      >
        <div class="message-detail-list">
          <div 
            v-for="(message, index) in selectedMessages" 
            :key="index"
            class="message-detail-item"
          >
            <div class="message-header">
              <span class="message-time">{{ formatTime(message.time) }}</span>
              <el-button 
                type="danger" 
                size="small" 
                text
                @click="deleteMessage(message, index)"
              >
                删除
              </el-button>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </div>
          
          <div v-if="selectedMessages.length === 0" class="empty-state">
            <el-empty description="暂无留言" />
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMemberStore } from '@/stores/members'
import { API_BASE_URL } from '@/api/config'

const memberStore = useMemberStore()

// 状态
const clearing = ref(false)
const showMessageDetail = ref(false)
const selectedMember = ref(null)
const selectedMessages = ref([])
const allMemberMessages = ref({})

// 计算属性
const totalMessages = computed(() => {
  return Object.values(allMemberMessages.value).reduce((total, messages) => {
    return total + (Array.isArray(messages) ? messages.length : 0)
  }, 0)
})

const activeMembers = computed(() => {
  return Object.keys(allMemberMessages.value).filter(memberId => {
    const messages = allMemberMessages.value[memberId]
    return Array.isArray(messages) && messages.length > 0
  }).length
})

const todayMessages = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return Object.values(allMemberMessages.value).reduce((total, messages) => {
    if (!Array.isArray(messages)) return total
    
    return total + messages.filter(msg => {
      const msgDate = new Date(msg.time)
      msgDate.setHours(0, 0, 0, 0)
      return msgDate.getTime() === today.getTime()
    }).length
  }, 0)
})

const membersWithMessages = computed(() => {
  return memberStore.members.map(member => {
    const messages = allMemberMessages.value[member.id] || []
    const latestMessage = messages.length > 0 ? messages[0] : null
    
    return {
      ...member,
      messageCount: messages.length,
      latestMessage: latestMessage ? latestMessage.content : '暂无留言',
      latestTime: latestMessage ? formatTime(latestMessage.time) : '-'
    }
  }).sort((a, b) => b.messageCount - a.messageCount)
})

// 方法
const loadAllMessages = () => {
  const messages = {}
  
  memberStore.members.forEach(member => {
    const storageKey = `messages_${member.id}`
    const storedMessages = localStorage.getItem(storageKey)
    
    if (storedMessages) {
      try {
        messages[member.id] = JSON.parse(storedMessages).map(msg => ({
          ...msg,
          time: new Date(msg.time)
        }))
      } catch (error) {
        console.error(`解析成员 ${member.id} 的留言失败:`, error)
        messages[member.id] = []
      }
    } else {
      messages[member.id] = []
    }
  })
  
  allMemberMessages.value = messages
}

const viewMessages = (member) => {
  selectedMember.value = member
  selectedMessages.value = [...(allMemberMessages.value[member.id] || [])]
  showMessageDetail.value = true
}

const deleteMessage = async (message, index) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条留言吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 从显示列表中删除
    selectedMessages.value.splice(index, 1)
    
    // 从存储中删除
    const memberId = selectedMember.value.id
    allMemberMessages.value[memberId] = [...selectedMessages.value]
    
    // 更新localStorage
    const storageKey = `messages_${memberId}`
    localStorage.setItem(storageKey, JSON.stringify(allMemberMessages.value[memberId]))
    
    ElMessage.success('留言删除成功')
  } catch {
    // 用户取消删除
  }
}

const clearMemberMessages = async (member) => {
  try {
    await ElMessageBox.confirm(
      `确定要清空 ${member.name} 的所有留言吗？此操作不可恢复。`,
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    

    
    try {
      // 调用后端API清空数据库中的留言
      const response = await fetch(`${API_BASE_URL}/messages/member/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('数据库清空结果:', result)
      
      // 清空本地存储
      const storageKey = `messages_${member.id}`
      localStorage.removeItem(storageKey)
      allMemberMessages.value[member.id] = []
      
      // 如果当前正在查看该成员的留言，同时清空详情视图
      if (selectedMember.value && selectedMember.value.id === member.id) {
        selectedMessages.value = []
      }
      
      // 刷新统计数据
      await loadStats()
      
      ElMessage.success(`已清空 ${member.name} 的留言（数据库已同步）`)
    } catch (apiError) {
      console.error('API调用失败:', apiError)
      
      // API失败时仍然清空本地存储，但给出提示
      const storageKey = `messages_${member.id}`
      localStorage.removeItem(storageKey)
      allMemberMessages.value[member.id] = []
      
      if (selectedMember.value && selectedMember.value.id === member.id) {
        selectedMessages.value = []
      }
      
      ElMessage.warning(`已清空 ${member.name} 的本地留言，但数据库同步失败`)
    }
  } catch {
    // 用户取消清空
  }
}

const clearAllMessages = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有成员的留言吗？此操作不可恢复！',
      '确认清空所有留言',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    clearing.value = true
    console.log('开始清空所有留言...')
    
    try {
      // 调用后端API清空数据库中的所有留言
      const response = await fetch(`${API_BASE_URL}/messages/all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('数据库清空结果:', result)
      
      // 清空所有localStorage中的留言数据
      memberStore.members.forEach(member => {
        const storageKey = `messages_${member.id}`
        console.log(`清空成员 ${member.name} (ID: ${member.id}) 的留言存储`)
        localStorage.removeItem(storageKey)
      })
      
      // 重置内存中的数据
      Object.keys(allMemberMessages.value).forEach(memberId => {
        allMemberMessages.value[memberId] = []
      })
      
      // 清空详情视图
      selectedMessages.value = []
      
      // 强制重新加载数据
      await loadAllMessages()
      await loadStats()
      
      clearing.value = false
      console.log('清空完成，当前留言总数:', totalMessages.value)
      ElMessage.success('所有留言已清空（数据库已同步）')
    } catch (apiError) {
      console.error('API调用失败:', apiError)
      
      // API失败时仍然清空本地存储，但给出提示
      memberStore.members.forEach(member => {
        const storageKey = `messages_${member.id}`
        localStorage.removeItem(storageKey)
      })
      
      Object.keys(allMemberMessages.value).forEach(memberId => {
        allMemberMessages.value[memberId] = []
      })
      
      selectedMessages.value = []
      loadAllMessages()
      
      clearing.value = false
      ElMessage.warning('已清空本地留言，但数据库同步失败')
    }
  } catch {
    clearing.value = false
    console.log('用户取消清空操作')
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  
  const date = time instanceof Date ? time : new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 生命周期
onMounted(() => {
  loadAllMessages()
})
</script>

<style scoped>
.message-management {
  padding: 20px;
}

.page-card {
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.member-messages h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.message-detail-list {
  max-height: 400px;
  overflow-y: auto;
}

.message-detail-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

/* 滚动条样式 */
.message-detail-list::-webkit-scrollbar {
  width: 6px;
}

.message-detail-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-detail-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message-detail-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
