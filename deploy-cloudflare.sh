#!/bin/bash

echo "🚀 BestFriends Cloudflare隧道部署脚本"
echo "================================"

# 检查后端服务是否运行
if curl -s http://localhost:3001/api/members > /dev/null; then
    echo "❌ 检测到后端服务已在运行，先停止现有服务..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 启动后端服务器
echo "🔧 启动后端服务器..."
cd server
node index.js &
SERVER_PID=$!
cd ..

# 等待服务器启动
echo "⏳ 等待服务器启动..."
for i in {1..10}; do
    if curl -s http://localhost:3001/api/members > /dev/null; then
        echo "✅ 后端服务器启动成功"
        break
    fi
    sleep 1
done

# 检查服务器是否成功启动
if ! curl -s http://localhost:3001/api/members > /dev/null; then
    echo "❌ 后端服务器启动失败"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# 启动Cloudflare隧道
echo "🌐 启动Cloudflare隧道..."
cloudflared tunnel --url localhost:3001 &
TUNNEL_PID=$!

# 等待隧道启动并获取URL
echo "⏳ 等待隧道启动..."
sleep 5

# 尝试获取隧道URL
for i in {1..10}; do
    TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data.get('tunnels', []):
        if 'https' in tunnel.get('public_url', ''):
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)
    
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

# 如果通过API获取失败，检查cloudflared日志
if [ -z "$TUNNEL_URL" ]; then
    echo "📋 隧道已启动，请查看上方日志中的URL地址"
    echo "格式类似: https://xxx-xxx-xxx.trycloudflare.com"
    echo ""
    echo "🔧 手动更新API配置："
    echo "请将获取到的隧道URL更新到 src/api/config.js 文件中"
else
    echo "✅ 隧道URL: $TUNNEL_URL"
    echo ""
    echo "🔧 自动更新API配置..."
    
    # 更新API配置文件
    sed -i '' "s|https://firm-ve-informal-holiday.trycloudflare.com|$TUNNEL_URL|g" src/api/config.js
    echo "✅ API配置已更新"
fi

echo ""
echo "📋 访问信息:"
echo "- 后端API: $TUNNEL_URL/api"
echo "- 前端开发服务器: http://localhost:5173"
echo ""
echo "💡 提示:"
echo "1. 启动前端: npm run dev"
echo "2. 分享给朋友的地址需要通过前端部署获得"
echo ""
echo "⚠️  按 Ctrl+C 停止所有服务"

# 捕获停止信号
trap "echo '🛑 正在停止服务...'; kill $SERVER_PID $TUNNEL_PID 2>/dev/null || true; exit 0" INT TERM

# 保持脚本运行
wait
