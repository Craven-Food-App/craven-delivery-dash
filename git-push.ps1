# Streamlined Git Push Script
# Usage: .\git-push.ps1 [commit-message]
# Or: npm run git:push "commit message"

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$MessageParts = @()
)

# Join message parts if passed as separate arguments
$Message = $MessageParts -join " "

# Get current branch name
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not a git repository" -ForegroundColor Red
    exit 1
}

# If no message provided, use default or prompt
if ([string]::IsNullOrWhiteSpace($Message)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "Update: $timestamp"
    Write-Host "📝 Using default message: $Message" -ForegroundColor Gray
}

Write-Host "`n🚀 Git Push" -ForegroundColor Cyan
Write-Host "Branch: $branch | Message: $Message`n" -ForegroundColor Gray

# Quick check for changes
$status = git status --porcelain 2>$null
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Stage, commit, and push in one flow
Write-Host "📦 Staging..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Stage failed" -ForegroundColor Red; exit 1 }

Write-Host "💾 Committing..." -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Commit failed" -ForegroundColor Red; exit 1 }

Write-Host "⬆️  Pushing..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host "💡 Try: git push --set-upstream origin $branch" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Pushed successfully!" -ForegroundColor Green

