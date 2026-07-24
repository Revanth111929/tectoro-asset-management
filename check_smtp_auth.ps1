# PowerShell Script to Check and Enable SMTP AUTH for Office 365
# Run this on a Windows machine with admin access

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Office 365 SMTP AUTH Checker & Enabler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ExchangeOnlineManagement module is installed
Write-Host "Checking for Exchange Online PowerShell module..." -ForegroundColor Yellow
if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
    Write-Host "Module not found. Installing..." -ForegroundColor Yellow
    Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber
    Write-Host "✅ Module installed" -ForegroundColor Green
} else {
    Write-Host "✅ Module already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Connecting to Exchange Online..." -ForegroundColor Yellow
Write-Host "Please enter your Office 365 admin credentials when prompted." -ForegroundColor Yellow
Write-Host ""

try {
    Connect-ExchangeOnline -ShowBanner:$false
    Write-Host "✅ Connected to Exchange Online" -ForegroundColor Green
    Write-Host ""
    
    # Get the email address to check
    $UserEmail = Read-Host "Enter the email address to check (e.g., revanth.moddelai@tectoro.com)"
    
    Write-Host ""
    Write-Host "Checking SMTP AUTH status for: $UserEmail" -ForegroundColor Yellow
    Write-Host ""
    
    # Check current status
    $Mailbox = Get-CASMailbox -Identity $UserEmail
    
    Write-Host "Current Settings:" -ForegroundColor Cyan
    Write-Host "  SmtpClientAuthenticationDisabled: $($Mailbox.SmtpClientAuthenticationDisabled)" -ForegroundColor White
    Write-Host ""
    
    if ($Mailbox.SmtpClientAuthenticationDisabled -eq $true) {
        Write-Host "❌ SMTP AUTH is DISABLED for this account" -ForegroundColor Red
        Write-Host "   This is why authentication is failing!" -ForegroundColor Red
        Write-Host ""
        
        $Enable = Read-Host "Do you want to ENABLE SMTP AUTH for this account? (yes/no)"
        
        if ($Enable -eq "yes") {
            Write-Host ""
            Write-Host "Enabling SMTP AUTH..." -ForegroundColor Yellow
            
            Set-CASMailbox -Identity $UserEmail -SmtpClientAuthenticationDisabled $false
            
            Write-Host "✅ SMTP AUTH has been ENABLED" -ForegroundColor Green
            Write-Host ""
            Write-Host "⏰ Please wait 5-10 minutes for changes to propagate" -ForegroundColor Yellow
            Write-Host ""
            
            # Verify
            $MailboxCheck = Get-CASMailbox -Identity $UserEmail
            Write-Host "Verification:" -ForegroundColor Cyan
            Write-Host "  SmtpClientAuthenticationDisabled: $($MailboxCheck.SmtpClientAuthenticationDisabled)" -ForegroundColor White
            Write-Host ""
            
            if ($MailboxCheck.SmtpClientAuthenticationDisabled -eq $false) {
                Write-Host "✅ SUCCESS! SMTP AUTH is now enabled" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Yellow
                Write-Host "1. Wait 5-10 minutes" -ForegroundColor White
                Write-Host "2. Test again in your Asset Management System" -ForegroundColor White
                Write-Host "3. Use your REGULAR Office 365 password (not App Password)" -ForegroundColor White
            }
        } else {
            Write-Host "❌ SMTP AUTH was NOT enabled" -ForegroundColor Red
            Write-Host "   You need to enable it to use SMTP" -ForegroundColor Red
        }
        
    } elseif ($Mailbox.SmtpClientAuthenticationDisabled -eq $false) {
        Write-Host "✅ SMTP AUTH is ENABLED for this account" -ForegroundColor Green
        Write-Host ""
        Write-Host "If authentication is still failing, try these:" -ForegroundColor Yellow
        Write-Host "1. Use your REGULAR Office 365 password (not App Password)" -ForegroundColor White
        Write-Host "2. Wait 5-10 minutes if you just enabled it" -ForegroundColor White
        Write-Host "3. Check if Security Defaults are blocking SMTP" -ForegroundColor White
        Write-Host "4. Verify the password by logging into https://outlook.office.com" -ForegroundColor White
        
    } else {
        Write-Host "⚠️  SMTP AUTH status is NULL" -ForegroundColor Yellow
        Write-Host "   Organization-level settings might be controlling this" -ForegroundColor Yellow
        Write-Host ""
        
        $Enable = Read-Host "Try enabling SMTP AUTH anyway? (yes/no)"
        
        if ($Enable -eq "yes") {
            Set-CASMailbox -Identity $UserEmail -SmtpClientAuthenticationDisabled $false
            Write-Host "✅ Command executed. Wait 5-10 minutes and test again." -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Disconnecting..." -ForegroundColor Yellow
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Host "✅ Done!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you have admin access to Exchange Online" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
