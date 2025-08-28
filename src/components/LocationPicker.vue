<template>
  <div class="location-picker">
    <el-form-item :label="label" :prop="prop">
      <div class="location-input-group">
        <!-- 地址输入框 -->
        <div class="input-with-actions">
          <el-input
            v-model="addressInput"
            :placeholder="placeholder"
            @blur="handleAddressBlur"
            @keyup.enter="handleAddressBlur"
            class="address-input"
          >
            <template #prepend>
              <el-icon><Location /></el-icon>
            </template>
          </el-input>
          
          <div class="input-actions">
            <el-button @click="getCurrentLocation" :loading="locating" class="action-btn">
              <el-icon><Position /></el-icon>
              {{ locating ? '定位中' : '定位' }}
            </el-button>
            <el-button @click="showMapPicker = true" type="primary" class="action-btn">
              <el-icon><Map /></el-icon>
              地图
            </el-button>
          </div>
        </div>
        
        <!-- 坐标显示（可选） -->
        <div v-if="coordinates && showCoordinates" class="coordinates-display">
          <el-tag size="small" type="info">
            经度: {{ coordinates[0].toFixed(6) }}, 纬度: {{ coordinates[1].toFixed(6) }}
          </el-tag>
        </div>
      </div>
    </el-form-item>

    <!-- 地图选择器对话框 -->
    <el-dialog
      v-model="showMapPicker"
      title="选择位置"
      width="80%"
      @closed="onMapPickerClosed"
    >
      <div class="map-picker-container">
        <div class="picker-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索地址或POI..."
            @keyup.enter="searchLocation"
            clearable
          >
            <template #prepend>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="searchLocation" type="primary">搜索</el-button>
            </template>
          </el-input>
        </div>
        
        <div ref="pickerMapContainer" class="picker-map"></div>
        
        <div class="picker-info" v-if="selectedAddress">
          <p><strong>选中地址:</strong> {{ selectedAddress }}</p>
          <p><strong>坐标:</strong> {{ selectedCoordinates[0] }}, {{ selectedCoordinates[1] }}</p>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMapPicker = false">取消</el-button>
          <el-button type="primary" @click="confirmLocation" :disabled="!selectedAddress">
            确认位置
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 快捷位置按钮 -->
    <div class="quick-locations" v-if="showQuickLocations">
      <el-button-group>
        <el-button
          v-for="location in quickLocations"
          :key="location.name"
          size="small"
          @click="selectQuickLocation(location)"
        >
          {{ location.name }}
        </el-button>
        <el-button size="small" @click="showMapPicker = true" type="primary">
          <el-icon><Map /></el-icon>
          地图选择
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  coordinates: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: '位置'
  },
  prop: {
    type: String,
    default: 'location'
  },
  placeholder: {
    type: String,
    default: '请输入详细地址，如：上海市浦东新区张江高科技园区'
  },
  showCoordinates: {
    type: Boolean,
    default: false
  },
  showQuickLocations: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'update:coordinates', 'locationChange'])

// 状态
const addressInput = ref(props.modelValue)
const showMapPicker = ref(false)
const locating = ref(false)
const searchKeyword = ref('')
const selectedAddress = ref('')
const selectedCoordinates = ref([])
const pickerMapContainer = ref()
let pickerMap = null
let marker = null
let geocoder = null

// 高德地图Key
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'e5bf6ad4ff2373f292289eadab4b227b'

// 地址格式化函数 - 精确到区级
const formatAddressToDistrict = (fullAddress, regeocode = null) => {
  if (!fullAddress) return ''
  
  // 如果有详细的regeocode信息，优先使用结构化数据
  if (regeocode && regeocode.addressComponent) {
    const { province, city, district } = regeocode.addressComponent
    if (province && city && district) {
      return `${province}${city}${district}`
    }
  }
  
  // 通过正则表达式提取省市区信息
  const addressMatch = fullAddress.match(/^(.*?[省市])(.*?[市区县])(.*?[区县镇])?/)
  if (addressMatch) {
    const [, province = '', city = '', district = ''] = addressMatch
    // 去除重复的"市"字
    const cleanCity = city.replace(/市$/, '') + (city.endsWith('市') ? '' : '市')
    return `${province}${cleanCity}${district}`
  }
  
  // 如果无法匹配，尝试简单的截取方式
  const parts = fullAddress.split(/[省市区县]/)
  if (parts.length >= 3) {
    return `${parts[0]}省${parts[1]}市${parts[2]}区`
  }
  
  return fullAddress
}

// 快捷位置
const quickLocations = [
  { name: '上海陆家嘴', coordinates: [121.5057, 31.2453], address: '上海市浦东新区' },
  { name: '上海张江', coordinates: [121.5994, 31.2047], address: '上海市浦东新区' },
  { name: '上海徐家汇', coordinates: [121.4352, 31.1993], address: '上海市徐汇区' },
  { name: '北京中关村', coordinates: [116.3105, 39.9830], address: '北京市海淀区' },
  { name: '深圳南山', coordinates: [113.9177, 22.5333], address: '广东省深圳市南山区' },
  { name: '杭州西湖', coordinates: [120.1551, 30.2741], address: '浙江省杭州市西湖区' }
]

// 方法
const initGeocoder = async () => {
  if (!geocoder) {
    try {
      const AMap = await AMapLoader.load({
        key: AMAP_KEY,
        version: '2.0',
        plugins: ['AMap.Geocoder']
      })
      geocoder = new AMap.Geocoder({
        radius: 1000,
        extensions: "all"
      })
    } catch (error) {
      console.error('初始化地理编码失败:', error)
    }
  }
}

const handleAddressBlur = async () => {
  if (addressInput.value && addressInput.value !== props.modelValue) {
    await geocodeAddress(addressInput.value)
  }
}

const geocodeAddress = async (address) => {
  if (!address.trim()) return
  
  try {
    await initGeocoder()
    if (!geocoder) return
    
    geocoder.getLocation(address, (status, result) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const location = result.geocodes[0]
        const coords = [location.location.lng, location.location.lat]
        
        emit('update:modelValue', location.formattedAddress || address)
        emit('update:coordinates', coords)
        emit('locationChange', {
          address: location.formattedAddress || address,
          coordinates: coords,
          detail: location
        })
        
        ElMessage.success('地址解析成功')
      } else {
        ElMessage.warning('地址解析失败，请检查地址是否正确')
      }
    })
  } catch (error) {
    console.error('地理编码失败:', error)
    ElMessage.error('地理编码服务异常')
  }
}

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    ElMessage.error('您的浏览器不支持地理定位')
    return
  }
  
  locating.value = true
  
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000  // 5分钟缓存
      })
    })
    
    const coords = [position.coords.longitude, position.coords.latitude]
    await reverseGeocode(coords)
    
  } catch (error) {
    console.error('定位失败:', error)
    
    // 根据错误类型提供更具体的提示
    let errorMessage = '定位失败'
    if (error.code === 1) {
      errorMessage = '定位被拒绝，请检查浏览器位置权限设置'
    } else if (error.code === 2) {
      errorMessage = '无法获取位置信息，请检查网络连接'
    } else if (error.code === 3) {
      errorMessage = '定位超时，请重试或手动输入地址'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    locating.value = false
  }
}

const reverseGeocode = async (coordinates) => {
  try {
    await initGeocoder()
    if (!geocoder) return
    
    geocoder.getAddress(coordinates, (status, result) => {
      if (status === 'complete' && result.regeocode) {
        const fullAddress = result.regeocode.formattedAddress
        const districtAddress = formatAddressToDistrict(fullAddress, result.regeocode)
        addressInput.value = districtAddress
        
        emit('update:modelValue', districtAddress)
        emit('update:coordinates', coordinates)
        emit('locationChange', {
          address: districtAddress,
          coordinates: coordinates,
          detail: result.regeocode
        })
        
        ElMessage.success('定位成功')
      } else {
        ElMessage.warning('逆地理编码失败')
      }
    })
  } catch (error) {
    console.error('逆地理编码失败:', error)
    ElMessage.error('地址解析失败')
  }
}

const selectQuickLocation = (location) => {
  addressInput.value = location.address
  emit('update:modelValue', location.address)
  emit('update:coordinates', location.coordinates)
  emit('locationChange', {
    address: location.address,
    coordinates: location.coordinates
  })
}

const searchLocation = async () => {
  if (!searchKeyword.value.trim()) return
  
  try {
    await initGeocoder()
    if (!geocoder) return
    
    geocoder.getLocation(searchKeyword.value, (status, result) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const location = result.geocodes[0]
        const coords = [location.location.lng, location.location.lat]
        
        // 更新地图中心和标记
        if (pickerMap) {
          updateMarker(coords)
          reverseGeocodeForPicker(coords)
        }
        
        ElMessage.success('搜索成功')
      } else {
        ElMessage.warning('未找到相关地址，请尝试其他关键词')
      }
    })
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  }
}

const initPickerMap = async () => {
  try {
    if (!pickerMapContainer.value) {
      console.error('地图容器未找到')
      return
    }

    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.Geocoder']
    })
    
    // 清理可能存在的旧地图实例
    if (pickerMap) {
      pickerMap.destroy()
      pickerMap = null
      marker = null
    }
    
    pickerMap = new AMap.Map(pickerMapContainer.value, {
      zoom: 15,
      center: props.coordinates.length ? props.coordinates : [121.4737, 31.2304],
      mapStyle: 'amap://styles/normal',
      resizeEnable: true
    })
    
    // 等待地图完全加载
    pickerMap.on('complete', () => {
      console.log('地图加载完成')
      
      // 添加点击事件
      pickerMap.on('click', (e) => {
        const coords = [e.lnglat.lng, e.lnglat.lat]
        updateMarker(coords)
        reverseGeocodeForPicker(coords)
      })
      
      // 如果有初始坐标，添加标记
      if (props.coordinates.length) {
        updateMarker(props.coordinates)
        selectedCoordinates.value = [...props.coordinates]
        selectedAddress.value = props.modelValue
      }
    })
    
  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error('地图加载失败，请检查网络连接或稍后重试')
  }
}

const updateMarker = (coordinates) => {
  if (!pickerMap) return
  
  // 移除旧标记
  if (marker) {
    pickerMap.remove(marker)
    marker = null
  }
  
  // 创建新标记
  marker = new AMap.Marker({
    position: coordinates,
    draggable: true,
    cursor: 'move'
  })
  
  // 添加拖拽事件
  marker.on('dragend', (e) => {
    const coords = [e.lnglat.lng, e.lnglat.lat]
    selectedCoordinates.value = coords
    reverseGeocodeForPicker(coords)
  })
  
  // 添加到地图
  pickerMap.add(marker)
  
  // 更新选中坐标和地图中心
  selectedCoordinates.value = coordinates
  pickerMap.setCenter(coordinates)
}

const reverseGeocodeForPicker = async (coordinates) => {
  try {
    await initGeocoder()
    if (!geocoder) return
    
    geocoder.getAddress(coordinates, (status, result) => {
      if (status === 'complete' && result.regeocode) {
        const fullAddress = result.regeocode.formattedAddress
        selectedAddress.value = formatAddressToDistrict(fullAddress, result.regeocode)
      }
    })
  } catch (error) {
    console.error('逆地理编码失败:', error)
  }
}

const confirmLocation = () => {
  if (selectedAddress.value && selectedCoordinates.value.length) {
    addressInput.value = selectedAddress.value
    emit('update:modelValue', selectedAddress.value)
    emit('update:coordinates', selectedCoordinates.value)
    emit('locationChange', {
      address: selectedAddress.value,
      coordinates: selectedCoordinates.value
    })
    showMapPicker.value = false
    ElMessage.success('位置选择成功')
  }
}

const onMapPickerClosed = () => {
  console.log('地图选择器关闭，清理资源')
  if (marker) {
    marker = null
  }
  if (pickerMap) {
    pickerMap.destroy()
    pickerMap = null
  }
  // 重置搜索关键词和选中状态
  searchKeyword.value = ''
  selectedAddress.value = ''
  selectedCoordinates.value = []
}

// 监听对话框打开
watch(showMapPicker, (newVal) => {
  if (newVal) {
    console.log('地图选择器打开，初始化地图')
    // 延迟更长时间确保DOM完全渲染
    setTimeout(() => {
      initPickerMap()
    }, 200)
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  addressInput.value = newVal
})

// 生命周期
onMounted(() => {
  initGeocoder()
})
</script>

<style scoped>
.location-picker {
  width: 100%;
}

.location-input-group {
  width: 100%;
}

.input-with-actions {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.address-input {
  flex: 1;
}

.input-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  min-width: 70px;
  height: 32px;
}

.coordinates-display {
  margin-top: 4px;
}

.quick-locations {
  margin-top: 8px;
}

.map-picker-container {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.picker-search {
  margin-bottom: 16px;
}

.picker-map {
  flex: 1;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.picker-info {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
}

.picker-info p {
  margin: 4px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .input-with-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .input-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .input-actions .el-button {
    flex: 1;
  }
  
  .map-picker-container {
    height: 400px;
  }
  
  .picker-map {
    min-height: 300px;
  }
}
</style>
