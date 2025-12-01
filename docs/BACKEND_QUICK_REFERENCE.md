# 🎯 Backend Quick Reference

## 📁 Folder Cheat Sheet

```
backend/app/
│
├── 📡 api/                    ← API ENDPOINTS (What clients call)
│   ├── auth.py               → /api/auth/* (login, signup)
│   ├── candles.py            → /api/candles/* (market data)
│   ├── paper_trading.py      → /api/paper-trading/* (orders, positions)
│   ├── tournaments.py        → /api/tournaments/* (tournaments)
│   └── admin.py              → /api/admin/* (admin panel)
│
├── 🗄️ models/                 ← DATABASE TABLES
│   ├── user.py               → users table
│   ├── wallet.py             → wallets table
│   ├── paper_order.py        → paper_orders table
│   ├── paper_position.py     → paper_positions table
│   └── tournament.py         → tournaments table
│
├── ✅ schemas/                ← DATA VALIDATION
│   ├── user.py               → Validate user data
│   ├── paper_trading.py      → Validate orders/positions
│   └── tournament.py         → Validate tournament data
│
├── ⚙️ services/               ← BUSINESS LOGIC
│   ├── auth_service.py       → Password hashing, JWT
│   ├── zerodha_service.py    → Fetch market data from Zerodha
│   ├── paper_trading_engine.py → Execute orders, calculate P&L
│   └── tournament_service.py → Rankings, prizes
│
├── 🛠️ utils/                  ← HELPER FUNCTIONS
│   ├── jwt_utils.py          → Create/verify tokens
│   ├── helpers.py            → General utilities
│   └── logger.py             → Logging setup
│
├── 🔌 websocket/              ← REAL-TIME UPDATES
│   ├── manager.py            → Manage connections
│   └── handlers.py           → Handle messages
│
└── 📄 Core Files
    ├── main.py               → App entry point (START HERE!)
    ├── config.py             → Settings
    └── db.py                 → Database connection
```

---

## 🔄 Request Flow Diagram

```
┌─────────────┐
│   CLIENT    │ (Browser/Frontend)
└──────┬──────┘
       │ HTTP Request
       ↓
┌─────────────────────────────────────────┐
│           main.py (FastAPI)             │
│  - Receives all requests                │
│  - Routes to correct endpoint           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│         api/ (Route Handlers)           │
│  - auth.py, candles.py, etc.            │
│  - Validates request                    │
│  - Calls service layer                  │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│       services/ (Business Logic)        │
│  - Complex operations                   │
│  - External API calls                   │
│  - Calculations                         │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│      models/ (Database Models)          │
│  - SQLAlchemy ORM                       │
│  - CRUD operations                      │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
│  - Stores all data                      │
└─────────────────────────────────────────┘
```

---

## 🎯 Common Operations

### **1. User Login**
```
Client → POST /api/auth/login
       ↓
api/auth.py → Receives request
       ↓
services/auth_service.py → Verify password
       ↓
models/user.py → Query database
       ↓
utils/jwt_utils.py → Generate token
       ↓
Response → {"access_token": "..."}
```

### **2. Fetch Chart Data**
```
Client → GET /api/candles/?symbol=NIFTY&limit=200
       ↓
api/candles.py → Validate params
       ↓
services/zerodha_service.py → Call Zerodha API
       ↓
Response → [{timestamp, open, high, low, close}, ...]
```

### **3. Place Order**
```
Client → POST /api/paper-trading/orders
       ↓
api/paper_trading.py → Validate order
       ↓
services/paper_trading_engine.py → Execute order
       ↓
models/paper_order.py → Save to database
models/wallet.py → Update balance
       ↓
Response → {"order_id": 123, "status": "FILLED"}
```

---

## 🗄️ Database Tables Quick View

```
users                    wallets
├── id                   ├── id
├── username             ├── user_id (FK)
├── email                ├── balance
└── hashed_password      └── currency

paper_orders             paper_positions
├── id                   ├── id
├── user_id (FK)         ├── user_id (FK)
├── symbol               ├── symbol
├── side (BUY/SELL)      ├── quantity
├── quantity             ├── average_price
├── price                └── unrealized_pnl
└── status

tournaments              tournament_participants
├── id                   ├── id
├── name                 ├── tournament_id (FK)
├── prize_pool           ├── user_id (FK)
└── status               └── rank
```

---

## 🔐 Authentication

```
1. SIGNUP
   POST /api/auth/signup
   → Password hashed with bcrypt
   → User created in database

2. LOGIN
   POST /api/auth/login
   → Verify password hash
   → Generate JWT token
   → Return token

3. PROTECTED ROUTES
   All requests include:
   Header: Authorization: Bearer <token>
   → Backend verifies token
   → Extracts user_id
   → Allows/denies access
```

---

## 📚 File Purposes (One-Liner)

| File | What It Does |
|------|-------------|
| `main.py` | Starts the FastAPI app, registers all routes |
| `config.py` | Loads environment variables (DB URL, API keys) |
| `db.py` | Creates database connection |
| `api/auth.py` | Handles login, signup, token refresh |
| `api/candles.py` | Fetches market data from Zerodha |
| `api/paper_trading.py` | Handles order placement, positions |
| `api/tournaments.py` | Tournament CRUD operations |
| `models/user.py` | User table definition |
| `models/paper_order.py` | Orders table definition |
| `services/auth_service.py` | Password hashing, JWT generation |
| `services/zerodha_service.py` | Calls Zerodha Kite API |
| `services/paper_trading_engine.py` | Executes orders, calculates P&L |
| `schemas/user.py` | Validates user input data |
| `utils/jwt_utils.py` | Create and verify JWT tokens |
| `websocket/manager.py` | Manages WebSocket connections |

---

## 🚀 Start Learning Here

1. **Read in this order:**
   ```
   1. main.py           (5 min)  - See how app starts
   2. api/auth.py       (10 min) - Simple CRUD example
   3. models/user.py    (5 min)  - Database model
   4. schemas/user.py   (5 min)  - Data validation
   5. services/auth_service.py (10 min) - Business logic
   ```

2. **Then explore:**
   ```
   - api/candles.py → How market data is fetched
   - services/zerodha_service.py → External API integration
   - api/paper_trading.py → Order execution
   ```

3. **Advanced:**
   ```
   - services/paper_trading_engine.py → Complex trading logic
   - websocket/ → Real-time updates
   - services/tournament_service.py → Rankings calculation
   ```

---

## 💡 Key Concepts

**MVC Pattern (Modified)**
- **Models** = Database tables (`models/`)
- **Views** = API endpoints (`api/`)
- **Controllers** = Business logic (`services/`)

**Dependency Injection**
- FastAPI automatically injects dependencies
- Example: `current_user = Depends(get_current_user)`

**ORM (Object-Relational Mapping)**
- Write Python code, not SQL
- SQLAlchemy handles database operations

**Pydantic Schemas**
- Automatic data validation
- Type checking
- Serialization/deserialization

---

## 🎓 Learning Tips

1. **Follow the imports** - Start at `main.py` and follow where it imports from
2. **Read error messages** - FastAPI gives detailed errors
3. **Use the docs** - Visit `http://localhost:8000/docs` for interactive API docs
4. **Test with Postman** - Try calling APIs manually
5. **Check logs** - Look at terminal output when requests come in

---

**Happy Learning! 🚀**
