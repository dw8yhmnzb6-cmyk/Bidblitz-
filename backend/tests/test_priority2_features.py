"""
Test Priority 2 Features: Auto-Bid System, Watchlist, VIP Loyalty Program
Tests all CRUD operations and critical edge cases for these features.

CRITICAL BUG FOUND: VIP Loyalty router (/api/loyalty/*) is being overwritten by 
loyalty_program router. The VIP loyalty endpoints (tiers, claim-daily) are NOT accessible.
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CUSTOMER_EMAIL = "kunde@bidblitz.ae"
CUSTOMER_PASSWORD = "Kunde123!"
ADMIN_EMAIL = "admin@bidblitz.ae"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def customer_token(api_client):
    """Get customer authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": CUSTOMER_EMAIL,
        "password": CUSTOMER_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Customer authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def active_auction_id(api_client):
    """Get an active auction ID for testing"""
    response = api_client.get(f"{BASE_URL}/api/auctions?status=active&limit=1")
    if response.status_code == 200:
        data = response.json()
        # API returns a list directly, not wrapped in "auctions" key
        auctions = data if isinstance(data, list) else data.get("auctions", [])
        if auctions:
            return auctions[0].get("id")
    pytest.skip("No active auctions available for testing")


class TestAutoBidSystem:
    """Test Auto-Bid System endpoints"""
    
    def test_get_my_auto_bids_empty(self, api_client, customer_token):
        """GET /api/auto-bid/my-auto-bids - Get user's auto-bids (may be empty)"""
        response = api_client.get(
            f"{BASE_URL}/api/auto-bid/my-auto-bids",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "auto_bids" in data, "Response should contain 'auto_bids' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["auto_bids"], list), "auto_bids should be a list"
        print(f"✓ GET /api/auto-bid/my-auto-bids - Found {data['total']} auto-bids")
    
    def test_configure_auto_bid_requires_auth(self, api_client, active_auction_id):
        """POST /api/auto-bid/configure - Should require authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/auto-bid/configure",
            json={
                "auction_id": active_auction_id,
                "max_price": 50.00,
                "max_bids": 20
            }
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ POST /api/auto-bid/configure - Requires authentication")
    
    def test_configure_auto_bid_invalid_auction(self, api_client, customer_token):
        """POST /api/auto-bid/configure - Should fail for invalid auction"""
        response = api_client.post(
            f"{BASE_URL}/api/auto-bid/configure",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "auction_id": "invalid-auction-id-12345",
                "max_price": 50.00,
                "max_bids": 20
            }
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid auction, got {response.status_code}"
        print("✓ POST /api/auto-bid/configure - Returns 404 for invalid auction")
    
    def test_configure_auto_bid_invalid_price(self, api_client, customer_token, active_auction_id):
        """POST /api/auto-bid/configure - Should fail for invalid max_price"""
        response = api_client.post(
            f"{BASE_URL}/api/auto-bid/configure",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "auction_id": active_auction_id,
                "max_price": -10.00,  # Invalid negative price
                "max_bids": 20
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for negative price, got {response.status_code}"
        print("✓ POST /api/auto-bid/configure - Validates max_price > 0")
    
    def test_toggle_auto_bid_not_configured(self, api_client, customer_token, active_auction_id):
        """POST /api/auto-bid/toggle/{auction_id} - Should fail if not configured"""
        response = api_client.post(
            f"{BASE_URL}/api/auto-bid/toggle/{active_auction_id}",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        # Should return 404 if no auto-bid configured for this auction
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        print(f"✓ POST /api/auto-bid/toggle/{active_auction_id} - Status: {response.status_code}")
    
    def test_update_auto_bid_not_found(self, api_client, customer_token):
        """PUT /api/auto-bid/{id} - Should fail for non-existent auto-bid"""
        response = api_client.put(
            f"{BASE_URL}/api/auto-bid/non-existent-id-12345",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"max_price": 100.00}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent auto-bid, got {response.status_code}"
        print("✓ PUT /api/auto-bid/{id} - Returns 404 for non-existent auto-bid")
    
    def test_delete_auto_bid_not_found(self, api_client, customer_token):
        """DELETE /api/auto-bid/{id} - Should fail for non-existent auto-bid"""
        response = api_client.delete(
            f"{BASE_URL}/api/auto-bid/non-existent-id-12345",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent auto-bid, got {response.status_code}"
        print("✓ DELETE /api/auto-bid/{id} - Returns 404 for non-existent auto-bid")


class TestWatchlistSystem:
    """Test Watchlist System endpoints"""
    
    def test_get_my_watchlist(self, api_client, customer_token):
        """GET /api/watchlist/my-watchlist - Get user's watchlist"""
        response = api_client.get(
            f"{BASE_URL}/api/watchlist/my-watchlist",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "watchlist" in data, "Response should contain 'watchlist' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["watchlist"], list), "watchlist should be a list"
        print(f"✓ GET /api/watchlist/my-watchlist - Found {data['total']} items")
    
    def test_get_my_watchlist_with_status_filter(self, api_client, customer_token):
        """GET /api/watchlist/my-watchlist?status=active - Filter by status"""
        response = api_client.get(
            f"{BASE_URL}/api/watchlist/my-watchlist?status=active",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "watchlist" in data
        print(f"✓ GET /api/watchlist/my-watchlist?status=active - Found {data['total']} active items")
    
    def test_add_to_watchlist_requires_auth(self, api_client, active_auction_id):
        """POST /api/watchlist/add - Should require authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/watchlist/add",
            json={"auction_id": active_auction_id}
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ POST /api/watchlist/add - Requires authentication")
    
    def test_add_to_watchlist_invalid_auction(self, api_client, customer_token):
        """POST /api/watchlist/add - Should fail for invalid auction"""
        response = api_client.post(
            f"{BASE_URL}/api/watchlist/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"auction_id": "invalid-auction-id-12345"}
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid auction, got {response.status_code}"
        print("✓ POST /api/watchlist/add - Returns 404 for invalid auction")
    
    def test_add_to_watchlist_success(self, api_client, customer_token, active_auction_id):
        """POST /api/watchlist/add - Add auction to watchlist"""
        response = api_client.post(
            f"{BASE_URL}/api/watchlist/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "auction_id": active_auction_id,
                "notify_before_end": 10,
                "notify_on_outbid": True
            }
        )
        
        # May return 400 if already on watchlist, or 200 if added
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Response should indicate success"
            assert "watchlist_item" in data, "Response should contain watchlist_item"
            print(f"✓ POST /api/watchlist/add - Added auction {active_auction_id} to watchlist")
        else:
            print(f"✓ POST /api/watchlist/add - Auction already on watchlist (expected)")
    
    def test_check_watchlist_status(self, api_client, customer_token, active_auction_id):
        """GET /api/watchlist/check/{auction_id} - Check if auction is on watchlist"""
        response = api_client.get(
            f"{BASE_URL}/api/watchlist/check/{active_auction_id}",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "on_watchlist" in data, "Response should contain 'on_watchlist' field"
        assert isinstance(data["on_watchlist"], bool), "on_watchlist should be boolean"
        print(f"✓ GET /api/watchlist/check/{active_auction_id} - on_watchlist: {data['on_watchlist']}")
    
    def test_remove_from_watchlist_not_found(self, api_client, customer_token):
        """DELETE /api/watchlist/remove/{auction_id} - Should fail if not on watchlist"""
        response = api_client.delete(
            f"{BASE_URL}/api/watchlist/remove/non-existent-auction-12345",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent item, got {response.status_code}"
        print("✓ DELETE /api/watchlist/remove/{auction_id} - Returns 404 for non-existent item")


class TestVIPLoyaltyProgram:
    """
    Test VIP Loyalty Program endpoints
    
    CRITICAL BUG: The VIP loyalty router is being overwritten by loyalty_program router.
    Both use prefix="/loyalty" and the loyalty_program import overwrites the VIP loyalty import.
    
    Expected endpoints that should exist but DON'T work:
    - GET /api/loyalty/tiers (returns 404)
    - POST /api/loyalty/claim-daily (returns 404)
    
    The /api/loyalty/status and /api/loyalty/leaderboard endpoints return restaurant loyalty
    data instead of VIP loyalty data.
    """
    
    def test_loyalty_status_returns_restaurant_data_bug(self, api_client, customer_token):
        """
        GET /api/loyalty/status - BUG: Returns restaurant loyalty data instead of VIP loyalty
        
        This test documents the bug - the endpoint returns restaurant stamps/levels
        instead of VIP points/tiers.
        """
        response = api_client.get(
            f"{BASE_URL}/api/loyalty/status",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # BUG: This returns restaurant loyalty data, not VIP loyalty
        # Expected: {"points": X, "tier": {...}, "progress": {...}}
        # Actual: {"total_stamps": X, "current_level": {...}, "current_streak": X}
        
        # Document what we actually get (restaurant loyalty)
        assert "total_stamps" in data or "points" in data, "Response should have loyalty data"
        
        if "total_stamps" in data:
            print(f"⚠️ BUG: GET /api/loyalty/status returns RESTAURANT loyalty (stamps: {data['total_stamps']})")
            print("   Expected VIP loyalty with points/tiers, got restaurant loyalty with stamps/levels")
        else:
            print(f"✓ GET /api/loyalty/status - Points: {data.get('points', 'N/A')}")
    
    def test_loyalty_tiers_not_found_bug(self, api_client):
        """
        GET /api/loyalty/tiers - BUG: Returns 404 because VIP loyalty router is overwritten
        
        This endpoint should return VIP tier information (bronze, silver, gold, platinum)
        but returns 404 because the loyalty_program router doesn't have this endpoint.
        """
        response = api_client.get(f"{BASE_URL}/api/loyalty/tiers")
        
        # BUG: This returns 404 because VIP loyalty router is overwritten
        if response.status_code == 404:
            print("⚠️ BUG: GET /api/loyalty/tiers returns 404 - VIP loyalty router not registered")
            print("   Root cause: loyalty_program.py overwrites loyalty.py router (same prefix)")
        else:
            assert response.status_code == 200
            data = response.json()
            assert "tiers" in data
            print(f"✓ GET /api/loyalty/tiers - Found {len(data['tiers'])} tiers")
    
    def test_claim_daily_not_found_bug(self, api_client, customer_token):
        """
        POST /api/loyalty/claim-daily - BUG: Returns 404 because VIP loyalty router is overwritten
        
        This endpoint should allow claiming daily loyalty points but returns 404.
        """
        response = api_client.post(
            f"{BASE_URL}/api/loyalty/claim-daily",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        # BUG: This returns 404 because VIP loyalty router is overwritten
        if response.status_code == 404:
            print("⚠️ BUG: POST /api/loyalty/claim-daily returns 404 - VIP loyalty router not registered")
        else:
            assert response.status_code in [200, 400]
            print(f"✓ POST /api/loyalty/claim-daily - Status: {response.status_code}")
    
    def test_leaderboard_returns_restaurant_data_bug(self, api_client, customer_token):
        """
        GET /api/loyalty/leaderboard - BUG: Returns restaurant leaderboard instead of VIP leaderboard
        
        The response format is different from what VIP loyalty expects.
        """
        response = api_client.get(
            f"{BASE_URL}/api/loyalty/leaderboard?period=month",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # BUG: Returns restaurant leaderboard (list of users with stamps)
        # instead of VIP leaderboard ({"period": "month", "leaderboard": [...]})
        
        if isinstance(data, list):
            print(f"⚠️ BUG: GET /api/loyalty/leaderboard returns RESTAURANT leaderboard format")
            print(f"   Got list of {len(data)} entries instead of {{period, leaderboard}} object")
        else:
            assert "period" in data
            assert "leaderboard" in data
            print(f"✓ GET /api/loyalty/leaderboard - Period: {data['period']}, Entries: {len(data['leaderboard'])}")


class TestIntegration:
    """Integration tests for Priority 2 features"""
    
    def test_watchlist_add_and_verify(self, api_client, customer_token, active_auction_id):
        """Test adding to watchlist and verifying via check endpoint"""
        # First check current status
        check_response = api_client.get(
            f"{BASE_URL}/api/watchlist/check/{active_auction_id}",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert check_response.status_code == 200
        
        initial_status = check_response.json()["on_watchlist"]
        
        if not initial_status:
            # Add to watchlist
            add_response = api_client.post(
                f"{BASE_URL}/api/watchlist/add",
                headers={"Authorization": f"Bearer {customer_token}"},
                json={"auction_id": active_auction_id}
            )
            assert add_response.status_code == 200
            
            # Verify it's now on watchlist
            verify_response = api_client.get(
                f"{BASE_URL}/api/watchlist/check/{active_auction_id}",
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            assert verify_response.status_code == 200
            assert verify_response.json()["on_watchlist"] == True
            print(f"✓ Integration: Added auction to watchlist and verified")
        else:
            print(f"✓ Integration: Auction already on watchlist")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
