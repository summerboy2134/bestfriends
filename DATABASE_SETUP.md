# 数据库配置指南

## 🎯 技术方案：SQLite + Express.js 后端

### 📋 整体架构
```
前端 (Vue3) ←→ 后端 API (Express.js) ←→ SQLite 数据库
```

## 🚀 实施步骤

### 1. 创建后端服务

在项目根目录创建 `server` 文件夹：

```bash
mkdir server
cd server
npm init -y
npm install express sqlite3 cors multer bcryptjs jsonwebtoken
npm install -D nodemon
```

### 2. 数据库结构设计

#### 成员表 (members)
```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  location TEXT NOT NULL,
  coordinates TEXT, -- JSON格式存储 [lng, lat]
  wechat TEXT,
  tags TEXT, -- JSON格式存储标签数组
  join_date DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 留言表 (messages)
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
```

#### 编辑权限表 (edit_tokens)
```sql
CREATE TABLE edit_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
```

### 3. 后端API设计

#### 基础路由结构
```
GET    /api/members          # 获取所有成员
GET    /api/members/:id      # 获取指定成员
POST   /api/members          # 添加成员
PUT    /api/members/:id      # 更新成员
DELETE /api/members/:id      # 删除成员

GET    /api/members/:id/messages    # 获取成员留言
POST   /api/members/:id/messages    # 添加留言
DELETE /api/messages/:id            # 删除留言

POST   /api/edit-tokens             # 生成编辑令牌
GET    /api/edit-tokens/:token      # 验证令牌并获取成员信息
PUT    /api/edit-tokens/:token      # 通过令牌更新成员信息

POST   /api/upload/avatar           # 头像上传
```

### 4. 部署方案

#### 本地开发
```bash
# 启动后端服务
cd server
npm run dev  # 运行在 localhost:3001

# 启动前端服务  
cd ..
npm run dev  # 运行在 localhost:5173
```

#### 内网部署
1. **获取本机IP地址**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr "IPv4"
   ```

2. **配置后端服务器监听所有接口**
   ```javascript
   app.listen(3001, '0.0.0.0', () => {
     console.log('服务器运行在 http://0.0.0.0:3001')
   })
   ```

3. **更新前端API配置**
   ```javascript
   // 在前端配置文件中
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? 'http://192.168.1.100:3001/api'  // 替换为你的实际IP
     : 'http://localhost:3001/api'
   ```

4. **群友访问**
   - 前端: `http://192.168.1.100:5173`
   - API: `http://192.168.1.100:3001/api`

### 5. 安全考虑

#### 令牌机制
- 编辑令牌有效期（例如24小时）
- 每个成员只能编辑自己的信息
- 管理员可以生成任意成员的编辑令牌

#### 数据验证
- 输入长度限制
- 必填字段验证
- 文件上传大小限制

#### 访问控制
- 留言内容过滤
- 编辑权限验证
- 防止恶意请求

### 6. 数据迁移

从当前前端数据迁移到SQLite：

```javascript
// 迁移脚本示例
const members = require('../src/stores/members.js').mockMembers

members.forEach(async (member) => {
  await db.run(`
    INSERT INTO members (name, avatar, bio, location, coordinates, wechat, tags, join_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    member.name,
    member.avatar,
    member.bio,
    member.location,
    JSON.stringify(member.coordinates),
    member.social?.wechat,
    JSON.stringify(member.tags),
    member.joinDate
  ])
})
```

## 🛠️ 优势

1. **轻量级**: SQLite文件数据库，无需安装额外服务
2. **简单部署**: 单个可执行文件 + 数据库文件
3. **局域网访问**: 群友可通过IP地址访问
4. **数据持久化**: 真正的数据库存储
5. **易于备份**: 简单的文件复制即可备份
6. **开发友好**: 支持标准SQL查询

## 📱 移动端适配

通过响应式设计，群友可以在手机上：
- 查看成员信息
- 编辑个人资料  
- 发送留言
- 查看地图分布

## 🔄 下一步

1. 创建后端服务器代码
2. 设计数据库迁移脚本
3. 更新前端API调用
4. 测试本地部署
5. 配置内网访问
