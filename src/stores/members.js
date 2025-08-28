import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_BASE_URL } from '@/api/config'

export const useMemberStore = defineStore('members', () => {
  // 状态
  const members = ref([])
  const loading = ref(false)
  const error = ref(null)


  const mockMembers = [
    // 上海成员 (15人)
    {
      id: 1,
      name: '张三',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: '群主，前端工程师，喜欢 Vue.js 和新技术',
      location: '上海市浦东新区张江高科技园区',
      coordinates: [121.5994, 31.2047],
      email: 'zhangsan@example.com',
      phone: '138****1234',
      company: '腾讯上海',
      position: '高级前端工程师',
      joinDate: '2023-01-15',
      tags: ['技术', '摄影', '旅行'],
      isGroupLeader: true, // 群主标识
      social: { wechat: 'zhangsan_wx', github: 'zhangsan-dev' }
    },
    {
      id: 2,
      name: '李四',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=150&h=150&fit=crop&crop=face',
      bio: '产品经理，关注用户体验和产品设计',
      location: '上海市浦东新区陆家嘴环路',
      coordinates: [121.5057, 31.2453],
      email: 'lisi@example.com',
      phone: '139****5678',
      company: '阿里巴巴',
      position: '产品经理',
      joinDate: '2023-02-20',
      tags: ['产品', '设计', '读书'],
      social: { wechat: 'lisi_pm', linkedin: 'lisi-product' }
    },
    {
      id: 3,
      name: '王五',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: '后端开发工程师，专注于微服务架构',
      location: '上海市杨浦区五角场',
      coordinates: [121.5118, 31.2965],
      email: 'wangwu@example.com',
      phone: '137****9012',
      company: '字节跳动',
      position: '后端工程师',
      joinDate: '2022-12-01',
      tags: ['后端', '云计算', '运动'],
      social: { wechat: 'wangwu_dev', github: 'wangwu-backend' }
    },
    {
      id: 4,
      name: '赵六',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'UI/UX 设计师，热爱创意和美学',
      location: '上海市徐汇区徐家汇',
      coordinates: [121.4352, 31.1993],
      email: 'zhaoliu@example.com',
      phone: '136****3456',
      company: '美团',
      position: 'UI/UX设计师',
      joinDate: '2023-03-10',
      tags: ['设计', '艺术', '音乐'],
      social: { wechat: 'zhaoliu_design', behance: 'zhaoliu-ui' }
    },
    {
      id: 5,
      name: '钱七',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: '数据分析师，用数据驱动决策',
      location: '上海市静安区南京西路',
      coordinates: [121.4648, 31.2422],
      email: 'qianqi@example.com',
      phone: '135****7890',
      company: '携程',
      position: '数据分析师',
      joinDate: '2023-01-05',
      tags: ['数据', '分析', '咖啡'],
      social: { wechat: 'qianqi_data', linkedin: 'qianqi-analyst' }
    },
    {
      id: 6,
      name: '孙八',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      bio: '运营专员，擅长社群运营和内容营销',
      location: '上海市长宁区中山公园',
      coordinates: [121.4204, 31.2231],
      email: 'sunba@example.com',
      phone: '134****2468',
      company: '拼多多',
      position: '运营专员',
      joinDate: '2023-04-01',
      tags: ['运营', '营销', '美食'],
      social: { wechat: 'sunba_ops', weibo: 'sunba-marketing' }
    },
    {
      id: 7,
      name: '周九',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'DevOps工程师，专注自动化部署',
      location: '上海市虹口区四川北路',
      coordinates: [121.4929, 31.2792],
      email: 'zhoujiu@example.com',
      phone: '138****1111',
      company: '小红书',
      position: 'DevOps工程师',
      joinDate: '2023-05-15',
      tags: ['技术', '自动化', '效率'],
      social: { wechat: 'zhoujiu_ops', github: 'zhoujiu-devops' }
    },
    {
      id: 8,
      name: '吴十',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=150&h=150&fit=crop&crop=face',
      bio: '全栈工程师，喜欢探索新技术',
      location: '上海市普陀区长寿路',
      coordinates: [121.4511, 31.2459],
      email: 'wushi@example.com',
      phone: '139****2222',
      company: 'B站',
      position: '全栈工程师',
      joinDate: '2023-06-01',
      tags: ['全栈', '创新', '游戏'],
      social: { wechat: 'wushi_fullstack', github: 'wushi-dev' }
    },
    {
      id: 9,
      name: '郑十一',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: '技术总监，带领团队攻克技术难题',
      location: '上海市黄浦区人民广场',
      coordinates: [121.4692, 31.2397],
      email: 'zhengshiyi@example.com',
      phone: '137****3333',
      company: '滴滴',
      position: '技术总监',
      joinDate: '2022-09-01',
      tags: ['管理', '技术', '领导力'],
      social: { wechat: 'zheng_cto', linkedin: 'zheng-tech-director' }
    },
    {
      id: 10,
      name: '刘十二',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: '前端架构师，专注性能优化',
      location: '上海市闵行区莘庄',
      coordinates: [121.3857, 31.1137],
      email: 'liushier@example.com',
      phone: '136****4444',
      company: '网易',
      position: '前端架构师',
      joinDate: '2022-11-15',
      tags: ['架构', '性能', '优化'],
      social: { wechat: 'liu_architect', github: 'liu-frontend' }
    },
    {
      id: 11,
      name: '陈十三',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: '移动端开发专家，iOS/Android双栖',
      location: '上海',
      email: 'chenshisan@example.com',
      phone: '135****5555',
      company: '哔哩哔哩',
      position: '移动端开发专家',
      joinDate: '2023-07-01',
      tags: ['移动端', 'iOS', 'Android'],
      social: { wechat: 'chen_mobile', github: 'chen-mobile-dev' }
    },
    {
      id: 12,
      name: '黄十四',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      bio: '算法工程师，AI和机器学习专家',
      location: '上海',
      email: 'huangshisi@example.com',
      phone: '134****6666',
      company: '商汤科技',
      position: '算法工程师',
      joinDate: '2023-08-10',
      tags: ['AI', '算法', '机器学习'],
      social: { wechat: 'huang_ai', github: 'huang-algorithm' }
    },
    {
      id: 13,
      name: '徐十五',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: '安全工程师，保护系统安全',
      location: '上海',
      email: 'xushiwu@example.com',
      phone: '138****7777',
      company: '奇安信',
      position: '安全工程师',
      joinDate: '2023-09-05',
      tags: ['安全', '防护', '渗透测试'],
      social: { wechat: 'xu_security', github: 'xu-security' }
    },
    {
      id: 14,
      name: '林十六',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=150&h=150&fit=crop&crop=face',
      bio: '测试工程师，追求代码质量',
      location: '上海',
      email: 'linshiliu@example.com',
      phone: '139****8888',
      company: '蚂蚁金服',
      position: '测试工程师',
      joinDate: '2023-10-01',
      tags: ['测试', '质量', '自动化'],
      social: { wechat: 'lin_qa', github: 'lin-testing' }
    },
    {
      id: 15,
      name: '杨十七',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: '项目经理，协调团队资源',
      location: '上海',
      email: 'yangshiqi@example.com',
      phone: '137****9999',
      company: '华为上海',
      position: '项目经理',
      joinDate: '2023-11-01',
      tags: ['管理', '协调', '敏捷'],
      social: { wechat: 'yang_pm', linkedin: 'yang-project-manager' }
    },
    
    // 北京成员 (5人)
    {
      id: 16,
      name: '马十八',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: '云计算架构师，专注分布式系统',
      location: '北京市海淀区中关村软件园',
      coordinates: [116.3105, 39.9830],
      email: 'mashiba@example.com',
      phone: '136****1010',
      company: '百度',
      position: '云计算架构师',
      joinDate: '2022-08-15',
      tags: ['云计算', '架构', '分布式'],
      social: { wechat: 'ma_cloud', github: 'ma-cloud-architect' }
    },
    {
      id: 17,
      name: '朱十九',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: '大数据工程师，处理海量数据',
      location: '北京',
      email: 'zhushijiu@example.com',
      phone: '135****1111',
      company: '京东',
      position: '大数据工程师',
      joinDate: '2023-02-10',
      tags: ['大数据', 'Spark', 'Hadoop'],
      social: { wechat: 'zhu_bigdata', github: 'zhu-data-engineer' }
    },
    {
      id: 18,
      name: '秦二十',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      bio: 'AI产品经理，推动智能产品落地',
      location: '北京',
      email: 'qinershi@example.com',
      phone: '134****1212',
      company: '字节跳动',
      position: 'AI产品经理',
      joinDate: '2023-04-20',
      tags: ['AI', '产品', '智能化'],
      social: { wechat: 'qin_ai_pm', linkedin: 'qin-ai-product' }
    },
    {
      id: 19,
      name: '尤二十一',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: '区块链工程师，探索去中心化技术',
      location: '北京',
      email: 'youershi@example.com',
      phone: '138****1313',
      company: '蚂蚁链',
      position: '区块链工程师',
      joinDate: '2023-06-15',
      tags: ['区块链', '去中心化', 'Web3'],
      social: { wechat: 'you_blockchain', github: 'you-blockchain-dev' }
    },
    {
      id: 20,
      name: '许二十二',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=150&h=150&fit=crop&crop=face',
      bio: '游戏开发工程师，创造虚拟世界',
      location: '北京',
      email: 'xuershi@example.com',
      phone: '139****1414',
      company: '腾讯游戏',
      position: '游戏开发工程师',
      joinDate: '2023-08-01',
      tags: ['游戏', 'Unity', 'C#'],
      social: { wechat: 'xu_game_dev', github: 'xu-game-developer' }
    },
    
    // 深圳成员 (4人)
    {
      id: 21,
      name: '何二十三',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: '硬件工程师，设计智能设备',
      location: '深圳',
      email: 'heersan@example.com',
      phone: '137****1515',
      company: '华为',
      position: '硬件工程师',
      joinDate: '2022-10-01',
      tags: ['硬件', '嵌入式', 'IoT'],
      social: { wechat: 'he_hardware', github: 'he-embedded' }
    },
    {
      id: 22,
      name: '吕二十四',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: '产品设计师，关注用户体验',
      location: '深圳',
      email: 'luersi@example.com',
      phone: '136****1616',
      company: '腾讯',
      position: '产品设计师',
      joinDate: '2023-03-15',
      tags: ['设计', 'UI/UX', '用户研究'],
      social: { wechat: 'lu_designer', behance: 'lu-product-design' }
    },
    {
      id: 23,
      name: '施二十五',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: '运维工程师，保障系统稳定',
      location: '深圳',
      email: 'shierwu@example.com',
      phone: '135****1717',
      company: '平安科技',
      position: '运维工程师',
      joinDate: '2023-05-01',
      tags: ['运维', 'DevOps', '监控'],
      social: { wechat: 'shi_ops', github: 'shi-sre' }
    },
    {
      id: 24,
      name: '张二十六',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      bio: '金融科技专家，连接技术与金融',
      location: '深圳',
      email: 'zhangerliu@example.com',
      phone: '134****1818',
      company: '微众银行',
      position: '金融科技专家',
      joinDate: '2023-07-10',
      tags: ['金融科技', '区块链', '风控'],
      social: { wechat: 'zhang_fintech', linkedin: 'zhang-fintech-expert' }
    },
    
    // 杭州成员 (3人)
    {
      id: 25,
      name: '孔二十七',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: '电商技术专家，优化购物体验',
      location: '杭州',
      email: 'kongerqi@example.com',
      phone: '138****1919',
      company: '阿里巴巴',
      position: '电商技术专家',
      joinDate: '2022-12-15',
      tags: ['电商', '高并发', '分布式'],
      social: { wechat: 'kong_ecommerce', github: 'kong-ecommerce-tech' }
    },
    {
      id: 26,
      name: '曹二十八',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=150&h=150&fit=crop&crop=face',
      bio: '支付系统工程师，处理金融交易',
      location: '杭州',
      email: 'caoerba@example.com',
      phone: '139****2020',
      company: '蚂蚁金服',
      position: '支付系统工程师',
      joinDate: '2023-01-20',
      tags: ['支付', '金融', '安全'],
      social: { wechat: 'cao_payment', github: 'cao-payment-system' }
    },
    {
      id: 27,
      name: '严二十九',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: '数据科学家，挖掘数据价值',
      location: '杭州',
      email: 'yanerjiu@example.com',
      phone: '137****2121',
      company: '网易',
      position: '数据科学家',
      joinDate: '2023-09-10',
      tags: ['数据科学', '机器学习', 'Python'],
      social: { wechat: 'yan_datascience', github: 'yan-data-scientist' }
    },
    
    // 广州成员 (2人)
    {
      id: 28,
      name: '华三十',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: '直播技术工程师，构建实时互动',
      location: '广州',
      email: 'huasan@example.com',
      phone: '136****2222',
      company: '欢聚时代',
      position: '直播技术工程师',
      joinDate: '2023-04-05',
      tags: ['直播', '音视频', '实时通信'],
      social: { wechat: 'hua_live_tech', github: 'hua-live-streaming' }
    },
    {
      id: 29,
      name: '金三十一',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: '游戏策划，设计有趣的游戏机制',
      location: '广州',
      email: 'jinsanyi@example.com',
      phone: '135****2323',
      company: '网易游戏',
      position: '游戏策划',
      joinDate: '2023-06-20',
      tags: ['游戏策划', '设计', '创意'],
      social: { wechat: 'jin_game_design', github: 'jin-game-planner' }
    },
    
    // 成都成员 (1人)
    {
      id: 30,
      name: '魏三十二',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      bio: '创业者，打造下一个独角兽',
      location: '成都',
      email: 'weisaner@example.com',
      phone: '134****2424',
      company: '自主创业',
      position: '创始人',
      joinDate: '2023-10-15',
      tags: ['创业', '创新', '领导力'],
      social: { wechat: 'wei_entrepreneur', linkedin: 'wei-startup-founder' }
    }
  ]

  // 计算属性
  const memberCount = computed(() => members.value.length)
  const membersByLocation = computed(() => {
    const locationMap = {}
    members.value.forEach(member => {
      if (!locationMap[member.location]) {
        locationMap[member.location] = []
      }
      locationMap[member.location].push(member)
    })
    return locationMap
  })

  // 动作
  const loadMembers = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/members`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      members.value = data.members || []
    } catch (err) {
      console.error('加载成员数据失败:', err)
      members.value = []
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const getMemberById = (id) => {
    return members.value.find(member => member.id === parseInt(id))
  }

  const addMember = async (memberData) => {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const newMember = data.member
      members.value.push(newMember)
      return newMember
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMember = async (id, memberData) => {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const updatedMember = data.member
      const index = members.value.findIndex(m => m.id === parseInt(id))
      if (index !== -1) {
        members.value[index] = updatedMember
      }
      return updatedMember
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteMember = async (id) => {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/members/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const index = members.value.findIndex(m => m.id === parseInt(id))
      if (index !== -1) {
        members.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 生成编辑令牌（调用后端API）
  const generateEditToken = async (memberId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId, expiresInHours: 24 })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('生成编辑令牌失败:', error)
      throw error
    }
  }

  const validateEditToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens/verify/${token}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.valid ? data.member.id : null
    } catch (error) {
      console.error('验证编辑令牌失败:', error)
      return null
    }
  }

  // 设置群主
  const setGroupLeader = async (memberId) => {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE_URL}/members/set-group-leader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId: parseInt(memberId) })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // 更新本地状态
      members.value.forEach(member => {
        member.isGroupLeader = member.id === parseInt(memberId)
      })
      
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取群主
  const getGroupLeader = () => {
    return members.value.find(member => member.isGroupLeader)
  }

  return {
    // 状态
    members,
    loading,
    error,
    // 计算属性
    memberCount,
    membersByLocation,
    // 动作
    loadMembers,
    getMemberById,
    addMember,
    updateMember,
    deleteMember,
    generateEditToken,
    validateEditToken,
    setGroupLeader,
    getGroupLeader
  }
})
