#!/bin/bash

echo "🚀 启动 BestFriends 服务器"
echo "================================"

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "📦 安装后端依赖..."
cd server
npm install

echo "🗄️  初始化数据库并迁移数据..."
npm run migrate

echo "🌟 启动服务器..."
npm run dev &
SERVER_PID=$!

echo "⏳ 等待服务器启动..."
sleep 3

# 获取本机IP地址
if command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1)
elif command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
else
    LOCAL_IP="127.0.0.1"
fi

echo ""
echo "✅ 服务器启动成功！"
echo "================================"
echo "📍 本地访问: http://localhost:3001"
echo "🌐 局域网访问: http://$LOCAL_IP:3001"
echo "🔗 API文档: http://localhost:3001/api/health"
echo ""
echo "💡 现在可以启动前端应用:"
echo "   cd .. && npm run dev"
echo ""
echo "🛑 按 Ctrl+C 停止服务器"

# 等待用户停止
wait $SERVER_PID
