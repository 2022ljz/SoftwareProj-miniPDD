# 查看服务日志

param(
    [string]$Service = ""
)

Set-Location -Path "e:\softwareproj"

if ($Service -eq "") {
    Write-Host "查看所有服务日志..." -ForegroundColor Cyan
    docker-compose -f docker-compose-full.yml logs -f
} else {
    Write-Host "查看 $Service 服务日志..." -ForegroundColor Cyan
    docker-compose -f docker-compose-full.yml logs -f $Service
}
