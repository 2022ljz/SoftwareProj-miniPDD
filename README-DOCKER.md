# 🐳 Docker 环境项目部署说明

## 📋 项目概述

本项目包含两个后端服务：
1. **市场后端 (s-pay-mall-ddd-market)** - 运行在端口 8070
2. **团购后端 (group-buy-market)** - 运行在端口 8091

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| **[CHECKLIST.md](CHECKLIST.md)** | ✅ 启动前检查清单 - **首次运行必读** |
| **[DOCKER-STARTUP-GUIDE.md](DOCKER-STARTUP-GUIDE.md)** | 📖 完整启动指南 - 详细步骤和故障排查 |
| **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** | 🎯 快速参考 - 常用命令速查 |
| 本文档 | ⚡ 快速启动 - 最简单的启动方式 |

---

## ⚡ 超快速启动（3步搞定）

### 第一步：确认 Docker 已启动
打开 Docker Desktop，确保它正在运行。

### 第二步：双击启动脚本
**Windows 用户**：双击 `start-docker.bat`  
**或使用 PowerShell**：运行 `.\start-docker.ps1`

### 第三步：等待完成
- 首次运行：5-15 分钟（下载镜像 + Maven 构建）
- 后续运行：30-60 秒

完成后会显示所有服务的访问地址！

---

## 🎯 推荐启动流程

### 方式一：双击 BAT 文件（最简单）

```
1. 双击 start-docker.bat
2. 等待启动完成
3. 访问 http://localhost
```

### 方式二：使用 PowerShell 脚本

```powershell
# 启动所有服务
.\start-docker.ps1

# 查看实时日志
.\view-logs.ps1

# 查看特定服务日志
.\view-logs.ps1 -Service group-buy-market
.\view-logs.ps1 -Service s-pay-mall

# 停止所有服务
.\stop-docker.ps1
```

### 方式三：使用 Docker Compose 命令

```powershell
# 构建并启动所有服务
docker-compose -f docker-compose-full.yml up -d --build

# 查看服务状态
docker-compose -f docker-compose-full.yml ps

# 查看日志
docker-compose -f docker-compose-full.yml logs -f

# 停止服务
docker-compose -f docker-compose-full.yml down
```

---

## 📦 服务说明

### 基础设施服务

| 服务 | 端口 | 说明 |
|------|------|------|
| MySQL | 13306 | 数据库服务，账号：root/123456 |
| Redis | 16379 | 缓存服务 |
| RabbitMQ | 5672, 15672 | 消息队列，管理界面：http://localhost:15672 (admin/admin) |

### 应用服务

| 服务 | 端口 | 说明 |
|------|------|------|
| 市场后端 | 8070 | s-pay-mall-ddd 项目 |
| 团购后端 | 8091 | group-buy-market 项目 |
| Nginx前端 | 80 | 前端页面 |

## 访问地址

- **前端页面**: http://localhost
- **市场后端API**: http://localhost:8070
- **团购后端API**: http://localhost:8091
- **RabbitMQ管理界面**: http://localhost:15672

## 构建说明

项目使用多阶段Docker构建：
1. **构建阶段**：使用 `maven:3.8.4-openjdk-8` 镜像编译项目
2. **运行阶段**：使用 `openjdk:8-jre-slim` 镜像运行应用

首次启动会自动：
- 下载Maven依赖
- 编译Java源代码
- 打包成JAR文件
- 创建运行镜像

## 常用命令

```bash
# 重启特定服务
docker-compose -f docker-compose-full.yml restart group-buy-market
docker-compose -f docker-compose-full.yml restart s-pay-mall

# 重新构建特定服务
docker-compose -f docker-compose-full.yml up -d --build group-buy-market

# 查看特定服务日志
docker-compose -f docker-compose-full.yml logs -f group-buy-market

# 进入容器
docker exec -it group-buy-market bash
docker exec -it s-pay-mall bash

# 查看容器状态
docker-compose -f docker-compose-full.yml ps

# 停止并删除所有容器、网络
docker-compose -f docker-compose-full.yml down

# 停止并删除所有容器、网络、卷
docker-compose -f docker-compose-full.yml down -v
```

## 故障排查

### 服务启动失败

1. 查看日志：
```bash
docker-compose -f docker-compose-full.yml logs service-name
```

2. 检查端口占用：
```bash
netstat -ano | findstr "8070"
netstat -ano | findstr "8091"
```

3. 重新构建：
```bash
docker-compose -f docker-compose-full.yml down
docker-compose -f docker-compose-full.yml up -d --build
```

### 数据库连接失败

确保MySQL服务已完全启动（可能需要15-30秒）：
```bash
docker-compose -f docker-compose-full.yml logs mysql
```

### 清理并重新开始

```bash
# 停止所有服务
docker-compose -f docker-compose-full.yml down

# 清理未使用的镜像
docker image prune -a

# 重新构建启动
docker-compose -f docker-compose-full.yml up -d --build
```

## 目录结构

```
e:\softwareproj\
├── docker-compose-full.yml        # 主配置文件
├── start-docker.ps1               # 启动脚本
├── stop-docker.ps1                # 停止脚本
├── view-logs.ps1                  # 日志查看脚本
├── README-DOCKER.md               # 本文档
├── group-buy-market-master/
│   └── Dockerfile-maven           # 团购后端构建文件
└── s-pay-mall-ddd-market-master/
    └── Dockerfile-maven           # 市场后端构建文件
```

## 注意事项

1. 首次构建可能需要10-20分钟，取决于网络速度
2. 确保Docker Desktop有足够的资源分配（建议4GB以上内存）
3. 如果构建失败，检查网络连接和Maven仓库配置
4. 日志文件会保存在各项目的 `docs/dev-ops/log` 目录
