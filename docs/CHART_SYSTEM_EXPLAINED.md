# 📊 Chart Loading & Real-Time Candle Building System

**Complete Technical Documentation**

---

## 🎯 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Phase 1: Historical Data Loading](#phase-1-historical-data-loading)
5. [Phase 2: Real-Time Updates](#phase-2-real-time-updates)
6. [Candle Building Algorithm](#candle-building-algorithm)
7. [Code Examples](#code-examples)
8. [Performance Optimizations](#performance-optimizations)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

The chart system consists of three main components working together:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Historical     │────▶│  Real-Time       │────▶│  Chart Display  │
│  Data Loader    │     │  Candle Builder  │     │  (KlineChart)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Key Files

| File                                      | Purpose              | Responsibility                           |
| ----------------------------------------- | -------------------- | ---------------------------------------- |
| `hooks/useChartData.ts`                   | **Main Hook**        | State management, WebSocket coordination |
| `utils/candleBuilder.ts`                  | **Candle Builder**   | Tick aggregation into candles            |
| `services/websocket.ts`                   | **WebSocket Client** | Real-time data connection                |
| `components/charts/KlineChart.tsx`        | **Chart Component**  | Visual rendering                         |
| `backend/app/services/zerodha_service.py` | **Data Provider**    | Market data from Zerodha                 |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Dashboard Page (pages/dashboard/index.tsx)                  │   │
│  │  - User clicks symbol in watchlist                           │   │
│  │  - Triggers handleSymbolSelect()                             │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            ↓                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  useChartData Hook (hooks/useChartData.ts)                   │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │ fetchCandles│  │ WebSocket    │  │ CandleBuilder    │  │   │
│  │  │ Function    │  │ Subscription │  │ Management       │  │   │
│  │  └─────────────┘  └──────────────┘  └──────────────────┘  │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            ↓                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  KlineChart Component (components/charts/KlineChart.tsx)     │   │
│  │  - Renders candles using KlineCharts library                 │   │
│  │  - Auto-updates when candles state changes                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  FastAPI Server (app/main.py)                                │   │
│  │  ┌──────────────┐         ┌──────────────────┐            │   │
│  │  │ HTTP API     │         │ WebSocket        │            │   │
│  │  │ /api/candles │         │ /ws              │            │   │
│  │  └──────┬───────┘         └────────┬─────────┘            │   │
│  └─────────┼──────────────────────────┼───────────────────────┘   │
│            ↓                           ↓                             │
│  ┌─────────────────┐         ┌──────────────────┐                  │
│  │ Zerodha Service │         │ WebSocket Manager│                  │
│  │ Historical Data │         │ Live Ticks       │                  │
│  └─────────────────┘         └──────────────────┘                  │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      ZERODHA KITE API                                 │
│  - Historical candlestick data                                        │
│  - Real-time tick data (price, volume, timestamp)                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Request → Response Flow

```
1. USER ACTION
   └─→ Clicks "NIFTY 50" in watchlist

2. FRONTEND (Dashboard)
   └─→ handleSymbolSelect(symbol)
       └─→ Stores symbol in state
       └─→ Calls fetchCandles()

3. FRONTEND (useChartData Hook)
   └─→ fetchCandles(symbol, instrumentToken, timeframe, limit)
       └─→ HTTP GET /api/candles/?symbol=NIFTY&token=256265&timeframe=5minute&limit=200

4. BACKEND (FastAPI)
   └─→ Receives request at /api/candles/
       └─→ Calls zerodha_service.fetch_historical_data()

5. ZERODHA API
   └─→ Returns 200 candles
       └─→ Format: [{timestamp, open, high, low, close, volume}, ...]

6. BACKEND (Response)
   └─→ Formats data for frontend
       └─→ Returns JSON array of candles

7. FRONTEND (useChartData Hook)
   └─→ setCandles(response.data)
       └─→ Initializes CandleBuilder
       └─→ Connects WebSocket
       └─→ Subscribes to symbol

8. FRONTEND (KlineChart)
   └─→ useEffect detects candles state change
       └─→ chartInstance.applyNewData(candles)
       └─→ Chart renders on screen ✅

9. BACKEND (WebSocket)
   └─→ Starts sending ticks every 1 second
       └─→ {symbol, price, volume, timestamp}

10. FRONTEND (WebSocket Handler)
    └─→ Receives tick
        └─→ candleBuilder.processTick(tick)
        └─→ Updates candles array
        └─→ Chart auto-updates 🔄
```

---

## Phase 1: Historical Data Loading

### Step 1: User Initiates Chart Load

**File:** `frontend/pages/dashboard/index.tsx`

```typescript
// User clicks symbol in watchlist sidebar
const handleSymbolSelect = async (symbol: WatchlistSymbol) => {
  console.log("🟣 Symbol selected:", symbol.symbol);

  // Update global state
  setSelectedSymbol(symbol);
  setShowChart(true);
  setActiveTab("CHART");

  // Fetch historical candles
  await handleSymbolChartFetch(symbol, currentTimeframe);
};
```

**What happens:**

- Symbol stored in Zustand store
- Chart view becomes visible
- Historical data fetch triggered

---

### Step 2: Map Timeframe & Fetch Data

**File:** `frontend/pages/dashboard/index.tsx`

```typescript
const handleSymbolChartFetch = async (
  symbol: WatchlistSymbol,
  timeframe: string
) => {
  // Convert frontend format to backend format
  // Example: '5m' → '5minute'
  const backendTimeframe = mapTimeframeToBackend(timeframe);

  // Call the hook's fetch function
  await fetchCandles(
    symbol.symbol, // "NIFTY 50"
    symbol.instrumentToken, // 256265
    backendTimeframe, // "5minute"
    200 // Number of candles
  );
};

// Timeframe mapping
const mapTimeframeToBackend = (timeframe: string): string => {
  const mapping: Record<string, string> = {
    "1m": "minute",
    "3m": "3minute",
    "5m": "5minute",
    "15m": "15minute",
    "30m": "30minute",
    "1h": "60minute",
    "1d": "day",
  };
  return mapping[timeframe] || timeframe;
};
```

---

### Step 3: Hook Manages State & API Call

**File:** `frontend/hooks/useChartData.ts`

```typescript
const fetchCandles = useCallback(
  async (
    symbol: string,
    instrumentToken: number,
    timeframe: string = "5minute",
    limit: number = 200
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 Fetching ${limit} candles for ${symbol}`);

      // HTTP GET request to backend
      const response = await api.get("/api/candles/", {
        params: {
          symbol,
          instrument_token: instrumentToken,
          timeframe,
          limit,
        },
      });

      console.log(`✅ Received ${response.data.length} candles`);

      // Update state with fetched candles
      setCandles(response.data);

      // Store for WebSocket subscription
      currentSymbolRef.current = symbol;
      currentTimeframeRef.current = timeframe;

      // Initialize candle builder for real-time updates
      const timeframeMinutes = getTimeframeMinutes(timeframe);
      candleBuilderRef.current = new CandleBuilder(
        timeframeMinutes,
        onCandleComplete
      );

      return response.data;
    } catch (err: any) {
      setError(err.message);
      console.error("❌ Fetch error:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  },
  []
);
```

**API Request Example:**

```
GET http://localhost:8000/api/candles/
  ?symbol=NIFTY%2050
  &instrument_token=256265
  &timeframe=5minute
  &limit=200
```

---

### Step 4: Backend Fetches from Zerodha

**File:** `backend/app/api/candles.py`

```python
@router.get("/")
async def get_candles(
    symbol: str,
    instrument_token: int,
    timeframe: str = "5minute",
    limit: int = 200
):
    """Fetch historical candle data from Zerodha"""

    # Call Zerodha service
    candles = await zerodha_service.fetch_historical_data(
        instrument_token,
        timeframe,
        limit
    )

    return candles
```

**File:** `backend/app/services/zerodha_service.py`

```python
async def fetch_historical_data(
    instrument_token: int,
    timeframe: str,
    limit: int
) -> List[Dict]:
    """Fetch historical candles from Zerodha Kite API"""

    # Calculate date range
    from_date = datetime.now() - timedelta(days=30)
    to_date = datetime.now()

    # Call Kite API
    candles = kite.historical_data(
        instrument_token,
        from_date,
        to_date,
        timeframe
    )

    # Format for frontend
    formatted_candles = [
        {
            "timestamp": int(candle['date'].timestamp() * 1000),
            "open": candle['open'],
            "high": candle['high'],
            "low": candle['low'],
            "close": candle['close'],
            "volume": candle['volume']
        }
        for candle in candles[-limit:]  # Last N candles
    ]

    return formatted_candles
```

**Response Example:**

```json
[
  {
    "timestamp": 1703145600000,
    "open": 21450.5,
    "high": 21475.3,
    "low": 21440.2,
    "close": 21460.8,
    "volume": 1234567
  },
  {
    "timestamp": 1703145900000,
    "open": 21460.8,
    "high": 21480.5,
    "low": 21455.0,
    "close": 21470.2,
    "volume": 1345678
  }
  // ... 198 more candles
]
```

---

### Step 5: Chart Renders Historical Data

**File:** `frontend/components/charts/KlineChart.tsx`

```typescript
// React effect that watches for data changes
useEffect(() => {
  if (chartInstance.current && data.length > 0 && chartReady) {
    // Format data for KlineCharts library
    const formattedData = data.map((candle) => ({
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume || 0,
    }));

    // Apply all candles at once to chart
    chartInstance.current.applyNewData(formattedData);

    console.log("✅ Chart updated with", formattedData.length, "candles");
  }
}, [data, chartReady]);
```

**Result:**

- User sees complete historical chart
- All 200 candles displayed
- Ready for real-time updates

---

## Phase 2: Real-Time Updates

### Step 6: WebSocket Connection Setup

**File:** `frontend/hooks/useChartData.ts`

```typescript
// useEffect runs after historical data is loaded
useEffect(() => {
  // Only proceed if we have symbol and candle builder
  if (!currentSymbolRef.current || !candleBuilderRef.current) {
    return;
  }

  const symbol = currentSymbolRef.current;
  let unsubscribeFn: (() => void) | null = null;

  console.log("📡 Subscribing to WebSocket for:", symbol);

  try {
    // 1. Connect to WebSocket server
    wsService.connect();

    // 2. Subscribe to specific symbol
    wsService.subscribe(symbol);

    // 3. Listen for tick updates
    unsubscribeFn = wsService.on("tick", (tickData: TickData) => {
      // Handle tick data (see next step)
    });
  } catch (err) {
    console.error("❌ WebSocket error:", err);
  }

  // Cleanup function
  return () => {
    console.log("📡 Cleaning up WebSocket");
    try {
      if (symbol) {
        wsService.unsubscribe(symbol);
      }
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    } catch (err) {
      console.error("❌ Cleanup error:", err);
    }
  };
}, [currentSymbolRef.current, currentTimeframeRef.current]);
```

---

### Step 7: WebSocket Service Manages Connection

**File:** `frontend/services/websocket.ts`

```typescript
class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private subscriptions: Set<string> = new Set();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.ws = new WebSocket("ws://localhost:8000/ws");

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");

      // Re-subscribe to all symbols
      this.subscriptions.forEach((symbol) => {
        this.send({ type: "subscribe", symbol });
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      // Auto-reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    };
  }

  subscribe(symbol: string) {
    this.subscriptions.add(symbol);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", symbol });
    }
  }

  unsubscribe(symbol: string) {
    this.subscriptions.delete(symbol);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe", symbol });
    }
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private handleMessage(message: any) {
    // Emit to all listeners
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message.data));
    }
  }

  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export default new WebSocketService();
```

---

### Step 8: Backend Sends Live Ticks

**File:** `backend/app/websocket/handlers.py`

```python
async def handle_subscribe(websocket: WebSocket, data: dict):
    """Handle symbol subscription request"""
    symbol = data['symbol']

    # Add to active subscriptions
    if symbol not in active_subscriptions:
        active_subscriptions[symbol] = set()

    active_subscriptions[symbol].add(websocket)

    # Send confirmation
    await websocket.send_json({
        "type": "subscribed",
        "symbol": symbol
    })

    # Start sending ticks for this symbol
    asyncio.create_task(send_live_ticks(symbol))

async def send_live_ticks(symbol: str):
    """Send live tick data for a symbol"""
    while True:
        try:
            # Get latest tick from Zerodha
            tick = await zerodha_service.get_live_tick(symbol)

            # Prepare message
            message = {
                "type": "tick",
                "data": {
                    "symbol": symbol,
                    "price": tick['ltp'],
                    "volume": tick['volume'],
                    "timestamp": int(time.time() * 1000)
                }
            }

            # Broadcast to all subscribers
            if symbol in active_subscriptions:
                for websocket in active_subscriptions[symbol]:
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        print(f"Error sending to client: {e}")
                        active_subscriptions[symbol].discard(websocket)

            # Send every 1 second
            await asyncio.sleep(1)

        except Exception as e:
            print(f"Error in send_live_ticks: {e}")
            await asyncio.sleep(5)
```

**Tick Message Example:**

```json
{
  "type": "tick",
  "data": {
    "symbol": "NIFTY 50",
    "price": 21462.35,
    "volume": 150,
    "timestamp": 1703145665000
  }
}
```

---

## Candle Building Algorithm

### How Ticks Become Candles

**File:** `frontend/utils/candleBuilder.ts`

```typescript
export class CandleBuilder {
  private timeframeMinutes: number;
  private currentCandle: CandleData | null = null;
  private onCandleComplete: (candle: CandleData) => void;

  constructor(
    timeframeMinutes: number,
    onCandleComplete: (candle: CandleData) => void
  ) {
    this.timeframeMinutes = timeframeMinutes;
    this.onCandleComplete = onCandleComplete;
  }

  processTick(tick: TickData) {
    // Get the candle timestamp for this tick
    const candleTimestamp = this.getCandleTimestamp(tick.timestamp);

    // Check if we're starting a new candle period
    if (
      !this.currentCandle ||
      this.currentCandle.timestamp !== candleTimestamp
    ) {
      // Complete the previous candle
      if (this.currentCandle) {
        console.log("📊 Candle completed:", this.currentCandle);
        this.onCandleComplete(this.currentCandle);
      }

      // Start a new candle
      this.currentCandle = {
        timestamp: candleTimestamp,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
      };

      console.log("🆕 New candle started:", candleTimestamp);
    } else {
      // Update the existing candle
      this.currentCandle.high = Math.max(this.currentCandle.high, tick.price);
      this.currentCandle.low = Math.min(this.currentCandle.low, tick.price);
      this.currentCandle.close = tick.price;
      this.currentCandle.volume! += tick.volume;
    }
  }

  /**
   * Calculate which candle period a tick belongs to
   * Example: For 5-minute candles, round down to nearest 5
   */
  getCandleTimestamp(tickTimestamp: number): number {
    const date = new Date(tickTimestamp);
    const minutes = date.getMinutes();

    // Round down to nearest timeframe interval
    // Example: 17 minutes / 5 = 3.4 → floor = 3 → 3 * 5 = 15
    const roundedMinutes =
      Math.floor(minutes / this.timeframeMinutes) * this.timeframeMinutes;

    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date.getTime();
  }

  getCurrentCandle(): CandleData | null {
    return this.currentCandle;
  }
}

/**
 * Convert backend timeframe format to minutes
 */
export function getTimeframeMinutes(timeframe: string): number {
  const mapping: Record<string, number> = {
    minute: 1,
    "3minute": 3,
    "5minute": 5,
    "15minute": 15,
    "30minute": 30,
    "60minute": 60,
    day: 1440, // 24 * 60
  };

  return mapping[timeframe] || 5;
}
```

---

### Visual Example: 5-Minute Candle Building

```
TIMEFRAME: 5 minutes
CANDLE PERIOD: 9:15:00 AM - 9:20:00 AM

═══════════════════════════════════════════════════════════════

TIME       TICK PRICE   CANDLE STATE
─────────  ──────────   ────────────────────────────────────────
9:15:00    (start)      Candle timestamp: 9:15:00

9:15:15    21450.00     ┌─ Open:   21450.00  (first price)
                        │  High:   21450.00
                        │  Low:    21450.00
                        └─ Close:  21450.00  (latest price)
                           Volume: 100

9:15:45    21455.50     ┌─ Open:   21450.00  (unchanged)
                        │  High:   21455.50  ← NEW HIGH
                        │  Low:    21450.00
                        └─ Close:  21455.50  ← UPDATED
                           Volume: 250 (+150)

9:16:30    21448.20     ┌─ Open:   21450.00  (unchanged)
                        │  High:   21455.50
                        │  Low:    21448.20  ← NEW LOW
                        └─ Close:  21448.20  ← UPDATED
                           Volume: 400 (+150)

9:17:45    21465.00     ┌─ Open:   21450.00  (unchanged)
                        │  High:   21465.00  ← NEW HIGH
                        │  Low:    21448.20
                        └─ Close:  21465.00  ← UPDATED
                           Volume: 800 (+400)

9:19:58    21460.80     ┌─ Open:   21450.00  (unchanged)
                        │  High:   21465.00
                        │  Low:    21445.50  ← NEW LOW
                        └─ Close:  21460.80  ← UPDATED
                           Volume: 5000 (+4200)

═══════════════════════════════════════════════════════════════

9:20:00    ⏰ TIME'S UP!

           ✅ CANDLE COMPLETED
           ┌─────────────────────────────────┐
           │ Timestamp: 9:15:00              │
           │ Open:      21450.00            │
           │ High:      21465.00            │
           │ Low:       21445.50            │
           │ Close:     21460.80            │
           │ Volume:    5000                │
           └─────────────────────────────────┘

           → Sent to onCandleComplete callback
           → Chart updates with completed candle

═══════════════════════════════════════════════════════════════

9:20:05    21462.50     🆕 NEW CANDLE STARTS
                        Candle timestamp: 9:20:00

                        ┌─ Open:   21462.50  (new start)
                        │  High:   21462.50
                        │  Low:    21462.50
                        └─ Close:  21462.50
                           Volume: 80

... process continues ...
```

---

### Tick Processing Handler

**File:** `frontend/hooks/useChartData.ts`

```typescript
// WebSocket tick handler
unsubscribeFn = wsService.on("tick", (tickData: TickData) => {
  // Only process ticks for our subscribed symbol
  if (tickData.symbol === symbol && candleBuilderRef.current) {
    // 1. Feed tick to candle builder
    candleBuilderRef.current.processTick(tickData);

    // 2. Get the current (in-progress) candle
    const currentCandle = candleBuilderRef.current.getCurrentCandle();

    if (currentCandle) {
      // 3. Update candles array in state
      setCandles((prev) => {
        const lastCandle = prev[prev.length - 1];

        // Check if this is the same candle period
        if (lastCandle && lastCandle.timestamp === currentCandle.timestamp) {
          // SAME PERIOD → Replace last candle
          return [...prev.slice(0, -1), currentCandle];
        } else {
          // NEW PERIOD → Append new candle
          return [...prev, currentCandle];
        }
      });
    }
  }
});
```

**Logic Breakdown:**

```typescript
// Example state before update
candles = [
    { timestamp: 9:00:00, open: 100, ... },
    { timestamp: 9:05:00, open: 105, ... },
    { timestamp: 9:10:00, open: 110, ... },
    { timestamp: 9:15:00, open: 115, high: 120, low: 114, close: 118 }
]

// Tick arrives at 9:17:30 (within 9:15:00-9:20:00 period)
// CandleBuilder updates: close = 119, high = 121

currentCandle = {
    timestamp: 9:15:00,  // Same as last candle
    open: 115,
    high: 121,           // Updated
    low: 114,
    close: 119           // Updated
}

// Update logic: REPLACE last candle
candles = [
    { timestamp: 9:00:00, open: 100, ... },
    { timestamp: 9:05:00, open: 105, ... },
    { timestamp: 9:10:00, open: 110, ... },
    { timestamp: 9:15:00, open: 115, high: 121, low: 114, close: 119 } ← REPLACED
]

// ─────────────────────────────────────────────────────────────

// Tick arrives at 9:20:05 (NEW period starts)
// CandleBuilder starts new candle

currentCandle = {
    timestamp: 9:20:00,  // Different from last candle!
    open: 120,
    high: 120,
    low: 120,
    close: 120
}

// Update logic: APPEND new candle
candles = [
    { timestamp: 9:00:00, open: 100, ... },
    { timestamp: 9:05:00, open: 105, ... },
    { timestamp: 9:10:00, open: 110, ... },
    { timestamp: 9:15:00, open: 115, high: 121, low: 114, close: 119 },
    { timestamp: 9:20:00, open: 120, high: 120, low: 120, close: 120 } ← APPENDED
]
```

---

## Code Examples

### Example 1: Complete Chart Loading Flow

```typescript
// 1. User clicks symbol
handleSymbolSelect({
    symbol: "NIFTY 50",
    instrumentToken: 256265,
    ltp: 21450.50
})

// 2. Fetch historical candles
await fetchCandles("NIFTY 50", 256265, "5minute", 200)

// Backend returns:
[
    { timestamp: 1703145600000, open: 21450, high: 21475, ... },
    { timestamp: 1703145900000, open: 21460, high: 21480, ... },
    // ... 198 more
]

// 3. State updates
setCandles(response.data)  // 200 candles

// 4. Chart renders
chartInstance.applyNewData(candles)

// 5. WebSocket connects
wsService.connect()
wsService.subscribe("NIFTY 50")

// 6. Ticks start arriving every 1 second
{
    symbol: "NIFTY 50",
    price: 21462.35,
    volume: 150,
    timestamp: 1703145665000
}

// 7. CandleBuilder processes tick
candleBuilder.processTick(tick)

// 8. Chart updates automatically
// Last candle in array gets replaced with updated version
```

---

### Example 2: Timeframe Change

```typescript
// User clicks "15m" timeframe button
handleTimeframeChange("15m");

// 1. Update current timeframe
setCurrentTimeframe("15m");

// 2. Map to backend format
const backendTf = mapTimeframeToBackend("15m"); // "15minute"

// 3. Re-fetch candles with new timeframe
await fetchCandles(
  selectedSymbol.symbol,
  selectedSymbol.instrumentToken,
  "15minute", // Changed from "5minute"
  200
);

// 4. Initialize new CandleBuilder
candleBuilderRef.current = new CandleBuilder(
  15, // 15 minutes instead of 5
  onCandleComplete
);

// 5. WebSocket continues sending same 1-second ticks
// But CandleBuilder now aggregates into 15-minute periods instead of 5

// Example:
// Tick at 9:17:30 → Belongs to 9:15:00-9:30:00 candle (15min)
// Tick at 9:30:05 → New candle starts (9:30:00-9:45:00)
```

---

## Performance Optimizations

### 1. Memoization

```typescript
// Use useCallback to prevent unnecessary re-renders
const fetchCandles = useCallback(async (...args) => {
  // ...
}, []);

// Use useMemo for expensive calculations
const formattedCandles = useMemo(() => {
  return candles.map((c) => ({
    timestamp: c.timestamp,
    // ...
  }));
}, [candles]);
```

---

### 2. Ref for Stable References

```typescript
// Using refs prevents re-creating WebSocket subscription
const candleBuilderRef = useRef<CandleBuilder | null>(null);
const currentSymbolRef = useRef<string>("");

// These don't trigger re-renders when updated
currentSymbolRef.current = "NIFTY 50";
```

---

### 3. Debounced State Updates

```typescript
// Optional: Debounce candle updates to avoid excessive re-renders
import { debounce } from "lodash";

const debouncedSetCandles = useMemo(() => debounce(setCandles, 100), []);

// Use in tick handler
debouncedSetCandles(newCandles);
```

---

### 4. Cleanup to Prevent Memory Leaks

```typescript
useEffect(() => {
  // Subscribe to WebSocket
  const unsubscribe = wsService.on("tick", handler);

  // Cleanup function
  return () => {
    wsService.unsubscribe(symbol);
    unsubscribe(); // Remove event listener
  };
}, [symbol]);
```

---

## Troubleshooting

### Problem 1: Chart Not Loading

**Symptoms:**

- Chart shows "Loading..." forever
- No candles displayed

**Solutions:**

```typescript
// 1. Check if API is accessible
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

// 2. Verify instrument token
if (!symbol.instrumentToken) {
  console.error("❌ No instrument token!");
}

// 3. Check network tab in browser
// Look for /api/candles/ request
// Check response status and data

// 4. Verify backend is running
// Visit http://localhost:8000/docs
```

---

### Problem 2: Real-Time Updates Not Working

**Symptoms:**

- Historical chart loads
- But chart doesn't update live

**Solutions:**

```typescript
// 1. Check WebSocket connection
wsService.connect();
console.log("WebSocket state:", wsService.ws?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

// 2. Verify subscription
console.log("Subscribed to:", currentSymbolRef.current);

// 3. Check if ticks are arriving
wsService.on("tick", (tick) => {
  console.log("✅ Tick received:", tick);
});

// 4. Ensure CandleBuilder is initialized
if (!candleBuilderRef.current) {
  console.error("❌ CandleBuilder not initialized!");
}
```

---

### Problem 3: Candles Update Too Slowly

**Symptoms:**

- Chart updates every 5-10 seconds
- Feels laggy

**Possible Causes & Solutions:**

```typescript
// 1. Backend sending ticks too slowly
// Check: backend/app/websocket/handlers.py
await asyncio.sleep(1); // Should be 1 second, not 5 or 10

// 2. Debouncing is too aggressive
// Remove or reduce debounce delay
const debouncedSetCandles = debounce(setCandles, 50); // 50ms instead of 500ms

// 3. React re-renders are slow
// Use React DevTools Profiler to identify slow components
```

---

### Problem 4: Memory Leak / Performance Degradation

**Symptoms:**

- App gets slower over time
- Browser tab uses more and more memory

**Solutions:**

```typescript
// 1. Ensure WebSocket cleanup
useEffect(() => {
  // ...subscribe

  return () => {
    // THIS IS CRITICAL!
    wsService.unsubscribe(symbol);
    unsubscribeFn();
  };
}, [symbol]);

// 2. Limit candles array size
setCandles((prev) => {
  const newCandles = [...prev, newCandle];
  // Keep only last 500 candles
  return newCandles.slice(-500);
});

// 3. Remove old subscriptions
// Before subscribing to new symbol, unsubscribe from old
wsService.unsubscribe(oldSymbol);
wsService.subscribe(newSymbol);
```

---

### Problem 5: Wrong Timeframe Displayed

**Symptoms:**

- User selects "5m" but sees "1m" candles

**Solutions:**

```typescript
// 1. Verify timeframe mapping
console.log("Frontend:", "5m");
console.log("Backend:", mapTimeframeToBackend("5m")); // Should be "5minute"

// 2. Check if CandleBuilder uses correct timeframe
const timeframeMinutes = getTimeframeMinutes(timeframe);
console.log("Timeframe minutes:", timeframeMinutes); // Should be 5

// 3. Verify API request
// Check browser Network tab
// URL should include: ?timeframe=5minute
```

---

## Summary

### Key Concepts

1. **Two-Phase System**

   - Phase 1: Load historical data (batch)
   - Phase 2: Stream real-time ticks (continuous)

2. **Candle Building**

   - Ticks are aggregated into candles based on timeframe
   - Candles are updated in-place until period completes
   - New candle starts when timestamp changes

3. **State Management**

   - `candles` array holds all candle data
   - Chart re-renders when `candles` changes
   - WebSocket connection persists across re-renders

4. **Optimization**
   - Use refs to avoid unnecessary re-renders
   - Memoize expensive calculations
   - Clean up subscriptions on unmount

---

### Data Flow Summary

```
User Action → Fetch Historical → Display Chart → Connect WebSocket
                                                        ↓
                                              Receive Ticks (1/sec)
                                                        ↓
                                              CandleBuilder Aggregates
                                                        ↓
                                              Update Candles Array
                                                        ↓
                                              Chart Auto-Updates
```

---

### Key Files Quick Reference

| File                                      | What It Does            |
| ----------------------------------------- | ----------------------- |
| `hooks/useChartData.ts`                   | Orchestrates everything |
| `utils/candleBuilder.ts`                  | Tick → Candle logic     |
| `services/websocket.ts`                   | WebSocket connection    |
| `components/charts/KlineChart.tsx`        | Visual rendering        |
| `backend/app/api/candles.py`              | HTTP endpoint           |
| `backend/app/websocket/handlers.py`       | WebSocket server        |
| `backend/app/services/zerodha_service.py` | Market data source      |

---

## 🎓 Conclusion

This system provides:

- ✅ Fast initial load (200 candles at once)
- ✅ Smooth real-time updates (1 tick per second)
- ✅ Multiple timeframe support
- ✅ Memory efficient (cleanup on unmount)
- ✅ Professional trading experience

The combination of HTTP for historical data and WebSocket for real-time updates creates a responsive, scalable chart system suitable for live trading! 🚀📊

---

**Need Help?**

- Check console logs for detailed debugging info
- Use browser DevTools Network tab to inspect API calls
- Enable React DevTools to track component re-renders
- Review this documentation for step-by-step troubleshooting

**Happy Trading!** 📈💹
