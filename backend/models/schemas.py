"""Pydantic models for request/response validation"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ==================== AUTH MODELS ====================

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str
    totp_code: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None

class PasswordReset(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class Enable2FA(BaseModel):
    totp_code: str

class Disable2FA(BaseModel):
    totp_code: str

# ==================== PRODUCT MODELS ====================

class ProductCreate(BaseModel):
    name: str
    description: str
    retail_price: float
    image_url: str
    category: Optional[str] = "Allgemein"

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    retail_price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None

# ==================== AUCTION MODELS ====================

class AuctionCreate(BaseModel):
    product_id: str
    start_price: float = 0.01
    price_increment: float = 0.01
    duration_hours: int = 24
    start_time: Optional[str] = None

class AuctionUpdate(BaseModel):
    status: Optional[str] = None
    end_time: Optional[str] = None

class BidPlace(BaseModel):
    auction_id: str

# ==================== VOUCHER MODELS ====================

class VoucherCreate(BaseModel):
    code: str
    bids: int
    max_uses: int = 1
    valid_until: Optional[str] = None

class VoucherRedeem(BaseModel):
    code: str

# ==================== BOT MODELS ====================

class BotCreate(BaseModel):
    name: str

class BotBidRequest(BaseModel):
    auction_id: str
    bot_id: str
    target_price: Optional[float] = None
    num_bids: Optional[int] = None
    delay_seconds: Optional[int] = 2

class MultiBotBidRequest(BaseModel):
    auction_id: str
    target_price: float
    min_delay: Optional[float] = 1.0

# ==================== CHECKOUT MODELS ====================

class CheckoutCreate(BaseModel):
    package_id: str
    origin_url: str

class CryptoCheckoutRequest(BaseModel):
    package_id: str
    bids: int
    price: float

# ==================== EMAIL MODELS ====================

class EmailCampaignCreate(BaseModel):
    subject: str
    html_content: str
    target_group: str = "all"

class EmailTestSend(BaseModel):
    to_email: str
    subject: str
    html_content: str

# ==================== AFFILIATE MODELS ====================

class AffiliateSignup(BaseModel):
    payment_details: str

class AffiliatePayoutRequest(BaseModel):
    affiliate_id: str
    amount: float

# ==================== WISHLIST MODELS ====================

class WishlistItem(BaseModel):
    item_type: str  # 'product' or 'category'
    item_id: str
    item_name: str

# ==================== AUTOBIDDER MODELS ====================

class AutobidderConfig(BaseModel):
    auction_id: str
    max_bids: int
    max_price: Optional[float] = None
    bid_in_last_seconds: int = 10
