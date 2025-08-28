<template>
  <div class="member-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>群成员展示</h1>
          <p class="subtitle">还没想好写什么</p>
        </div>
        <div class="header-stats">
          <el-statistic 
            title="总成员数" 
            :value="memberStore.memberCount"
            :value-style="{ color: '#409eff', fontSize: '24px' }"
          />
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索成员姓名..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="selectedLocation"
            placeholder="选择地区"
            clearable
            @change="handleLocationFilter"
          >
            <el-option label="全部地区" value="" />
            <el-option
              v-for="location in locations"
              :key="location"
              :label="location"
              :value="location"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="selectedTag"
            placeholder="选择标签"
            clearable
            @change="handleTagFilter"
          >
            <el-option label="全部标签" value="" />
            <el-option
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters" type="info">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 成员卡片网格 -->
    <div class="members-grid" v-loading="memberStore.loading">
      <div 
        v-for="member in filteredMembers" 
        :key="member.id"
        class="member-card-wrapper"
      >
        <MemberCard :member="member" :show-actions="true" />
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty 
      v-if="!memberStore.loading && filteredMembers.length === 0"
      description="没有找到匹配的成员"
      :image-size="120"
    >
      <el-button type="primary" @click="resetFilters">重置筛选条件</el-button>
    </el-empty>

    <!-- 地图展示 -->
    <div class="map-section" v-if="filteredMembers.length > 0">
      <MemberMap :members="filteredMembers" />
    </div>

    <!-- 地区统计 -->
    <div class="location-stats" v-if="filteredMembers.length > 0">
      <h3>地区分布</h3>
      <el-row :gutter="16">
        <el-col 
          v-for="(members, location) in locationStats" 
          :key="location"
          :span="6"
        >
          <el-card class="location-card">
            <div class="location-info">
              <el-icon class="location-icon"><Location /></el-icon>
              <div>
                <div class="location-name">{{ location }}</div>
                <div class="location-count">{{ members.length }} 人</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from '@/stores/members'
import MemberCard from '@/components/MemberCard.vue'
import MemberMap from '@/components/MemberMap.vue'

const memberStore = useMemberStore()

// 地址格式化函数 - 提取区级地址
const formatAddressToDistrict = (fullAddress) => {
  if (!fullAddress) return '未知地区'
  
  // 处理上海市的情况: 上海市XX区
  const shanghaiMatch = fullAddress.match(/^上海市([^区]+区)/)
  if (shanghaiMatch) {
    return `上海市${shanghaiMatch[1]}`
  }
  
  // 处理北京市的情况: 北京市XX区  
  const beijingMatch = fullAddress.match(/^北京市([^区]+区)/)
  if (beijingMatch) {
    return `北京市${beijingMatch[1]}`
  }
  
  // 处理天津市的情况: 天津市XX区
  const tianjinMatch = fullAddress.match(/^天津市([^区]+区)/)
  if (tianjinMatch) {
    return `天津市${tianjinMatch[1]}`
  }
  
  // 处理重庆市的情况: 重庆市XX区
  const chongqingMatch = fullAddress.match(/^重庆市([^区]+区)/)
  if (chongqingMatch) {
    return `重庆市${chongqingMatch[1]}`
  }
  
  // 处理省级地址: XX省XX市XX区
  const provinceMatch = fullAddress.match(/^([^省]+省)([^市]+市)([^区县]+[区县])/)
  if (provinceMatch) {
    return `${provinceMatch[1]}${provinceMatch[2]}${provinceMatch[3]}`
  }
  
  // 处理其他市级地址: XX市XX区 (没有省)
  const cityMatch = fullAddress.match(/^([^市]+市)([^区县]+[区县])/)
  if (cityMatch) {
    return `${cityMatch[1]}${cityMatch[2]}`
  }
  
  // 如果都无法匹配，尝试提取前面的关键信息
  if (fullAddress.includes('区')) {
    const parts = fullAddress.split('区')
    if (parts.length > 0) {
      const mainPart = parts[0] + '区'
      return mainPart.length > 15 ? mainPart.substring(0, 15) : mainPart
    }
  }
  
  // 最后兜底，返回简化的地址
  return fullAddress.length > 12 ? fullAddress.substring(0, 12) : fullAddress
}

// 筛选状态
const searchKeyword = ref('')
const selectedLocation = ref('')
const selectedTag = ref('')

// 计算属性
const locations = computed(() => {
  return [...new Set(memberStore.members.map(member => formatAddressToDistrict(member.location)))]
})

const allTags = computed(() => {
  const tags = new Set()
  memberStore.members.forEach(member => {
    member.tags?.forEach(tag => tags.add(tag))
  })
  return [...tags]
})

const filteredMembers = computed(() => {
  let filtered = [...memberStore.members]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(member => 
      member.name.toLowerCase().includes(keyword) ||
      member.company.toLowerCase().includes(keyword) ||
      member.position.toLowerCase().includes(keyword) ||
      member.bio.toLowerCase().includes(keyword)
    )
  }

  // 地区筛选
  if (selectedLocation.value) {
    filtered = filtered.filter(member => 
      formatAddressToDistrict(member.location) === selectedLocation.value
    )
  }

  // 标签筛选
  if (selectedTag.value) {
    filtered = filtered.filter(member => 
      member.tags?.includes(selectedTag.value)
    )
  }

  // 群主置顶排序
  return filtered.sort((a, b) => {
    // 群主排在最前面
    if (a.isGroupLeader && !b.isGroupLeader) return -1
    if (!a.isGroupLeader && b.isGroupLeader) return 1
    
    // 非群主按名字排序
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

const locationStats = computed(() => {
  const stats = {}
  filteredMembers.value.forEach(member => {
    const districtLocation = formatAddressToDistrict(member.location)
    if (!stats[districtLocation]) {
      stats[districtLocation] = []
    }
    stats[districtLocation].push(member)
  })
  return stats
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleLocationFilter = () => {
  // 筛选逻辑已在计算属性中处理
}

const handleTagFilter = () => {
  // 筛选逻辑已在计算属性中处理
}

const resetFilters = () => {
  searchKeyword.value = ''
  selectedLocation.value = ''
  selectedTag.value = ''
}

// 生命周期
onMounted(async () => {
  await memberStore.loadMembers()
})
</script>

<style scoped>
.member-list-page {
  max-width: 1200px;
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
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

.filter-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 24px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.member-card-wrapper {
  height: 100%;
}

.map-section {
  margin-bottom: 32px;
}

.location-stats {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.location-stats h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.location-card {
  text-align: center;
}

.location-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.location-icon {
  font-size: 24px;
  color: #409eff;
}

.location-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.location-count {
  font-size: 14px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .members-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .filter-section .el-row .el-col {
    margin-bottom: 12px;
  }
}
</style>
