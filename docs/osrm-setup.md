# OSRM 地图匹配服务配置指南

## 概述

OSRM (Open Source Routing Machine) 是一个开源的路径规划和地图匹配引擎。本项目使用 OSRM 的 Map Matching 功能，将原始 GPS 轨迹点贴合到道路网络，大幅改善轨迹显示效果。

## 核心功能

- **Map Matching（地图匹配）**：将有误差的 GPS 轨迹点"吸附"到真实道路上
- **自动纠偏**：纠正 GPS 漂移、隧道/高楼遮挡导致的定位偏差
- **优雅降级**：如果 OSRM 服务不可用，系统自动回退到原始轨迹

## 快速开始

### 1. 准备 OSM 数据文件

OSRM 需要 OpenStreetMap (OSM) 地图数据。根据你的使用区域下载对应的 `.osm.pbf` 文件：

#### 中国大陆数据（推荐）
```bash
# 创建数据目录
mkdir -p docker/osrm-data

# 下载中国地区 OSM 数据（约 1.5GB）
cd docker/osrm-data
wget https://download.geofabrik.de/asia/china-latest.osm.pbf
```

#### 其他区域数据源
- 全球数据：https://planet.openstreetmap.org/
- 区域数据：https://download.geofabrik.de/
  - 亚洲：https://download.geofabrik.de/asia.html
  - 欧洲：https://download.geofabrik.de/europe.html
  - 北美：https://download.geofabrik.de/north-america.html

### 2. 预处理地图数据

OSRM 需要将 `.osm.pbf` 文件预处理成可快速查询的格式：

```bash
cd docker/osrm-data

# Step 1: Extract (提取道路网络，约 5-15 分钟)
docker run --rm -v "${PWD}:/data" \
  ghcr.io/project-osrm/osrm-backend:latest \
  osrm-extract -p /opt/car.lua /data/china-latest.osm.pbf

# Step 2: Partition (分区优化，约 3-10 分钟)
docker run --rm -v "${PWD}:/data" \
  ghcr.io/project-osrm/osrm-backend:latest \
  osrm-partition /data/china-latest.osrm

# Step 3: Customize (定制化处理，约 2-5 分钟)
docker run --rm -v "${PWD}:/data" \
  ghcr.io/project-osrm/osrm-backend:latest \
  osrm-customize /data/china-latest.osrm
```

完成后，`docker/osrm-data` 目录下会生成多个 `.osrm*` 文件。

### 3. 启动 OSRM 服务

```bash
# 返回项目根目录
cd ../..

# 启动 OSRM 服务（已包含在 docker-compose.yml）
docker compose up -d osrm
```

### 4. 验证服务

```bash
# 检查服务健康状态
curl http://localhost:5000/health

# 测试地图匹配 API（北京天安门附近的示例坐标）
curl "http://localhost:5000/match/v1/driving/116.397428,39.909187;116.398541,39.908860?geometries=geojson"
```

返回 `{"code":"Ok",...}` 表示服务正常。

### 5. 启用后端集成

OSRM 服务已自动集成到后端，只需确保环境变量配置正确：

```bash
# backend/.env.local
MAP_MATCHER_URL=http://localhost:5000
```

重启后端服务：
```bash
npm run dev:backend
```

## 工作原理

### Map Matching 流程

1. **前端请求轨迹**
   ```
   GET /api/track/:vehicleId?start=2024-01-01&end=2024-01-02
   ```

2. **后端查询数据库**
   - 从 `positions` 表获取原始 GPS 点
   - 按时间排序

3. **调用 OSRM Map Matching**
   - 将 GPS 点发送到 OSRM 服务
   - OSRM 返回贴合道路的坐标

4. **返回优化轨迹**
   - 前端渲染平滑的道路轨迹

### 性能优化

- **分块处理**：自动将大量轨迹点分成 100 个一组
- **并发请求**：支持多车辆轨迹并行处理
- **超时保护**：OSRM 请求超时自动降级
- **容错机制**：服务不可用时返回原始数据

## 高级配置

### 自定义路径配置文件

OSRM 支持不同车辆类型的配置（小汽车、卡车、自行车等）：

```bash
# 使用卡车配置
docker run --rm -v "${PWD}:/data" \
  ghcr.io/project-osrm/osrm-backend:latest \
  osrm-extract -p /opt/truck.lua /data/china-latest.osm.pbf
```

### 修改匹配参数

在 `backend/src/services/map-matching.service.ts` 中调整：

```typescript
const url = `${this.baseUrl}/match/v1/driving/${coordinates}?
  annotations=duration,distance&
  geometries=geojson&
  timestamps=${timestamps}&
  radiuses=${radiuses}`;  // 增加此参数控制匹配半径
```

### 资源占用

| 区域 | OSM 文件大小 | 处理后大小 | 内存占用 | 处理时间 |
|------|-------------|-----------|---------|---------|
| 中国 | ~1.5GB | ~3GB | 4-8GB | 20-30min |
| 省级 | ~100-500MB | ~500MB | 2-4GB | 5-15min |
| 城市 | ~50-100MB | ~200MB | 1-2GB | 2-5min |

## 故障排查

### 问题 1：OSRM 服务无法启动

```bash
# 检查日志
docker compose logs osrm

# 常见原因：
# 1. .osrm 文件未生成或不完整
# 2. 文件路径错误
# 3. 内存不足
```

**解决方案**：重新执行预处理步骤，确保三个步骤（extract、partition、customize）全部完成。

### 问题 2：地图匹配返回空结果

**原因**：
- GPS 点距离道路太远（默认半径 50 米）
- 数据区域不匹配（例如使用欧洲地图匹配中国坐标）

**解决方案**：
```typescript
// 增大匹配半径
const radiuses = points.map(() => 100).join(';'); // 改为 100 米
```

### 问题 3：性能问题

**优化建议**：
1. 限制单次查询的轨迹点数量（前端分页）
2. 添加 Redis 缓存匹配结果
3. 使用更小范围的地图数据（省级/城市级）

## 生产环境部署

### 1. 使用持久化存储

```yaml
# docker-compose.yml
services:
  osrm:
    volumes:
      - osrm-data:/data  # 使用 Docker volume

volumes:
  osrm-data:
    driver: local
```

### 2. 配置资源限制

```yaml
services:
  osrm:
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4'
        reservations:
          memory: 4G
          cpus: '2'
```

### 3. 监控和告警

```bash
# 添加健康检查到监控系统
curl http://localhost:5000/health | jq .
```

## 数据更新

OSM 数据定期更新，建议每月/每季度更新一次：

```bash
# 1. 下载最新数据
cd docker/osrm-data
wget -O china-latest.osm.pbf https://download.geofabrik.de/asia/china-latest.osm.pbf

# 2. 重新预处理
# (执行 extract -> partition -> customize)

# 3. 重启服务
docker compose restart osrm
```

## 相关链接

- OSRM 官网：http://project-osrm.org/
- OSRM GitHub：https://github.com/Project-OSRM/osrm-backend
- OSM 数据下载：https://download.geofabrik.de/
- API 文档：https://project-osrm.org/docs/v5.24.0/api/

## 技术支持

遇到问题时，请提供：
1. Docker 日志：`docker compose logs osrm`
2. 测试请求和响应
3. 地图数据区域和版本