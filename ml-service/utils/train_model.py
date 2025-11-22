"""
Price Prediction Model - Train ML model on historical fare data
"""
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
from datetime import datetime

class FarePredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.model_metadata = {}
        
    def prepare_features(self, df):
        """Prepare features for training"""
        df = df.copy()
        
        # Encode categorical variables
        categorical_cols = ['transport_type', 'service_provider']
        for col in categorical_cols:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df[col + '_encoded'] = self.label_encoders[col].fit_transform(df[col])
                else:
                    df[col + '_encoded'] = self.label_encoders[col].transform(df[col])
        
        # Feature engineering
        if 'timestamp' in df.columns:
            df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
            df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 17, 18, 19]).astype(int)
        
        # Select features
        feature_cols = [
            'distance_km', 'duration_mins', 'hour', 'day_of_week',
            'is_weekend', 'is_rush_hour', 'avg_speed',
            'transport_type_encoded', 'service_provider_encoded'
        ]
        
        # Filter only existing columns
        feature_cols = [col for col in feature_cols if col in df.columns]
        self.feature_columns = feature_cols
        
        X = df[feature_cols]
        y = df['fare'] if 'fare' in df.columns else None
        
        return X, y, df
    
    def train(self, data_path='data/training_data.csv', test_size=0.2):
        """Train the model"""
        print("Loading data...")
        df = pd.read_csv(data_path)
        print(f"Loaded {len(df)} records")
        
        # Prepare features
        X, y, df_processed = self.prepare_features(df)
        
        if y is None:
            raise ValueError("No 'fare' column found in data")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        print("Training Random Forest model...")
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        print(f"\nModel Performance:")
        print(f"MAE: ₹{mae:.2f}")
        print(f"RMSE: ₹{rmse:.2f}")
        print(f"R² Score: {r2:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\nTop Features:")
        print(feature_importance.head(5))
        
        # Store metadata
        self.model_metadata = {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_importance': feature_importance.to_dict('records'),
            'trained_at': datetime.now().isoformat()
        }
        
        return self.model_metadata
    
    def predict_fare(self, distance_km, duration_mins, hour, day_of_week,
                     transport_type, service_provider, avg_speed=None):
        """Predict fare for given conditions"""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Calculate average speed if not provided
        if avg_speed is None and duration_mins > 0:
            avg_speed = distance_km / (duration_mins / 60)
        else:
            avg_speed = 20  # Default speed
        
        # Create feature dict
        is_weekend = 1 if day_of_week in [5, 6] else 0
        is_rush_hour = 1 if hour in [7, 8, 9, 17, 18, 19] else 0
        
        # Encode categorical variables
        transport_encoded = self.label_encoders['transport_type'].transform([transport_type])[0]
        service_encoded = self.label_encoders['service_provider'].transform([service_provider])[0]
        
        # Create feature array
        features = {
            'distance_km': distance_km,
            'duration_mins': duration_mins,
            'hour': hour,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'is_rush_hour': is_rush_hour,
            'avg_speed': avg_speed,
            'transport_type_encoded': transport_encoded,
            'service_provider_encoded': service_encoded
        }
        
        X = pd.DataFrame([features])[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        
        prediction = self.model.predict(X_scaled)[0]
        return max(0, prediction)  # Ensure non-negative
    
    def predict_best_time(self, distance_km, transport_type='cab', 
                         service_provider='obeer', hours_ahead=24):
        """Predict best time to book in next N hours"""
        predictions = []
        current_time = datetime.now()
        
        for hour_offset in range(hours_ahead):
            future_time = current_time + pd.Timedelta(hours=hour_offset)
            hour = future_time.hour
            day_of_week = future_time.weekday()  # Fixed: use weekday() instead of dayofweek
            
            # Estimate duration (simple heuristic)
            base_duration = distance_km * 3  # 3 mins per km
            if hour in [7, 8, 9, 17, 18, 19]:  # Rush hour
                duration = base_duration * 1.5
            else:
                duration = base_duration
            
            try:
                fare = self.predict_fare(
                    distance_km=distance_km,
                    duration_mins=duration,
                    hour=hour,
                    day_of_week=day_of_week,
                    transport_type=transport_type,
                    service_provider=service_provider
                )
                
                predictions.append({
                    'hour': hour,
                    'datetime': future_time.isoformat(),
                    'fare': round(fare, 2),
                    'is_rush_hour': hour in [7, 8, 9, 17, 18, 19]
                })
            except Exception as e:
                print(f"Error predicting for hour {hour}: {e}")
                continue
        
        if not predictions:
            return None
        
        # Find best time (lowest fare)
        predictions_df = pd.DataFrame(predictions)
        best_time = predictions_df.loc[predictions_df['fare'].idxmin()]
        current_fare = predictions[0]['fare'] if predictions else None
        
        savings = current_fare - best_time['fare'] if current_fare else 0
        
        return {
            'current_fare': round(current_fare, 2) if current_fare else None,
            'best_time': best_time['datetime'],
            'best_fare': round(best_time['fare'], 2),
            'savings': round(max(0, savings), 2),
            'wait_hours': predictions_df.loc[predictions_df['fare'].idxmin()].name,
            'all_predictions': predictions[:12]  # Return next 12 hours
        }
    
    def save_model(self, model_dir='models'):
        """Save trained model and scalers"""
        os.makedirs(model_dir, exist_ok=True)
        
        model_path = os.path.join(model_dir, 'fare_prediction_model.pkl')
        scaler_path = os.path.join(model_dir, 'scaler.pkl')
        encoders_path = os.path.join(model_dir, 'label_encoders.pkl')
        metadata_path = os.path.join(model_dir, 'model_metadata.pkl')
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.label_encoders, encoders_path)
        joblib.dump({
            'feature_columns': self.feature_columns,
            'metadata': self.model_metadata
        }, metadata_path)
        
        print(f"Model saved to {model_dir}")
    
    def load_model(self, model_dir='models'):
        """Load trained model"""
        model_path = os.path.join(model_dir, 'fare_prediction_model.pkl')
        scaler_path = os.path.join(model_dir, 'scaler.pkl')
        encoders_path = os.path.join(model_dir, 'label_encoders.pkl')
        metadata_path = os.path.join(model_dir, 'model_metadata.pkl')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.label_encoders = joblib.load(encoders_path)
        
        metadata = joblib.load(metadata_path)
        self.feature_columns = metadata['feature_columns']
        self.model_metadata = metadata['metadata']
        
        print("Model loaded successfully")

if __name__ == '__main__':
    # Train model
    model = FarePredictionModel()
    
    # Check if data exists
    data_path = 'data/training_data.csv'
    if not os.path.exists(data_path):
        print("Training data not found. Run data_collector.py first!")
        exit(1)
    
    # Train
    print("Starting model training...")
    metrics = model.train(data_path)
    
    # Save model
    model.save_model()
    
    # Test prediction
    print("\n--- Test Predictions ---")
    test_fare = model.predict_fare(
        distance_km=10,
        duration_mins=30,
        hour=18,
        day_of_week=2,
        transport_type='cab',
        service_provider='obeer'
    )
    print(f"Predicted fare for 10km cab ride at 6 PM: ₹{test_fare:.2f}")
    
    # Test best time recommendation
    print("\n--- Best Time Recommendation ---")
    best_time = model.predict_best_time(distance_km=15, transport_type='cab')
    if best_time:
        print(f"Current fare: ₹{best_time['current_fare']}")
        print(f"Best time: {best_time['best_time']}")
        print(f"Best fare: ₹{best_time['best_fare']}")
        print(f"Potential savings: ₹{best_time['savings']}")
