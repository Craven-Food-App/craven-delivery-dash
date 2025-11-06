# Reset CFO Password Script
# This script resets the password for Justin Sweet (wowbilallovely@gmail.com)

$supabaseUrl = "https://xaxbucnjlrfkccsfiddq.supabase.co"
$email = "wowbilallovely@gmail.com"
$newPassword = "Craventemp01!"

Write-Host "🔄 Resetting password for CFO: $email" -ForegroundColor Yellow
Write-Host ""

# Check if service role key is set
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your service role key:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/xaxbucnjlrfkccsfiddq/settings/api" -ForegroundColor Cyan
    Write-Host "2. Copy the 'service_role' key" -ForegroundColor Cyan
    Write-Host "3. Set it: `$env:SUPABASE_SERVICE_ROLE_KEY = 'your-key-here'" -ForegroundColor Cyan
    Write-Host "4. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use the Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "  Authentication > Users > Find $email > Reset Password" -ForegroundColor Cyan
    exit 1
}

$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

# Use the reset-executive-password edge function
$body = @{
    email = $email
    newPassword = $newPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/reset-executive-password" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $serviceRoleKey"
        } `
        -Body $body

    if ($response.success) {
        Write-Host "✅ Password reset successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Email: $email" -ForegroundColor White
        Write-Host "New Password: $newPassword" -ForegroundColor White
        Write-Host "User ID: $($response.user_id)" -ForegroundColor White
        if ($response.executive) {
            Write-Host "Executive: $($response.executive.full_name) ($($response.executive.role))" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "The CFO can now log in with these credentials." -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to reset password: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Details: $($errorObj.error)" -ForegroundColor Red
    }
    exit 1
}

