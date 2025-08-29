# 高德地图API配置说明

## 概述
本项目使用高德地图API提供地理编码、逆地理编码和地图显示功能。2021年12月以后申请的高德地图API Key需要同时配置安全密钥。

## 获取API Key和安全密钥

### 1. 注册高德开放平台账号
- 访问：https://lbs.amap.com/
- 注册并登录账号

### 2. 创建应用
- 进入控制台 → 应用管理 → 我的应用
- 点击"创建新应用"
- 填写应用信息

### 3. 添加Key
- 在应用中点击"添加Key"
- 服务平台：选择"Web端(JS API)"
- Key名称：自定义名称
- 提交后获得Key值

### 4. 获取安全密钥
- 在Key列表中找到刚创建的Key
- 点击"设置"或"查看"
- 找到"安全密钥"项，复制securityJsCode值

## 在Vercel中配置环境变量

### 登录Vercel控制台
1. 进入你的项目设置页面
2. 找到 "Environment Variables" 选项
3. 添加以下环境变量：

```bash
# 高德地图API Key
VITE_AMAP_KEY=your_api_key_here

# 高德地图安全密钥（2021年12月后申请的Key必需）
VITE_AMAP_SECURITY_JS_CODE=your_security_js_code_here
```

### 重新部署
- 添加环境变量后，需要重新部署项目
- 在Vercel控制台点击"Redeploy"

## 本地开发配置

### 创建.env文件
在项目根目录创建`.env`文件：

```bash
# 高德地图API Key
VITE_AMAP_KEY=your_api_key_here

# 高德地图安全密钥
VITE_AMAP_SECURITY_JS_CODE=your_security_js_code_here
```

### 重启开发服务器
```bash
npm run dev
```

## 常见问题

### Q: 出现 "INVALID_USER_SCODE" 错误
A: 这表示API Key无效或缺少安全密钥配置，请检查：
1. API Key是否正确
2. 是否配置了安全密钥（2021年12月后的Key必需）
3. 环境变量名称是否正确

### Q: 地图显示但地理编码失败
A: 请检查：
1. Key是否开启了"Web服务API"权限
2. 是否开启了"地理编码"和"逆地理编码"服务
3. Key的使用配额是否充足

### Q: 本地开发正常，部署后失败
A: 请检查：
1. Vercel环境变量是否正确配置
2. 是否重新部署了项目
3. API Key是否有域名限制

## 服务权限设置
确保你的API Key开启了以下服务：
- ✅ Web服务API
- ✅ 地理编码
- ✅ 逆地理编码
- ✅ JS API

## 安全建议
1. 不要在代码中硬编码API Key
2. 生产环境建议使用代理服务器转发请求
3. 设置合理的域名白名单
4. 定期检查API使用量和账单
