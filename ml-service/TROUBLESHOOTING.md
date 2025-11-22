# 🔧 ML Service Troubleshooting Guide

Common issues and solutions for the RideWise ML Price Prediction Service.

## 🚨 Common Errors

### 1. "Model not found at models/fare_prediction_model.pkl"

**Cause**: Model hasn't been trained yet

**Solution**:
```powershell
cd ml-service
.\venv\Scripts\activate
python utils/data_collector.py
python utils/train_model.py
```

**Verification**:
```powershell
# Check if model files exist
ls models/
# Should see:
# - fare_prediction_model.pkl
# - scaler.pkl
# - label_encoders.pkl
# - model_metadata.pkl
```

---

### 2. "Service Unavailable (503)" in Frontend

**Cause**: ML service is not running

**Solution**:
```powershell
cd ml-service
.\start.ps1
```

**Alternative**:
```powershell
cd ml-service
.\venv\Scripts\activate
python app.py
```

**Verification**:
```powershell
# Test health endpoint
curl http://localhost:5001/health

# Should return:
# {"status": "healthy", "model_loaded": true, "service": "ml-price-prediction"}
```

---

### 3. "ModuleNotFoundError: No module named 'flask'"

**Cause**: Python dependencies not installed

**Solution**:
```powershell
cd ml-service
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Verification**:
```powershell
pip list
# Should show: Flask, scikit-learn, pandas, numpy, pymongo, joblib
```

---

### 4. "pymongo.errors.ServerSelectionTimeoutError"

**Cause**: Cannot connect to MongoDB

**Solution 1**: Check if MongoDB is running
```powershell
# Check MongoDB status
net start | findstr MongoDB
```

**Solution 2**: Verify connection string in `.env`
```env
MONGODB_URI=mongodb://localhost:27017/ridewise
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ridewise
```

**Solution 3**: Use synthetic data (doesn't require MongoDB)
```powershell
# data_collector.py will auto-generate synthetic data if MongoDB has <10 records
python utils/data_collector.py
```

---

### 5. "Port 5001 is already in use"

**Cause**: Another process is using port 5001

**Solution 1**: Kill existing process
```powershell
# Find process on port 5001
netstat -ano | findstr :5001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Solution 2**: Change port in `.env`
```env
FLASK_PORT=5002
```

Then update `ML_SERVICE_URL` in `server/.env`:
```env
ML_SERVICE_URL=http://localhost:5002
```

---

### 6. Low Prediction Accuracy (High MAE/RMSE)

**Cause**: Insufficient or poor quality training data

**Solution 1**: Collect more real data
```powershell
# Use app for 1-2 weeks to accumulate historical data
# Then retrain:
python utils/data_collector.py
python utils/train_model.py
```

**Solution 2**: Increase synthetic data samples
Edit `data_collector.py`:
```python
# Line ~150
n_samples = 2000  # Increase from 1000
```

**Solution 3**: Tune hyperparameters
Edit `train_model.py`:
```python
# Line ~50
self.model = RandomForestRegressor(
    n_estimators=200,     # Increase from 100
    max_depth=20,         # Increase from 15
    min_samples_split=3   # Decrease from 5
)
```

---

### 7. "Training data is empty or invalid"

**Cause**: CSV file has no data or wrong format

**Solution**:
```powershell
# Delete old data and regenerate
Remove-Item data/training_data.csv
python utils/data_collector.py
```

**Verification**:
```powershell
# Check CSV has data
Get-Content data/training_data.csv | Measure-Object -Line
# Should show > 100 lines
```

---

### 8. CORS Errors in Browser Console

**Cause**: CORS not configured properly

**Solution 1**: Verify Flask-CORS is installed
```powershell
pip show Flask-CORS
```

**Solution 2**: Check CORS setup in `app.py`
```python
# Should be at top of app.py
from flask_cors import CORS
CORS(app)
```

**Solution 3**: Use proxy endpoints (recommended)
- Frontend should call `/api/ml/predict` (Node.js)
- NOT `http://localhost:5001/predict` (Flask directly)

---

### 9. "Best Time" Always Shows "Book Now"

**Cause**: All predictions are similar (no price variation)

**Solution**: Improve model with time-based features

Check if rush hour patterns are in data:
```powershell
python -c "import pandas as pd; df = pd.read_csv('data/training_data.csv'); print(df['is_rush_hour'].value_counts())"
```

Should show mix of True/False. If all False:
```python
# Edit data_collector.py line ~80
def _is_rush_hour(hour):
    # Expand rush hours
    return (7 <= hour <= 10) or (16 <= hour <= 20)
```

---

### 10. Virtual Environment Issues

**Problem**: "venv\Scripts\Activate.ps1 cannot be loaded"

**Cause**: PowerShell execution policy

**Solution**:
```powershell
# Check current policy
Get-ExecutionPolicy

# If Restricted, change it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Try activation again
.\venv\Scripts\Activate.ps1
```

---

## 🔍 Debugging Commands

### Check Service Status
```powershell
# ML Service
curl http://localhost:5001/health

# Node.js Server
curl http://localhost:5000/api/ml/health

# React Frontend
# Open browser: http://localhost:3000
```

### View Model Information
```powershell
curl http://localhost:5001/model-info
# Shows: MAE, RMSE, R², training samples, features
```

### Test Prediction Directly
```powershell
curl -X POST http://localhost:5001/predict `
  -H "Content-Type: application/json" `
  -d '{"distance_km": 10, "transport_type": "cab", "service_provider": "obeer", "hour": 18, "day_of_week": 2, "duration_mins": 30}'
```

### Check Training Data Quality
```powershell
cd ml-service
python -c "
import pandas as pd
df = pd.read_csv('data/training_data.csv')
print(f'Rows: {len(df)}')
print(f'Columns: {df.columns.tolist()}')
print(f'Fare range: {df[\"fare\"].min():.2f} - {df[\"fare\"].max():.2f}')
print(f'Distance range: {df[\"distance_km\"].min():.2f} - {df[\"distance_km\"].max():.2f}')
print(df.describe())
"
```

### View Flask Logs
```powershell
# Start with verbose logging
cd ml-service
.\venv\Scripts\activate
$env:FLASK_DEBUG = "1"
python app.py
# Watch console for detailed logs
```

---

## 📊 Performance Optimization

### Speed Up Predictions
1. **Use batch predictions** for multiple options:
   ```javascript
   // Instead of 3 separate calls
   fetch('/api/ml/batch-predict', {
     body: JSON.stringify({
       distance_km: 10,
       transport_types: ['bike', 'auto', 'cab'],
       service_providers: ['obeer', 'radipoo', 'yela']
     })
   })
   ```

2. **Cache predictions** in frontend (5 minutes):
   ```javascript
   const cacheKey = `${distance}_${transportType}_${hour}`;
   if (cache.has(cacheKey)) return cache.get(cacheKey);
   ```

### Reduce Model Size
```python
# In train_model.py, reduce trees
self.model = RandomForestRegressor(
    n_estimators=50,  # Reduce from 100
    max_depth=10      # Reduce from 15
)
```

### Speed Up Training
```python
# Add to train_model.py
self.model = RandomForestRegressor(
    n_jobs=-1  # Use all CPU cores
)
```

---

## 🧪 Testing

### Test Data Collection
```powershell
cd ml-service
python utils/data_collector.py
# Check: data/training_data.csv created
# Should have 1000+ rows
```

### Test Model Training
```powershell
python utils/train_model.py
# Check output:
# ✓ MAE < 20
# ✓ RMSE < 30
# ✓ R² > 0.80
```

### Test API Endpoints
```powershell
# Health check
curl http://localhost:5001/health

# Prediction
curl -X POST http://localhost:5001/predict -H "Content-Type: application/json" -d '{\"distance_km\": 10, \"transport_type\": \"cab\", \"service_provider\": \"obeer\", \"hour\": 18, \"day_of_week\": 2, \"duration_mins\": 30}'

# Best time
curl -X POST http://localhost:5001/best-time -H "Content-Type: application/json" -d '{\"distance_km\": 15, \"transport_type\": \"cab\", \"service_provider\": \"obeer\", \"hours_ahead\": 24}'
```

### Integration Test
1. Start all services:
   ```powershell
   # Terminal 1: ML Service
   cd ml-service; .\start.ps1
   
   # Terminal 2: Node.js
   cd server; npm start
   
   # Terminal 3: React
   cd client; npm start
   ```

2. Open browser: http://localhost:3000
3. Navigate to Compare page
4. Enter locations, click "Compare Fares"
5. Click "Predict Price" → Should show prediction
6. Click "Best Time" → Should show recommendation + chart

---

## 📞 Getting Help

If none of these solutions work:

1. **Check logs**:
   - Flask console output
   - Node.js server logs
   - Browser console (F12)

2. **Verify setup**:
   ```powershell
   # All these should pass
   python --version          # 3.8+
   pip list | findstr Flask  # Flask installed
   ls models/               # Model files exist
   ls data/                 # Training data exists
   curl http://localhost:5001/health  # Service running
   ```

3. **Reset everything**:
   ```powershell
   # Clean slate
   cd ml-service
   Remove-Item -Recurse venv, models, data
   .\setup.ps1
   ```

4. **Contact support** with:
   - Python version
   - Error message (full traceback)
   - Output of `pip list`
   - Contents of `.env` files (redact sensitive data)

---

**Last Updated**: November 2025  
**Version**: 1.0
