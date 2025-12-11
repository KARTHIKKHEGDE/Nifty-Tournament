import { WSMessage, WSMessageType, TickData } from '../types';

// Simple event emitter for local (non-network) events
class LocalEmitter {
    private listeners: Map<string, Function[]> = new Map();

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback?: Function) {
        if (!callback) {
            this.listeners.delete(event);
        } else {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                this.listeners.set(event, callbacks.filter(cb => cb !== callback));
            }
        }
    }

    emit(event: string, data?: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(data));
        }
    }
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private listeners: Map<string, Function[]> = new Map();
    private subscriptions: Map<string, number> = new Map(); // Map<symbol, instrumentToken>
    private pendingQueue: any[] = []; // queue messages until socket open
    private reconnectAttempts = 0;
    private reconnectTimer: any = null;
    private currentToken?: string; // store token for reconnect
    private localEmitter = new LocalEmitter(); // For optimistic UI updates
    private rooms: Set<string> = new Set(); // Track joined rooms

    // Connect accepts optional token and will append it to the WS URL as ?token=...
    connect(token?: string) {
        // Store token for reconnects
        if (token) {
            this.currentToken = token;
        }

        // Avoid multiple open sockets - check for OPEN or CONNECTING
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            console.log(`[WebSocket] Already connected/connecting (state: ${this.ws.readyState}), skipping connect()`);
            return;
        }

        const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws').replace(/\/+$/, '');
        const finalToken = token || this.currentToken;
        const url = finalToken ? `${baseUrl}?token=${encodeURIComponent(finalToken)}` : baseUrl;

        console.log(`[WebSocket] Connecting to: ${baseUrl}`);
        console.log(`[WebSocket] Token provided: ${finalToken ? 'YES (' + finalToken.substring(0, 20) + '...)' : 'NO'}`);

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('✅ [WebSocket] Connected successfully');
                this.reconnectAttempts = 0;

                // flush pending queue
                if (this.pendingQueue.length > 0) {
                    console.log(`[WebSocket] Flushing ${this.pendingQueue.length} pending messages`);
                }
                while (this.pendingQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    const msg = this.pendingQueue.shift();
                    console.log('[WebSocket] Sending queued message:', msg);
                    this._sendRaw(msg);
                }

                // send subscribe for any stored subscriptions
                if (this.subscriptions.size > 0) {
                    console.log(`[WebSocket] Re-subscribing to ${this.subscriptions.size} symbols:`, Array.from(this.subscriptions.keys()));
                }
                this.subscriptions.forEach((instrumentToken, symbol) => {
                    this.send({ type: 'subscribe', symbol, instrument_token: instrumentToken });
                });
            };

            this.ws.onmessage = (event) => {
                console.log('[WebSocket] Message received:', event.data);
                try {
                    const message = JSON.parse(event.data);
                    console.log('[WebSocket] Parsed message:', message);
                    this.handleMessage(message);
                } catch (err) {
                    console.error('❌ [WebSocket] Invalid message', err);
                }
            };

            this.ws.onerror = (err) => {
                console.error('❌ [WebSocket] Error:', err);
            };

            this.ws.onclose = (ev) => {
                console.warn(`🔌 [WebSocket] Disconnected (code: ${ev.code}, reason: ${ev.reason || 'none'})`);
                // attempt reconnect with backoff
                this._scheduleReconnect(finalToken);
            };
        } catch (err) {
            console.error('❌ [WebSocket] connect error:', err);
            this._scheduleReconnect(finalToken);
        }
    }

    // internal raw send (assumes ws open)
    private _sendRaw(data: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] Cannot send, socket not open');
            return;
        }
        try {
            const jsonStr = JSON.stringify(data);
            console.log('[WebSocket] Sending:', jsonStr);
            this.ws.send(jsonStr);
        } catch (err) {
            console.error('❌ [WebSocket] send failed:', err);
        }
    }

    // public send — queues if socket not open
    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this._sendRaw(data);
        } else {
            // queue the message until connection opens
            console.log('[WebSocket] Socket not open, queuing message:', data);
            this.pendingQueue.push(data);
            // ensure we try to connect if not already
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                console.log('[WebSocket] Socket closed, attempting to reconnect...');
                this.connect(); // will use stored token
            }
        }
    }

    // Subscribe stores symbol AND instrument_token, sends subscribe message (queued if needed)
    subscribe(symbol: string, instrumentToken?: number) {
        console.log(`[WebSocket] Subscribing to: ${symbol} (token: ${this.currentToken ? 'present' : 'none'}, instrument: ${instrumentToken || 'none'})`);
        if (instrumentToken) {
            this.subscriptions.set(symbol, instrumentToken);
        }
        this.send({
            type: 'subscribe',
            symbol,
            instrument_token: instrumentToken
        });
    }

    unsubscribe(symbol: string, instrumentToken?: number) {
        console.log(`[WebSocket] Unsubscribing from: ${symbol}`);
        this.subscriptions.delete(symbol);
        this.send({
            type: 'unsubscribe',
            symbol,
            instrument_token: instrumentToken
        });
    }

    on(event: string, callback: Function): () => void {
        console.log(`[WebSocket] Registering listener for event: ${event}`);
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
        return () => {
            console.log(`[WebSocket] Removing listener for event: ${event}`);
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const idx = callbacks.indexOf(callback);
                if (idx > -1) callbacks.splice(idx, 1);
            }
        };
    }

    off(event: string, callback?: Function) {
        console.log(`[WebSocket] Removing listener(s) for event: ${event}`);
        if (!callback) {
            // Remove all listeners for this event
            this.listeners.delete(event);
        } else {
            // Remove specific callback
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const idx = callbacks.indexOf(callback);
                if (idx > -1) callbacks.splice(idx, 1);
            }
        }
    }

    private handleMessage(message: any) {
        const callbacks = this.listeners.get(message.type);
        if (callbacks && callbacks.length > 0) {
            console.log(`[WebSocket] Dispatching message type '${message.type}' to ${callbacks.length} listener(s)`);
            callbacks.forEach((cb) => cb(message.data));
        } else {
            console.log(`[WebSocket] No listeners for message type: ${message.type}`);
        }
    }

    // Reconnect scheduler with simple backoff
    private _scheduleReconnect(token?: string) {
        if (this.reconnectTimer) {
            console.log('[WebSocket] Reconnect already scheduled, skipping');
            return;
        }
        this.reconnectAttempts += 1;
        const delay = Math.min(30000, 1000 * Math.pow(1.5, this.reconnectAttempts));
        console.log(`⏰ [WebSocket] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            console.log(`🔄 [WebSocket] Attempting reconnect (attempt ${this.reconnectAttempts})`);
            this.connect(token);
        }, delay);
    }

    // Get connection state for debugging
    getConnectionState(): string {
        if (!this.ws) return 'NOT_INITIALIZED';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    // Check if connected
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ==================== ROOM MANAGEMENT (for tournaments) ====================

    /**
     * Join a room (for tournament or other grouped events)
     */
    joinRoom(room: string) {
        if (this.rooms.has(room)) {
            console.log(`[WebSocket] Already in room: ${room}`);
            return;
        }
        this.rooms.add(room);
        this.send({ type: 'join', data: { room } });
        console.log(`[WebSocket] Joined room: ${room}`);
    }

    /**
     * Leave a room
     */
    leaveRoom(room: string) {
        if (!this.rooms.has(room)) {
            console.log(`[WebSocket] Not in room: ${room}`);
            return;
        }
        this.rooms.delete(room);
        this.send({ type: 'leave', data: { room } });
        console.log(`[WebSocket] Left room: ${room}`);
    }

    /**
     * Get list of joined rooms
     */
    getRooms(): string[] {
        return Array.from(this.rooms);
    }

    // ==================== LOCAL EVENT EMITTER (for optimistic UI) ====================

    /**
     * Listen to local events (no network, client-side only)
     * Used for optimistic UI updates
     */
    onLocal(event: string, callback: Function) {
        this.localEmitter.on(event, callback);
    }

    /**
     * Remove local event listener
     */
    offLocal(event: string, callback?: Function) {
        this.localEmitter.off(event, callback);
    }

    /**
     * Emit local event (no network, client-side only)
     * Used for optimistic UI updates
     */
    emitLocal(event: string, data?: any) {
        this.localEmitter.emit(event, data);
    }
}

export default new WebSocketService();
