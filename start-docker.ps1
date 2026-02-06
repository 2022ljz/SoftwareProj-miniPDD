# Docker环境构建和运行脚本
# 此脚本使用Docker和Maven构建并运行两个Java 8后端项目

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始构建和启动项目..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Docker是否运行
Write-Host "检查Docker环境..." -ForegroundColor Yellow
docker version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker未运行，请先启动Docker Desktop" -ForegroundColor Red
    exit 1
}

# 检查Maven
Write-Host "检查Maven环境..." -ForegroundColor Yellow
mvn --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "警告: Maven未安装，将使用Docker内置的Maven进行构建" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "准备启动服务..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务列表:" -ForegroundColor Green
Write-Host "  1. MySQL          - 端口: 13306" -ForegroundColor White
Write-Host "  2. Redis          - 端口: 16379" -ForegroundColor White
Write-Host "  3. RabbitMQ       - 端口: 5672, 15672 (管理界面)" -ForegroundColor White
Write-Host "  4. 团购后端       - 端口: 8091" -ForegroundColor White
Write-Host "  5. 市场后端       - 端口: 8070" -ForegroundColor White
Write-Host "  6. Nginx前端      - 端口: 80" -ForegroundColor White
Write-Host ""

# 切换到项目根目录
Set-Location -Path "e:\softwareproj"

# 启动Docker Compose
Write-Host "正在启动Docker Compose..." -ForegroundColor Yellow
Write-Host "注意: 首次运行会下载镜像和构建项目，可能需要较长时间..." -ForegroundColor Yellow
Write-Host ""

docker-compose -f docker-compose-full.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "所有服务启动成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问地址:" -ForegroundColor Cyan
    Write-Host "  前端页面:         http://localhost" -ForegroundColor White
    Write-Host "  团购后端API:      http://localhost:8091" -ForegroundColor White
    Write-Host "  市场后端API:      http://localhost:8070" -ForegroundColor White
    Write-Host "  RabbitMQ管理:     http://localhost:15672 (账号: admin/admin)" -ForegroundColor White
    Write-Host ""
    Write-Host "查看日志命令:" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose-full.yml logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "停止服务命令:" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose-full.yml down" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "启动失败，请检查错误信息" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看日志:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose-full.yml logs" -ForegroundColor White
    exit 1
}
