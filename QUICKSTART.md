# 快速启动 - OSRM Map Matching 测试

## ✅ 已完成配置

- ✅ 后端已集成 Map Matching 服务
- ✅ 前端已添加轨迹显示控制
- ✅ 已配置 OSRM 公共测试服务器
- ✅ 已添加详细的调试日志

## 🚀 立即测试步骤

### 1. 重启后端（重要！）

后端需要重启才能读取新的环境变量：

```bash
# 方法 A: 如果后端在终端运行
# 按 Ctrl+C 停止，然后重新运行：
cd backend
npm run dev

# 方法 B: 如果不确定，先杀掉所有占用 4000 端口的进程
lsof -ti:4000 | xargs kill -9
cd backend
npm run dev
```

### 2. 验证配置

打开新终端窗口：

```bash
# 检查健康状态（应该显示 enabled: true）
curl http://localhost:4000/api/health | jq
```

期望输出：
```json
{
  "status": "ok",
  "services": {
    "mapMatching": {
      "enabled": true,
      "baseUrl": "http://router.project-osrm.org"
    }
  }
}
```

### 3. 启动前端

```bash
cd frontend
npm run dev
```

### 4. 测试轨迹显示

1. 访问 http://localhost:5173
2. 进入「报表」页面
3. 点击任意报表记录（日报/周报/月报）
4. 观察轨迹预览区域

### 5. 观察后端日志

后端终端应该显示：

```
[MapMatching] Service initialized: {
  enabled: true,
  baseUrl: 'http://router.project-osrm.org',
  pointsCount: 150
}
[MapMatching] Processing 2 chunks
[MapMatching] Matching chunk with 100 points...
[MapMatching] Requesting: http://router.project-osrm.org/match/v1/driving/116.397428,39.909187...
[MapMatching] Matched successfully, got 100 points
[MapMatching] Total matched points: 150
```

### 6. 对比不同模式

地图右上角有控制面板，可以切换三种模式：

| 模式 | 说明 | 效果 |
|------|------|------|
| **🌐 后端 OSRM 匹配** | 默认，所有开关关闭 | 后端处理，贴合真实道路 |
| **📐 前端曲线平滑** | 开启「前端平滑」 | 客户端平滑插值，视觉优化 |
| **🛣️ 前端路径规划** | 开启「前端规划」 | 高德 API（需配置 Key） |

## 🎯 效果验证

### 成功标志

✅ 后端日志显示 `enabled: true`
✅ 后端日志显示 `Matched successfully`
✅ 轨迹显示不再是生硬的折线
✅ 转弯处平滑过渡
✅ 地图控制面板显示 "🌐 后端 OSRM 匹配"

### 如果还是直线

检查清单：
1. 后端是否重启？
2. 健康检查是否显示 `enabled: true`？
3. 后端日志是否有 `[MapMatching]` 输出？
4. 前端控制面板的开关是否都关闭？（应该显示 "🌐 后端 OSRM 匹配"）

## 📊 性能说明

### 公共 OSRM 服务器限制

- ⚠️ 仅用于测试/演示
- ⚠️ 可能有速率限制
- ⚠️ 不可用于生产环境
- ⚠️ 主要支持欧洲地区数据

如果测试中国区域数据效果不佳，属正常现象，因为公共服务器使用的是全球地图数据。

### 生产环境建议

需要部署自己的 OSRM 实例，参考 `docs/osrm-setup.md`

## 🐛 故障排查

### 问题：健康检查显示 enabled: false

**原因**：后端没有重启

**解决**：
```bash
# 杀掉旧进程
lsof -ti:4000 | xargs kill -9

# 重新启动
cd backend && npm run dev
```

### 问题：后端报错 "Map matcher responded with status 503"

**原因**：公共服务器过载或不可用

**解决**：稍后重试，或部署私有 OSRM 实例

### 问题：轨迹还是直线

**检查步骤**：
1. 确认前端控制面板显示 "🌐 后端 OSRM 匹配"
2. 查看后端日志是否有 `[MapMatching]` 输出
3. 如果有输出但显示 "falling back to raw points"，说明 OSRM 匹配失败（可能是数据区域不匹配）

### 问题：TypeError: fetch is not defined

**原因**：Node.js 版本过低（< 18）

**解决**：
```bash
# 升级 Node.js 到 18+ 或安装 node-fetch
npm install node-fetch
```

然后在 `backend/src/services/map-matching.service.ts` 顶部添加：
```typescript
import fetch from 'node-fetch';
```

## 📞 获取帮助

如果遇到问题：
1. 运行 `./test-osrm.sh` 查看配置状态
2. 检查后端日志中的 `[MapMatching]` 输出
3. 提供健康检查的输出：`curl http://localhost:4000/api/health`