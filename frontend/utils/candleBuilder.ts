import { CandleData, TickData } from '../types';

export class CandleBuilder {
    private currentCandle: Partial<CandleData> | null = null;
    private timeframe: number; // in milliseconds
    private onCandleComplete: (candle: CandleData) => void;

    constructor(timeframeMinutes: number, onCandleComplete: (candle: CandleData) => void) {
        this.timeframe = timeframeMinutes * 60 * 1000;
        this.onCandleComplete = onCandleComplete;
    }

    processTick(tick: TickData) {
        const tickTime = tick.timestamp;
        const candleStartTime = Math.floor(tickTime / this.timeframe) * this.timeframe;

        // If no current candle or new candle period started
        if (!this.currentCandle || this.currentCandle.timestamp !== candleStartTime) {
            // Complete and emit previous candle
            if (this.currentCandle && this.isValidCandle(this.currentCandle)) {
                this.onCandleComplete(this.currentCandle as CandleData);
            }

            // Start new candle
            this.currentCandle = {
                timestamp: candleStartTime,
                open: tick.price,
                high: tick.price,
                low: tick.price,
                close: tick.price,
                volume: tick.volume || 0,
            };
        } else {
            // Update current candle
            this.currentCandle.high = Math.max(this.currentCandle.high!, tick.price);
            this.currentCandle.low = Math.min(this.currentCandle.low!, tick.price);
            this.currentCandle.close = tick.price;
            this.currentCandle.volume = (this.currentCandle.volume || 0) + (tick.volume || 0);
        }
    }

    getCurrentCandle(): CandleData | null {
        if (this.currentCandle && this.isValidCandle(this.currentCandle)) {
            return this.currentCandle as CandleData;
        }
        return null;
    }

    private isValidCandle(candle: Partial<CandleData>): candle is CandleData {
        return !!(
            candle.timestamp &&
            candle.open !== undefined &&
            candle.high !== undefined &&
            candle.low !== undefined &&
            candle.close !== undefined
        );
    }

    reset() {
        this.currentCandle = null;
    }
}

export function getTimeframeMinutes(timeframe: string): number {
    const map: Record<string, number> = {
        '1m': 1,
        '3m': 3,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 240,
        '1d': 1440,
    };
    return map[timeframe] || 5;
}
