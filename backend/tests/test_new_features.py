"""
Test suite for BidBlitz new features:
- BIETEN button fix (correct API endpoint)
- Auction of the Day (AOTD)
- User Statistics
- Social Sharing (frontend only)
- Admin AOTD setting
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBidEndpoint:
    """Test the fixed BIETEN button endpoint"""
    
    def test_bid_endpoint_exists(self):
        """Test that /api/auctions/{id}/bid endpoint exists"""
        # Get an active auction first
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        assert response.status_code == 200
        auctions = response.json()
        assert len(auctions) > 0, "No active auctions found"
        
        auction_id = auctions[0]['id']
        
        # Test bid endpoint without auth (should return 401)
        bid_response = requests.post(f"{BASE_URL}/api/auctions/{auction_id}/bid")
        assert bid_response.status_code == 401, f"Expected 401, got {bid_response.status_code}"
        print(f"✅ Bid endpoint /api/auctions/{auction_id}/bid exists and requires auth")


class TestAuctionOfTheDay:
    """Test Auction of the Day feature"""
    
    def test_aotd_endpoint_exists(self):
        """Test GET /api/auction-of-the-day endpoint"""
        response = requests.get(f"{BASE_URL}/api/auction-of-the-day")
        assert response.status_code == 200
        print("✅ AOTD endpoint returns 200")
        
        data = response.json()
        if data:
            # If AOTD is set, verify structure
            assert 'id' in data, "AOTD should have id"
            assert 'current_price' in data, "AOTD should have current_price"
            assert 'product' in data or 'product_id' in data, "AOTD should have product info"
            print(f"✅ AOTD data structure valid: {data.get('product', {}).get('name', 'N/A')}")
        else:
            print("⚠️ No AOTD set (auto-selection may apply)")
    
    def test_admin_set_aotd_requires_auth(self):
        """Test POST /api/admin/auction-of-the-day/{id} requires admin auth"""
        # Get an auction ID
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        auctions = response.json()
        if len(auctions) > 0:
            auction_id = auctions[0]['id']
            
            # Try without auth
            set_response = requests.post(f"{BASE_URL}/api/admin/auction-of-the-day/{auction_id}")
            assert set_response.status_code == 401, f"Expected 401, got {set_response.status_code}"
            print("✅ Admin AOTD endpoint requires authentication")


class TestUserStats:
    """Test User Statistics endpoints"""
    
    def test_user_stats_requires_auth(self):
        """Test /api/user/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/stats")
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print("✅ User stats endpoint requires authentication")
    
    def test_achievements_endpoint(self):
        """Test /api/auth/achievements endpoint"""
        response = requests.get(f"{BASE_URL}/api/auth/achievements")
        # Should require auth
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Achievements endpoint requires authentication")


class TestAuthentication:
    """Test authentication flow"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "kunde@bidblitz.de",
            "password": "Kunde123!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@bidblitz.de",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_customer_login(self):
        """Test customer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "kunde@bidblitz.de",
            "password": "Kunde123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("✅ Customer login successful")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@bidblitz.de",
            "password": "Admin123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("✅ Admin login successful")


class TestAuthenticatedFeatures:
    """Test features that require authentication"""
    
    @pytest.fixture
    def customer_session(self):
        """Get authenticated customer session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "kunde@bidblitz.de",
            "password": "Kunde123!"
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            session = requests.Session()
            session.headers.update({"Authorization": f"Bearer {token}"})
            return session
        pytest.skip("Customer login failed")
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@bidblitz.de",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            session = requests.Session()
            session.headers.update({"Authorization": f"Bearer {token}"})
            return session
        pytest.skip("Admin login failed")
    
    def test_authenticated_bid(self, customer_session):
        """Test placing a bid with authentication"""
        # Get an active auction
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        auctions = response.json()
        if len(auctions) == 0:
            pytest.skip("No active auctions")
        
        auction_id = auctions[0]['id']
        
        # Place bid
        bid_response = customer_session.post(f"{BASE_URL}/api/auctions/{auction_id}/bid")
        # Should succeed or fail due to insufficient bids
        assert bid_response.status_code in [200, 400], f"Unexpected status: {bid_response.status_code}"
        
        if bid_response.status_code == 200:
            data = bid_response.json()
            assert "new_price" in data or "bids_remaining" in data
            print(f"✅ Bid placed successfully")
        else:
            print(f"⚠️ Bid failed (expected if no bids): {bid_response.json()}")
    
    def test_user_achievements(self, customer_session):
        """Test fetching user achievements"""
        response = customer_session.get(f"{BASE_URL}/api/auth/achievements")
        assert response.status_code == 200
        data = response.json()
        assert "earned" in data or "total" in data or isinstance(data, list)
        print("✅ User achievements fetched successfully")
    
    def test_admin_set_aotd(self, admin_session):
        """Test admin setting Auction of the Day"""
        # Get an active auction
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        auctions = response.json()
        if len(auctions) == 0:
            pytest.skip("No active auctions")
        
        auction_id = auctions[0]['id']
        
        # Set as AOTD
        set_response = admin_session.post(f"{BASE_URL}/api/admin/auction-of-the-day/{auction_id}")
        assert set_response.status_code == 200
        data = set_response.json()
        assert "message" in data
        print(f"✅ Admin set AOTD successfully: {data}")
        
        # Verify AOTD is set
        verify_response = requests.get(f"{BASE_URL}/api/auction-of-the-day")
        assert verify_response.status_code == 200
        aotd_data = verify_response.json()
        if aotd_data:
            assert aotd_data.get('id') == auction_id
            print("✅ AOTD verified")


class TestAuctionEndpoints:
    """Test auction-related endpoints"""
    
    def test_get_auctions(self):
        """Test GET /api/auctions"""
        response = requests.get(f"{BASE_URL}/api/auctions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} auctions")
    
    def test_get_active_auctions(self):
        """Test GET /api/auctions?status=active"""
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for auction in data:
            assert auction.get('status') == 'active'
        print(f"✅ Got {len(data)} active auctions")
    
    def test_get_auction_detail(self):
        """Test GET /api/auctions/{id}"""
        # Get an auction first
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        auctions = response.json()
        if len(auctions) == 0:
            pytest.skip("No auctions available")
        
        auction_id = auctions[0]['id']
        detail_response = requests.get(f"{BASE_URL}/api/auctions/{auction_id}")
        assert detail_response.status_code == 200
        data = detail_response.json()
        assert data.get('id') == auction_id
        print(f"✅ Got auction detail: {data.get('product', {}).get('name', 'N/A')}")
    
    def test_get_bid_history(self):
        """Test GET /api/auctions/{id}/bid-history"""
        # Get an auction first
        response = requests.get(f"{BASE_URL}/api/auctions?status=active")
        auctions = response.json()
        if len(auctions) == 0:
            pytest.skip("No auctions available")
        
        auction_id = auctions[0]['id']
        history_response = requests.get(f"{BASE_URL}/api/auctions/{auction_id}/bid-history")
        assert history_response.status_code == 200
        data = history_response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} bid history entries")


class TestProducts:
    """Test product endpoints"""
    
    def test_get_products(self):
        """Test GET /api/products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} products")


class TestHealthCheck:
    """Test health endpoints"""
    
    def test_health(self):
        """Test /api/health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✅ Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
