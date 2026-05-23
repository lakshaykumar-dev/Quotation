# PowerShell script to run the Angular project

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Starting Vithal Hardware Quotation Generator" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check for node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
}

Write-Host "Starting Angular development server..." -ForegroundColor Green
Write-Host "The application will be available at http://localhost:4200/" -ForegroundColor Cyan

# Start the dev server
npx ng serve --open
