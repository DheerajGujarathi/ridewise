# 📡 ML Service API Reference

Quick reference guide for the RideWise ML Price Prediction API.

## Base URL

- **ML Service (Direct)**: `http://localhost:5001`
- **Node.js Proxy**: `http://localhost:5000/api/ml`

> **Recommended**: Use Node.js proxy endpoints for frontend integration

---

## Endpoints

### 1. Health Check

Check if ML service is running and model is loaded.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "ml-price-prediction"
}
```

**Status Codes:**
- `200`: Service healthy
- `503`: Service unhealthy (model not loaded)

---

### 2. Predict Fare

Get fare prediction for a single trip.

**Request:**
```http
POST /predict
Content-Type: application/json

{
  "distance_km": 10.5,
  "transport_type": "cab",
  "service_provider": "obeer",
  "hour": 18,
  "day_of_week": 2,
  "duration_mins": 25
}
```

**Parameters:**
| Field | Type | Required | Description | Values |
|-------|------|----------|-------------|--------|
| `distance_km` | float | Yes | Trip distance in km | 0.1 - 100+ |
| `transport_type` | string | Yes | Vehicle type | `bike`, `auto`, `cab` |
| `service_provider` | string | Yes | Service provider | `obeer`, `radipoo`, `yela` |
| `hour` | int | No | Hour of day (24h) | 0 - 23 (default: current) |
| `day_of_week` | int | No | Day of week | 0=Mon ... 6=Sun (default: current) |
| `duration_mins` | int | No | Trip duration | 1 - 300 (default: calculated) |

**Response:**
```json
{
  "predicted_fare": 185.50,
  "distance_km": 10.5,
  "transport_type": "cab",
  "service_provider": "obeer",
  "hour": 18,
  "day_of_week": 2,
  "duration_mins": 25,
  "features_used": {
    "is_rush_hour": true,
    "is_weekend": false,
    "avg_speed": 25.2
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid parameters
- `503`: Model not loaded

---

### 3. Get Best Time to Book

Analyze next N hours and recommend optimal booking time.

**Request:**
```http
POST /best-time
Content-Type: application/json

{
  "distance_km": 15.0,
  "transport_type": "cab",
  "service_provider": "obeer",
  "hours_ahead": 24
}
```

**Parameters:**
| Field | Type | Required | Description | Values |
|-------|------|----------|-------------|--------|
| `distance_km` | float | Yes | Trip distance in km | 0.1 - 100+ |
| `transport_type` | string | Yes | Vehicle type | `bike`, `auto`, `cab` |
| `service_provider` | string | Yes | Service provider | `obeer`, `radipoo`, `yela` |
| `hours_ahead` | int | No | Forecast window | 1 - 48 (default: 24) |

**Response:**
```json
{
  "current_fare": 220.00,
  "best_time": "2025-11-18T02:00:00",
  "best_fare": 185.50,
  "savings": 34.50,
  "savings_percent": 15.68,
  "wait_hours": 8,
  "recommendation": "Wait 8 hours to save ₹34.50 (15.7%)",
  "all_predictions": [
    {
      "hour": 18,
      "datetime": "2025-11-17T18:00:00",
      "fare": 220.00,
      "is_rush_hour": true,
      "is_best_time": false
    },
    {
      "hour": 2,
      "datetime": "2025-11-18T02:00:00",
      "fare": 185.50,
      "is_rush_hour": false,
      "is_best_time": true
    }
  ]
}
```

**Business Logic:**
- If savings < ₹10: Recommend "Book Now"
- If savings >= ₹10: Show wait time and savings
- Rush hours (7-9 AM, 5-7 PM): Higher fares
- Late night/early morning (12-5 AM): Lower fares

**Status Codes:**
- `200`: Success
- `400`: Invalid parameters
- `503`: Model not loaded

---

### 4. Batch Predict

Get predictions for multiple transport types and providers at once.

**Request:**
```http
POST /batch-predict
Content-Type: application/json

{
  "distance_km": 10.0,
  "transport_types": ["bike", "auto", "cab"],
  "service_providers": ["obeer", "radipoo", "yela"],
  "hour": 18,
  "day_of_week": 2
}
```

**Parameters:**
| Field | Type | Required | Description | Values |
|-------|------|----------|-------------|--------|
| `distance_km` | float | Yes | Trip distance in km | 0.1 - 100+ |
| `transport_types` | array | Yes | Vehicle types | `["bike", "auto", "cab"]` |
| `service_providers` | array | Yes | Providers | `["obeer", "radipoo", "yela"]` |
| `hour` | int | No | Hour of day | 0 - 23 (default: current) |
| `day_of_week` | int | No | Day of week | 0-6 (default: current) |

**Response:**
```json
{
  "distance_km": 10.0,
  "timestamp": "2025-11-17T18:30:00",
  "predictions": [
    {
      "transport_type": "bike",
      "service_provider": "obeer",
      "predicted_fare": 65.00,
      "is_rush_hour": true
    },
    {
      "transport_type": "auto",
      "service_provider": "radipoo",
      "predicted_fare": 125.00,
      "is_rush_hour": true
    },
    {
      "transport_type": "cab",
      "service_provider": "yela",
      "predicted_fare": 190.00,
      "is_rush_hour": true
    }
  ],
  "cheapest": {
    "transport_type": "bike",
    "service_provider": "obeer",
    "fare": 65.00
  },
  "fastest": {
    "transport_type": "cab",
    "service_provider": "yela",
    "fare": 190.00
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid parameters
- `503`: Model not loaded

---

### 5. Model Information

Get metadata about trained model and performance metrics.

**Request:**
```http
GET /model-info
```

**Response:**
```json
{
  "model_loaded": true,
  "metadata": {
    "mae": 12.34,
    "rmse": 18.56,
    "r2": 0.87,
    "training_samples": 1600,
    "test_samples": 400,
    "trained_at": "2025-11-17T10:30:00",
    "model_version": "1.0"
  },
  "features": [
    "distance_km",
    "duration_mins",
    "hour",
    "day_of_week",
    "is_weekend",
    "is_rush_hour",
    "avg_speed",
    "transport_type",
    "service_provider"
  ],
  "model_type": "RandomForestRegressor",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 15,
    "min_samples_split": 5
  }
}
```

**Status Codes:**
- `200`: Success
- `503`: Model not loaded

---

## Frontend Integration

### React Component Example

```jsx
import { useState } from 'react';

function PricePrediction({ distance, transportType, provider }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const predictPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: distance,
          transport_type: transportType,
          service_provider: provider
        })
      });
      const data = await response.json();
      setPrediction(data.predicted_fare);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={predictPrice} disabled={loading}>
        {loading ? 'Predicting...' : 'Predict Price'}
      </button>
      {prediction && <p>Predicted Fare: ₹{prediction.toFixed(2)}</p>}
    </div>
  );
}
```

### Axios Example

```javascript
import axios from 'axios';

// Predict fare
const predictFare = async (distance, transportType, provider) => {
  try {
    const { data } = await axios.post('/api/ml/predict', {
      distance_km: distance,
      transport_type: transportType,
      service_provider: provider
    });
    return data.predicted_fare;
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

// Get best time
const getBestTime = async (distance, transportType, provider) => {
  try {
    const { data } = await axios.post('/api/ml/best-time', {
      distance_km: distance,
      transport_type: transportType,
      service_provider: provider,
      hours_ahead: 24
    });
    return {
      bestTime: data.best_time,
      savings: data.savings,
      waitHours: data.wait_hours,
      predictions: data.all_predictions
    };
  } catch (error) {
    console.error('Best time error:', error);
    throw error;
  }
};
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description",
  "details": "Additional context (optional)",
  "status": 400
}
```

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | "Missing required field: distance_km" | Missing parameter | Include all required fields |
| 400 | "Invalid transport_type" | Wrong value | Use: bike, auto, or cab |
| 400 | "Invalid service_provider" | Wrong value | Use: obeer, radipoo, or yela |
| 400 | "distance_km must be positive" | Invalid distance | Provide distance > 0 |
| 503 | "Model not loaded" | Model not trained | Run training script |
| 503 | "ML service unavailable" | Service down | Start Flask server |

### Frontend Error Handling

```javascript
try {
  const response = await fetch('/api/ml/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    if (response.status === 503) {
      alert('ML service is currently unavailable');
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
    return;
  }

  const data = await response.json();
  // Use prediction data
} catch (error) {
  console.error('Network error:', error);
  alert('Failed to connect to server');
}
```

---

## Rate Limiting

Current implementation: **No rate limiting**

For production:
```python
# Add to app.py
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/predict', methods=['POST'])
@limiter.limit("100 per minute")
def predict():
    # ...
```

---

## Caching Recommendations

**Frontend Cache** (5 minutes):
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedPrediction = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};
```

**Backend Cache** (Redis):
```python
# Add to app.py
import redis
r = redis.Redis()

@app.route('/predict', methods=['POST'])
def predict():
    cache_key = f"{distance}_{type}_{provider}_{hour}"
    cached = r.get(cache_key)
    if cached:
        return jsonify(json.loads(cached))
    # ... make prediction ...
    r.setex(cache_key, 300, json.dumps(result))  # 5 min cache
```

---

## Testing with cURL

```powershell
# Health check
curl http://localhost:5001/health

# Predict
curl -X POST http://localhost:5001/predict `
  -H "Content-Type: application/json" `
  -d '{\"distance_km\": 10, \"transport_type\": \"cab\", \"service_provider\": \"obeer\"}'

# Best time
curl -X POST http://localhost:5001/best-time `
  -H "Content-Type: application/json" `
  -d '{\"distance_km\": 15, \"transport_type\": \"cab\", \"service_provider\": \"obeer\", \"hours_ahead\": 24}'

# Batch predict
curl -X POST http://localhost:5001/batch-predict `
  -H "Content-Type: application/json" `
  -d '{\"distance_km\": 10, \"transport_types\": [\"bike\", \"auto\", \"cab\"], \"service_providers\": [\"obeer\", \"radipoo\", \"yela\"]}'

# Model info
curl http://localhost:5001/model-info
```

---

## Performance

- **Average Response Time**: 50-100ms
- **Batch Predictions**: 150-200ms (9 predictions)
- **Best Time Analysis**: 200-300ms (24-hour forecast)
- **Model Load Time**: 1-2 seconds (at startup)

---

**Version**: 1.0  
**Last Updated**: November 2025
