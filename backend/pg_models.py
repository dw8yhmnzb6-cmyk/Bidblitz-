"""
BidBlitz PostgreSQL Models
SQLAlchemy ORM models for the gaming platform
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from database import Base

def generate_uuid():
    """Generate a UUID string"""
    return str(uuid.uuid4())

def utc_now():
    """Get current UTC time"""
    return datetime.now(timezone.utc)


class User(Base):
    """User model for authentication and profile"""
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(20), default='customer', index=True)  # customer, admin, staff
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    scores = relationship("GameScore", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_users_email_active', 'email', 'is_active'),
    )


class Wallet(Base):
    """User wallet for coins and balance"""
    __tablename__ = 'wallets'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    coins = Column(Integer, default=0)
    balance = Column(Float, default=0.0)  # Real money balance
    total_earned = Column(Integer, default=0)  # Total coins earned
    total_spent = Column(Integer, default=0)  # Total coins spent
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    user = relationship("User", back_populates="wallet")


class Game(Base):
    """Game model for the gaming platform"""
    __tablename__ = 'games'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # puzzle, arcade, tycoon, strategy, 3d
    description = Column(Text, nullable=True)
    thumbnail = Column(String(500), nullable=True)
    game_url = Column(String(500), nullable=True)  # URL to game HTML file
    min_score = Column(Integer, default=0)
    max_reward = Column(Integer, default=100)
    cost_to_play = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    play_count = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    scores = relationship("GameScore", back_populates="game", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_games_category_active', 'category', 'is_active'),
    )


class GameScore(Base):
    """Game scores and history"""
    __tablename__ = 'game_scores'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    game_id = Column(String(36), ForeignKey('games.id', ondelete='CASCADE'), nullable=False, index=True)
    score = Column(Integer, default=0)
    reward = Column(Integer, default=0)
    play_duration = Column(Integer, nullable=True)  # seconds
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    user = relationship("User", back_populates="scores")
    game = relationship("Game", back_populates="scores")
    
    __table_args__ = (
        Index('idx_scores_user_game', 'user_id', 'game_id'),
        Index('idx_scores_created', 'created_at'),
    )


class Auction(Base):
    """Auction model for bidding system"""
    __tablename__ = 'auctions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    product_id = Column(String(36), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    start_price = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)
    retail_price = Column(Float, default=0.0)
    bid_increment = Column(Float, default=0.01)
    status = Column(String(20), default='pending', index=True)  # pending, active, ended, cancelled
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True, index=True)
    winner_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    last_bidder_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    last_bidder_name = Column(String(200), nullable=True)
    bid_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    __table_args__ = (
        Index('idx_auctions_status_end', 'status', 'end_time'),
    )


class Product(Base):
    """Product model for auction items"""
    __tablename__ = 'products'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    retail_price = Column(Float, default=0.0)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    stock = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Transaction(Base):
    """Transaction history for wallet operations"""
    __tablename__ = 'transactions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # deposit, withdraw, game_reward, bid, purchase
    amount = Column(Float, default=0.0)
    coins = Column(Integer, default=0)
    description = Column(String(500), nullable=True)
    reference_id = Column(String(100), nullable=True)  # Related auction/game ID
    status = Column(String(20), default='completed', index=True)  # pending, completed, failed
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    __table_args__ = (
        Index('idx_transactions_user_type', 'user_id', 'type'),
        Index('idx_transactions_created', 'created_at'),
    )
