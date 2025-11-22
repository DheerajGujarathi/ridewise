# ML Service Setup Script for Windows PowerShell
# This script automates the setup of the ML price prediction service

Write-Host "🤖 RideWise ML Service Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    Write-Host "  Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Create virtual environment
Write-Host "`nCreating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
} else {
    python -m venv venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host "`nActivating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`nInstalling Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create required directories
Write-Host "`nCreating directories..." -ForegroundColor Yellow
$directories = @("data", "models")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "✓ Created $dir/" -ForegroundColor Green
    } else {
        Write-Host "✓ $dir/ already exists" -ForegroundColor Green
    }
}

# Check .env file
Write-Host "`nChecking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file not found - using defaults" -ForegroundColor Yellow
}

# Collect training data
Write-Host "`nCollecting training data..." -ForegroundColor Yellow
Write-Host "  This will fetch historical data from MongoDB or generate synthetic data" -ForegroundColor Gray
python utils/data_collector.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Training data collected successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to collect training data" -ForegroundColor Red
    Write-Host "  Check MongoDB connection in .env file" -ForegroundColor Yellow
    exit 1
}

# Train the model
Write-Host "`nTraining ML model..." -ForegroundColor Yellow
Write-Host "  This may take 1-2 minutes..." -ForegroundColor Gray
python utils/train_model.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Model trained successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to train model" -ForegroundColor Red
    exit 1
}

# Display completion message
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✓ ML Service Setup Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start the ML service:" -ForegroundColor White
Write-Host "   python app.py`n" -ForegroundColor Yellow

Write-Host "2. Start the Node.js server:" -ForegroundColor White
Write-Host "   cd ..\server" -ForegroundColor Yellow
Write-Host "   npm start`n" -ForegroundColor Yellow

Write-Host "3. Start the React client:" -ForegroundColor White
Write-Host "   cd ..\client" -ForegroundColor Yellow
Write-Host "   npm start`n" -ForegroundColor Yellow

Write-Host "4. Test the service:" -ForegroundColor White
Write-Host "   Navigate to http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Go to Compare page and click 'Predict Price'`n" -ForegroundColor Yellow

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "- Check service health: curl http://localhost:5001/health" -ForegroundColor Gray
Write-Host "- View model info: curl http://localhost:5001/model-info" -ForegroundColor Gray
Write-Host "- Retrain model: python utils/train_model.py`n" -ForegroundColor Gray

Write-Host "Documentation: See README.md for detailed API documentation`n" -ForegroundColor Gray
