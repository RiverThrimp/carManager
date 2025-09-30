#!/bin/bash

echo "======================================"
echo "OSRM Map Matching 配置测试"
echo "======================================"
echo ""

# 测试 1: 检查后端环境变量
echo "📋 步骤 1: 检查后端配置"
if [ -f "backend/.env.local" ]; then
    echo "✅ backend/.env.local 存在"
    grep "MAP_MATCHER_URL" backend/.env.local
else
    echo "❌ backend/.env.local 不存在"
fi
echo ""

# 测试 2: 检查 OSRM 公共服务
echo "📋 步骤 2: 测试 OSRM 公共服务器"
echo "请求: http://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.397634,52.529407"
curl -s "http://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.397634,52.529407?overview=false" | head -c 200
echo ""
echo ""

# 测试 3: 测试后端健康检查
echo "📋 步骤 3: 测试后端健康检查"
echo "请求: http://localhost:4000/api/health"
response=$(curl -s "http://localhost:4000/api/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ 后端响应成功"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
else
    echo "❌ 后端未运行或无法连接"
    echo "请运行: npm run dev:backend"
fi
echo ""

# 测试 4: 给出下一步建议
echo "======================================"
echo "📝 下一步操作"
echo "======================================"
echo ""
echo "1. 启动后端（如果未启动）："
echo "   cd backend && npm run dev"
echo ""
echo "2. 访问健康检查："
echo "   curl http://localhost:4000/api/health"
echo ""
echo "3. 启动前端："
echo "   cd frontend && npm run dev"
echo ""
echo "4. 访问报表页面，点击任意轨迹记录"
echo ""
echo "5. 观察后端终端输出，应该看到："
echo "   [MapMatching] Service initialized: ..."
echo "   [MapMatching] Processing X chunks"
echo ""
echo "6. 对比效果："
echo "   - 关闭所有开关 → 后端 OSRM 处理的轨迹"
echo "   - 开启「前端平滑」→ 客户端曲线插值"
echo "   - 开启「前端规划」→ 高德路径规划（需要 API Key）"
echo ""
echo "======================================"