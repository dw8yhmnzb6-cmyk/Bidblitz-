"""
BidBlitz PostgreSQL Database Configuration
Async SQLAlchemy setup for FastAPI
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

# Database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Convert to async URL
    if DATABASE_URL.startswith('postgresql://'):
        ASYNC_DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')
    else:
        ASYNC_DATABASE_URL = DATABASE_URL
    
    # Create async engine
    engine = create_async_engine(
        ASYNC_DATABASE_URL,
        pool_size=10,
        max_overflow=5,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        echo=False,
        connect_args={
            "statement_cache_size": 0,  # Required for connection pooling
            "command_timeout": 30,
        }
    )
    
    # Session factory
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
else:
    engine = None
    AsyncSessionLocal = None
    print("⚠️ DATABASE_URL not set - PostgreSQL disabled")

# Base for models
Base = declarative_base()

# Dependency for FastAPI
async def get_db():
    """Get database session for FastAPI dependency injection"""
    if AsyncSessionLocal is None:
        raise Exception("Database not configured")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Check if PostgreSQL is available
def is_postgres_available():
    """Check if PostgreSQL is configured"""
    return DATABASE_URL is not None and engine is not None
