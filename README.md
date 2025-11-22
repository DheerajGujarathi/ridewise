# 🚗 RideWise - Smart Ride Comparison Platform

RideWise is a comprehensive ride comparison platform that helps users find the best transportation options by comparing prices, routes, and travel times across multiple service providers. Now powered by **Machine Learning** for intelligent fare predictions and booking recommendations!

## ✨ Key Features

### 🗺️ Map & Navigation (Geoapify)
- **Interactive Maps**: Leaflet-based maps with Geoapify tiles
- **Route Visualization**: Display optimal routes with polylines
- **Location Search**: Autocomplete search for addresses
- **Current Location**: Get user's current position
- **Geocoding**: Convert addresses to coordinates and vice versa

### 💰 Fare Comparison
- **Multi-Provider Comparison**: Compare Obeer, Radipoo, and Yela services
- **Multiple Transport Types**: Bike, Auto, and Cab options
- **Real-time Calculations**: Distance-based fare calculation
- **Visual Comparison**: Side-by-side fare cards with color coding

### 🤖 **NEW: AI-Powered Price Predictions**
- **Fare Prediction**: ML model predicts prices based on distance, time, and traffic patterns
- **Best Time to Book**: Get recommendations for optimal booking time with savings calculations
- **Surge Pricing Detection**: Identify rush hours and price fluctuations
- **12-Hour Price Trends**: Visual chart showing fare variations throughout the day
- **Smart Recommendations**: "Book now" or "Wait X hours to save ₹Y" suggestions

### 👤 User Management
- **Authentication**: Secure login/register with JWT tokens
- **User Profiles**: Personal account management
- **Protected Routes**: Secure user-specific features

### 📊 History & Analytics
- **Ride History**: Track all past searches and bookings
- **Export Options**: Download history as CSV or PDF
- **Analytics Dashboard**: View usage patterns and statistics

### 💾 Data Management
- **Favorites**: Save frequently used locations
- **Search History**: Quick access to recent searches
- **MongoDB Integration**: Persistent data storage

### 🎨 User Experience
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive UI**: Clean interface with Tailwind CSS
- **Real-time Updates**: Instant feedback on all actions

## 🏗️ Architecture

### Three-Tier Microservices Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend (React + Leaflet)            │
│              http://localhost:3000              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│        Backend (Node.js + Express)              │
│              http://localhost:5000              │
│                                                  │
│  Routes:                                         │
│  - /api/auth      → Authentication              │
│  - /api/geocode   → Geoapify geocoding          │
│  - /api/directions → Route calculations         │
│  - /api/history   → User ride history           │
│  - /api/ml/*      → ML predictions (proxy)      │
└────────────┬────────────────────┬────────────────┘
             │                    │
             │                    │
   ┌─────────▼────────┐  ┌────────▼──────────────┐
   │    MongoDB       │  │  ML Service (Flask)   │
   │   Database       │  │ http://localhost:5001 │
   │                  │  │                       │
   │  Collections:    │  │  Endpoints:           │
   │  - users         │  │  - /predict           │
   │  - histories     │  │  - /best-time         │
   │  - favorites     │  │  - /batch-predict     │
   └──────────────────┘  │  - /model-info        │
                         │                       │
                         │  Model:               │
                         │  - Random Forest      │
                         │  - scikit-learn       │
                         └───────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14+)
- **Python** (v3.8+)
- **MongoDB** (running instance)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RideWise
```

### 2. Setup Backend (Node.js)

```bash
cd server
npm install

# Create .env file
# Add:
# MONGODB_URI=your_mongodb_connection_string
# GEOAPIFY_API_KEY=your_geoapify_api_key
# JWT_SECRET=your_jwt_secret
# PORT=5000
# ML_SERVICE_URL=http://localhost:5001

npm start
```

### 3. Setup Frontend (React)

```bash
cd client
npm install

# Create .env file
# Add:
# REACT_APP_GEOAPIFY_API_KEY=your_geoapify_api_key

npm start
```

### 4. Setup ML Service (Python) - NEW!

```bash
cd ml-service

# Run automated setup (recommended)
.\setup.ps1

# OR manual setup:
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python utils/data_collector.py
python utils/train_model.py
python app.py
```

**See [ml-service/README.md](ml-service/README.md) for detailed ML setup instructions**

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:5001

## 📁 Project Structure

```
RideWise/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   └── PricePrediction.jsx  # NEW: ML predictions UI
│   │   ├── pages/               # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Compare.jsx      # Main comparison page
│   │   │   ├── History.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/             # React context
│   │   │   └── ThemeContext.jsx
│   │   └── App.js
│   ├── public/
│   └── package.json
│
├── server/                      # Node.js backend
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── geocode.js           # Geoapify geocoding
│   │   ├── directions.js        # Route calculations
│   │   └── history.js           # User history
│   ├── models/
│   │   ├── User.js
│   │   └── History.js
│   ├── config/
│   │   └── database.js
│   ├── constants/
│   │   └── fareRates.js
│   ├── index.js                 # Main server file with ML proxies
│   └── package.json
│
├── ml-service/                  # NEW: Python ML service
│   ├── utils/
│   │   ├── data_collector.py    # Fetch/generate training data
│   │   └── train_model.py       # Model training pipeline
│   ├── models/                  # Trained model files (.pkl)
│   ├── data/                    # Training datasets (.csv)
│   ├── app.py                   # Flask REST API
│   ├── requirements.txt         # Python dependencies
│   ├── setup.ps1                # Automated setup script
│   ├── start.ps1                # Service startup script
│   └── README.md                # ML service documentation
│
└── README.md                    # This file
```

## 🔑 Environment Variables

### Server (.env)
```env
MONGODB_URI=mongodb://localhost:27017/ridewise
GEOAPIFY_API_KEY=your_geoapify_api_key
JWT_SECRET=your_secret_key
PORT=5000
ML_SERVICE_URL=http://localhost:5001
```

### Client (.env)
```env
REACT_APP_GEOAPIFY_API_KEY=your_geoapify_api_key
```

### ML Service (.env)
```env
FLASK_PORT=5001
MONGODB_URI=mongodb://localhost:27017/ridewise
NODE_SERVER_URL=http://localhost:5000
```

## 🤖 ML Model Details

### Features
- **Distance**: Trip distance in kilometers
- **Duration**: Estimated travel time
- **Time Factors**: Hour of day, day of week, weekend flag
- **Traffic**: Rush hour detection (7-9 AM, 5-7 PM)
- **Speed**: Average speed calculation
- **Service Details**: Transport type and provider

### Model Performance
- **Algorithm**: Random Forest Regressor
- **Typical R² Score**: 0.85-0.90
- **Mean Absolute Error**: ₹10-15
- **Training Data**: 1000+ historical rides

### Prediction Types
1. **Single Fare Prediction**: Instant price estimate
2. **Best Time Recommendation**: Analyze 24-hour window
3. **Batch Prediction**: Compare all options at once
4. **Price Trends**: 12-hour visualization with color coding

## 🛠️ Technologies Used

### Frontend
- **React 19.1.0**: UI framework
- **Leaflet 1.9.4**: Map library
- **React-Leaflet 4.2.1**: React bindings for Leaflet
- **Tailwind CSS**: Styling
- **Axios**: HTTP client

### Backend
- **Node.js**: Runtime environment
- **Express 4.21.2**: Web framework
- **MongoDB**: Database
- **Mongoose 8.16.5**: ODM for MongoDB
- **JWT**: Authentication
- **Geoapify API**: Maps and geocoding

### ML Service (NEW)
- **Python 3.8+**: Programming language
- **Flask 3.0.0**: Web framework
- **scikit-learn 1.3.0**: Machine learning
- **pandas 2.0.3**: Data processing
- **numpy 1.24.3**: Numerical computations
- **pymongo 4.5.0**: MongoDB driver

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Geocoding
- `POST /api/geocode/search` - Search locations
- `POST /api/geocode/reverse` - Reverse geocoding

### Directions
- `POST /api/directions/route` - Get route between points

### History
- `POST /api/history` - Save ride history
- `GET /api/history` - Get user history
- `DELETE /api/history/:id` - Delete history entry

### ML Predictions (NEW)
- `GET /api/ml/health` - Service health check
- `POST /api/ml/predict` - Single fare prediction
- `POST /api/ml/best-time` - Best time recommendation
- `POST /api/ml/batch-predict` - Batch predictions
- `GET /api/ml/model-info` - Model metadata

## 🎯 Usage Flow

1. **User Opens Compare Page**
2. **Enters Source & Destination** (with autocomplete)
3. **Selects Transport Type** (Bike/Auto/Cab)
4. **Clicks "Compare Fares"**
5. **Views Results**: Map with route + Fare comparison table
6. **NEW: ML Predictions**:
   - Click **"Predict Price"** → See ML-predicted fare
   - Click **"Best Time"** → Get booking recommendation with:
     - Current fare vs best fare
     - Savings amount
     - Hours to wait
     - 12-hour price trend chart
7. **Saves to History** (if logged in)
8. **Downloads as PDF/CSV** (optional)

## 🔧 Development Scripts

### Backend
```bash
npm start          # Start server (port 5000)
npm run dev        # Development mode with nodemon
```

### Frontend
```bash
npm start          # Start React dev server (port 3000)
npm run build      # Production build
npm test           # Run tests
```

### ML Service
```bash
.\setup.ps1                    # Initial setup (install deps, train model)
.\start.ps1                    # Start ML service
python app.py                  # Start Flask server
python utils/train_model.py   # Retrain model
python utils/data_collector.py # Collect new training data
```

## 🐛 Troubleshooting

### ML Service 503 Error
- Ensure ML service is running on port 5001
- Check `ML_SERVICE_URL` in server/.env
- Verify model is trained: `ml-service/models/fare_prediction_model.pkl` exists

### Map Not Loading
- Verify Geoapify API key in both server/.env and client/.env
- Check browser console for errors
- Ensure Leaflet CSS is loaded

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify database name matches in all services

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `build/` folder
3. Set environment variables

### Backend (Heroku/Railway)
1. Push to Git repository
2. Set environment variables
3. Deploy from main branch

### ML Service (Docker recommended)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY ml-service/ .
RUN pip install -r requirements.txt
RUN python utils/train_model.py
CMD ["python", "app.py"]
```

## 📈 Future Enhancements

- [ ] Real-time ride booking integration
- [ ] Weather-based fare adjustments
- [ ] Traffic API integration
- [ ] Multi-stop route planning
- [ ] Voice input for locations
- [ ] Push notifications for price drops
- [ ] Advanced analytics dashboard
- [ ] Social sharing features
- [ ] Ride scheduling
- [ ] Payment gateway integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Developed with ❤️ for smart transportation

---

**⭐ Star this repo if you find it helpful!**
