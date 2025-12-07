# Y-Axis Mode Implementation (%, log, auto)

## Overview
Implemented three Y-axis scaling modes for the KlineChart component, allowing users to switch between different price scale representations.

## Features Implemented

### 3 Y-Axis Modes:

1. **% (Percentage)** - Shows price changes as percentage from reference price
2. **log (Logarithmic)** - Logarithmic scale for better visualization of large price movements
3. **auto (Normal/Linear)** - Default auto-scaling linear axis

## Implementation Details

### State Management
```typescript
const [yAxisMode, setYAxisMode] = useState<'normal' | 'percent' | 'log'>('normal');
const refPriceRef = useRef<number>(0); // Reference price for percent mode
```

### Mode Change Handler
```typescript
const handleYAxisModeChange = (mode: 'normal' | 'percent' | 'log') => {
  if (!chartInstance.current) return;

  setYAxisMode(mode);

  // Set reference price for percent mode (first visible candle's close)
  if (mode === 'percent') {
    const visibleData = chartInstance.current.getDataList();
    if (visibleData && visibleData.length > 0) {
      refPriceRef.current = visibleData[0].close;
    }
  }

  // Apply Y-axis type to chart using klinecharts API
  const currentStyles = chartInstance.current.getStyles();
  
  chartInstance.current.setStyles({
    ...currentStyles,
    yAxis: {
      ...currentStyles.yAxis,
      type: mode === 'log' ? 'log' : mode === 'percent' ? 'percentage' : 'normal',
    },
  });
}
```

### UI Buttons
Three buttons added to the top toolbar, positioned after the Indicators dropdown:

```tsx
{/* Y-Axis Mode Buttons */}
<div className="flex items-center gap-1 ml-2 border-l border-[#2a2e39] pl-2">
  <button onClick={() => handleYAxisModeChange('percent')} 
          className={yAxisMode === 'percent' ? 'bg-[#2962ff] text-white' : 'text-[#787b86]'}>
    %
  </button>
  <button onClick={() => handleYAxisModeChange('log')}
          className={yAxisMode === 'log' ? 'bg-[#2962ff] text-white' : 'text-[#787b86]'}>
    log
  </button>
  <button onClick={() => handleYAxisModeChange('normal')}
          className={yAxisMode === 'normal' ? 'bg-[#2962ff] text-white' : 'text-[#787b86]'}>
    auto
  </button>
</div>
```

## KlineCharts API Used

### Version: 9.8.0

According to klinecharts 9.8.0 documentation, the Y-axis type is controlled via:

```typescript
chart.setStyles({
  yAxis: {
    type: 'normal' | 'percentage' | 'log'
  }
})
```

### Supported Y-Axis Types:
- `"normal"` - Linear scale (default)
- `"percentage"` - Percentage scale
- `"log"` - Logarithmic scale

## How It Works

### Normal Mode (auto):
- Default linear Y-axis
- Auto-scales based on visible price range
- Best for general use

### Percentage Mode (%):
- Shows price as % change from reference price
- Reference price = first visible candle's close price
- Useful for comparing relative performance
- Formula: `((current_price - ref_price) / ref_price) * 100`

### Logarithmic Mode (log):
- Y-axis uses logarithmic scale
- Equal percentage changes appear as equal distances
- Useful for long-term charts with large price movements
- Better visualization when price ranges vary significantly

## User Experience

1. **Click % button**: Chart switches to percentage view
2. **Click log button**: Chart switches to logarithmic scale
3. **Click auto button**: Chart returns to normal linear scale

Active button is highlighted in blue (`#2962ff`), inactive buttons are gray.

## Visual Design

Buttons styled to match the provided reference image:
- Small, compact buttons
- Positioned in toolbar after Indicators
- Separated by border-left divider
- Active state: Blue background (#2962ff)
- Inactive state: Gray text (#787b86)
- Hover effect: Dark background (#1e222d)

## Benefits

✅ **Better Analysis**: Different scales for different analysis needs  
✅ **Percentage Comparison**: Easy to see relative performance  
✅ **Log Scale**: Better for long-term trends and exponential growth  
✅ **Professional**: Matches TradingView and other pro charting platforms  
✅ **Native Support**: Uses klinecharts built-in functionality  

## Testing

Both frontend and backend servers running successfully.
The Y-axis mode buttons are now functional and ready to use!

## Location in Code

**File**: `frontend/components/charts/KlineChart.tsx`
- State: Lines 73-75
- Handler: Lines 411-441
- UI Buttons: Lines 1401-1438
