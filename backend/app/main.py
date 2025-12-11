"""
Main FastAPI application for Nifty Options Trading Platform.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db, init_db
from app.utils.logger import setup_logger
from app.utils.jwt_utils import verify_token
from app.websocket.manager import manager
from app.websocket.handlers import handle_message

# Import API routers
from app.api import auth, paper_trading, candles, tournaments, admin, teams

logger = setup_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Paper Trading Platform for NIFTY Options with Real Money Tournament Prizes",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(paper_trading.router, prefix="/api/paper-trading", tags=["Paper Trading"])
app.include_router(candles.router, prefix="/api/candles", tags=["Market Data"])
app.include_router(tournaments.router, prefix="/api/tournaments", tags=["Tournaments"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.on_event("startup")
async def startup_event():
    """
    Application startup event.
    Initialize database and other services.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Paper trading only: {settings.PAPER_TRADING_ONLY}")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    # Initialize and start KiteTicker service
    try:
        from app.services.ticker_service import get_ticker_service, start_ticker_service
        from app.websocket.handlers import broadcast_tick_data
        import asyncio
        
        logger.info("🔧 [STARTUP] Initializing KiteTicker service (NOT starting yet)...")
        ticker_service = get_ticker_service()
        if ticker_service:
            logger.info("✅ [STARTUP] KiteTicker service created successfully")
            # Get the main event loop
            loop = asyncio.get_event_loop()
            
            # Set callback to broadcast ticks to WebSocket clients
            def tick_callback(tick_data):
                # Schedule coroutine in the main event loop from another thread
                logger.info(f"🔔 [TICK CALLBACK] Received tick: {tick_data.get('symbol')} @ {tick_data.get('last_price')}")
                try:
                    asyncio.run_coroutine_threadsafe(broadcast_tick_data(tick_data), loop)
                    logger.info(f"✅ [TICK CALLBACK] Broadcasted tick for {tick_data.get('symbol')}")
                except Exception as e:
                    logger.error(f"❌ [TICK CALLBACK] Error broadcasting tick data: {e}")
            
            ticker_service.set_tick_callback(tick_callback)
            logger.info("✅ [STARTUP] KiteTicker service initialized (will start on first subscription)")
        else:
            logger.error("❌ [STARTUP] KiteTicker service NOT available - missing credentials!")
            logger.error("❌ [STARTUP] Please check MARKET_API_KEY and MARKET_ACCESS_TOKEN in .env")
    except Exception as e:
        logger.error(f"Failed to start KiteTicker service: {e}")
    
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event.
    Clean up resources.
    """
    logger.info("Shutting down application")
    
    # Stop KiteTicker service
    try:
        from app.services.ticker_service import stop_ticker_service
        stop_ticker_service()
        logger.info("✓ KiteTicker service stopped")
    except Exception as e:
        logger.error(f"Error stopping KiteTicker service: {e}")


@app.get("/api/diagnostics")
async def diagnostics():
    """
    Diagnostic endpoint to check WebSocket ticker service status.
    """
    from app.services.ticker_service import get_ticker_service
    
    ticker_service = get_ticker_service()
    
    if not ticker_service:
        return JSONResponse({
            "status": "error",
            "ticker_service": "not initialized",
            "message": "KiteTicker service is not available. Check MARKET_API_KEY and MARKET_ACCESS_TOKEN in .env",
            "websocket_connections": len(manager.connections),
            "subscribed_symbols": list(manager.subscriptions.keys()) if hasattr(manager, 'subscriptions') else []
        }, status_code=503)
    
    return JSONResponse({
        "status": "ok",
        "ticker_service": {
            "initialized": True,
            "connected": ticker_service.is_connected,
            "subscribed_tokens": list(ticker_service.subscribed_tokens) if hasattr(ticker_service, 'subscribed_tokens') else []
        },
        "websocket_manager": {
            "active_connections": len(manager.connections),
            "subscribed_symbols": list(manager.subscriptions.keys()) if hasattr(manager, 'subscriptions') else [],
            "subscribers_per_symbol": {
                symbol: len(users) for symbol, users in (manager.subscriptions.items() if hasattr(manager, 'subscriptions') else {}).items()
            }
        }
    })


@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "paper_trading_only": settings.PAPER_TRADING_ONLY,
        "docs": "/docs",
        "websocket": "/ws"
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.
    """
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "websocket_connections": manager.get_connection_count()
    }


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token")
):
    """
    WebSocket endpoint for real-time data streaming.
    
    Clients must provide a valid JWT token as a query parameter.
    
    Message format (from client):
    {
        "type": "subscribe" | "unsubscribe" | "ping",
        "symbol": "NIFTY 50" (for subscribe/unsubscribe)
    }
    
    Message format (to client):
    {
        "type": "price_update" | "tick" | "subscribed" | "unsubscribed" | "error" | "pong",
        "symbol": "NIFTY 50",
        "price": 19450.25,
        "volume": 1000,
        "timestamp": "2024-01-01T10:00:00"
    }
    """
    logger.info(f"🔵 [WebSocket] New connection attempt")
    logger.info(f"🔵 [WebSocket] Token received: {token[:20]}..." if len(token) > 20 else f"🔵 [WebSocket] Token: {token}")
    
    # Verify JWT token BEFORE accepting connection
    try:
        user_id = verify_token(token)
        logger.info(f"🔵 [WebSocket] Token verification result: user_id={user_id}")
    except Exception as e:
        logger.error(f"❌ [WebSocket] Token verification error: {e}")
        # Must accept connection before closing it
        await websocket.accept()
        await websocket.close(code=1008, reason=f"Token verification failed: {str(e)}")
        return
    
    if user_id is None:
        logger.error(f"❌ [WebSocket] Invalid token - closing connection")
        # Must accept connection before closing it
        await websocket.accept()
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Accept connection for valid user
    logger.info(f"✅ [WebSocket] Token valid, accepting connection for user {user_id}")
    try:
        await manager.connect(websocket, user_id)
        logger.info(f"✅ [WebSocket] Connection accepted for user {user_id}")
    except Exception as e:
        logger.error(f"❌ [WebSocket] Failed to accept connection: {e}")
        await websocket.close(code=1011, reason=f"Connection error: {str(e)}")
        return
    
    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "connected",
            "message": "WebSocket connected successfully",
            "user_id": user_id
        }, user_id)
        logger.info(f"📨 [WebSocket] Welcome message sent to user {user_id}")
        
        # Listen for messages
        logger.info(f"👂 [WebSocket] Starting message loop for user {user_id}")
        while True:
            logger.info(f"⏳ [WebSocket] Waiting for message from user {user_id}...")
            data = await websocket.receive_text()
            logger.info(f"📬 [WebSocket] Received message from user {user_id}: {data}")
            await handle_message(user_id, data)
            logger.info(f"✅ [WebSocket] Message handled for user {user_id}")
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        logger.info(f"🔴 [WebSocket] User {user_id} disconnected gracefully")
    except Exception as e:
        logger.error(f"❌ [WebSocket] Error for user {user_id}: {e}", exc_info=True)
        manager.disconnect(user_id)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
