"""
Test suite for Wheel (Glücksrad) and Leaderboard features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "kunde@bidblitz.de"
TEST_USER_PASSWORD = "Kunde123!"
ADMIN_EMAIL = "admin@bidblitz.de"
ADMIN_PASSWORD = "Admin123!"


class TestWheelAPI:
    """Test Wheel (Glücksrad) API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email=TEST_USER_EMAIL, password=TEST_USER_PASSWORD):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_wheel_prizes_public(self):
        """Test GET /api/wheel/prizes - public endpoint"""
        response = self.session.get(f"{BASE_URL}/api/wheel/prizes")
        assert response.status_code == 200
        
        data = response.json()
        assert "prizes" in data
        assert len(data["prizes"]) > 0
        
        # Verify prize structure
        for prize in data["prizes"]:
            assert "type" in prize
            assert "value" in prize
            assert "label" in prize
            assert prize["type"] in ["bids", "discount", "vip_day", "retry"]
        
        print(f"✓ Wheel prizes endpoint returns {len(data['prizes'])} prizes")
    
    def test_wheel_status_requires_auth(self):
        """Test GET /api/wheel/status requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/wheel/status")
        assert response.status_code == 401
        print("✓ Wheel status requires authentication")
    
    def test_wheel_status_authenticated(self):
        """Test GET /api/wheel/status with authentication"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        response = self.session.get(
            f"{BASE_URL}/api/wheel/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "can_spin" in data
        assert isinstance(data["can_spin"], bool)
        
        if not data["can_spin"]:
            assert "next_spin_time" in data
            print(f"✓ User cannot spin, next spin at: {data['next_spin_time']}")
        else:
            print("✓ User can spin the wheel")
    
    def test_wheel_spin_requires_auth(self):
        """Test POST /api/wheel/spin requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/wheel/spin")
        assert response.status_code == 401
        print("✓ Wheel spin requires authentication")
    
    def test_wheel_history_authenticated(self):
        """Test GET /api/wheel/history with authentication"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        response = self.session.get(
            f"{BASE_URL}/api/wheel/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "spins" in data
        assert isinstance(data["spins"], list)
        
        print(f"✓ Wheel history returns {len(data['spins'])} spin records")


class TestLeaderboardAPI:
    """Test Leaderboard API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email=TEST_USER_EMAIL, password=TEST_USER_PASSWORD):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_leaderboard_public(self):
        """Test GET /api/leaderboard/public - public endpoint"""
        response = self.session.get(f"{BASE_URL}/api/leaderboard/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert "week_start" in data
        assert "week_end" in data
        assert "prizes" in data
        
        # Verify prizes structure
        assert "1" in data["prizes"]
        assert "bids" in data["prizes"]["1"]
        assert "badge" in data["prizes"]["1"]
        
        print(f"✓ Public leaderboard returns {len(data['leaderboard'])} entries")
        print(f"  Week: {data['week_start']} to {data['week_end']}")
    
    def test_leaderboard_authenticated(self):
        """Test GET /api/leaderboard with authentication"""
        token = self.get_auth_token()
        assert token is not None, "Failed to get auth token"
        
        response = self.session.get(
            f"{BASE_URL}/api/leaderboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert "full_leaderboard" in data
        assert "current_user" in data
        assert "week_start" in data
        assert "week_end" in data
        assert "prizes" in data
        
        print(f"✓ Authenticated leaderboard returns {len(data['leaderboard'])} top entries")
        print(f"  Full leaderboard has {len(data['full_leaderboard'])} entries")
        
        if data["current_user"]:
            print(f"  Current user rank: {data['current_user'].get('rank')}")
    
    def test_leaderboard_requires_auth(self):
        """Test GET /api/leaderboard requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 401
        print("✓ Authenticated leaderboard requires authentication")
    
    def test_leaderboard_prizes_structure(self):
        """Test leaderboard prizes structure"""
        response = self.session.get(f"{BASE_URL}/api/leaderboard/public")
        assert response.status_code == 200
        
        data = response.json()
        prizes = data["prizes"]
        
        # Verify top 10 prizes exist
        for rank in range(1, 11):
            assert str(rank) in prizes, f"Prize for rank {rank} missing"
            assert "bids" in prizes[str(rank)]
            assert "badge" in prizes[str(rank)]
        
        # Verify prize values decrease with rank
        assert prizes["1"]["bids"] > prizes["2"]["bids"]
        assert prizes["2"]["bids"] > prizes["3"]["bids"]
        
        print("✓ Leaderboard prizes structure is correct")
        print(f"  1st place: {prizes['1']['bids']} bids ({prizes['1']['badge']})")
        print(f"  2nd place: {prizes['2']['bids']} bids ({prizes['2']['badge']})")
        print(f"  3rd place: {prizes['3']['bids']} bids ({prizes['3']['badge']})")


class TestAdminLeaderboard:
    """Test admin-only leaderboard endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def get_user_token(self):
        """Get regular user authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_award_prizes_requires_admin(self):
        """Test POST /api/leaderboard/award-weekly-prizes requires admin"""
        user_token = self.get_user_token()
        assert user_token is not None, "Failed to get user token"
        
        response = self.session.post(
            f"{BASE_URL}/api/leaderboard/award-weekly-prizes",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print("✓ Award prizes endpoint requires admin role")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
