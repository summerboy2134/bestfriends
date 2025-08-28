<template>
  <el-card 
    class="member-card" 
    :class="{ 'group-leader-card': member.isGroupLeader }"
    :body-style="{ padding: '20px' }"
    shadow="hover"
  >
    <div class="card-content">
      <!-- 头像和基本信息区域 -->
      <div class="header-section">
        <!-- 头像 -->
        <div class="avatar-container">
          <el-avatar 
            :size="80" 
            :src="member.avatar" 
            class="member-avatar"
          >
            <el-icon><User /></el-icon>
          </el-avatar>
          <!-- 群主王冠 -->
          <div v-if="member.isGroupLeader" class="crown-badge">
            <img src="/crown.png" alt="群主" class="crown-icon" />
          </div>
        </div>
        
        <!-- 基本信息 -->
        <div class="basic-info">
          <!-- 姓名 -->
          <h3 class="member-name">{{ member.name }}</h3>
          
          <!-- 微信号和地址 -->
          <div class="contact-info">
            <div class="info-item" v-if="member.social?.wechat">
              <el-icon class="info-icon"><ChatDotRound /></el-icon>
              <span>{{ member.social.wechat }}</span>
            </div>
            <div class="info-item">
              <el-icon class="info-icon"><Location /></el-icon>
              <span>{{ member.location }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 个人介绍 -->
      <div class="bio-section" v-if="member.bio">
        <p class="member-bio">{{ member.bio }}</p>
      </div>

      <!-- 兴趣标签 -->
      <div class="tags-section" v-if="member.tags && member.tags.length">
        <el-tag 
          v-for="tag in member.tags" 
          :key="tag" 
          size="small" 
          class="member-tag"
        >
          {{ tag }}
        </el-tag>
      </div>

      <!-- 留言板区域 -->
      <div class="message-board-section">
        <MessageBoard 
          :member-id="member.id" 
          :member-name="member.name"
        />
      </div>

      <!-- 管理员操作区域 -->
      <div class="admin-actions" v-if="showActions">
        <el-button 
          type="primary" 
          size="small" 
          circle
          @click="goToEdit"
          title="编辑成员信息"
        >
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          circle
          @click="generateEditLink"
          title="生成编辑链接"
        >
          <el-icon><Share /></el-icon>
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useMemberStore } from '@/stores/members'
import MessageBoard from './MessageBoard.vue'

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([])
const router = useRouter()
const memberStore = useMemberStore()



const goToEdit = async () => {
  try {
    const token = await memberStore.generateEditToken(props.member.id)
    router.push(`/edit/${token}`)
  } catch (error) {
    ElMessage.error('生成编辑令牌失败: ' + error.message)
  }
}

const generateEditLink = async () => {
  try {
    const token = await memberStore.generateEditToken(props.member.id)
    const editUrl = `${window.location.origin}/edit/${token}`
    
    ElMessageBox.alert(
      `编辑链接: ${editUrl}`,
      '生成编辑链接',
      {
        confirmButtonText: '复制链接',
        callback: () => {
          navigator.clipboard.writeText(editUrl).then(() => {
            ElMessage.success('编辑链接已复制到剪贴板')
          })
        }
      }
    )
  } catch (error) {
    ElMessage.error('生成编辑链接失败: ' + error.message)
  }
}
</script>

<style scoped>
.member-card {
  height: 100%;
  transition: transform 0.2s ease;
}

.member-card:hover {
  transform: translateY(-2px);
}

/* 群主卡片样式 */
.group-leader-card {
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
  box-shadow: 0 4px 16px rgba(245, 200, 66, 0.15) !important;
}

.group-leader-card:hover {
  box-shadow: 0 8px 24px rgba(245, 200, 66, 0.25) !important;
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-section {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.avatar-container {
  flex-shrink: 0;
  position: relative;
}

.member-avatar {
  border: 2px solid #f0f0f0;
}

/* 群主头像在群主卡片中的特殊样式 */
.group-leader-card .member-avatar {
  border: 3px solid #f5c842;
  box-shadow: 0 4px 12px rgba(245, 200, 66, 0.3);
}

/* 王冠徽章 */
.crown-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #f5c842;
  box-shadow: 0 2px 8px rgba(245, 200, 66, 0.4);
  z-index: 10;
}

.crown-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.basic-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  font-size: 14px;
  color: #606266;
}

.info-icon {
  margin-right: 8px;
  color: #909399;
}

.bio-section {
  margin-bottom: 16px;
}

.member-bio {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.tags-section {
  margin-bottom: 16px;
}

.member-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.message-board-section {
  margin-bottom: 16px;
  text-align: left;
}

.admin-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  justify-content: flex-end;
}

.admin-actions .el-button {
  flex-shrink: 0;
}
</style>
