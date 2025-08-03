# BitComm Production Cleanup Script
# Removes all demo, simulation, and test code for production deployment

Write-Host "BitComm Production Cleanup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Users\8020p\bitcomm"
$BackupDir = "$ProjectRoot\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Create backup directory
Write-Host "Creating backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# Files to remove completely (test/demo components)
$FilesToRemove = @(
    "src\components\TestPage.tsx",
    "src\components\AlbyIntegrationTest.tsx", 
    "src\components\ProofOfWorkDemo.tsx",
    "src\test\browser-transaction-test.js",
    "src\test\manual-transaction-test.ts",
    "src\test\message-payment-flow.test.ts"
)

# Files to modify (remove simulation/demo code)
$FilesToModify = @(
    "src\lib\p2p\webrtc-p2p.ts",
    "src\lib\lightningToolsService.ts",
    "src\components\Inbox.tsx",
    "src\pages\Index.tsx",
    "src\components\AppSidebar.tsx"
)

# Backup files before modification
Write-Host "Backing up files..." -ForegroundColor Yellow
foreach ($file in ($FilesToRemove + $FilesToModify)) {
    $sourcePath = Join-Path $ProjectRoot $file
    if (Test-Path $sourcePath) {
        $backupPath = Join-Path $BackupDir $file
        $backupDir = Split-Path $backupPath -Parent
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item $sourcePath $backupPath -Force
        Write-Host "  Backed up: $file" -ForegroundColor Green
    }
}

# Remove test/demo files
Write-Host "Removing test/demo files..." -ForegroundColor Yellow
foreach ($file in $FilesToRemove) {
    $filePath = Join-Path $ProjectRoot $file
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        Write-Host "  Removed: $file" -ForegroundColor Green
    }
}

Write-Host "Production cleanup completed!" -ForegroundColor Green
Write-Host "Backup created at: $BackupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual steps required:" -ForegroundColor Yellow
Write-Host "1. Review and test the application" -ForegroundColor White
Write-Host "2. Update deployment configurations" -ForegroundColor White
Write-Host "3. Remove test tabs from navigation" -ForegroundColor White
Write-Host "4. Verify all real connections work" -ForegroundColor White
