# 停止所有Docker服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "停止所有服务..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "e:\softwareproj"

docker-compose -f docker-compose-full.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "所有服务已停止" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "停止失败" -ForegroundColor Red
}
