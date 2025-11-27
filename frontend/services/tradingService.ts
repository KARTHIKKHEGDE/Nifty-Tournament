import api, { handleApiError } from './api';
import {
    PaperOrder,
    PaperPosition,
    OrderForm,
    CandleData,
    Timeframe,
} from '../types';

class TradingService {
    /**
     * Get historical candle data
     */
    async getCandles(
        symbol: string,
        timeframe: Timeframe,
        limit: number = 400,
        instrumentToken?: number
    ): Promise<CandleData[]> {
        try {
            const params: any = { symbol, timeframe, limit };

            // Add instrument_token if provided
            if (instrumentToken) {
                params.instrument_token = instrumentToken;
            }

            const response = await api.get<CandleData[]>('/api/candles/', {
                params,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get instrument token for a symbol
     */
    async getInstrumentToken(symbol: string, exchange: string = 'NSE'): Promise<number | null> {
        try {
            const response = await api.get<{ instruments: any[] }>('/api/candles/instruments', {
                params: { exchange },
            });

            // Find the instrument matching the symbol
            const instrument = response.data.instruments.find(
                (inst: any) => inst.tradingsymbol === symbol || inst.name === symbol
            );

            return instrument?.instrument_token || null;
        } catch (error) {
            console.error('Failed to get instrument token:', error);
            return null;
        }
    }

    /**
     * Place a paper order
     */
    async placeOrder(orderData: OrderForm): Promise<PaperOrder> {
        try {
            const response = await api.post<PaperOrder>('/api/paper-trading/orders', orderData);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get all paper orders
     */
    async getOrders(status?: string): Promise<PaperOrder[]> {
        try {
            const response = await api.get<PaperOrder[]>('/api/paper-trading/orders', {
                params: status ? { status } : {},
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get a specific order
     */
    async getOrder(orderId: number): Promise<PaperOrder> {
        try {
            const response = await api.get<PaperOrder>(`/api/paper-trading/orders/${orderId}`);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId: number): Promise<PaperOrder> {
        try {
            const response = await api.post<PaperOrder>(
                `/api/paper-trading/orders/${orderId}/cancel`
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get all positions
     */
    async getPositions(): Promise<PaperPosition[]> {
        try {
            const response = await api.get<PaperPosition[]>('/api/paper-trading/positions');
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Close a position
     */
    async closePosition(positionId: number): Promise<{ message: string }> {
        try {
            const response = await api.post<{ message: string }>(
                `/api/paper-trading/positions/${positionId}/close`
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get portfolio summary
     */
    async getPortfolio(): Promise<{
        total_value: number;
        cash_balance: number;
        positions_value: number;
        total_pnl: number;
        day_pnl: number;
    }> {
        try {
            const response = await api.get('/api/paper-trading/portfolio');
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get options chain for NIFTY or BANKNIFTY
     */
    async getOptionsChain(
        symbol: string,
        expiryDate?: string
    ): Promise<{
        symbol: string;
        spot_price: number;
        expiry_date: string | null;
        ce_options: Array<{
            strike: number;
            expiry: string;
            instrument_token: number;
            tradingsymbol: string;
            ltp: number;
            oi: number;
            change: number;
            volume: number;
        }>;
        pe_options: Array<{
            strike: number;
            expiry: string;
            instrument_token: number;
            tradingsymbol: string;
            ltp: number;
            oi: number;
            change: number;
            volume: number;
        }>;
    }> {
        try {
            const params: any = {};
            if (expiryDate) {
                params.expiry_date = expiryDate;
            }

            const response = await api.get(`/api/candles/options-chain/${symbol}`, {
                params,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get current price for a symbol
     */
    async getCurrentPrice(symbol: string): Promise<number> {
        try {
            const response = await api.get<{ price: number }>('/api/candles/current-price', {
                params: { symbol },
            });
            return response.data.price;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}

export default new TradingService();
