#!/bin/bash

echo "🚀 BestFriends 公网部署脚本"
echo "================================"

# 检查ngrok是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安装，请运行: brew install ngrok"
    exit 1
fi

# 检查服务是否运行
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ 后端服务未运行，请先启动: node server/index.js"
    exit 1
fi

if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ 前端服务未运行，请先启动: npm run dev"
    exit 1
fi

echo "✅ 服务检查通过"
echo ""

# 启动ngrok隧道
echo "🌐 启动公网隧道..."
echo ""

# 后端API隧道
echo "🔗 后端API隧道："
ngrok http 3001 --log stdout &
NGROK_PID=$!

sleep 3

# 获取隧道URL
API_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data.get('tunnels', []):
        if tunnel['proto'] == 'https':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)

if [ -n "$API_URL" ]; then
    echo "✅ 后端API地址: $API_URL"
    echo ""
    echo "📋 朋友访问步骤："
    echo "1. 访问前端: http://localhost:5173"
    echo "2. 如需远程访问后端，API地址为: $API_URL/api"
    echo ""
    echo "⚠️  注意：需要修改前端配置文件中的API地址为: $API_URL/api"
    echo ""
    echo "按 Ctrl+C 停止隧道"
    wait $NGROK_PID
else
    echo "❌ 无法获取隧道地址，请检查ngrok状态"
    kill $NGROK_PID 2>/dev/null
fi
