# PowerShell script to deploy ONLY the 5 business systems migrations
# This runs the SQL files directly to avoid CLI conflicts

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING BUSINESS SYSTEMS TO SUPABASE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseExists) {
    Write-Host "ERROR: Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Opening deployment SQL file..." -ForegroundColor Yellow
Write-Host ""

# Open the SQL file in default editor
Start-Process "DEPLOY-ALL-BUSINESS-SYSTEMS.sql"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to Supabase Dashboard SQL Editor:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/xaxbucnjlrfkccsfiddq/sql/new" -ForegroundColor White
Write-Host ""
Write-Host "2. Copy ALL text from DEPLOY-ALL-BUSINESS-SYSTEMS.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Paste into SQL Editor and click RUN" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Wait for success message" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Then create COO/CTO users by running:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   INSERT INTO public.exec_users (user_id, role, access_level, title, department) VALUES" -ForegroundColor White
Write-Host "     ('<your-coo-user-id>', 'coo', 9, 'Chief Operating Officer', 'Operations')," -ForegroundColor White
Write-Host "     ('<your-cto-user-id>', 'cto', 9, 'Chief Technology Officer', 'Technology');" -ForegroundColor White
Write-Host ""
Write-Host "Replace <your-coo-user-id> and <your-cto-user-id> with actual UUIDs from auth.users" -ForegroundColor Gray
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter when you've completed the SQL deployment"

Write-Host ""
Write-Host "Deployment complete! Your business systems are now live." -ForegroundColor Green
Write-Host "Test portals at: coo.cravenusa.com and cto.cravenusa.com" -ForegroundColor Cyan

