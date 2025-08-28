<template>
  <div class="user-edit-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon size="32" class="header-icon"><EditPen /></el-icon>
          <div>
            <h1>编辑个人信息</h1>
            <p class="subtitle" v-if="currentMember">{{ currentMember.name }}，欢迎更新你的信息</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑表单 -->
    <div class="edit-form-container" v-if="isValidToken && currentMember">
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span>个人信息编辑</span>
            <el-tag v-if="hasChanges" type="warning">有未保存的更改</el-tag>
          </div>
        </template>

        <el-form 
          ref="editFormRef"
          :model="editForm" 
          :rules="formRules"
          label-width="100px"
          label-position="top"
        >
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">基本信息</h3>
            <el-form-item label="姓名" prop="name">
              <el-input v-model="editForm.name" />
            </el-form-item>
            
            <el-form-item label="所在地区" prop="location">
              <LocationPicker
                v-model="editForm.location"
                :coordinates="editForm.coordinates || []"
                @update:coordinates="updateCoordinates"
                placeholder="请输入详细地址，或点击定位/地图选择"
                :show-coordinates="true"
                :show-quick-locations="false"
              />
            </el-form-item>
          </div>



          <!-- 个人介绍 -->
          <div class="form-section">
            <h3 class="section-title">个人介绍</h3>
            <el-form-item label="个人简介" prop="bio">
              <el-input 
                v-model="editForm.bio" 
                type="textarea" 
                :rows="4"
                placeholder="简单介绍一下自己，让大家更好地了解你..."
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </div>

          <!-- 头像设置 -->
          <div class="form-section">
            <h3 class="section-title">头像设置</h3>
            <AvatarUpload
              v-model="editForm.avatar"
              label=""
              prop="avatar"
              :avatar-size="120"
            />
          </div>

          <!-- 兴趣标签 -->
          <div class="form-section">
            <h3 class="section-title">兴趣标签</h3>
            <el-form-item label="个人标签" prop="tags">
              <el-select
                v-model="editForm.tags"
                multiple
                filterable
                allow-create
                placeholder="选择或输入你的兴趣标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in commonTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
              <p class="tag-tip">
                选择或自定义标签来展示你的兴趣爱好和专业领域
              </p>
            </el-form-item>
          </div>

          <!-- 微信信息 -->
          <div class="form-section">
            <h3 class="section-title">微信信息</h3>
            <el-form-item label="微信号" prop="wechat">
              <el-input 
                v-model="editForm.social.wechat" 
                placeholder="请输入微信号"
              >
                <template #prefix>
                  <el-icon><ChatDotRound /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </div>

          <!-- 管理信息（仅内部编辑时显示） -->
          <div class="form-section" v-if="isAdminEdit">
            <h3 class="section-title">管理信息</h3>
            <el-form-item label="加入时间">
              <el-date-picker
                v-model="editForm.joinDate"
                type="date"
                placeholder="选择加入时间"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="群主身份">
              <el-switch
                v-model="editForm.isGroupLeader"
                active-text="群主 👑"
                inactive-text="普通成员"
                active-color="#f5c842"
              />
            </el-form-item>
          </div>
        </el-form>
        
        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button size="large" @click="resetForm">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            @click="saveChanges"
            :loading="saving"
          >
            <el-icon><Check /></el-icon>
            保存更改
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 无效令牌提示 -->
    <div class="invalid-token" v-else-if="!isValidToken">
      <el-result
        icon="warning"
        title="访问链接无效"
        sub-title="编辑链接已过期或无效，请联系管理员获取新的编辑链接"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">
            返回首页
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 加载状态 -->
    <div class="loading-state" v-else>
      <el-skeleton :rows="8" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMemberStore } from '@/stores/members'
import LocationPicker from '@/components/LocationPicker.vue'
import AvatarUpload from '@/components/AvatarUpload.vue'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()

// 状态
const editFormRef = ref()
const saving = ref(false)
const isValidToken = ref(false)
const currentMember = ref(null)

// 判断是否为管理员编辑
const isAdminEdit = computed(() => {
  // 如果路由路径包含 /edit/admin/ 或者有admin参数
  return route.path.includes('/edit/admin/') || route.query.admin === 'true'
})

// 获取成员ID（管理员模式直接从路由参数获取）
const getMemberId = () => {
  if (route.path.includes('/edit/admin/')) {
    return route.params.memberId
  }
  return null
}
const originalData = ref(null)

// 表单数据
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  location: '',
  coordinates: [],
  position: '',
  company: '',
  bio: '',
  avatar: '',
  tags: [],
  social: {
    wechat: '',
    github: '',
    linkedin: ''
  }
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地区', trigger: 'blur' }]
}

// 常用标签
const commonTags = ['技术', '产品', '设计', '运营', '数据', '营销', '管理', '创业', '投资', '教育', '艺术', '音乐', '摄影', '旅行', '运动', '美食', '读书', '电影']

// 计算属性
const hasChanges = computed(() => {
  if (!originalData.value) return false
  return JSON.stringify(editForm.value) !== JSON.stringify(originalData.value)
})

// 方法
const loadMemberData = async () => {
  try {
    await memberStore.loadMembers()
    
    let memberId = null
    
    // 判断是管理员编辑还是令牌编辑
    if (isAdminEdit.value && route.path.includes('/edit/admin/')) {
      // 管理员编辑：检查是否从管理面板跳转过来
      // 注释掉过于严格的 referrer 检查，因为用户可能直接访问链接
      // if (!document.referrer.includes('/admin')) {
      //   ElMessage.error('请从管理面板访问此页面')
      //   router.push('/admin')
      //   return
      // }
      
      // 从路由参数获取成员ID
      memberId = route.params.memberId
      isValidToken.value = true
    } else {
      // 令牌编辑：验证令牌
      const token = route.params.token
      if (!token) {
        isValidToken.value = false
        return
      }

      memberId = await memberStore.validateEditToken(token)
      if (!memberId) {
        isValidToken.value = false
        ElMessage.error('编辑链接无效或已过期')
        return
      }
      isValidToken.value = true
    }

    const member = memberStore.getMemberById(memberId)
    if (!member) {
      isValidToken.value = false
      ElMessage.error('成员不存在')
      return
    }

    currentMember.value = member
    
    // 初始化表单数据
    editForm.value = {
      ...member,
      social: { ...member.social }
    }
    originalData.value = JSON.parse(JSON.stringify(editForm.value))
    
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
    isValidToken.value = false
  }
}

const updateCoordinates = (coordinates) => {
  editForm.value.coordinates = coordinates
}

const resetForm = () => {
  if (originalData.value) {
    editForm.value = JSON.parse(JSON.stringify(originalData.value))
  }
}

const saveChanges = async () => {
  try {
    await editFormRef.value.validate()
    
    saving.value = true
    await memberStore.updateMember(currentMember.value.id, editForm.value)
    
    // 更新原始数据
    originalData.value = JSON.parse(JSON.stringify(editForm.value))
    currentMember.value = { ...editForm.value }
    
    ElMessage.success('信息更新成功！')
  } catch (error) {
    if (error.message) {
      ElMessage.error('保存失败: ' + error.message)
    }
  } finally {
    saving.value = false
  }
}

// 生命周期
onMounted(() => {
  loadMemberData()
})

// 路由守卫 - 离开前检查未保存的更改
watch(
  () => route.params.token,
  () => {
    loadMemberData()
  }
)
</script>

<style scoped>
.user-edit-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  color: #409eff;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.edit-form-container {
  margin-bottom: 24px;
}

.form-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: #409eff;
  border-radius: 2px;
}

.tag-tip {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.invalid-token {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 32px;
}

.loading-state {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 32px;
}

@media (max-width: 768px) {
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style>
