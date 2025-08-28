import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import './assets/main.css'

import MemberList from './pages/MemberList.vue'
import AdminPanel from './pages/AdminPanel.vue'
import UserEdit from './pages/UserEdit.vue'
import MessageManagement from './pages/MessageManagement.vue'

// 路由配置
const routes = [
  { path: '/', name: 'Home', component: MemberList },
  { path: '/members', name: 'Members', component: MemberList },
  { path: '/admin', name: 'Admin', component: AdminPanel },
  { path: '/admin/messages', name: 'MessageManagement', component: MessageManagement },
  { path: '/edit/:token?', name: 'UserEdit', component: UserEdit, props: true },
  { path: '/edit/admin/:memberId', name: 'AdminEdit', component: UserEdit, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册 Element Plus
app.use(ElementPlus)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册其他插件
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')
