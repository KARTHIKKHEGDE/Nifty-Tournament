import { WSMessage, WSMessageType } from '../types';

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private messageHandlers: Map<WSMessageType, Set<(data: any) => void>> = new Map();
    private isConnecting = false;
    private shouldReconnect = true;

    /**
     * Connect to WebSocket server
     */
    connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                reject(new Error('Connection already in progress'));
                return;
            }

            this.isConnecting = true;
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
            const url = `${wsUrl}?token=${token}`;

            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WSMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnecting = false;
                    this.ws = null;

                    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
                        setTimeout(() => this.connect(token), this.reconnectDelay);
                    }
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        this.shouldReconnect = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.messageHandlers.clear();
    }

    /**
     * Subscribe to a symbol
     */
    subscribe(symbol: string): void {
        this.send({
            type: WSMessageType.SUBSCRIBE,
            symbol,
        });
    }

    /**
     * Unsubscribe from a symbol
     */
    unsubscribe(symbol: string): void {
        this.send({
            type: WSMessageType.UNSUBSCRIBE,
            symbol,
        });
    }

    /**
     * Send a message to the server
     */
    private send(message: WSMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }

    /**
     * Handle incoming message
     */
    private handleMessage(message: WSMessage): void {
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
            handlers.forEach((handler) => handler(message.data));
        }
    }

    /**
     * Register a message handler
     */
    on(type: WSMessageType, handler: (data: any) => void): () => void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            const handlers = this.messageHandlers.get(type);
            if (handlers) {
                handlers.delete(handler);
            }
        };
    }

    /**
     * Remove a message handler
     */
    off(type: WSMessageType, handler: (data: any) => void): void {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export default new WebSocketService();
