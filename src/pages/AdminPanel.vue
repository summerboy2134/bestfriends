<template>
  <div class="admin-panel">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>管理员面板</h1>
          <p class="subtitle">管理群成员信息</p>
        </div>
        <div class="header-actions">
          <el-button @click="showGroupLeaderDialog">
            <el-icon><Crown /></el-icon>
            设置群主
          </el-button>
          <el-button @click="goToMessageManagement">
            <el-icon><ChatDotRound /></el-icon>
            留言管理
          </el-button>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加成员
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic 
            title="总成员数" 
            :value="memberStore.memberCount"
            :value-style="{ color: '#409eff' }"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic 
            title="地区数量" 
            :value="locationCount"
            :value-style="{ color: '#67c23a' }"
          >
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic 
            title="本月新增" 
            :value="thisMonthCount"
            :value-style="{ color: '#e6a23c' }"
          >
            <template #prefix>
              <el-icon><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic 
            :title="`当前群主`"
            :value="currentGroupLeaderName"
            :value-style="{ color: '#f5c842', fontSize: '18px', fontWeight: '600' }"
          >
            <template #prefix>
              <img src="/crown.png" style="width: 20px; height: 20px; margin-right: 8px;" />
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 成员管理表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>成员列表</span>
          <el-input
            v-model="searchText"
            placeholder="搜索成员..."
            style="width: 250px"
            prefix-icon="Search"
            clearable
          />
        </div>
      </template>

      <el-table 
        :data="filteredTableData" 
        v-loading="memberStore.loading"
        stripe
        style="width: 100%"
      >
        <el-table-column width="80">
          <template #default="{ row }">
            <el-avatar :size="50" :src="row.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="name-cell">
              <span>{{ row.name }}</span>
              <span v-if="row.isGroupLeader" class="leader-crown">👑</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="微信号" width="150">
          <template #default="{ row }">
            <span v-if="row.social?.wechat">{{ row.social.wechat }}</span>
            <span v-else class="no-data">未设置</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="location" label="地区" width="180">
          <template #default="{ row }">
            <el-tag size="small">{{ row.location }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="bio" label="个人介绍" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="joinDate" label="加入时间" width="120" />
        
        <el-table-column prop="tags" label="兴趣标签" width="180">
          <template #default="{ row }">
            <el-tag 
              v-for="tag in row.tags?.slice(0, 3)" 
              :key="tag" 
              size="small"
              style="margin-right: 4px; margin-bottom: 2px;"
            >
              {{ tag }}
            </el-tag>
            <span v-if="row.tags?.length > 3" class="more-tags">+{{ row.tags.length - 3 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small"
                @click="adminEditMember(row)"
              >
                编辑
              </el-button>
              <el-button 
                type="success" 
                size="small"
                @click="generateEditLink(row)"
              >
                链接
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click="deleteMember(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 设置群主对话框 -->
    <el-dialog 
      v-model="groupLeaderDialogVisible" 
      title="设置群主"
      width="400px"
    >
      <div class="group-leader-selection">
        <p style="margin-bottom: 16px; color: #606266;">选择新的群主：</p>
        <el-select 
          v-model="selectedGroupLeaderId" 
          placeholder="请选择群主"
          style="width: 100%"
          size="large"
        >
          <el-option
            v-for="member in memberStore.members"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          >
            <div class="member-option-select">
              <span class="member-name">{{ member.name }}</span>
              <img v-if="member.isGroupLeader" src="/crown.png" class="crown-icon-small" />
            </div>
          </el-option>
        </el-select>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="groupLeaderDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmSetGroupLeader"
            :disabled="!selectedGroupLeaderId"
          >
            确定设置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑成员对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑成员' : '添加成员'"
      width="600px"
    >
      <el-form 
        ref="memberFormRef"
        :model="memberForm" 
        :rules="formRules"
        label-width="80px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="memberForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信号">
              <el-input 
                v-model="memberForm.social.wechat" 
                placeholder="请输入微信号"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="地区" prop="location">
              <el-input v-model="memberForm.location" placeholder="如：上海市浦东新区" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="加入时间" prop="joinDate">
              <el-date-picker
                v-model="memberForm.joinDate"
                type="date"
                placeholder="选择加入时间"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="头像URL" prop="avatar">
          <el-input v-model="memberForm.avatar" placeholder="头像图片链接" />
        </el-form-item>
        
        <el-form-item label="个人介绍" prop="bio">
          <el-input 
            v-model="memberForm.bio" 
            type="textarea" 
            :rows="3"
            placeholder="简单介绍一下自己..."
          />
        </el-form-item>
        
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="memberForm.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或输入标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="社交信息">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-input 
                v-model="memberForm.social.wechat" 
                placeholder="微信号"
                prefix-icon="ChatDotRound"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMember">
            {{ isEditing ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMemberStore } from '@/stores/members'

const memberStore = useMemberStore()
const router = useRouter()

// 状态
const searchText = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const memberFormRef = ref()
const groupLeaderDialogVisible = ref(false)
const selectedGroupLeaderId = ref(null)

// 表单数据
const memberForm = ref({
  name: '',
  originalName: '', // 用于编辑时跟踪原始姓名
  email: '',
  position: '',
  company: '',
  phone: '',
  location: '',
  avatar: '',
  bio: '',
  tags: [],
  social: {
    wechat: '',
    github: '',
    linkedin: ''
  }
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { validator: validateName, trigger: 'blur' }
  ]
}

// 常用标签
const commonTags = ['技术', '产品', '设计', '运营', '数据', '营销', '管理', '创业', '投资', '教育', '艺术', '音乐', '摄影', '旅行', '运动', '美食', '读书', '电影']

// 计算属性
const filteredTableData = computed(() => {
  if (!searchText.value) return memberStore.members
  
  const keyword = searchText.value.toLowerCase()
  return memberStore.members.filter(member =>
    member.name.toLowerCase().includes(keyword) ||
    member.company.toLowerCase().includes(keyword) ||
    member.position.toLowerCase().includes(keyword) ||
    member.email.toLowerCase().includes(keyword)
  )
})

const locationCount = computed(() => {
  return new Set(memberStore.members.map(m => m.location)).size
})

const thisMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return memberStore.members.filter(member => {
    const joinDate = new Date(member.joinDate)
    return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
  }).length
})

// 获取当前群主名称
const currentGroupLeaderName = computed(() => {
  const leader = memberStore.getGroupLeader()
  return leader ? leader.name : '暂无群主'
})

// 验证函数
const validateName = async (rule, value, callback) => {
  if (!value) {
    return callback()  // 空值由required规则处理
  }
  
  // 如果是编辑模式且名字没有改变，则跳过检查
  if (isEditing.value && memberForm.value.originalName === value) {
    return callback()
  }
  
  // 检查是否有重名
  const existingMember = memberStore.members.find(member => 
    member.name === value && member.id !== memberForm.value.id
  )
  
  if (existingMember) {
    callback(new Error('该姓名已存在，请使用其他姓名'))
  } else {
    callback()
  }
}

// 方法
const showAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

// 管理员直接编辑（绕过token校验）
const adminEditMember = (member) => {
  router.push(`/edit/admin/${member.id}`)
}

// 生成编辑链接给群友使用
const goToEditPage = async (member) => {
  try {
    const token = await memberStore.generateEditToken(member.id)
    router.push(`/edit/${token}?admin=true`)
  } catch (error) {
    ElMessage.error('生成编辑令牌失败: ' + error.message)
  }
}

const goToMessageManagement = () => {
  router.push('/admin/messages')
}

// 显示群主设置对话框
const showGroupLeaderDialog = () => {
  const currentLeader = memberStore.getGroupLeader()
  selectedGroupLeaderId.value = currentLeader ? currentLeader.id : null
  groupLeaderDialogVisible.value = true
}

// 确认设置群主
const confirmSetGroupLeader = async () => {
  if (selectedGroupLeaderId.value) {
    try {
      await memberStore.setGroupLeader(selectedGroupLeaderId.value)
      const member = memberStore.getMemberById(selectedGroupLeaderId.value)
      ElMessage.success(`${member.name} 已设置为群主`)
      groupLeaderDialogVisible.value = false
    } catch (error) {
      ElMessage.error('设置群主失败: ' + error.message)
    }
  }
}



const resetForm = () => {
  memberForm.value = {
    name: '',
    originalName: '',
    location: '',
    avatar: '',
    bio: '',
    tags: [],
    joinDate: new Date().toISOString().split('T')[0], // 默认为今天
    social: {
      wechat: ''
    }
  }
}

const saveMember = async () => {
  try {
    await memberFormRef.value.validate()
    
    if (isEditing.value) {
      await memberStore.updateMember(memberForm.value.id, memberForm.value)
      ElMessage.success('成员信息更新成功')
    } else {
      await memberStore.addMember(memberForm.value)
      ElMessage.success('成员添加成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

const deleteMember = (member) => {
  ElMessageBox.confirm(
    `确定要删除成员 "${member.name}" 吗？此操作不可撤销。`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await memberStore.deleteMember(member.id)
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败: ' + error.message)
    }
  })
}

const generateEditLink = async (member) => {
  try {
    const token = await memberStore.generateEditToken(member.id)
    const editUrl = `${window.location.origin}/edit/${token}`
    
    ElMessageBox.alert(
      `编辑链接: ${editUrl}`,
      `为 ${member.name} 生成编辑链接`,
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

// 生命周期
onMounted(async () => {
  await memberStore.loadMembers()
})
</script>

<style scoped>
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: white;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.table-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.more-tags {
  color: #909399;
  font-size: 12px;
}

.no-data {
  color: #c0c4cc;
  font-style: italic;
  font-size: 12px;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.leader-crown {
  font-size: 16px;
  line-height: 1;
}

/* 群主设置对话框样式 */
.group-leader-selection {
  padding: 16px 0;
}

.member-option-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.crown-icon-small {
  width: 14px;
  height: 14px;
  margin-left: 8px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.action-buttons .el-button {
  flex-shrink: 0;
  min-width: auto;
  padding: 4px 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-row .el-col {
    margin-bottom: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
