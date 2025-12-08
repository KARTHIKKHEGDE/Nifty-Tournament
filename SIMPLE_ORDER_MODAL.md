# 🎯 Simple Order Modal - Implementation Guide

## Overview

Implemented a **clean, minimal Buy/Sell order popup** inspired by Zerodha, with only essential fields to avoid user confusion.

---

## ✨ Features Implemented

### 1. **Modal Structure**

```
┌─────────────────────────────────────┐
│  NIFTY 9th DEC 26050 CE            │
│  LTP: ₹22.50                        │
├─────────────────────────────────────┤
│                                     │
│  Order Type                         │
│  [Intraday (MIS)] [Delivery(NRML)] │
│                                     │
│  Quantity / Lots                    │
│  Lot Size: 50                       │
│  Lots: [ - ] [ 1 ] [ + ]           │
│  Qty:  [ - ] [50 ] [ + ]           │
│                                     │
│  Stoploss (Optional)                │
│  [Enter price or leave empty]       │
│                                     │
│  Target (Optional)                  │
│  [Enter price or leave empty]       │
│                                     │
│  Total Amount: ₹1,125.00            │
│                                     │
│  [ BUY ]  [ SELL ]                  │
│                                     │
│  [  Place BUY Order  ]              │
│                                     │
│  Paper Trading: Virtual money only  │
└─────────────────────────────────────┘
```

---

## 📋 Fields Included

### **1. Order Type** (MIS / NRML)

- **MIS (Intraday)**: Position closed by end of day
- **NRML (Delivery)**: Position carried forward

### **2. Quantity / Lots**

- **Lot Size**: Auto-fetched (default: 50)
- **Lots**: Number of lots to trade
- **Quantity**: Total quantity (auto-calculated)
- **Synced**: Changing one updates the other

**Logic:**

```typescript
quantity = lots × lot_size
lots = Math.round(quantity / lot_size)
```

### **3. Stoploss** (Optional)

- Price level to exit if market moves against you
- Leave empty to skip

### **4. Target** (Optional)

- Price level to exit when profit target is reached
- Leave empty to skip

### **5. Total Amount**

- Auto-calculated: `currentPrice × quantity`
- Displayed prominently

### **6. Buy/Sell Toggle**

- Visual indication of order side
- Green for BUY, Red for SELL

---

## 🎨 UI/UX Features

### Clean & Minimal

✅ Only essential fields  
✅ No overwhelming options  
✅ Clear visual hierarchy  
✅ Zerodha-inspired design

### Smart Defaults

✅ Pre-filled with 1 lot  
✅ Market order type  
✅ Auto lot size detection

### User-Friendly

✅ +/- buttons for quick adjustment  
✅ Direct number input available  
✅ Real-time total calculation  
✅ Clear optional field labels

### Responsive Actions

✅ Buy/Sell selection before submit  
✅ Loading states during order placement  
✅ Error handling with clear messages  
✅ Success feedback & auto-close

---

## 🔧 Technical Implementation

### Component: `SimpleOrderModal.tsx`

**Location:** `frontend/components/trading/SimpleOrderModal.tsx`

**Props:**

```typescript
interface SimpleOrderModalProps {
  isOpen: boolean; // Modal visibility
  onClose: () => void; // Close handler
  symbol: string; // e.g., "NIFTY 9th DEC 26050 CE"
  currentPrice: number; // LTP of the option
  instrumentType?: "CE" | "PE" | "INDEX";
  initialSide?: OrderSide; // BUY or SELL
  lotSize?: number; // Default: 50
}
```

**State Management:**

```typescript
const [orderType, setOrderType] = useState<"MIS" | "NRML">("MIS");
const [lots, setLots] = useState<number>(1);
const [quantity, setQuantity] = useState<number>(lotSize);
const [stoploss, setStoploss] = useState<string>("");
const [target, setTarget] = useState<string>("");
```

**Key Functions:**

1. **Lot-Quantity Sync**

```typescript
useEffect(() => {
  setQuantity(lots * lotSize);
}, [lots, lotSize]);

const handleQuantityChange = (newQty: number) => {
  setQuantity(newQty);
  setLots(Math.round(newQty / lotSize));
};
```

2. **Order Placement**

```typescript
const orderData = {
  symbol,
  instrument_type: instrumentType,
  order_type: OrderType.MARKET,
  order_side: side,
  quantity,
  product: orderType, // MIS or NRML
  stop_loss: stoploss ? parseFloat(stoploss) : undefined,
  take_profit: target ? parseFloat(target) : undefined,
};
```

---

## 🔗 Integration with OptionsChain

### Updated: `components/options/OptionsChain.tsx`

**Changes:**

1. Added modal state management

```typescript
const [orderModalOpen, setOrderModalOpen] = useState(false);
const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
const [orderSide, setOrderSide] = useState<OrderSide>(OrderSide.BUY);
```

2. Modified action handler

```typescript
const handleAction = (
  option: OptionData,
  action: "BUY" | "SELL" | "CHART" | "WATCHLIST"
) => {
  if (action === "BUY" || action === "SELL") {
    setSelectedOption(option);
    setOrderSide(action === "BUY" ? OrderSide.BUY : OrderSide.SELL);
    setOrderModalOpen(true);
  } else {
    onOptionSelect?.(option, action);
  }
};
```

3. Rendered modal

```tsx
<SimpleOrderModal
  isOpen={orderModalOpen}
  onClose={() => {
    setOrderModalOpen(false);
    setSelectedOption(null);
  }}
  symbol={selectedOption.symbol}
  currentPrice={selectedOption.ltp}
  instrumentType={selectedOption.option_type as "CE" | "PE"}
  initialSide={orderSide}
  lotSize={50}
/>
```

---

## 📦 Order JSON Structure

When user submits, the following is sent to backend:

```json
{
  "symbol": "NIFTY 09DEC 26050 CE",
  "instrument_type": "CE",
  "order_type": "MARKET",
  "order_side": "BUY",
  "quantity": 50,
  "product": "MIS",
  "stop_loss": 22.0,
  "take_profit": 28.5
}
```

**Note:** `stop_loss` and `take_profit` are omitted if not provided.

---

## 🎯 User Flow

1. **User clicks "B" (Buy) or "S" (Sell)** on any option in the options chain
2. **Modal opens** with:
   - Symbol and current price pre-filled
   - Order side (BUY/SELL) pre-selected
   - Default: 1 lot (50 quantity)
3. **User adjusts:**
   - Order type (MIS/NRML)
   - Lots or Quantity (whichever is easier)
   - Optionally: Stoploss and Target
4. **User confirms order side** (can switch BUY ↔ SELL)
5. **User clicks "Place BUY/SELL Order"**
6. **Order placed → Modal closes → Success**

---

## ✅ Benefits

### For Users

- **Simple**: Only essential fields, no confusion
- **Fast**: Quick adjustments with +/- buttons
- **Smart**: Auto lot-quantity sync
- **Safe**: Clear total amount before submit
- **Flexible**: Optional stoploss/target

### For Developers

- **Clean Code**: Single responsibility component
- **Type-Safe**: Full TypeScript support
- **Reusable**: Can be used anywhere
- **Maintainable**: Clear structure and logic

---

## 🚀 Future Enhancements

### Potential Additions

1. **Price Type Toggle** - Market vs Limit
2. **Percentage-based SL/Target** - Calculate from current price
3. **Quick Preset Buttons** - 1 lot, 2 lots, 5 lots
4. **Order Preview** - Summary before confirmation
5. **Recent Orders** - Quick repeat feature
6. **Risk Calculator** - Show max loss/profit

---

## 📝 Usage Example

```typescript
import SimpleOrderModal from "../components/trading/SimpleOrderModal";

function MyComponent() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setModalOpen(true)}>Place Order</button>

      <SimpleOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        symbol="NIFTY 09DEC 26050 CE"
        currentPrice={22.5}
        instrumentType="CE"
        initialSide={OrderSide.BUY}
        lotSize={50}
      />
    </>
  );
}
```

---

## 🎨 Styling

**Color Scheme:**

- Background: `#1a1d23` (Dark)
- Border: `#374151` (Gray)
- Input: `#374151` with `#2563eb` focus
- BUY: Blue `#2563eb` / Green `#16a34a`
- SELL: Red `#dc2626`

**Typography:**

- Font: Inter
- Headers: 14px semi-bold
- Labels: 11px uppercase tracking-wider
- Values: 14px medium

---

## 🐛 Error Handling

1. **Validation Errors**

   - Quantity ≤ 0 → "Quantity must be greater than 0"
   - Network errors → Display API error message

2. **Loading States**

   - Disable form during submission
   - Show "Placing Order..." text
   - Prevent multiple submissions

3. **Success Handling**
   - Close modal automatically
   - Refresh orders list
   - Show success notification (if implemented)

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Implemented & Working  
**Files Created:** 1 new component  
**Files Modified:** 1 integration update
