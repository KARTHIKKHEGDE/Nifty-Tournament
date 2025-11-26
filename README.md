# 🚀 NIFTY Options Trading Platform

A professional paper trading platform for NIFTY options with real-time data integration from Zerodha API, advanced charting, and tournament features.

![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)



docker-compose up -d postgres redis

cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd frontend 
npm run dev




## ✨ Features

### 📊 Options Chain
- **Real-time NIFTY options data** from Zerodha API
- **ATM filtering** - Shows +/- 8 strikes around At-The-Money
- **Interactive table** with Open Interest, Volume, LTP, and Change %
- **Quick actions** - Buy, Sell, and Chart buttons for each option
- **Multiple expiry dates** - Switch between different expiry cycles

### 📈 Advanced Charting
- **Professional KlineChart** with 400 candles
- **Technical Indicators**:
  - Moving Averages (MA): 5, 10, 20, 30
  - Exponential Moving Average (EMA)
  - Bollinger Bands (BOLL)
  - Relative Strength Index (RSI)
  - MACD
  - Volume
- **Exness-style chart window** - Opens in new window with chart + order panel
- **Interactive controls** - Toggle indicators on/off
- **Lazy loading** - Load more historical data on scroll

### 💼 Paper Trading
- **Virtual trading** - Practice without real money
- **Order types**: Market, Limit, Stop-Loss
- **Buy/Sell** with quantity and price controls
- **Order history** tracking
- **Portfolio management**

### 🏆 Tournaments
- **Compete with others** in paper trading competitions
- **Leaderboards** and rankings
- **Prize pools** and rewards
- **Real-time updates**

### 🔐 Authentication
- **Secure login/signup** with JWT tokens
- **User profiles** and settings
- **Session management**

## 🛠️ Tech Stack

### Frontend
- **Next.js 13** - React framework with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **KlineCharts** - Professional charting library
- **Axios** - HTTP client with interceptors
- **Lucide React** - Beautiful icons

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Zerodha Kite Connect** - Market data API

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **PostgreSQL** 12+
- **Zerodha Kite Connect** account (for live data)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nifty-tournament
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Configure `.env`:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nifty_trading

# JWT Secret
SECRET_KEY=your-secret-key-here

# Zerodha API
ZERODHA_API_KEY=your-api-key
ZERODHA_API_SECRET=your-api-secret
ZERODHA_ACCESS_TOKEN=your-access-token
```

**Run migrations:**
```bash
alembic upgrade head
```

**Start backend:**
```bash
uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

**Configure `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Start frontend:**
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📖 Usage Guide

### Getting Started

1. **Sign Up** - Create an account at `http://localhost:3000/auth/signup`
2. **Login** - Access your account at `http://localhost:3000/auth/login`
3. **Dashboard** - View your portfolio and stats

### Trading Options

1. **Navigate to Options** - Click "Options" in the sidebar
2. **Select Expiry** - Choose your desired expiry date
3. **View Options Chain** - See all available strikes with real-time data
4. **Analyze**:
   - Click **Chart button** (📊) to open detailed chart in new window
   - Click **Buy button** (B) to pre-fill buy order
   - Click **Sell button** (S) to pre-fill sell order
5. **Place Order** - Set quantity, price, and submit

### Using the Chart Window

- **70/30 Layout** - Chart on left, order panel on right
- **Toggle Indicators** - Click indicator buttons to show/hide
- **Zoom & Pan** - Mouse wheel to zoom, drag to pan
- **Place Orders** - Use order panel on the right
- **Close** - Click X button to close window

### Joining Tournaments

1. **Navigate to Tournaments** - Click "Tournaments" in sidebar
2. **Browse Active** - See ongoing competitions
3. **Join** - Click "Join Tournament"
4. **Trade** - Make trades to compete
5. **Track Rank** - View leaderboard

## 🔧 Configuration

### Zerodha API Setup

1. **Get API Credentials**:
   - Visit [Kite Connect](https://kite.trade/)
   - Create an app
   - Note your API Key and Secret

2. **Generate Access Token**:
   ```bash
   # Run the auth script
   python backend/scripts/generate_token.py
   ```

3. **Update .env**:
   ```env
   ZERODHA_API_KEY=your_api_key
   ZERODHA_API_SECRET=your_api_secret
   ZERODHA_ACCESS_TOKEN=generated_token
   ```

### Database Configuration

**PostgreSQL Setup:**
```bash
# Create database
createdb nifty_trading

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/nifty_trading
```

## 📁 Project Structure

```
nifty-tournament/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI app
│   ├── alembic/          # Database migrations
│   └── requirements.txt
│
├── frontend/
│   ├── components/       # React components
│   │   ├── charts/       # Chart components
│   │   ├── options/      # Options chain
│   │   ├── trading/      # Order panel
│   │   └── layout/       # Layout components
│   ├── pages/            # Next.js pages
│   │   ├── dashboard/    # Dashboard pages
│   │   └── auth/         # Auth pages
│   ├── services/         # API services
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│
└── README.md
```

## 🎯 Key Features Explained

### ATM Strike Filtering
The platform automatically identifies the At-The-Money (ATM) strike based on the current NIFTY spot price and displays only the most relevant strikes (+/- 8 from ATM).

### Real-time Data
All options data is fetched from Zerodha's Kite Connect API, ensuring accurate and up-to-date information.

### Paper Trading
All trades are simulated - no real money is involved. Perfect for learning and practicing options trading strategies.

### Chart Window
The Exness-style chart window provides a professional trading interface with:
- Full-screen chart view
- Side-by-side order panel
- All technical indicators
- Real-time price updates

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL in .env
```

**Zerodha API Error:**
```bash
# Regenerate access token
python backend/scripts/generate_token.py

# Update ZERODHA_ACCESS_TOKEN in .env
```

### Frontend Issues

**Chart Not Loading:**
- Check browser console for errors
- Verify API is running on port 8000
- Check network tab for failed requests

**Authentication Issues:**
- Clear browser localStorage
- Check JWT token validity
- Verify backend is running

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a **paper trading platform** for educational purposes only. No real money is involved. Always consult with a financial advisor before making real investment decisions.

## 🙏 Acknowledgments

- **Zerodha Kite Connect** - Market data API
- **KlineCharts** - Professional charting library
- **Next.js** - React framework
- **FastAPI** - Python web framework

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API docs at `/docs`

---

**Built with ❤️ for traders who want to learn and practice options trading**

**Happy Trading! 🚀📈**
#   N i f t y - T o u r n a m e n t 
 
 