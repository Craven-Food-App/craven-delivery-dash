@echo off
REM Streamlined Git Push Script (Windows Batch)
REM Usage: git-push.bat [commit-message]

setlocal enabledelayedexpansion

set "MESSAGE=%~1"

REM Get current branch name
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i

REM If no message provided, prompt for one
if "!MESSAGE!"=="" (
    set /p MESSAGE="Enter commit message: "
    if "!MESSAGE!"=="" (
        echo ❌ Commit message cannot be empty
        exit /b 1
    )
)

echo.
echo 🚀 Pushing to git...
echo Branch: !BRANCH!
echo Message: !MESSAGE!
echo.

REM Check if there are changes to commit
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No changes to commit
    exit /b 0
)

REM Stage all changes
echo 📦 Staging changes...
git add -A
if errorlevel 1 (
    echo ❌ Failed to stage changes
    exit /b 1
)

REM Commit changes
echo 💾 Committing changes...
git commit -m "!MESSAGE!"
if errorlevel 1 (
    echo ❌ Failed to commit changes
    exit /b 1
)

REM Push to remote
echo ⬆️  Pushing to remote...
git push
if errorlevel 1 (
    echo ❌ Failed to push changes
    echo 💡 Try: git push --set-upstream origin !BRANCH!
    exit /b 1
)

echo.
echo ✅ Successfully pushed to git!
echo Branch: !BRANCH!
echo Commit: !MESSAGE!
echo.

endlocal

