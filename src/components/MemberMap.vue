<template>
  <div class="member-map">
    <el-card class="map-card">
      <template #header>
        <div class="map-header">
          <div class="header-left">
            <el-icon size="20"><Location /></el-icon>
            <span class="title">成员地理分布</span>
          </div>
          <div class="header-stats">
            <el-tag type="info">总计 {{ totalMembers }} 人</el-tag>
            <el-tag type="success">{{ uniqueLocations }} 个城市</el-tag>
          </div>
        </div>
      </template>
      
      <!-- 地图容器 -->
      <div 
        ref="mapContainer" 
        class="map-container"
        v-loading="loading"
        element-loading-text="加载地图中..."
      ></div>
      
      <!-- 城市统计 -->
      <div class="location-stats">
        <h4>城市分布统计</h4>
        <div class="stats-grid">
          <div 
            v-for="(data, city) in locationStats" 
            :key="city"
            class="stat-item"
            @click="focusOnCity(city)"
          >
            <div class="city-info">
              <span class="city-name">{{ city }}</span>
              <span class="member-count">{{ data.members.length }} 人</span>
            </div>
            <div class="member-avatars">
              <el-avatar 
                v-for="member in data.members.slice(0, 3)" 
                :key="member.id"
                :size="24" 
                :src="member.avatar"
                class="mini-avatar"
              >
                {{ member.name.charAt(0) }}
              </el-avatar>
              <span v-if="data.members.length > 3" class="more-count">
                +{{ data.members.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { ElMessage } from 'element-plus'

const props = defineProps({
  members: {
    type: Array,
    default: () => []
  }
})

// 状态
const mapContainer = ref()
const loading = ref(true)
const map = ref(null)
const markers = ref([])

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'your-amap-key-here'
const AMAP_SECURITY_JS_CODE = import.meta.env.VITE_AMAP_SECURITY_JS_CODE

// 城市坐标映射（主要城市）
const cityCoordinates = {
  '上海': [121.4737, 31.2304],
  '北京': [116.4074, 39.9042],
  '深圳': [114.0579, 22.5431],
  '广州': [113.2644, 23.1291],
  '杭州': [120.1551, 30.2741],
  '南京': [118.7969, 32.0603],
  '成都': [104.0668, 30.5728],
  '武汉': [114.3054, 30.5931],
  '西安': [108.9398, 34.3416],
  '重庆': [106.5516, 29.5630],
  '苏州': [120.5853, 31.2989],
  '天津': [117.1901, 39.1040],
  '青岛': [120.3826, 36.0678],
  '大连': [121.6147, 38.9140],
  '厦门': [118.1689, 24.4797],
  '宁波': [121.5440, 29.8683],
  '无锡': [120.3019, 31.5747],
  '佛山': [113.1220, 23.0288],
  '东莞': [113.7518, 23.0218],
  '长沙': [112.9388, 28.2282]
}

// 地址格式化函数 - 提取城市名称
const formatAddressToCity = (fullAddress) => {
  if (!fullAddress) return ''
  
  // 匹配各种地址格式，提取城市
  const patterns = [
    /^(.+?市)/,  // 匹配 "上海市"、"北京市" 等
    /^(.+?自治区)/,  // 匹配自治区
    /^(.+?特别行政区)/,  // 匹配特别行政区
    /^(.+?省)(.+?市)/,  // 匹配 "江苏省南京市" 格式，取市
  ]
  
  for (const pattern of patterns) {
    const match = fullAddress.match(pattern)
    if (match) {
      // 对于省市格式，返回市
      if (pattern.source.includes('省') && match[2]) {
        return match[2]
      }
      return match[1]
    }
  }
  
  // 如果都不匹配，返回原地址
  return fullAddress
}

// 计算属性
const totalMembers = computed(() => props.members.length)

const uniqueLocations = computed(() => {
  const cities = new Set(props.members.map(m => formatAddressToCity(m.location)))
  return cities.size
})

const locationStats = computed(() => {
  const stats = {}
  props.members.forEach(member => {
    const city = formatAddressToCity(member.location)
    if (!stats[city]) {
      stats[city] = {
        members: [],
        coordinates: cityCoordinates[city] || null
      }
    }
    stats[city].members.push(member)
  })
  return stats
})

// 方法
const initMap = async () => {
  try {
    loading.value = true
    
    // 如果没有API Key，显示提示信息
    if (!AMAP_KEY || AMAP_KEY === 'your-amap-key-here') {
      showNoMapMessage()
      return
    }
    
    // 配置安全密钥
    if (AMAP_SECURITY_JS_CODE) {
      window._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_JS_CODE
      }

    }

    // 加载高德地图API
    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.InfoWindow']
    })
    
    // 检查地图容器
    if (!mapContainer.value) {
      throw new Error('地图容器未找到')
    }
    
    // 创建地图实例
    map.value = new AMap.Map(mapContainer.value, {
      zoom: 6,
      center: [121.4737, 31.2304], // 以上海为中心
      mapStyle: 'amap://styles/light'
    })
    
    // 添加标记点
    await addMarkers(AMap)
    
  } catch (error) {

    
    // 显示错误信息给用户
    const errorMsg = error.message || '未知错误'
    ElMessage.error(`地图加载失败: ${errorMsg}`)
    
    // 如果是API相关错误，提供更具体的提示
    if (error.message && error.message.includes('key')) {
      ElMessage.warning('可能是API Key配置问题，请检查高德地图控制台')
    }
    
    showNoMapMessage()
  } finally {
    loading.value = false
  }
}

const showNoMapMessage = async () => {
  await nextTick()
  if (mapContainer.value) {
    mapContainer.value.innerHTML = `
      <div class="no-map-message">
        <div class="message-content">
          <div class="icon">🗺️</div>
          <h3>地图功能暂不可用</h3>
          <p>需要配置高德地图API Key才能显示地图</p>
          <div class="help-text">
            <small>请在环境变量中配置 VITE_AMAP_KEY</small>
          </div>
        </div>
      </div>
    `
  }
  loading.value = false
}

const addMarkers = async (AMap) => {
  // 清除现有标记
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []
  
  // 为每个成员添加精确标记
  const markerPromises = props.members.map(async (member) => {
    
    if (member.coordinates && member.coordinates.length === 2) {
      try {
        const iconImage = await createMemberMarkerIcon(member)
        
        const marker = new AMap.Marker({
          position: member.coordinates,
          title: `${member.name} - ${member.bio || ''}`,
          icon: new AMap.Icon({
            image: iconImage,
            size: new AMap.Size(40, 40),
            imageSize: new AMap.Size(40, 40)
          })
        })
        
        // 添加信息窗口
        const infoWindow = new AMap.InfoWindow({
          content: createMemberInfoWindowContent(member),
          offset: new AMap.Pixel(0, -40)
        })
        
        marker.on('click', () => {
          infoWindow.open(map.value, marker.getPosition())
        })
        
        marker.setMap(map.value)
        return marker
      } catch (error) {

        return null
      }
    } else {
      return null
    }
  })
  
  // 等待所有标记创建完成
  const newMarkers = await Promise.all(markerPromises)
  markers.value = newMarkers.filter(marker => marker !== null)
  
  // 如果有标记，调整地图视野以包含所有标记
  if (markers.value.length > 0) {
    const bounds = new AMap.Bounds()
    markers.value.forEach(marker => {
      bounds.extend(marker.getPosition())
    })
    map.value.setBounds(bounds, false, [50, 50, 50, 50])
  }
}

const createMemberMarkerIcon = (member) => {
  // 为每个成员创建个性化标记图标
  const canvas = document.createElement('canvas')
  canvas.width = 40
  canvas.height = 40
  const ctx = canvas.getContext('2d')
  
  return new Promise((resolve) => {
    // 如果有头像，尝试加载头像；否则显示姓名首字母
    if (member.avatar && member.avatar.trim()) {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          // 绘制圆形头像
          ctx.clearRect(0, 0, 40, 40)
          ctx.save()
          
          // 创建圆形裁剪路径
          ctx.beginPath()
          ctx.arc(20, 20, 18, 0, 2 * Math.PI)
          ctx.clip()
          
          // 绘制头像
          ctx.drawImage(img, 2, 2, 36, 36)
          
          // 恢复上下文并添加边框
          ctx.restore()
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(20, 20, 18, 0, 2 * Math.PI)
          ctx.stroke()
          
          resolve(canvas.toDataURL())
        } catch (error) {

          resolve(createNameMarker())
        }
      }
      
      img.onerror = () => {

        resolve(createNameMarker())
      }
      
      // 设置图片源，支持相对路径和绝对路径
      if (member.avatar.startsWith('http') || member.avatar.startsWith('//')) {
        img.src = member.avatar
      } else if (member.avatar.startsWith('/uploads/')) {
        // 使用当前域名构建完整URL
        const protocol = window.location.protocol
        const hostname = window.location.hostname
        const port = window.location.hostname === 'localhost' ? ':3001' : ''
        img.src = `${protocol}//${hostname}${port}${member.avatar}`
      } else {
        img.src = member.avatar
      }
    } else {
      // 没有头像时显示首字母
      resolve(createNameMarker())
    }
    
    function createNameMarker() {
      // 根据个人介绍设置颜色
      const getColorByBio = (bio) => {
        if (!bio) return '#1890ff'
        if (bio.includes('前端') || bio.includes('全栈')) return '#409eff'
        if (bio.includes('后端') || bio.includes('DevOps')) return '#67c23a'
        if (bio.includes('产品') || bio.includes('运营')) return '#e6a23c'
        if (bio.includes('设计')) return '#f56c6c'
        if (bio.includes('数据') || bio.includes('算法') || bio.includes('AI')) return '#909399'
        if (bio.includes('总监') || bio.includes('经理') || bio.includes('架构师')) return '#722ed1'
        return '#1890ff'
      }
      
      // 清空画布
      ctx.clearRect(0, 0, 40, 40)
      
      // 绘制圆形背景
      ctx.fillStyle = getColorByBio(member.bio || '')
      ctx.beginPath()
      ctx.arc(20, 20, 18, 0, 2 * Math.PI)
      ctx.fill()
      
      // 添加白色边框
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.stroke()
      
      // 绘制成员姓名首字母
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(member.name.charAt(0), 20, 20)
      
      return canvas.toDataURL()
    }
  })
}

const createMemberInfoWindowContent = (member) => {
  return `
    <div style="padding: 15px; min-width: 250px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="width: 50px; height: 50px; border-radius: 50%; margin-right: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
          ${member.name.charAt(0)}
        </div>
        <div>
          <h4 style="margin: 0 0 4px 0; color: #303133; font-size: 16px;">${member.name}</h4>
          <p style="margin: 0; color: #909399; font-size: 12px;">${member.bio || '群组成员'}</p>
        </div>
      </div>
      <div style="border-top: 1px solid #ebeef5; padding-top: 12px;">
        <div style="margin-bottom: 8px;">
          <span style="color: #606266; font-size: 14px;"><strong>地址:</strong> ${member.location}</span>
        </div>
        ${member.social?.wechat ? `
        <div style="margin-bottom: 8px;">
          <span style="color: #606266; font-size: 14px;"><strong>微信:</strong> ${member.social.wechat}</span>
        </div>
        ` : ''}
        ${member.bio ? `<div style="margin-top: 12px; padding: 8px; background: #f5f7fa; border-radius: 4px; font-size: 13px; color: #606266;">${member.bio}</div>` : ''}
        ${member.tags && member.tags.length > 0 ? `
        <div style="margin-top: 12px;">
          ${member.tags.map(tag => `<span style="display: inline-block; padding: 2px 8px; background: #e1f3d8; color: #529b2e; border-radius: 12px; font-size: 11px; margin-right: 4px; margin-bottom: 4px;">${tag}</span>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
  `
}



const focusOnCity = (city) => {
  const coordinates = cityCoordinates[city]
  if (coordinates && map.value) {
    map.value.setCenter(coordinates)
    map.value.setZoom(10)
  } else {
    ElMessage.info(`聚焦到 ${city}`)
  }
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initMap()
  })
})
</script>

<style scoped>
.member-map {
  width: 100%;
}

.map-card {
  width: 100%;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-stats {
  display: flex;
  gap: 8px;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  position: relative;
}

/* 无地图消息样式 */
.no-map-message {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.message-content {
  text-align: center;
  padding: 40px;
}

.message-content .icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.message-content h3 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 18px;
  font-weight: 500;
}

.message-content p {
  margin: 0 0 16px 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.5;
}

.help-text small {
  color: #c0c4cc;
  font-size: 12px;
}

.location-stats {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.location-stats h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: #e8f4ff;
  transform: translateY(-1px);
}

.city-info {
  display: flex;
  flex-direction: column;
}

.city-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.member-count {
  font-size: 12px;
  color: #909399;
}

.member-avatars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-avatar {
  border: 1px solid white;
}

.more-count {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

@media (max-width: 768px) {
  .map-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .map-container {
    height: 300px;
  }
}
</style>
