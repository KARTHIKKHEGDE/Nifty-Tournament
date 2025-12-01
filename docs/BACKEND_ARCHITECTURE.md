# 🏗️ Backend Architecture Guide

**Framework:** FastAPI (Python)  
**Database:** PostgreSQL  
**ORM:** SQLAlchemy  
**Authentication:** JWT (JSON Web Tokens)  
**Real-time:** WebSockets

---

## 📁 **Project Structure Overview**

```
backend/
├── app/                    # Main application code
│   ├── api/               # API route handlers (endpoints)
│   ├── models/            # Database models (tables)
│   ├── schemas/           # Pydantic schemas (validation)
│   ├── services/          # Business logic layer
│   ├── utils/             # Helper functions
│   ├── websocket/         # WebSocket handlers
│   ├── config.py          # Configuration settings
│   ├── db.py              # Database connection
│   └── main.py            # Application entry point
├── alembic/               # Database migrations
├── scripts/               # Utility scripts
├── .env                   # Environment variables
├── requirements.txt       # Python dependencies
└── venv/                  # Virtual environment
```

---

## 🎯 **Core Concepts**

### **Request Flow**
```
Client Request
    ↓
main.py (FastAPI app)
    ↓
api/ (Route handlers)
    ↓
services/ (Business logic)
    ↓
models/ (Database operations)
    ↓
Database (PostgreSQL)
```

---

## 📂 **Detailed Folder Structure**

### **1. `/app` - Main Application**

The heart of your backend application.

---

### **2. `/app/api` - API Endpoints (Route Handlers)**

**Purpose:** Define HTTP endpoints that clients can call

**Files:**

| File | Purpose | Routes | Description |
|------|---------|--------|-------------|
| `auth.py` | Authentication | `/api/auth/*` | User login, signup, token refresh |
| `candles.py` | Market Data | `/api/candles/*` | Fetch candlestick data, options chain |
| `paper_trading.py` | Trading | `/api/paper-trading/*` | Place orders, view positions |
| `tournaments.py` | Tournaments | `/api/tournaments/*` | Create, join, view tournaments |
| `admin.py` | Admin Panel | `/api/admin/*` | Admin-only operations |
| `dependencies.py` | Shared Logic | N/A | Authentication dependencies |

#### **Example: How Routes Work**

**File:** `api/auth.py`
```python
@router.post("/login")
async def login(credentials: LoginRequest):
    # 1. Validate credentials
    # 2. Generate JWT token
    # 3. Return token to client
    return {"access_token": token}
```

**Client calls:** `POST http://localhost:8000/api/auth/login`

---

### **3. `/app/models` - Database Models**

**Purpose:** Define database tables using SQLAlchemy ORM

**Files:**

| File | Table Name | Purpose |
|------|-----------|---------|
| `user.py` | `users` | Store user accounts |
| `wallet.py` | `wallets` | Track virtual money |
| `paper_order.py` | `paper_orders` | Trading orders |
| `paper_position.py` | `paper_positions` | Open positions |
| `tournament.py` | `tournaments` | Tournament details |
| `tournament_participant.py` | `tournament_participants` | Who joined which tournament |
| `tournament_ranking.py` | `tournament_rankings` | Leaderboard rankings |
| `prize_distribution.py` | `prize_distributions` | Prize payouts |
| `user_settings.py` | `user_settings` | User preferences |

#### **Example: User Model**

**File:** `models/user.py`
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Creates table:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    hashed_password VARCHAR,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **4. `/app/schemas` - Data Validation**

**Purpose:** Define request/response formats using Pydantic

**Files:**

| File | Purpose | Used For |
|------|---------|----------|
| `user.py` | User data validation | Login, signup, profile |
| `paper_trading.py` | Trading data validation | Orders, positions |
| `tournament.py` | Tournament data validation | Create, join tournaments |
| `user_settings.py` | Settings validation | User preferences |

#### **Why Schemas?**

**Without Schema:**
```python
# Client sends: {"username": 123, "email": "invalid"}
# ❌ No validation, crashes later
```

**With Schema:**
```python
class UserCreate(BaseModel):
    username: str  # Must be string
    email: EmailStr  # Must be valid email
    password: str  # Must be string

# ✅ FastAPI validates automatically
# ✅ Returns error if invalid
```

---

### **5. `/app/services` - Business Logic**

**Purpose:** Complex operations, external API calls, business rules

**Files:**

| File | Purpose | Key Functions |
|------|---------|---------------|
| `auth_service.py` | Authentication logic | Hash passwords, verify tokens |
| `zerodha_service.py` | Zerodha API integration | Fetch market data, instruments |
| `paper_trading_engine.py` | Trading engine | Execute orders, calculate P&L |
| `tournament_service.py` | Tournament management | Rankings, prize distribution |

#### **Example: Why Separate Services?**

**Bad (Everything in route):**
```python
@router.post("/order")
async def place_order(order: OrderCreate):
    # ❌ 100 lines of logic here
    # ❌ Hard to test
    # ❌ Can't reuse
```

**Good (Using service):**
```python
@router.post("/order")
async def place_order(order: OrderCreate):
    # ✅ Clean and simple
    return await trading_engine.execute_order(order)
```

---

### **6. `/app/utils` - Helper Functions**

**Purpose:** Reusable utility functions

**Files:**

| File | Purpose | Functions |
|------|---------|-----------|
| `jwt_utils.py` | JWT token operations | Create token, verify token |
| `helpers.py` | General helpers | Date formatting, calculations |
| `logger.py` | Logging setup | Configure logging |

---

### **7. `/app/websocket` - Real-time Communication**

**Purpose:** Push live updates to clients

**Files:**

| File | Purpose |
|------|---------|
| `manager.py` | Manage WebSocket connections |
| `handlers.py` | Handle WebSocket messages |

#### **How WebSockets Work**

```
Client connects → manager.py stores connection
Market data updates → handlers.py processes
manager.py broadcasts → All connected clients receive update
```

---

### **8. Root Files**

| File | Purpose |
|------|---------|
| `main.py` | Application entry point, route registration |
| `config.py` | Configuration (database URL, secrets) |
| `db.py` | Database connection setup |
| `.env` | Environment variables (secrets) |
| `requirements.txt` | Python package dependencies |
| `alembic.ini` | Database migration config |

---

## 🔄 **How Everything Connects**

### **Example: User Login Flow**

```
1. CLIENT REQUEST
   POST /api/auth/login
   Body: {"username": "john", "password": "secret123"}
   
2. MAIN.PY
   Routes request to auth.py
   
3. API/AUTH.PY
   @router.post("/login")
   - Receives request
   - Validates using schema (schemas/user.py)
   - Calls service
   
4. SERVICES/AUTH_SERVICE.PY
   - Queries database (models/user.py)
   - Verifies password hash
   - Generates JWT token (utils/jwt_utils.py)
   
5. RESPONSE
   Returns: {"access_token": "eyJ..."}
   
6. CLIENT
   Stores token, uses for future requests
```

---

### **Example: Fetch Candle Data Flow**

```
1. CLIENT REQUEST
   GET /api/candles/?symbol=NIFTY&timeframe=5minute&limit=200
   
2. MAIN.PY
   Routes to candles.py
   
3. API/CANDLES.PY
   @router.get("/")
   - Validates parameters
   - Checks authentication (dependencies.py)
   - Calls Zerodha service
   
4. SERVICES/ZERODHA_SERVICE.PY
   - Calls Zerodha Kite API
   - Fetches historical data
   - Formats response
   
5. RESPONSE
   Returns: [
     {timestamp: 123, open: 100, high: 105, ...},
     ...
   ]
   
6. CLIENT
   Displays chart using data
```

---

### **Example: Place Order Flow**

```
1. CLIENT REQUEST
   POST /api/paper-trading/orders
   Body: {
     "symbol": "NIFTY 50",
     "side": "BUY",
     "quantity": 50,
     "price": 19500
   }
   
2. API/PAPER_TRADING.PY
   - Validates order (schemas/paper_trading.py)
   - Checks user authentication
   - Calls trading engine
   
3. SERVICES/PAPER_TRADING_ENGINE.PY
   - Checks wallet balance
   - Creates order (models/paper_order.py)
   - Updates position (models/paper_position.py)
   - Updates wallet (models/wallet.py)
   - Saves to database
   
4. DATABASE
   Inserts into:
   - paper_orders table
   - paper_positions table
   - Updates wallets table
   
5. WEBSOCKET (Optional)
   Broadcasts order update to connected clients
   
6. RESPONSE
   Returns: {
     "order_id": 123,
     "status": "FILLED",
     "message": "Order placed successfully"
   }
```

---

## 🗄️ **Database Tables**

### **Core Tables**

```sql
users
├── id (PK)
├── username
├── email
├── hashed_password
└── is_admin

wallets
├── id (PK)
├── user_id (FK → users)
├── balance
└── currency

paper_orders
├── id (PK)
├── user_id (FK → users)
├── symbol
├── side (BUY/SELL)
├── quantity
├── price
├── status
└── created_at

paper_positions
├── id (PK)
├── user_id (FK → users)
├── symbol
├── quantity
├── average_price
└── unrealized_pnl

tournaments
├── id (PK)
├── name
├── start_date
├── end_date
├── prize_pool
└── status

tournament_participants
├── id (PK)
├── tournament_id (FK → tournaments)
├── user_id (FK → users)
└── joined_at

tournament_rankings
├── id (PK)
├── tournament_id (FK → tournaments)
├── user_id (FK → users)
├── rank
└── pnl
```

---

## 🔐 **Authentication Flow**

### **How JWT Works**

```
1. USER SIGNS UP
   - Password is hashed (bcrypt)
   - Stored in database
   
2. USER LOGS IN
   - Provides username + password
   - Backend verifies hash
   - Generates JWT token
   
3. JWT TOKEN CONTAINS
   {
     "sub": "user_id",
     "exp": "expiration_time",
     "is_admin": false
   }
   
4. FUTURE REQUESTS
   Client sends: Authorization: Bearer <token>
   Backend verifies token
   Extracts user_id
   Allows/denies access
```

---

## 🚀 **API Endpoints Summary**

### **Authentication (`/api/auth`)**
- `POST /signup` - Create new account
- `POST /login` - Get access token
- `POST /refresh` - Refresh token
- `GET /me` - Get current user info

### **Market Data (`/api/candles`)**
- `GET /` - Get candlestick data
- `GET /instruments` - Get available instruments
- `GET /options-chain/{symbol}` - Get options chain

### **Paper Trading (`/api/paper-trading`)**
- `POST /orders` - Place order
- `GET /orders` - Get order history
- `GET /positions` - Get open positions
- `DELETE /positions/{id}` - Close position
- `GET /wallet` - Get wallet balance

### **Tournaments (`/api/tournaments`)**
- `GET /` - List tournaments
- `POST /` - Create tournament (admin)
- `POST /{id}/join` - Join tournament
- `GET /{id}/rankings` - Get leaderboard

### **Admin (`/api/admin`)**
- `GET /users` - List all users
- `PUT /users/{id}` - Update user
- `GET /stats` - System statistics

---

## 🔧 **Configuration (`config.py`)**

**Environment Variables:**
```python
DATABASE_URL = "postgresql://user:pass@localhost/db"
SECRET_KEY = "your-secret-key"
ZERODHA_API_KEY = "your-api-key"
ZERODHA_ACCESS_TOKEN = "your-access-token"
```

**Loaded from `.env` file**

---

## 📊 **Database Migrations (Alembic)**

**Purpose:** Version control for database schema

```bash
# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🎓 **Learning Path**

### **1. Start Here**
1. Read `main.py` - Understand app initialization
2. Look at `api/auth.py` - Simple CRUD operations
3. Check `models/user.py` - See database models

### **2. Then Move To**
4. `services/auth_service.py` - Business logic
5. `schemas/user.py` - Data validation
6. `utils/jwt_utils.py` - Helper functions

### **3. Advanced**
7. `services/zerodha_service.py` - External API integration
8. `services/paper_trading_engine.py` - Complex logic
9. `websocket/` - Real-time features

---

## 💡 **Key Takeaways**

1. **Separation of Concerns**
   - `api/` = Handle HTTP requests
   - `services/` = Business logic
   - `models/` = Database operations
   - `schemas/` = Data validation

2. **Request Flow**
   - Client → API → Service → Model → Database
   - Response flows back in reverse

3. **Authentication**
   - JWT tokens for stateless auth
   - Passwords are hashed, never stored plain

4. **Database**
   - SQLAlchemy ORM (no raw SQL needed)
   - Alembic for migrations

---

## 📚 **Next Steps**

1. **Read the code in this order:**
   - `main.py`
   - `api/auth.py`
   - `models/user.py`
   - `services/auth_service.py`

2. **Try making a change:**
   - Add a new field to User model
   - Create migration
   - Update schema
   - Test API

3. **Explore:**
   - How orders are executed
   - How tournaments calculate rankings
   - How WebSockets broadcast updates

---

**Ready to dive deeper? Start with `main.py` and follow the imports!** 🚀
