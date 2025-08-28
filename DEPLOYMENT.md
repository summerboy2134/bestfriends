# 部署指南

## 支持的部署平台

### 1. 前端部署

#### Vercel（推荐）
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 在项目根目录执行
vercel

# 3. 按提示配置项目
# - Framework: Vue.js
# - Build Command: npm run build
# - Output Directory: dist
```

**环境变量配置**：
- 在 Vercel 仪表板的 Settings > Environment Variables 中添加：
  - `VITE_API_BASE_URL`: 你的后端API地址
  - `VITE_AMAP_KEY`: 高德地图API密钥

#### Netlify
```bash
# 1. 构建项目
npm run build

# 2. 将 dist 文件夹上传到 Netlify
# 或者连接 GitHub 仓库自动部署
```

#### Firebase Hosting
```bash
# 1. 安装 Firebase CLI
npm install -g firebase-tools

# 2. 登录并初始化
firebase login
firebase init hosting

# 3. 构建并部署
npm run build
firebase deploy
```

### 2. 后端部署

#### Railway
```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录并部署
railway login
railway init
railway up
```

#### Render
1. 连接 GitHub 仓库
2. 选择 "Web Service"
3. 设置：
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: Node.js

#### DigitalOcean App Platform
1. 连接 GitHub 仓库
2. 配置应用：
   - Source Directory: `/server`
   - Build Command: `npm install`
   - Run Command: `npm start`

#### 传统服务器（VPS）
```bash
# 1. 安装 Node.js 和 PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 2. 克隆代码
git clone https://github.com/summerboy2134/bestfriends.git
cd bestfriends

# 3. 安装依赖
cd server
npm install

# 4. 启动服务
pm2 start index.js --name "bestfriends-api"
pm2 save
pm2 startup
```

### 3. 全栈部署解决方案

#### Docker
```bash
# 在项目根目录创建 docker-compose.yml 后
docker-compose up -d
```

#### Heroku
1. 前端部署到 Vercel/Netlify
2. 后端部署到 Heroku：
```bash
# 在 server 目录下
heroku create your-app-name
git subtree push --prefix server heroku main
```

## 环境配置

### 1. 复制环境变量文件
```bash
# 前端
cp env.example .env

# 后端（如果需要）
cd server
cp .env.example .env
```

### 2. 配置必要的环境变量

**前端（.env）**：
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_AMAP_KEY=your_actual_amap_key
```

**后端环境变量**：
```env
PORT=3001
NODE_ENV=production
```

## 安全注意事项

### 1. API密钥管理
- ✅ 使用环境变量存储API密钥
- ✅ 不要将真实密钥提交到代码仓库
- ✅ 在高德控制台设置域名白名单
- ✅ 定期轮换API密钥

### 2. 数据库安全
- 生产环境使用专用数据库
- 定期备份数据
- 设置访问权限

### 3. HTTPS
- 生产环境必须使用HTTPS
- 配置SSL证书

## 部署后检查清单

- [ ] 前端可以正常访问
- [ ] API接口正常工作
- [ ] 地图功能正常（检查API密钥）
- [ ] 文件上传功能正常
- [ ] 数据库连接正常
- [ ] HTTPS配置正确
- [ ] 环境变量配置完整

## 推荐部署组合

**方案一（免费）**：
- 前端：Vercel
- 后端：Railway/Render
- 数据库：SQLite（文件存储）

**方案二（生产级）**：
- 前端：Vercel/Netlify
- 后端：DigitalOcean/AWS EC2
- 数据库：PostgreSQL/MySQL
- CDN：Cloudflare

## 域名配置

1. **购买域名**：推荐 Namecheap、GoDaddy
2. **DNS配置**：
   - A记录指向服务器IP
   - CNAME记录用于子域名
3. **SSL证书**：Let's Encrypt 免费证书

## 监控和维护

- 使用 PM2 监控后端进程
- 配置日志记录
- 设置自动备份
- 监控API使用量
