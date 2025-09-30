# 🚗 车队管理与轨迹监控平台

本项目由 **Codex 自动生成**，包含前端、后端、协议接入微服务，以及系统架构图。团队只需按照步骤执行，即可快速搭建一个车队管理平台。

---

## 📌 系统组成
- **前端**：React + Ant Design  
- **后端**：Express + TypeScript + PostgreSQL + WebSocket  
- **协议接入**：JT/T 808 微服务（TCP Server，转 JSON）  
- **数据库**：PostgreSQL  
- **消息总线（可选）**：Redis/Kafka  

---

## ⚙️ 环境依赖清单

请确保团队成员环境一致，避免出现兼容问题。

### 必备环境
- **Node.js**：版本 ≥ 18.x（建议使用 LTS 版本，推荐 18.20+）  
- **npm**：版本 ≥ 9.x  
- **PostgreSQL**：版本 ≥ 14（推荐 15.x）  
- **TypeScript**：版本 ≥ 5.x  

### 可选环境（增强功能）
- **Redis**：版本 ≥ 7.x（如果要用消息队列做轨迹/告警异步处理）  
- **Kafka**：版本 ≥ 3.x（大规模车队推荐使用）  

### 全局工具
- `npm install -g ts-node typescript`  
- `npm install -g nodemon`  

---

## ⚙️ 执行步骤

### **Step 1：生成后端**
在 Codex 中输入以下 Prompt：

```
请生成一个 Node.js (Express) + TypeScript + TypeORM + PostgreSQL + WebSocket 的后端项目，功能如下：
- JWT 登录鉴权
- 用户管理、车辆管理、司机管理
- 轨迹存储（位置点）
- 里程计算（Haversine + 停车过滤）
- 报表（日/月出勤里程统计）
- 告警存储与推送
- WebSocket 广播最新位置和告警
- 提供 Swagger API 文档
- 数据库表：users, vehicles, drivers, positions, alarms, reports_daily, reports_monthly
- 附带一个模拟脚本 mock_device.ts：定时生成随机轨迹点并写入数据库，同时推送 WebSocket
```

执行：
```bash
cd backend
npm install
npm run dev
```

---

### **Step 2：生成前端**
在 Codex 中输入以下 Prompt：

```
请生成一个 React + TypeScript + Ant Design 的前端项目，功能如下：
- 登录页面（用户名+密码，存 JWT）
- 车辆管理页面（表格 + CRUD）
- 实时监控页面（地图展示车辆位置，支持 WebSocket 更新）
- 轨迹回放页面（选择车辆+时间范围，显示历史轨迹）
- 报表页面（日/月报表，用 AntD Table + Chart）
- 告警中心（表格展示实时告警，WebSocket 接收）

API 调用：
- POST /api/auth/login
- GET /api/vehicles
- POST /api/vehicles
- GET /api/track/:vehicleId?start=&end=
- GET /api/report/daily?date=
- GET /api/report/monthly?month=
WebSocket:
- vehicle/position → 实时位置
- vehicle/alarm → 实时告警
```

执行：
```bash
cd frontend
npm install
npm start
```

---

### **Step 3：生成 JT/T 808 协议接入微服务**
在 Codex 中输入以下 Prompt：

```
请生成一个 Node.js + TypeScript TCP Server，用于接入 JT/T 808-2019 协议：
- 监听 TCP 端口 6808
- 支持消息：鉴权(0x0102)、心跳(0x0002)、位置信息(0x0200)、报警(0x0200 的报警位)
- 实现报文转义/还原、校验码验证
- 解析出 JSON：{ deviceId, lat, lng, speed, direction, time, status, alarms }
- 将解码结果通过 HTTP POST 推送到后端：/api/position 和 /api/alarm
- 附带一个 mock_device.ts，模拟终端设备发送鉴权、心跳、位置包
```

执行：
```bash
cd jt808-service
npm install
npm run dev
```

---

### **Step 4：生成系统架构图**
在 Codex 中输入以下 Prompt：

```
请帮我生成一个「车队管理与轨迹监控平台」的系统架构图（Mermaid），包含：
1. 前端 (React + AntD)
2. 后端 API (Express + PostgreSQL + WebSocket)
3. JT/T 808 接入微服务 (TCP Server)
4. 数据库 (PostgreSQL)
5. 消息总线 (Redis/Kafka，可选)

要求：
- 展示数据流向：设备 → 808 微服务 → 后端 API → 数据库 → 前端
- 显示协议类型：TCP、HTTP、WebSocket
- 生成 Mermaid 图代码 + 模块说明 + 数据流转说明
```

Codex 会生成一张 Mermaid 架构图，可以直接复制到 README.md 展示。

---

## ✅ 最终运行流程
1. 启动数据库（PostgreSQL）  
2. 启动后端（Express + TypeORM）  
3. 启动 JT/T 808 微服务（TCP Server + Mock 设备）  
4. 启动前端（React + AntD）  
5. 打开浏览器 → 登录 → 管理车辆 → 查看实时轨迹与报表  

---

## 📂 推荐目录结构
```
fleet-platform/
 ├── backend/        # 后端服务
 ├── frontend/       # 前端界面
 ├── jt808-service/  # 协议接入微服务
 ├── README.md       # 本文档
```
