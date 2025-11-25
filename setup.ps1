# Setup Script for Nifty Options Trading Platform

Write-Host "🚀 Setting up Nifty Options Trading Platform..." -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Gray
python --version

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found! Please install Python 3.10 or higher." -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host ""
Write-Host "Creating Python virtual environment..." -ForegroundColor Gray
Set-Location backend
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Gray
.\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Gray
python -m pip install --upgrade pip

# Install requirements
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Gray
pip install -r requirements.txt

Write-Host ""
Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Deactivate and go back
deactivate
Set-Location ..

# Frontend Setup
Write-Host "📦 Setting up Frontend..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Gray
node --version

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js 18 or higher." -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "Installing Node.js dependencies..." -ForegroundColor Gray
Set-Location frontend
npm install

Write-Host ""
Write-Host "✅ Frontend setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Environment files
Write-Host "📝 Setting up environment files..." -ForegroundColor Yellow
Write-Host ""

# Copy backend .env
if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend/.env from example..." -ForegroundColor Gray
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  Please update backend/.env with your configuration!" -ForegroundColor Yellow
} else {
    Write-Host "backend/.env already exists, skipping..." -ForegroundColor Gray
}

# Copy frontend .env.local
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "Creating frontend/.env.local from example..." -ForegroundColor Gray
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✅ frontend/.env.local created!" -ForegroundColor Green
} else {
    Write-Host "frontend/.env.local already exists, skipping..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your database and API credentials" -ForegroundColor White
Write-Host "2. Start PostgreSQL and Redis (via Docker or locally)" -ForegroundColor White
Write-Host "3. Run database migrations: cd backend && .\venv\Scripts\Activate.ps1 && alembic upgrade head" -ForegroundColor White
Write-Host "4. Start backend: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "5. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker Compose: docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
