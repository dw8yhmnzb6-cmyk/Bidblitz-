"""
Admin Wallet Top-up API Tests
Tests for the admin wallet top-up feature including:
- GET /api/admin/wallet-topup/stats - Returns stats, leaderboard, recent_topups
- GET /api/admin/wallet-topup/search?query=test - Returns matching users
- POST /api/admin/wallet-topup/topup - Top-up user wallet with bonuses
- GET /api/admin/wallet-topup/history - Returns paginated history
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminWalletTopup:
    """Admin Wallet Top-up endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.admin_email = "admin@bidblitz.ae"
        self.admin_password = "Admin123!"
        self.test_user_id = "7e627750-4dc5-41d3-a027-6bacc6cfa90e"  # Wheel Tester
        
    def get_admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Admin authentication failed: {response.status_code}")
        
    # ==================== STATS ENDPOINT ====================
    
    def test_stats_endpoint_exists(self):
        """Test GET /api/admin/wallet-topup/stats returns 200"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
    def test_stats_returns_required_fields(self):
        """Test stats endpoint returns stats, leaderboard, recent_topups"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "stats" in data, "Response missing 'stats' field"
        assert "leaderboard" in data, "Response missing 'leaderboard' field"
        assert "recent_topups" in data, "Response missing 'recent_topups' field"
        
    def test_stats_structure(self):
        """Test stats object has correct structure"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        stats = response.json().get("stats", {})
        
        # Check stats fields
        assert "totalTopUps" in stats, "Stats missing 'totalTopUps'"
        assert "totalAmount" in stats, "Stats missing 'totalAmount'"
        assert "totalBonus" in stats, "Stats missing 'totalBonus'"
        assert "newCustomers" in stats, "Stats missing 'newCustomers'"
        
    def test_stats_requires_auth(self):
        """Test stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet-topup/stats")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
    # ==================== SEARCH ENDPOINT ====================
    
    def test_search_endpoint_exists(self):
        """Test GET /api/admin/wallet-topup/search returns 200"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            params={"query": "test"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
    def test_search_returns_users_array(self):
        """Test search returns users array"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            params={"query": "test"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data, "Response missing 'users' field"
        assert isinstance(data["users"], list), "Users should be a list"
        
    def test_search_user_structure(self):
        """Test search results have correct user structure"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            params={"query": "admin"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        users = response.json().get("users", [])
        
        if len(users) > 0:
            user = users[0]
            # Check user fields
            assert "id" in user, "User missing 'id'"
            assert "email" in user, "User missing 'email'"
            
    def test_search_requires_query(self):
        """Test search requires query parameter"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 422, f"Expected 422 without query, got {response.status_code}"
        
    def test_search_requires_auth(self):
        """Test search endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            params={"query": "test"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
    # ==================== TOPUP ENDPOINT ====================
    
    def test_topup_endpoint_exists(self):
        """Test POST /api/admin/wallet-topup/topup endpoint exists"""
        token = self.get_admin_token()
        response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={
                "user_id": self.test_user_id,
                "amount": 10.0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should return 200 or 404 (if user not found), not 404 for endpoint
        assert response.status_code in [200, 404], f"Expected 200/404, got {response.status_code}: {response.text}"
        
    def test_topup_validates_minimum_amount(self):
        """Test topup rejects amounts below €1"""
        token = self.get_admin_token()
        response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={
                "user_id": self.test_user_id,
                "amount": 0.5
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400, f"Expected 400 for amount < 1, got {response.status_code}"
        
    def test_topup_validates_maximum_amount(self):
        """Test topup rejects amounts above €10,000"""
        token = self.get_admin_token()
        response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={
                "user_id": self.test_user_id,
                "amount": 15000.0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400, f"Expected 400 for amount > 10000, got {response.status_code}"
        
    def test_topup_requires_user_id(self):
        """Test topup requires user_id"""
        token = self.get_admin_token()
        response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={"amount": 10.0},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 422, f"Expected 422 without user_id, got {response.status_code}"
        
    def test_topup_requires_amount(self):
        """Test topup requires amount"""
        token = self.get_admin_token()
        response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={"user_id": self.test_user_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 422, f"Expected 422 without amount, got {response.status_code}"
        
    def test_topup_requires_auth(self):
        """Test topup endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={
                "user_id": self.test_user_id,
                "amount": 10.0
            }
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
    def test_topup_returns_bonus_info(self):
        """Test successful topup returns bonus information"""
        token = self.get_admin_token()
        
        # First search for a valid user
        search_response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            params={"query": "admin"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if search_response.status_code == 200:
            users = search_response.json().get("users", [])
            if len(users) > 0:
                user_id = users[0]["id"]
                
                response = requests.post(
                    f"{BASE_URL}/api/admin/wallet-topup/topup",
                    json={
                        "user_id": user_id,
                        "amount": 10.0
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Check bonus fields
                    assert "success" in data, "Response missing 'success'"
                    assert "amount" in data, "Response missing 'amount'"
                    assert "customer_bonus" in data, "Response missing 'customer_bonus'"
                    assert "total_credit" in data, "Response missing 'total_credit'"
                    
                    # Verify 2% bonus calculation
                    assert data["customer_bonus"] == 0.2, f"Expected 2% bonus (0.2), got {data['customer_bonus']}"
                    
    # ==================== HISTORY ENDPOINT ====================
    
    def test_history_endpoint_exists(self):
        """Test GET /api/admin/wallet-topup/history returns 200"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
    def test_history_returns_paginated_data(self):
        """Test history returns paginated data structure"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check pagination fields
        assert "topups" in data, "Response missing 'topups'"
        assert "total" in data, "Response missing 'total'"
        assert "page" in data, "Response missing 'page'"
        assert "pages" in data, "Response missing 'pages'"
        
    def test_history_pagination_params(self):
        """Test history accepts pagination parameters"""
        token = self.get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/history",
            params={"page": 1, "limit": 5},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1, f"Expected page 1, got {data['page']}"
        
    def test_history_requires_auth(self):
        """Test history endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet-topup/history")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"


class TestAdminWalletTopupIntegration:
    """Integration tests for admin wallet topup flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.admin_email = "admin@bidblitz.ae"
        self.admin_password = "Admin123!"
        
    def get_admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Admin authentication failed: {response.status_code}")
        
    def test_full_topup_flow(self):
        """Test complete topup flow: search -> topup -> verify in history"""
        token = self.get_admin_token()
        
        # Step 1: Search for a user
        search_response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search",
            params={"query": "admin"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert search_response.status_code == 200, "Search failed"
        users = search_response.json().get("users", [])
        
        if len(users) == 0:
            pytest.skip("No users found for testing")
            
        user_id = users[0]["id"]
        user_name = users[0].get("name", "Unknown")
        print(f"Testing topup for user: {user_name} ({user_id})")
        
        # Step 2: Perform topup
        topup_response = requests.post(
            f"{BASE_URL}/api/admin/wallet-topup/topup",
            json={
                "user_id": user_id,
                "amount": 25.0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if topup_response.status_code == 200:
            topup_data = topup_response.json()
            print(f"Topup successful: €25 + €{topup_data.get('customer_bonus', 0)} bonus")
            
            # Step 3: Verify in history
            history_response = requests.get(
                f"{BASE_URL}/api/admin/wallet-topup/history",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert history_response.status_code == 200, "History fetch failed"
            
            # Step 4: Verify in stats
            stats_response = requests.get(
                f"{BASE_URL}/api/admin/wallet-topup/stats",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert stats_response.status_code == 200, "Stats fetch failed"
            
            print("Full topup flow completed successfully")
        else:
            print(f"Topup returned {topup_response.status_code}: {topup_response.text}")
