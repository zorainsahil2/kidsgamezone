# Bella's Flower Run platformer game verification script

$basePath = "f:/50 games/kidsgamezone/games/super-mario"
$serverUrl = "http://localhost:8000"
$allPassed = $true

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Verifying Bella's Flower Run Platformer Game" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify files exist
$files = @(
    "index.html",
    "style.css",
    "game.js",
    "assets/bella-thin.png",
    "assets/bella-fat.png",
    "assets/collectibles.png",
    "assets/enemies.png",
    "assets/tileset.png",
    "assets/background.png"

)

foreach ($file in $files) {
    $filePath = "$basePath/$file"
    if (-not (Test-Path $filePath)) {
        Write-Host "  [-] File/Asset missing: $filePath" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "  [+] File OK: $file" -ForegroundColor Green
    }
}

# 2. Check HTTP Endpoint for Game
$gameUrl = "$serverUrl/games/super-mario/index.html"
try {
    $response = Invoke-WebRequest -Uri $gameUrl -Method Head -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  [+] HTTP Game URL OK: 200 ($gameUrl)" -ForegroundColor Green
    } else {
        Write-Host "  [-] HTTP Game URL failed: Status $($response.StatusCode) ($gameUrl)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  [-] HTTP Game URL connection failed: $_" -ForegroundColor Red
    $allPassed = $false
}

# 3. Check HTTP Endpoint for Game Player Wrapper
$playerUrl = "$serverUrl/game.html?slug=super-mario&id=1"
try {
    $response = Invoke-WebRequest -Uri $playerUrl -Method Get -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  [+] HTTP Player Wrapper URL OK: 200 ($playerUrl)" -ForegroundColor Green
    } else {
        Write-Host "  [-] HTTP Player Wrapper URL failed: Status $($response.StatusCode) ($playerUrl)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  [-] HTTP Player Wrapper URL connection failed: $_" -ForegroundColor Red
    $allPassed = $false
}

# 4. Check syntax of PHP files in project
Write-Host "`nChecking PHP files syntax..." -ForegroundColor Yellow
$phpFiles = Get-ChildItem -Path "f:/50 games/kidsgamezone" -Filter "*.php" -Recurse
$phpExe = "C:\Users\zorai\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"

if (Test-Path $phpExe) {
    foreach ($file in $phpFiles) {
        $result = & $phpExe -l $file.FullName 2>&1
        if ($result -match "No syntax errors detected") {
            # Silent on success to keep log clean, or output a small check mark
        } else {
            Write-Host "  [-] Syntax error in $($file.FullName): $result" -ForegroundColor Red
            $allPassed = $false
        }
    }
    Write-Host "  [+] PHP Syntax validation completed." -ForegroundColor Green
} else {
    Write-Host "  [!] PHP compiler not found, skipping syntax check." -ForegroundColor Yellow
}

Write-Host "==========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "SUCCESS: Bella's Flower Run is fully validated!" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Some verification checks failed." -ForegroundColor Red
}
