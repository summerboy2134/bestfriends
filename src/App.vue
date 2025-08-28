<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
</script>

<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <el-container direction="vertical">
      <el-header height="60px" class="header">
        <div class="header-content">
          <div class="logo-section">
            <el-icon size="24"><User /></el-icon>
            <h2>最好的朋友们</h2>
          </div>
          <el-menu
            :default-active="route.path"
            mode="horizontal"
            @select="router.push"
            class="nav-menu"
          >
            <el-menu-item index="/">成员展示</el-menu-item>
            <el-menu-item index="/admin">管理面板</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 0;
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-section h2 {
  margin: 0;
  font-weight: 600;
}

.nav-menu {
  background: transparent !important;
  border: none !important;
}

.nav-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.8) !important;
  border-bottom: 2px solid transparent !important;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-menu-item.is-active {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-bottom-color: white !important;
}

.main-content {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
  width: 100%;
  max-width: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 10px;
    gap: 10px;
  }
  
  .nav-menu {
    width: 100%;
  }
  
  .main-content {
    padding: 10px;
  }
}
</style>
