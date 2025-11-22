# 🤖 ML Price Prediction Service

Machine Learning service for RideWise that predicts ride fares and recommends the best time to book based on historical data analysis.

## 🎯 Features

- **Fare Prediction**: ML-powered price prediction based on distance, time, traffic patterns
- **Best Time Recommendation**: Analyze next 24 hours and suggest optimal booking time
- **Surge Pricing Detection**: Identify rush hours and predict price variations
- **Batch Predictions**: Get predictions for multiple transport types and providers at once
- **Historical Analysis**: Train models on real user data from MongoDB

## 📦 Technologies

- **Python 3.8+**
- **Flask**: REST API server
- **scikit-learn**: Machine learning models (Random Forest Regressor)
- **pandas**: Data processing
- **numpy**: Numerical computations
- **MongoDB**: Historical data storage

## 🚀 Quick Start

### 1. Install Python Dependencies

```powershell
cd ml-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Update `.env` file:
```env
FLASK_PORT=5001
MONGODB_URI=your_mongodb_connection_string
NODE_SERVER_URL=http://localhost:5000
```

### 3. Collect Training Data

```powershell
# Option A: Use real historical data from MongoDB
python utils/data_collector.py

# Option B: Generate synthetic training data (for testing)
# Synthetic data is auto-generated if MongoDB has < 10 records
```

### 4. Train the Model

```powershell
python utils/train_model.py
```

This will:
- Load training data from `data/training_data.csv`
- Train Random Forest model
- Evaluate performance (MAE, RMSE, R²)
- Save model to `models/` directory

### 5. Start ML Service

```powershell
python app.py
```

Service will start on `http://localhost:5001`

## 📡 API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "ml-price-prediction"
}
```

### Predict Fare
```http
POST /predict
Content-Type: application/json

{
  "distance_km": 10,
  "transport_type": "cab",
  "service_provider": "obeer",
  "hour": 18,
  "day_of_week": 2,
  "duration_mins": 30
}
```

Response:
```json
{
  "predicted_fare": 185.50,
  "distance_km": 10,
  "transport_type": "cab",
  "service_provider": "obeer",
  "hour": 18,
  "day_of_week": 2
}
```

### Get Best Time to Book
```http
POST /best-time
Content-Type: application/json

{
  "distance_km": 15,
  "transport_type": "cab",
  "service_provider": "obeer",
  "hours_ahead": 24
}
```

Response:
```json
{
  "current_fare": 220.00,
  "best_time": "2025-11-18T02:00:00",
  "best_fare": 195.50,
  "savings": 24.50,
  "wait_hours": 8,
  "all_predictions": [
    {"hour": 18, "datetime": "2025-11-17T18:00:00", "fare": 220.00, "is_rush_hour": true},
    {"hour": 19, "datetime": "2025-11-17T19:00:00", "fare": 215.00, "is_rush_hour": true}
  ]
}
```

### Batch Predict
```http
POST /batch-predict
Content-Type: application/json

{
  "distance_km": 10,
  "transport_types": ["bike", "auto", "cab"],
  "service_providers": ["obeer", "radipoo", "yela"]
}
```

Response:
```json
{
  "distance_km": 10,
  "predictions": [
    {"transport_type": "bike", "service_provider": "obeer", "predicted_fare": 65.00},
    {"transport_type": "auto", "service_provider": "radipoo", "predicted_fare": 125.00},
    {"transport_type": "cab", "service_provider": "yela", "predicted_fare": 190.00}
  ]
}
```

### Model Information
```http
GET /model-info
```

Response:
```json
{
  "model_loaded": true,
  "metadata": {
    "mae": 12.34,
    "rmse": 18.56,
    "r2": 0.87,
    "training_samples": 1600,
    "test_samples": 400,
    "trained_at": "2025-11-17T10:30:00"
  },
  "features": ["distance_km", "duration_mins", "hour", "day_of_week", "is_weekend", "is_rush_hour", "avg_speed"]
}
```

## 🧠 Model Details

### Features Used for Prediction

1. **distance_km**: Trip distance in kilometers
2. **duration_mins**: Estimated trip duration in minutes
3. **hour**: Hour of day (0-23)
4. **day_of_week**: Day of week (0=Monday, 6=Sunday)
5. **is_weekend**: Binary (1 for Sat/Sun, 0 otherwise)
6. **is_rush_hour**: Binary (1 for 7-9 AM or 5-7 PM)
7. **avg_speed**: Average speed (km/h)
8. **transport_type**: Encoded (bike/auto/cab)
9. **service_provider**: Encoded (obeer/radipoo/yela)

### Model Architecture

- **Algorithm**: Random Forest Regressor
- **Parameters**:
  - n_estimators: 100
  - max_depth: 15
  - min_samples_split: 5
  - min_samples_leaf: 2

### Performance Metrics

Typical performance on synthetic data:
- **MAE (Mean Absolute Error)**: ₹10-15
- **RMSE (Root Mean Squared Error)**: ₹15-20
- **R² Score**: 0.85-0.90

## 🔄 Retraining the Model

To retrain with new data:

```powershell
# 1. Collect fresh data
python utils/data_collector.py

# 2. Retrain model
python utils/train_model.py

# 3. Restart service
python app.py
```

## 🐛 Troubleshooting

### Model Not Loading

```
Error: Model not found at models/fare_prediction_model.pkl
```

**Solution**: Run training first:
```powershell
python utils/data_collector.py
python utils/train_model.py
```

### Service Unavailable (503)

**Check**:
1. ML service is running on port 5001
2. Node.js server can reach `http://localhost:5001`
3. Firewall allows localhost connections

### Low Prediction Accuracy

**Solutions**:
1. Collect more historical data (>1000 records recommended)
2. Retrain model with updated data
3. Adjust hyperparameters in `train_model.py`

## 📊 Data Flow

```
User Input (Compare.jsx)
    ↓
Node.js Server (/api/ml/predict)
    ↓
ML Service (Flask API)
    ↓
Trained Model (RandomForest)
    ↓
Prediction
    ↓
User Interface
```

## 🔐 Security Notes

- ML service runs on `localhost:5001` (not exposed externally)
- Only Node.js server can call ML service
- No authentication required (internal service)
- Frontend never calls ML service directly

## 📈 Future Enhancements

- [ ] LSTM model for time-series predictions
- [ ] Weather data integration
- [ ] Traffic API integration
- [ ] Real-time model updates
- [ ] A/B testing framework
- [ ] Model explainability (SHAP values)
- [ ] Auto-retraining pipeline
- [ ] Model versioning

## 🤝 Integration with Main App

The ML service is automatically integrated:

1. **Backend**: `server/index.js` has ML endpoints at `/api/ml/*`
2. **Frontend**: `PricePrediction.jsx` component displays predictions
3. **UI**: Integrated into `Compare.jsx` below fare results

## 💡 Usage Tips

- Train model with at least 500+ records for better accuracy
- Retrain weekly to capture latest trends
- Monitor model metrics in `/model-info` endpoint
- Use batch-predict for better performance when comparing multiple options

## 📞 Support

For issues or questions:
1. Check logs in Flask console
2. Verify MongoDB connection
3. Ensure all dependencies installed
4. Check Node.js server logs for integration errors

---

**Built with ❤️ for RideWise**
