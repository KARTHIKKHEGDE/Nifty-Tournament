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
from app.api import auth, paper_trading, candles, tournaments, admin

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
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(paper_trading.router, prefix="/api/paper-trading", tags=["Paper Trading"])
app.include_router(candles.router, prefix="/api/candles", tags=["Market Data"])
app.include_router(tournaments.router, prefix="/api/tournaments", tags=["Tournaments"])
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
    
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event.
    Clean up resources.
    """
    logger.info("Shutting down application")


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
    # Verify JWT token
    user_id = verify_token(token)
    
    if user_id is None:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Accept connection
    await manager.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "connected",
            "message": "WebSocket connected successfully",
            "user_id": user_id
        }, user_id)
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            await handle_message(user_id, data)
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        logger.info(f"WebSocket disconnected: User {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
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
