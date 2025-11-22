"""
Data Collector - Fetch historical ride data from MongoDB
"""
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
import json

load_dotenv()

class DataCollector:
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.client['test']  # Default DB name from your connection string
        self.history_collection = self.db['histories']
        
    def fetch_historical_data(self, days=90):
        """Fetch historical ride data from last N days"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Fetch all history records
            cursor = self.history_collection.find({
                'createdAt': {'$gte': cutoff_date}
            })
            
            data = []
            for record in cursor:
                # Extract distance value (e.g., "5.2 km" -> 5.2)
                distance_str = record.get('distance', '0 km')
                distance = float(distance_str.split()[0]) if distance_str else 0
                
                # Extract duration in minutes
                duration_str = record.get('duration', '0 mins')
                duration_parts = duration_str.split()
                duration_mins = 0
                
                # Handle "1 hour 20 mins" or "45 mins"
                if 'hour' in duration_str:
                    hours = int(duration_parts[0]) if duration_parts[0].isdigit() else 0
                    mins_idx = duration_parts.index('hour') + 1
                    mins = int(duration_parts[mins_idx]) if len(duration_parts) > mins_idx and duration_parts[mins_idx].isdigit() else 0
                    duration_mins = hours * 60 + mins
                else:
                    duration_mins = int(duration_parts[0]) if duration_parts[0].isdigit() else 0
                
                data.append({
                    'distance_km': distance,
                    'duration_mins': duration_mins,
                    'timestamp': record.get('createdAt', datetime.now()),
                    'source': record.get('source', ''),
                    'destination': record.get('destination', ''),
                    'user_id': str(record.get('userId', ''))
                })
            
            df = pd.DataFrame(data)
            
            if len(df) > 0:
                # Add time-based features
                df['hour'] = df['timestamp'].dt.hour
                df['day_of_week'] = df['timestamp'].dt.dayofweek  # 0=Monday, 6=Sunday
                df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
                df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 17, 18, 19]).astype(int)
                
                # Calculate average speed (km/h)
                df['avg_speed'] = (df['distance_km'] / (df['duration_mins'] / 60)).fillna(0)
                
            return df
            
        except Exception as e:
            print(f"Error fetching data: {e}")
            return pd.DataFrame()
    
    def generate_synthetic_data(self, n_samples=1000):
        """Generate synthetic training data for initial model training"""
        import numpy as np
        from datetime import datetime, timedelta
        
        np.random.seed(42)
        
        # Base fare rates from your fareRates.js
        base_rates = {
            'bike': {'base': 10, 'per_km': 5},
            'auto': {'base': 20, 'per_km': 10},
            'cab': {'base': 30, 'per_km': 15}
        }
        
        data = []
        start_date = datetime.now() - timedelta(days=90)
        
        for _ in range(n_samples):
            # Random distance between 1-30 km
            distance = np.random.uniform(1, 30)
            
            # Random timestamp
            random_days = np.random.randint(0, 90)
            random_hours = np.random.randint(0, 24)
            timestamp = start_date + timedelta(days=random_days, hours=random_hours)
            
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            is_weekend = 1 if day_of_week in [5, 6] else 0
            is_rush_hour = 1 if hour in [7, 8, 9, 17, 18, 19] else 0
            
            # Calculate duration based on distance and traffic
            base_duration = distance * 3  # 3 mins per km base
            traffic_multiplier = 1.5 if is_rush_hour else 1.0
            weekend_multiplier = 0.9 if is_weekend else 1.0
            duration_mins = base_duration * traffic_multiplier * weekend_multiplier
            
            # Add some randomness
            duration_mins += np.random.normal(0, 5)
            duration_mins = max(5, duration_mins)  # Minimum 5 mins
            
            avg_speed = (distance / (duration_mins / 60))
            
            # Calculate fares with surge pricing
            surge_multiplier = 1.0
            if is_rush_hour:
                surge_multiplier = np.random.uniform(1.2, 2.0)
            if is_weekend:
                surge_multiplier *= 0.9  # Weekend discount
            
            for transport_type, rates in base_rates.items():
                fare = (rates['base'] + (distance * rates['per_km'])) * surge_multiplier
                fare += np.random.normal(0, 10)  # Add noise
                fare = max(rates['base'], fare)  # Minimum fare
                
                data.append({
                    'distance_km': round(distance, 2),
                    'duration_mins': round(duration_mins, 1),
                    'hour': hour,
                    'day_of_week': day_of_week,
                    'is_weekend': is_weekend,
                    'is_rush_hour': is_rush_hour,
                    'avg_speed': round(avg_speed, 2),
                    'transport_type': transport_type,
                    'service_provider': np.random.choice(['obeer', 'radipoo', 'yela']),
                    'fare': round(fare, 2),
                    'surge_multiplier': round(surge_multiplier, 2),
                    'timestamp': timestamp
                })
        
        df = pd.DataFrame(data)
        return df
    
    def save_data(self, df, filename='training_data.csv'):
        """Save data to CSV"""
        filepath = os.path.join('data', filename)
        df.to_csv(filepath, index=False)
        print(f"Data saved to {filepath}")
        print(f"Total records: {len(df)}")
        return filepath
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

if __name__ == '__main__':
    collector = DataCollector()
    
    # Try to fetch real data
    print("Fetching historical data from MongoDB...")
    df_real = collector.fetch_historical_data(days=90)
    
    if len(df_real) > 10:
        print(f"Found {len(df_real)} real records")
        collector.save_data(df_real, 'historical_data.csv')
    else:
        print("Not enough real data, generating synthetic data...")
        df_synthetic = collector.generate_synthetic_data(n_samples=2000)
        collector.save_data(df_synthetic, 'training_data.csv')
    
    collector.close()
    print("Data collection complete!")
