"""
Flask API for Price Prediction Service
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import sys

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from utils.train_model import FarePredictionModel

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load model at startup
model = FarePredictionModel()
try:
    model.load_model('models')
    print("✅ ML Model loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load model: {e}")
    print("Please run 'python utils/data_collector.py' and 'python utils/train_model.py' first")
    model = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'service': 'ml-price-prediction'
    })

@app.route('/predict', methods=['POST'])
def predict_fare():
    """
    Predict fare for given parameters
    
    Body:
    {
        "distance_km": 10,
        "duration_mins": 30,
        "hour": 18,
        "day_of_week": 2,
        "transport_type": "cab",
        "service_provider": "obeer"
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        data = request.json
        
        # Validate required fields
        required = ['distance_km', 'transport_type', 'service_provider']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get current time if not provided
        from datetime import datetime
        now = datetime.now()
        hour = data.get('hour', now.hour)
        day_of_week = data.get('day_of_week', now.weekday())
        
        # Estimate duration if not provided
        duration_mins = data.get('duration_mins')
        if duration_mins is None:
            # Simple estimation: 3 mins per km
            duration_mins = data['distance_km'] * 3
        
        # Predict
        predicted_fare = model.predict_fare(
            distance_km=data['distance_km'],
            duration_mins=duration_mins,
            hour=hour,
            day_of_week=day_of_week,
            transport_type=data['transport_type'],
            service_provider=data['service_provider']
        )
        
        return jsonify({
            'predicted_fare': round(predicted_fare, 2),
            'distance_km': data['distance_km'],
            'transport_type': data['transport_type'],
            'service_provider': data['service_provider'],
            'hour': hour,
            'day_of_week': day_of_week
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/best-time', methods=['POST'])
def get_best_time():
    """
    Get best time to book recommendation
    
    Body:
    {
        "distance_km": 15,
        "transport_type": "cab",
        "service_provider": "obeer",
        "hours_ahead": 24
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        data = request.json
        
        # Validate
        if 'distance_km' not in data:
            return jsonify({'error': 'Missing distance_km'}), 400
        
        transport_type = data.get('transport_type', 'cab')
        service_provider = data.get('service_provider', 'obeer')
        hours_ahead = data.get('hours_ahead', 24)
        
        # Get recommendation
        recommendation = model.predict_best_time(
            distance_km=data['distance_km'],
            transport_type=transport_type,
            service_provider=service_provider,
            hours_ahead=hours_ahead
        )
        
        if recommendation is None:
            return jsonify({'error': 'Could not generate recommendation'}), 500
        
        return jsonify(recommendation)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Predict fares for multiple scenarios
    
    Body:
    {
        "distance_km": 10,
        "transport_types": ["bike", "auto", "cab"],
        "service_providers": ["obeer", "radipoo", "yela"]
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        data = request.json
        distance_km = data.get('distance_km')
        
        if not distance_km:
            return jsonify({'error': 'Missing distance_km'}), 400
        
        transport_types = data.get('transport_types', ['bike', 'auto', 'cab'])
        service_providers = data.get('service_providers', ['obeer', 'radipoo', 'yela'])
        
        from datetime import datetime
        now = datetime.now()
        hour = data.get('hour', now.hour)
        day_of_week = data.get('day_of_week', now.weekday())
        duration_mins = data.get('duration_mins', distance_km * 3)
        
        predictions = []
        
        for transport in transport_types:
            for provider in service_providers:
                try:
                    fare = model.predict_fare(
                        distance_km=distance_km,
                        duration_mins=duration_mins,
                        hour=hour,
                        day_of_week=day_of_week,
                        transport_type=transport,
                        service_provider=provider
                    )
                    
                    predictions.append({
                        'transport_type': transport,
                        'service_provider': provider,
                        'predicted_fare': round(fare, 2)
                    })
                except Exception as e:
                    print(f"Error predicting {transport}/{provider}: {e}")
                    continue
        
        return jsonify({
            'distance_km': distance_km,
            'predictions': predictions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model metadata and performance metrics"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        return jsonify({
            'model_loaded': True,
            'metadata': model.model_metadata,
            'features': model.feature_columns
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    print(f"🚀 Starting ML Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
