$npxCache = "$env:LOCALAPPDATA\npm-cache\_npx"
$searchString = "api/projects"
$oldEndpoint = "https://context7.com/api/projects"
$newEndpoint = "https://context7.com/api/v1"

Write-Host "Searching in: $npxCache" -ForegroundColor Cyan

# Find all JS files containing the old endpoint
$matches = Get-ChildItem -Path $npxCache -Recurse -Include "*.js" -ErrorAction SilentlyContinue |
    Select-String -Pattern [regex]::Escape($searchString) -List |
    Select-Object -ExpandProperty Path

if ($matches.Count -eq 0) {
    Write-Host "No files found containing '$searchString'" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($matches.Count) file(s):" -ForegroundColor Green
$matches | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }

foreach ($file in $matches) {
    Write-Host "`nPatching: $file" -ForegroundColor Cyan
    
    # Backup first
    $backup = "$file.bak"
    Copy-Item $file $backup -Force
    Write-Host "  Backup saved: $backup" -ForegroundColor Gray

    $content = Get-Content $file -Raw -Encoding UTF8

    # Count occurrences before
    $before = ([regex]::Matches($content, [regex]::Escape($oldEndpoint))).Count
    Write-Host "  Occurrences found: $before" -ForegroundColor White

    # Replace
    $patched = $content -replace [regex]::Escape($oldEndpoint), $newEndpoint

    # Write back
    Set-Content $file $patched -Encoding UTF8 -NoNewline
    Write-Host "  Patched successfully!" -ForegroundColor Green
}

Write-Host "`nDone. Restart your IDE / MCP server now." -ForegroundColor Cyan
