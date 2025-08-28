<template>
  <div class="avatar-upload">
    <el-form-item :label="label" :prop="prop">
      <div class="upload-container">
        <!-- 头像预览 -->
        <div class="avatar-preview">
          <el-avatar 
            :size="avatarSize" 
            :src="previewUrl || modelValue" 
            class="preview-avatar"
          >
            <el-icon size="40"><User /></el-icon>
          </el-avatar>
          
          <!-- 上传按钮覆盖层 -->
          <div class="upload-overlay" @click="triggerUpload">
            <el-icon size="24"><Camera /></el-icon>
            <span class="upload-text">{{ modelValue ? '更换头像' : '上传头像' }}</span>
          </div>
        </div>
        
        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          style="display: none"
        />
        
        <!-- 操作按钮 -->
        <div class="upload-actions">
          <el-button size="small" @click="triggerUpload" type="primary">
            <el-icon><Upload /></el-icon>
            选择图片
          </el-button>
          <el-button 
            v-if="modelValue" 
            size="small" 
            @click="removeAvatar" 
            type="danger"
          >
            <el-icon><Delete /></el-icon>
            移除
          </el-button>
        </div>
        
        <!-- 上传提示 -->
        <div class="upload-tips">
          <p>• 支持 JPG、PNG、GIF 格式</p>
          <p>• 推荐使用正方形图片</p>
          <p>• 建议图片大小不超过 5MB</p>
        </div>
      </div>
    </el-form-item>

    <!-- 裁剪对话框 -->
    <el-dialog
      v-model="showCropper"
      title="裁剪头像"
      width="600px"
      @closed="onCropperClosed"
    >
      <div class="cropper-container">
        <div class="cropper-preview">
          <canvas
            ref="cropperCanvas"
            class="cropper-canvas"
            @mousedown="startCrop"
            @mousemove="updateCrop"
            @mouseup="endCrop"
          ></canvas>
        </div>
        
        <div class="cropper-controls">
          <el-slider
            v-model="cropScale"
            :min="0.1"
            :max="3"
            :step="0.1"
            @input="updatePreview"
          />
          <p>缩放: {{ (cropScale * 100).toFixed(0) }}%</p>
        </div>
      </div>
      
      <template #footer>
        <div class="cropper-footer">
          <el-button @click="showCropper = false">取消</el-button>
          <el-button type="primary" @click="confirmCrop" :loading="processing">
            {{ processing ? '处理中...' : '确认' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: '头像'
  },
  prop: {
    type: String,
    default: 'avatar'
  },
  avatarSize: {
    type: Number,
    default: 120
  }
})

const emit = defineEmits(['update:modelValue'])

// 状态
const fileInput = ref()
const previewUrl = ref('')
const showCropper = ref(false)
const processing = ref(false)
const cropperCanvas = ref()
const originalImage = ref(null)
const cropScale = ref(1)
const cropData = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  isDragging: false
})

// 方法
const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }
  
  loadImage(file)
}

const loadImage = (file) => {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      showCropper.value = true
      nextTick(() => {
        initCropper()
      })
    }
    img.src = e.target.result
  }
  
  reader.readAsDataURL(file)
}

const initCropper = () => {
  if (!cropperCanvas.value || !originalImage.value) return
  
  const canvas = cropperCanvas.value
  const ctx = canvas.getContext('2d')
  const img = originalImage.value
  
  // 设置画布尺寸
  const maxSize = 400
  const scale = Math.min(maxSize / img.width, maxSize / img.height)
  canvas.width = img.width * scale
  canvas.height = img.height * scale
  
  // 绘制图片
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  
  // 初始化裁剪区域
  const size = Math.min(canvas.width, canvas.height) * 0.8
  cropData.value = {
    x: (canvas.width - size) / 2,
    y: (canvas.height - size) / 2,
    width: size,
    height: size,
    isDragging: false
  }
  
  updatePreview()
}

const startCrop = (e) => {
  const rect = cropperCanvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 检查是否在裁剪区域内
  const crop = cropData.value
  if (x >= crop.x && x <= crop.x + crop.width && 
      y >= crop.y && y <= crop.y + crop.height) {
    crop.isDragging = true
    crop.startX = x - crop.x
    crop.startY = y - crop.y
  }
}

const updateCrop = (e) => {
  if (!cropData.value.isDragging) return
  
  const rect = cropperCanvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const crop = cropData.value
  crop.x = Math.max(0, Math.min(x - crop.startX, cropperCanvas.value.width - crop.width))
  crop.y = Math.max(0, Math.min(y - crop.startY, cropperCanvas.value.height - crop.height))
  
  updatePreview()
}

const endCrop = () => {
  cropData.value.isDragging = false
}

const updatePreview = () => {
  if (!cropperCanvas.value || !originalImage.value) return
  
  const canvas = cropperCanvas.value
  const ctx = canvas.getContext('2d')
  const img = originalImage.value
  
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 重新绘制图片
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  
  // 绘制裁剪框
  const crop = cropData.value
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)
  
  // 绘制遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvas.width, crop.y)
  ctx.fillRect(0, crop.y, crop.x, crop.height)
  ctx.fillRect(crop.x + crop.width, crop.y, canvas.width - crop.x - crop.width, crop.height)
  ctx.fillRect(0, crop.y + crop.height, canvas.width, canvas.height - crop.y - crop.height)
}

const confirmCrop = async () => {
  if (!originalImage.value) return
  
  processing.value = true
  
  try {
    const result = await processImage()
    emit('update:modelValue', result)
    showCropper.value = false
    ElMessage.success('头像上传成功')
  } catch (error) {
    console.error('图片处理失败:', error)
    ElMessage.error('图片处理失败，请重试')
  } finally {
    processing.value = false
  }
}

const processImage = () => {
  return new Promise((resolve) => {
    const img = originalImage.value
    const crop = cropData.value
    const canvas = cropperCanvas.value
    
    // 创建最终输出画布
    const outputCanvas = document.createElement('canvas')
    const outputCtx = outputCanvas.getContext('2d')
    
    // 计算原图比例
    const scaleX = img.width / canvas.width
    const scaleY = img.height / canvas.height
    
    // 计算裁剪区域在原图中的位置
    const sourceX = crop.x * scaleX
    const sourceY = crop.y * scaleY
    const sourceWidth = crop.width * scaleX
    const sourceHeight = crop.height * scaleY
    
    // 保持原图质量，只进行裁剪，不压缩尺寸
    // 设置输出尺寸为裁剪区域的实际大小
    const outputWidth = Math.round(sourceWidth)
    const outputHeight = Math.round(sourceHeight)
    
    outputCanvas.width = outputWidth
    outputCanvas.height = outputHeight
    
    // 绘制裁剪后的图片，保持原始分辨率
    outputCtx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, outputWidth, outputHeight
    )
    
    // 转换为 base64，使用高质量 (0.95)
    resolve(outputCanvas.toDataURL('image/jpeg', 0.95))
  })
}

const removeAvatar = () => {
  emit('update:modelValue', '')
  previewUrl.value = ''
  ElMessage.success('头像已移除')
}

const onCropperClosed = () => {
  originalImage.value = null
  cropScale.value = 1
  cropData.value = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    isDragging: false
  }
}
</script>

<style scoped>
.avatar-upload {
  width: 100%;
}

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  position: relative;
  cursor: pointer;
}

.preview-avatar {
  border: 2px dashed #dcdfe6;
  transition: border-color 0.3s ease;
}

.avatar-preview:hover .preview-avatar {
  border-color: #409eff;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  color: white;
}

.avatar-preview:hover .upload-overlay {
  opacity: 1;
}

.upload-text {
  font-size: 12px;
  margin-top: 4px;
}

.upload-actions {
  display: flex;
  gap: 8px;
}

.upload-tips {
  text-align: center;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.upload-tips p {
  margin: 2px 0;
}

.cropper-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.cropper-canvas {
  border: 1px solid #dcdfe6;
  cursor: crosshair;
  max-width: 100%;
}

.cropper-controls {
  width: 100%;
  text-align: center;
}

.cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .upload-actions {
    flex-direction: column;
  }
  
  .cropper-canvas {
    max-width: 90vw;
  }
}
</style>
