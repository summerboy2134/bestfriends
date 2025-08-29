<template>
  <div class="message-board">
    <!-- 留言板按钮 -->
    <el-button 
      type="info" 
      size="small" 
      circle
      @click="showMessageBoard = true"
      class="message-btn"
      :title="`留言板 (${messages.length}条)`"
    >
      <el-icon><ChatDotRound /></el-icon>
    </el-button>

    <!-- 留言板对话框 -->
    <el-dialog
      v-model="showMessageBoard"
      :title="`${memberName} 的留言板`"
      width="350px"
      class="message-dialog"
    >
      <!-- 留言列表 -->
      <div class="message-list" ref="messageListRef">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          class="message-item"
        >
          <div class="message-header">
            <span class="message-time">{{ formatTime(message.time) }}</span>
          </div>
          <div class="message-content">{{ message.content }}</div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-messages">
          <el-icon size="40" color="#c0c4cc"><ChatDotRound /></el-icon>
          <p>还没有留言，来写第一条吧~</p>
        </div>
      </div>

      <!-- 留言输入区 -->
      <div class="message-input-area">
        <el-input
          v-model="newMessage"
          placeholder="写点什么吧... (最多20字)"
          maxlength="20"
          show-word-limit
          @keyup.enter="sendMessage"
        />
        <el-button 
          type="primary" 
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          class="send-btn"
        >
          发送
        </el-button>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMessageBoard = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL } from '@/api/config'

const props = defineProps({
  memberId: {
    type: [Number, String],
    required: true
  },
  memberName: {
    type: String,
    required: true
  }
})

// 状态
const showMessageBoard = ref(false)
const newMessage = ref('')
const messageListRef = ref()
const messages = ref([])

// 方法
const loadMessages = async () => {
  try {
    // 尝试从数据库加载留言
    const response = await fetch(`${API_BASE_URL}/members/${props.memberId}/messages`)
    
    if (response.ok) {
      const dbMessages = await response.json()

      
      if (dbMessages.length > 0) {
        messages.value = dbMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          time: new Date(msg.created_at)
        }))
        
        // 同步到本地存储
        saveMessages()
        return
      }
    }
  } catch (error) {

  }
  
  // 如果数据库加载失败，从本地存储加载
  const storageKey = `messages_${props.memberId}`
  const storedMessages = localStorage.getItem(storageKey)
  
  if (storedMessages) {
    messages.value = JSON.parse(storedMessages).map(msg => ({
      ...msg,
      time: new Date(msg.time)
    }))
  } else {
    // 如果本地也没有数据，保持空数组
    messages.value = []
  }
}

const saveMessages = () => {
  const storageKey = `messages_${props.memberId}`
  localStorage.setItem(storageKey, JSON.stringify(messages.value))
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  const messageContent = newMessage.value.trim()
  
  try {
    // 调用后端API添加留言到数据库
    const response = await fetch(`${API_BASE_URL}/members/${props.memberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: messageContent
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()

    
    const message = {
      id: result.id || Date.now(),
      content: messageContent,
      time: new Date()
    }
    
    // 添加到列表开头 (最新的在最上面)
    messages.value.unshift(message)
    
    // 限制最多20条留言
    if (messages.value.length > 20) {
      messages.value = messages.value.slice(0, 20)
    }
    
    // 保存到本地存储
    saveMessages()
    
    // 清空输入
    newMessage.value = ''
    
    ElMessage.success('留言发送成功（已同步到数据库）')
    
    // 滚动到顶部显示新留言
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = 0
      }
    })
  } catch (apiError) {

    
    // API失败时仍然添加到本地，但给出提示
    const message = {
      id: Date.now(),
      content: messageContent,
      time: new Date()
    }
    
    messages.value.unshift(message)
    
    if (messages.value.length > 20) {
      messages.value = messages.value.slice(0, 20)
    }
    
    saveMessages()
    newMessage.value = ''
    
    ElMessage.warning('留言已保存到本地，但数据库同步失败')
    
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = 0
      }
    })
  }
}

const clearMessages = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清空 ${props.memberName} 的所有留言吗？此操作不可恢复。`,
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    

    
    try {
      // 调用后端API清空数据库中的留言
      const response = await fetch(`${API_BASE_URL}/messages/member/${props.memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      
      // 清空内存中的留言
      messages.value = []
      
      // 清空localStorage
      const storageKey = `messages_${props.memberId}`
      localStorage.removeItem(storageKey)
      

      
      ElMessage.success('留言已清空（数据库已同步）')
    } catch (apiError) {
  
      
      // API失败时仍然清空本地数据，但给出提示
      messages.value = []
      const storageKey = `messages_${props.memberId}`
      localStorage.removeItem(storageKey)
      
      ElMessage.warning('已清空本地留言，但数据库同步失败')
    }
  } catch {

  }
}

const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
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
    return time.toLocaleDateString()
  }
}

// 监听localStorage变化（其他页面的清空操作）
const handleStorageChange = (e) => {
  const storageKey = `messages_${props.memberId}`
  if (e.key === storageKey && e.newValue === null) {

    messages.value = []
  }
}

// 生命周期
onMounted(() => {
  loadMessages()
  // 监听storage事件（跨页面/标签页同步）
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.message-btn {
  margin: 2px;
}

.message-dialog :deep(.el-dialog__body) {
  padding: 10px 20px;
}

.message-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.message-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  margin: 8px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message-item:last-child {
  border-bottom: none;
}

.message-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 6px;
}

.message-time {
  font-size: 11px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
}

.empty-messages {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-messages p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

.message-input-area {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input-area .el-input {
  flex: 1;
}

.send-btn {
  flex-shrink: 0;
}

.dialog-footer {
  text-align: center;
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
