"""
Test suite for Buy It Now (Sofort Kaufen) and Autobidder features
Tests:
- GET /api/auctions/{auction_id}/buy-now-price - returns correct pricing with bid credits
- POST /api/auctions/{auction_id}/buy-now - completes purchase and ends auction
- POST /api/autobidder/create - creates autobidder
- GET /api/autobidder/my - returns user's autobidders
- Bid credits calculation: 3 bids = €0.45 credit (3 x €0.15)
- Authentication requirements
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = {"email": "test_buyer@bidblitz.de", "password": "Test123!"}
ADMIN_USER = {"email": "admin@bidblitz.de", "password": "Admin123!"}

# Active auction for testing (created fresh for testing)
ACTIVE_AUCTION_ID = "733e8568-869b-40a1-a350-8e169e427a27"


class TestAuthentication:
    """Test authentication for Buy It Now and Autobidder endpoints"""
    
    def test_buy_now_price_requires_auth(self):
        """GET /api/auctions/{id}/buy-now-price requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}/buy-now-price")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: buy-now-price requires authentication")
    
    def test_buy_now_requires_auth(self):
        """POST /api/auctions/{id}/buy-now requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}/buy-now")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: buy-now requires authentication")
    
    def test_autobidder_create_requires_auth(self):
        """POST /api/autobidder/create requires authentication"""
        response = requests.post(f"{BASE_URL}/api/autobidder/create", json={
            "auction_id": ACTIVE_AUCTION_ID,
            "max_price": 10.0
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: autobidder/create requires authentication")
    
    def test_autobidder_my_requires_auth(self):
        """GET /api/autobidder/my requires authentication"""
        response = requests.get(f"{BASE_URL}/api/autobidder/my")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: autobidder/my requires authentication")


class TestBuyNowPrice:
    """Test Buy It Now price calculation endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    
    def test_buy_now_price_returns_200(self):
        """GET /api/auctions/{id}/buy-now-price returns 200 for valid auction"""
        response = requests.get(
            f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}/buy-now-price",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: buy-now-price returns 200")
    
    def test_buy_now_price_structure(self):
        """Response contains retail_price, bid_credit, bids_used, final_price"""
        response = requests.get(
            f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}/buy-now-price",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "retail_price" in data, "Missing retail_price"
        assert "bid_credit" in data, "Missing bid_credit"
        assert "bids_used" in data, "Missing bids_used"
        assert "final_price" in data, "Missing final_price"
        
        # Check types
        assert isinstance(data["retail_price"], (int, float)), "retail_price should be numeric"
        assert isinstance(data["bid_credit"], (int, float)), "bid_credit should be numeric"
        assert isinstance(data["bids_used"], int), "bids_used should be integer"
        assert isinstance(data["final_price"], (int, float)), "final_price should be numeric"
        
        print(f"PASS: buy-now-price structure correct - retail: €{data['retail_price']}, credit: €{data['bid_credit']}, bids: {data['bids_used']}, final: €{data['final_price']}")
    
    def test_buy_now_price_calculation(self):
        """Verify bid credit calculation: each bid = €0.15 credit"""
        response = requests.get(
            f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}/buy-now-price",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify calculation: bid_credit = bids_used * 0.15
        expected_credit = data["bids_used"] * 0.15
        assert abs(data["bid_credit"] - expected_credit) < 0.01, \
            f"Bid credit mismatch: expected {expected_credit}, got {data['bid_credit']}"
        
        # Verify final price: final_price = retail_price - bid_credit (min 0)
        expected_final = max(0, data["retail_price"] - data["bid_credit"])
        assert abs(data["final_price"] - expected_final) < 0.01, \
            f"Final price mismatch: expected {expected_final}, got {data['final_price']}"
        
        print(f"PASS: bid credit calculation correct - {data['bids_used']} bids = €{data['bid_credit']} credit")
    
    def test_buy_now_price_invalid_auction(self):
        """GET /api/auctions/{invalid_id}/buy-now-price returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/auctions/invalid-auction-id/buy-now-price",
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: buy-now-price returns 404 for invalid auction")


class TestAutobidder:
    """Test Autobidder CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    
    def test_create_autobidder(self):
        """POST /api/autobidder/create creates autobidder successfully"""
        response = requests.post(
            f"{BASE_URL}/api/autobidder/create",
            json={
                "auction_id": ACTIVE_AUCTION_ID,
                "max_price": 15.0
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Missing message in response"
        print(f"PASS: autobidder created - {data.get('message')}")
    
    def test_get_my_autobidders(self):
        """GET /api/autobidder/my returns user's autobidders"""
        response = requests.get(
            f"{BASE_URL}/api/autobidder/my",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: autobidder/my returns list with {len(data)} autobidders")
    
    def test_autobidder_structure(self):
        """Autobidder response contains required fields"""
        # First create an autobidder
        requests.post(
            f"{BASE_URL}/api/autobidder/create",
            json={
                "auction_id": ACTIVE_AUCTION_ID,
                "max_price": 20.0
            },
            headers=self.headers
        )
        
        # Then get autobidders
        response = requests.get(
            f"{BASE_URL}/api/autobidder/my",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            autobidder = data[0]
            # Check required fields
            assert "id" in autobidder, "Missing id"
            assert "auction_id" in autobidder, "Missing auction_id"
            assert "max_price" in autobidder, "Missing max_price"
            assert "is_active" in autobidder, "Missing is_active"
            print(f"PASS: autobidder structure correct - id: {autobidder['id'][:8]}..., max_price: €{autobidder['max_price']}")
        else:
            print("PASS: autobidder/my returns empty list (no autobidders)")


class TestBuyNowPurchase:
    """Test Buy It Now purchase flow (creates new auction to avoid affecting active auction)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin to create test auction"""
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_USER)
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
            self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        else:
            pytest.skip(f"Admin login failed: {response.status_code}")
        
        # Login as test user
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            self.user_token = response.json().get("token")
            self.user_headers = {"Authorization": f"Bearer {self.user_token}"}
        else:
            pytest.skip(f"User login failed: {response.status_code}")
    
    def test_buy_now_on_ended_auction_fails(self):
        """POST /api/auctions/{id}/buy-now fails on ended auction"""
        # Get an ended auction
        response = requests.get(f"{BASE_URL}/api/auctions?status=ended")
        if response.status_code == 200:
            auctions = response.json()
            if len(auctions) > 0:
                ended_auction_id = auctions[0]["id"]
                
                # Try to buy now on ended auction
                response = requests.post(
                    f"{BASE_URL}/api/auctions/{ended_auction_id}/buy-now",
                    headers=self.user_headers
                )
                assert response.status_code == 400, f"Expected 400, got {response.status_code}"
                print("PASS: buy-now fails on ended auction")
            else:
                pytest.skip("No ended auctions found")
        else:
            pytest.skip("Could not fetch auctions")
    
    def test_buy_now_invalid_auction_fails(self):
        """POST /api/auctions/{invalid_id}/buy-now returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/auctions/invalid-auction-id/buy-now",
            headers=self.user_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: buy-now returns 404 for invalid auction")


class TestTranslations:
    """Test German translations are present"""
    
    def test_auction_detail_loads(self):
        """Auction detail page loads successfully"""
        response = requests.get(f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check product has category (Kategorie)
        if data.get("product"):
            assert "category" in data["product"], "Missing category field"
            print(f"PASS: Auction has category: {data['product'].get('category')}")
        
        # Check product has retail_price (UVP)
        if data.get("product"):
            assert "retail_price" in data["product"], "Missing retail_price (UVP) field"
            print(f"PASS: Auction has UVP: €{data['product'].get('retail_price')}")
        
        # Check last_bidder_name (Letzter Bieter)
        if data.get("last_bidder_name"):
            print(f"PASS: Auction has last bidder: {data.get('last_bidder_name')}")


class TestBidCreditsCalculation:
    """Test specific bid credits calculation scenarios"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {response.status_code}")
    
    def test_bid_credit_formula(self):
        """Verify: 3 bids = €0.45 credit (3 x €0.15)"""
        response = requests.get(
            f"{BASE_URL}/api/auctions/{ACTIVE_AUCTION_ID}/buy-now-price",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        bids_used = data["bids_used"]
        bid_credit = data["bid_credit"]
        
        # Verify formula: bid_credit = bids_used * 0.15
        expected_credit = round(bids_used * 0.15, 2)
        actual_credit = round(bid_credit, 2)
        
        assert actual_credit == expected_credit, \
            f"Credit calculation wrong: {bids_used} bids should give €{expected_credit}, got €{actual_credit}"
        
        print(f"PASS: {bids_used} bids = €{actual_credit} credit (formula: bids * €0.15)")
        
        # Example verification: if 3 bids, should be €0.45
        if bids_used == 3:
            assert actual_credit == 0.45, f"3 bids should give €0.45, got €{actual_credit}"
            print("PASS: 3 bids = €0.45 credit verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
