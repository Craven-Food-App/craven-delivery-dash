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
$branch = git rev-parse --abbrev-ref HEAD

# If no message provided, prompt for one
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "Enter commit message"
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Host "❌ Commit message cannot be empty" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🚀 Pushing to git..." -ForegroundColor Cyan
Write-Host "Branch: $branch" -ForegroundColor Gray
Write-Host "Message: $Message`n" -ForegroundColor Gray

# Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Stage all changes
Write-Host "📦 Staging changes..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to stage changes" -ForegroundColor Red
    exit 1
}

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push to remote
Write-Host "⬆️  Pushing to remote..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push changes" -ForegroundColor Red
    Write-Host "💡 Try: git push --set-upstream origin $branch" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Successfully pushed to git!" -ForegroundColor Green
Write-Host "Branch: $branch" -ForegroundColor Gray
Write-Host "Commit: $Message`n" -ForegroundColor Gray

