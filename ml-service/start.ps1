# ML Service Startup Script for Windows PowerShell
# Quick script to start the ML prediction service

Write-Host "🚀 Starting ML Price Prediction Service..." -ForegroundColor Cyan

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "✗ Virtual environment not found!" -ForegroundColor Red
    Write-Host "  Run setup.ps1 first: .\setup.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if model exists
if (-not (Test-Path "models/fare_prediction_model.pkl")) {
    Write-Host "✗ Trained model not found!" -ForegroundColor Red
    Write-Host "  Run training first: python utils/train_model.py" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment and start service
Write-Host "✓ Starting Flask server on port 5001..." -ForegroundColor Green
& .\venv\Scripts\Activate.ps1
python app.py
