# Live Market Updates & Real-Time Price System

## Overview

This document explains how the real-time market data updates work in the Nifty Tournament application, from receiving ticks from Zerodha to updating prices across all UI components.

## Architecture Flow

```
Zerodha Kite Connect API
         ↓
   KiteTicker (WebSocket)
         ↓
   ticker_service.py
         ↓
   tick_callback (main.py)
         ↓
   broadcast_tick_data (handlers.py)
         ↓
   WebSocket Manager (manager.py)
         ↓
   Frontend WebSocket Service (websocket.ts)
         ↓
   UI Components (OptionsChain, PositionsTable, WatchlistSidebar, etc.)
```

## Backend Implementation

### 1. KiteTicker Service (`backend/app/services/ticker_service.py`)

**Purpose**: Manages connection to Zerodha's WebSocket for live market data.

**Key Features**:

- **Lazy-start pattern**: Only connects when first subscription arrives
- **Token-to-symbol mapping**: Converts instrument tokens to readable symbols
- **Auto-reconnection**: Reconnects automatically on disconnection

**Critical Code Sections**:

```python
# Lines 47-63: on_connect callback
def on_connect(ws, response):
    """Called when KiteTicker successfully connects"""
    # CRITICAL: Zerodha requires at least one instrument subscribed immediately
    # If subscribed_tokens is empty, connection will be closed with error 1006
    if len(self.subscribed_tokens) > 0:
        ws.subscribe(list(self.subscribed_tokens))
        ws.set_mode(ws.MODE_FULL, list(self.subscribed_tokens))
```

**Logging Strategy**:

- ✅ Connection events (connect, disconnect, errors)
- ✅ Subscription changes
- ❌ NO per-tick logging (would block event loop)

```python
# Lines 64-107: on_ticks callback
def on_ticks(ws, ticks):
    """Process incoming ticks - NO logging per tick"""
    for tick in ticks:
        # Extract data
        tick_data = {
            'symbol': symbol,
            'instrument_token': instrument_token,
            'last_price': tick.get('last_price', 0),
            'volume': tick.get('volume', 0),
            # ... other OHLC data
        }
        # Call callback without blocking
        self.on_tick_callback(tick_data)
```

**Subscription Flow** (Lines 182-191):

```python
def subscribe(self, symbol: str, instrument_token: int):
    """Subscribe to a symbol - triggers lazy start"""
    self.subscribed_tokens.add(instrument_token)
    self.token_to_symbol[instrument_token] = symbol

    # Lazy-start: Start ticker only when first subscription arrives
    if not self.is_connected and len(self.subscribed_tokens) > 0:
        self.start()  # Connect to Zerodha
```

### 2. Main Application (`backend/app/main.py`)

**Purpose**: Initialize ticker service and bridge to WebSocket manager.

**Critical Code** (Lines 73-91):

```python
def tick_callback(tick_data):
    """
    Bridge between KiteTicker (separate thread) and FastAPI event loop.
    Uses asyncio.run_coroutine_threadsafe for thread-safe async execution.
    """
    try:
        # Schedule broadcast in main event loop from KiteTicker thread
        asyncio.run_coroutine_threadsafe(
            broadcast_tick_data(tick_data),
            loop
        )
    except Exception as e:
        logger.error(f"❌ [TICK CALLBACK] Error: {e}")

ticker_service.set_tick_callback(tick_callback)
```

**Why asyncio.run_coroutine_threadsafe?**

- KiteTicker runs in separate thread (blocking WebSocket library)
- FastAPI runs async event loop
- This bridges the two safely without blocking

### 3. WebSocket Handlers (`backend/app/websocket/handlers.py`)

**Purpose**: Process ticks, build candles, and broadcast to frontend clients.

**Key Function** (Lines 183-244):

```python
async def broadcast_tick_data(tick_data: Dict[str, Any]):
    """
    1. Build real-time candles from ticks
    2. Broadcast tick data to subscribed users
    3. Broadcast completed candles
    4. Broadcast current (incomplete) candle updates
    """

    # Build candles (1-minute timeframe)
    candle_builder = get_candle_builder(timeframe_seconds=60)
    completed_candle = candle_builder.process_tick(symbol, price, volume, timestamp)

    # Concurrent broadcasting (non-blocking)
    tasks = []

    # 1. Broadcast tick
    tasks.append(manager.broadcast_to_symbol(symbol, tick_message))

    # 2. Broadcast completed candle (if any)
    if completed_candle:
        tasks.append(manager.broadcast_to_symbol(symbol, candle_message))

    # 3. Broadcast current candle update
    tasks.append(manager.broadcast_to_symbol(symbol, current_candle_message))

    # Execute all broadcasts concurrently (prevents blocking)
    await asyncio.gather(*tasks, return_exceptions=True)
```

**Optimization**: All broadcasts run concurrently using `asyncio.gather` to prevent blocking login and other API requests.

### 4. WebSocket Manager (`backend/app/websocket/manager.py`)

**Purpose**: Manage client connections and route messages to subscribers.

**Critical Optimization** (Lines 100-143):

```python
async def broadcast_to_symbol(self, symbol: str, message: dict):
    """
    Broadcast to all users subscribed to a symbol.
    OPTIMIZED: Concurrent sends, no per-message logging.
    """
    # NO logging here (would block on every tick)

    # Serialize message ONCE
    message_json = json.dumps(message)

    # Send to all subscribers CONCURRENTLY
    tasks = []
    for user_id in self.subscriptions[symbol]:
        if user_id in self.active_connections:
            tasks.append(send_to_user(user_id, self.active_connections[user_id]))

    # Execute all sends in parallel (non-blocking)
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
```

**Why This Matters**:

- Original implementation: Sequential await for each user = BLOCKING
- New implementation: Parallel sends with asyncio.gather = NON-BLOCKING
- Result: Login requests no longer blocked during active trading

**Subscription Management** (Lines 126-140):

```python
def subscribe(self, user_id: int, symbol: str):
    """Track which users want which symbols"""
    if symbol not in self.subscriptions:
        self.subscriptions[symbol] = set()

    self.subscriptions[symbol].add(user_id)
    logger.info(f"User {user_id} subscribed to {symbol}")
```

## Frontend Implementation

### 1. WebSocket Service (`frontend/services/websocket.ts`)

**Purpose**: Singleton WebSocket client for frontend.

**Key Features** (Lines 48-56):

```typescript
connect(token: string): void {
    // Prevent duplicate connections
    if (this.ws &&
        (this.ws.readyState === WebSocket.OPEN ||
         this.ws.readyState === WebSocket.CONNECTING)) {
        return;  // Already connected/connecting
    }

    this.ws = new WebSocket(`${WS_URL}?token=${token}`);
    this.setupEventHandlers();
}
```

**Event System** (Lines 100-120):

```typescript
on(event: 'tick' | 'candle' | 'candle_update', callback: Function): () => void {
    if (!this.listeners[event]) {
        this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
        const index = this.listeners[event].indexOf(callback);
        if (index > -1) {
            this.listeners[event].splice(index, 1);
        }
    };
}
```

**Message Handling**:

```typescript
private handleMessage(event: MessageEvent): void {
    const message = JSON.parse(event.data);

    if (message.type === 'tick') {
        // Notify all tick listeners
        this.emit('tick', message.data);
    } else if (message.type === 'candle') {
        this.emit('candle', message.data);
    } else if (message.type === 'candle_update') {
        this.emit('candle_update', message.data);
    }
}
```

### 2. Global App Initialization (`frontend/pages/_app.tsx`)

**Purpose**: Establish WebSocket connection and auto-subscribe to watchlist.

**Key Code** (Lines 34-79):

```typescript
useEffect(() => {
  const token = userStore.token;
  if (token) {
    // Connect once per app load
    wsService.connect(token);

    // Auto-subscribe to watchlist symbols
    const watchlistSymbols = [
      { symbol: "NIFTY 50", token: 256265 },
      { symbol: "BANKNIFTY", token: 260105 },
    ];

    watchlistSymbols.forEach(({ symbol, token }) => {
      wsService.subscribe(symbol, token);
    });

    // Listen to ticks and update symbolStore
    const unsubscribe = wsService.on("tick", (tickData: TickData) => {
      symbolStore.updatePrice(tickData.symbol, tickData.price);
    });

    return () => unsubscribe();
  }
}, [userStore.token]);
```

**Design Decision**: Single connection point in `_app.tsx`, all other components only subscribe to events.

### 3. Options Chain (`frontend/components/options/OptionsChain.tsx`)

**Purpose**: Display live option prices without re-rendering.

**Optimization Strategy**: Direct DOM manipulation instead of React state updates.

**Key Code** (Lines 28-58):

```typescript
// Use refs instead of state (no re-renders)
const callsRef = useRef<OptionData[]>(calls);
const putsRef = useRef<OptionData[]>(puts);

useEffect(() => {
  const unsubscribe = wsService.on("tick", (tickData: TickData) => {
    // Update refs (data cache)
    callsRef.current = callsRef.current.map((call) =>
      call.symbol === tickData.symbol ? { ...call, ltp: tickData.price } : call
    );

    putsRef.current = putsRef.current.map((put) =>
      put.symbol === tickData.symbol ? { ...put, ltp: tickData.price } : put
    );

    // Update DOM directly (NO React re-render)
    const priceElements = document.querySelectorAll(
      `[data-option-symbol="${tickData.symbol}"]`
    );
    priceElements.forEach((el) => {
      el.textContent = formatCurrency(tickData.price);
    });
  });

  return () => unsubscribe();
}, []);
```

**Rendered HTML** (data attributes for targeting):

```tsx
<button
  data-option-symbol={call.symbol} // Target for DOM updates
  onClick={() => handleAction(call, "CHART")}
>
  {formatCurrency(call.ltp)}
</button>
```

**Why This Approach?**

- ❌ State updates (`setState`) → Full component re-render → Buttons flicker, clicks interrupted
- ✅ Direct DOM updates → Only price text changes → Smooth, no interruptions

### 4. Positions Table (`frontend/components/trading/PositionsTable.tsx`)

**Purpose**: Real-time P&L updates for open positions.

**Optimization Strategy**: Ref-based updates with version counter.

**Key Code** (Lines 20-50):

```typescript
const positionsRef = useRef<Position[]>(positions);
const [priceVersion, setPriceVersion] = useState(0);

useEffect(() => {
  const unsubscribe = wsService.on("tick", (tickData: TickData) => {
    let updated = false;

    // Update positions in-place
    positionsRef.current = positionsRef.current.map((pos) => {
      if (pos.trading_symbol === tickData.symbol) {
        updated = true;
        const currentPrice = tickData.price;
        const pnl = (currentPrice - pos.average_price) * pos.quantity;
        const pnlPercentage =
          ((currentPrice - pos.average_price) / pos.average_price) * 100;

        return { ...pos, currentPrice, pnl, pnlPercentage };
      }
      return pos;
    });

    // Minimal re-render only when actually updated
    if (updated) {
      setPriceVersion((v) => v + 1);
    }
  });

  return () => unsubscribe();
}, []);
```

**Why Version Counter?**

- Only increment when position prices actually change
- React re-renders only for relevant updates
- Much more efficient than re-rendering on every tick

### 5. Watchlist Sidebar (`frontend/components/layout/WatchlistSidebar.tsx`)

**Purpose**: Display watchlist with live prices and % change.

**Key Code** (Lines 310-327):

```typescript
useEffect(() => {
  const unsubscribe = wsService.on("tick", (tickData: TickData) => {
    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.instrument_token === tickData.instrument_token) {
          const changePercent = item.ltp
            ? ((tickData.price - item.ltp) / item.ltp) * 100
            : 0;

          return {
            ...item,
            ltp: tickData.price,
            changePercent,
          };
        }
        return item;
      })
    );
  });

  return () => unsubscribe();
}, []);
```

**Fallback Handling**:

```tsx
<span className="text-lg font-bold">
    ₹{(item.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</span>
<span className={getColorClass(item.changePercent || 0)}>
    {(item.changePercent || 0) > 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
</span>
```

## Performance Optimizations

### Backend Optimizations

1. **No Per-Tick Logging**

   - ❌ Before: `logger.info()` on every tick → Thousands per second → Event loop blocked
   - ✅ After: Only log errors and connection events

2. **Concurrent Broadcasting**

   - ❌ Before: Sequential `await` for each user → Slow, blocking
   - ✅ After: `asyncio.gather()` → All users receive simultaneously

3. **Single Message Serialization**

   - ❌ Before: `json.dumps()` for each user
   - ✅ After: Serialize once, reuse for all users

4. **Lazy-Start Pattern**
   - ❌ Before: Connect to Zerodha on app startup → Fails if no subscriptions
   - ✅ After: Connect only when first subscription arrives → Stable connection

### Frontend Optimizations

1. **Direct DOM Updates (OptionsChain)**

   - ❌ Before: State updates → Full re-render → UI flickers
   - ✅ After: Direct DOM manipulation → No re-renders → Smooth updates

2. **Ref-Based Caching**

   - ❌ Before: Data in state → Updates cause re-renders
   - ✅ After: Data in refs → Updates don't trigger re-renders

3. **Single WebSocket Connection**

   - ❌ Before: Multiple components calling `connect()` → Duplicate connections
   - ✅ After: Single connection in `_app.tsx` → Components only subscribe

4. **Version Counters**
   - Minimal re-renders only when data actually changes
   - Prevents unnecessary React reconciliation

## Logging Strategy

### What We Log

✅ **Connection Events**:

```python
logger.info("✅ [KITE] Connected to Zerodha WebSocket")
logger.warning("❌ [KITE] Connection closed")
logger.error("❌ [KITE] Connection error")
```

✅ **Subscription Changes**:

```python
logger.info(f"📊 [TICKER] Subscribed to {symbol} (token: {instrument_token})")
logger.info(f"User {user_id} subscribed to {symbol}")
```

✅ **Critical Errors**:

```python
logger.error(f"❌ [TICK CALLBACK] Error broadcasting tick data: {e}")
logger.error(f"Error processing ticks: {e}", exc_info=True)
```

✅ **Candle Completion** (infrequent):

```python
logger.info(f"Broadcasted completed candle for {symbol}")
```

### What We Don't Log

❌ **Per-Tick Processing**:

```python
# REMOVED: Would log thousands of times per second
# logger.info(f"Processing tick for {symbol}: {price}")
```

❌ **Per-Broadcast Events**:

```python
# REMOVED: Would log on every tick broadcast
# logger.info(f"📡 [MANAGER] Broadcasting to symbol: {symbol}")
```

❌ **Successful Sends**:

```python
# REMOVED: Would log for every user on every tick
# logger.info(f"Sent tick to user {user_id}")
```

## Data Flow Example

**Scenario**: NIFTY 50 tick arrives with price 19,250.50

1. **Zerodha sends tick** → KiteTicker receives it
2. **ticker_service.py** `on_ticks()` → Extracts data
3. **ticker_service.py** → Calls `tick_callback(tick_data)`
4. **main.py** `tick_callback()` → Schedules `broadcast_tick_data()` in event loop
5. **handlers.py** `broadcast_tick_data()` →
   - Builds 1-minute candle
   - Prepares tick message
   - Calls `manager.broadcast_to_symbol()`
6. **manager.py** `broadcast_to_symbol()` →
   - Finds all users subscribed to "NIFTY 50"
   - Sends JSON to all users concurrently
7. **Frontend websocket.ts** → Receives message, parses JSON
8. **Frontend websocket.ts** → Emits 'tick' event to all listeners
9. **UI Components** →
   - **OptionsChain**: Updates DOM directly (no re-render)
   - **PositionsTable**: Updates refs, increments version counter
   - **WatchlistSidebar**: Updates state with new price
   - **\_app.tsx**: Updates symbolStore

**Total latency**: ~10-50ms from Zerodha to UI update

## Troubleshooting

### Issue: Login Blocked During Active Trading

**Symptom**: Login API takes 10-30 seconds when market is active.

**Root Cause**:

- Excessive logging blocking event loop
- Sequential broadcasts blocking other requests

**Solution**:

- Removed all per-tick logging
- Changed to concurrent broadcasts with `asyncio.gather()`

### Issue: UI Flickering/Buttons Not Clickable

**Symptom**: Options chain re-renders constantly, buttons unresponsive.

**Root Cause**: State updates on every tick causing full component re-renders.

**Solution**: Direct DOM manipulation in OptionsChain, ref-based updates elsewhere.

### Issue: Zerodha Connection Timeout (Error 1006)

**Symptom**: `WebSocket opening handshake timeout`.

**Root Cause**: Zerodha requires at least one instrument subscribed immediately in `on_connect`.

**Solution**: Lazy-start pattern - queue subscriptions before connecting.

### Issue: Multiple WebSocket Connections

**Symptom**: Frontend creates duplicate WebSocket connections.

**Root Cause**: Multiple components calling `wsService.connect()`.

**Solution**: Single connection in `_app.tsx`, enhanced connection check.

## Configuration

### Environment Variables

```bash
# Backend (.env)
MARKET_API_KEY=your_zerodha_api_key
MARKET_ACCESS_TOKEN=your_zerodha_access_token
```

### Subscription Examples

**Backend**:

```python
# Subscribe from backend
ticker_service = get_ticker_service()
ticker_service.subscribe("NIFTY 50", 256265)
```

**Frontend**:

```typescript
// Subscribe from frontend
wsService.subscribe("NIFTY 50", 256265);

// Listen to ticks
const unsubscribe = wsService.on("tick", (tickData) => {
  console.log(tickData.symbol, tickData.price);
});
```

## Testing

### Check WebSocket Connection

**Backend logs** (on startup):

```
✅ [STARTUP] KiteTicker service initialized (will start on first subscription)
```

**Backend logs** (on first subscription):

```
📊 [TICKER] Subscribed to NIFTY 50 (token: 256265)
🚀 [TICKER] Starting KiteTicker with 1 instruments queued...
✅ [KITE] Connected to Zerodha WebSocket
📡 [KITE] Subscribing to 1 instruments
```

**Frontend console**:

```javascript
// Check connection
console.log(wsService.isConnected()); // true

// Monitor ticks
wsService.on("tick", (tick) => console.log(tick));
```

### Verify Real-Time Updates

1. Open Options Chain
2. Watch prices update in real-time
3. Hover/click buttons → Should work smoothly (no flickering)
4. Check browser console → No errors

## Future Enhancements

1. **Tick Throttling**: Limit frontend updates to 2-5 per second per symbol
2. **Compression**: Use WebSocket compression for bandwidth savings
3. **Reconnection Strategy**: Exponential backoff for reconnections
4. **Health Monitoring**: WebSocket ping/pong with timeout detection
5. **Message Queue**: Buffer ticks during high volume for smoother processing

## Summary

The live market update system is designed for:

- ⚡ **Low latency**: 10-50ms from Zerodha to UI
- 🔒 **Non-blocking**: Login and API requests never blocked
- 🎯 **Efficient**: Minimal CPU usage, no excessive re-renders
- 🛡️ **Stable**: Auto-reconnection, error handling, fallbacks
- 📊 **Scalable**: Concurrent broadcasts, single message serialization

Key patterns:

- **Backend**: Lazy-start, concurrent broadcasting, minimal logging
- **Frontend**: Single connection, event-driven, direct DOM updates, ref-based caching
