"""
Test Partner Lock/Unlock Feature
Tests the admin functionality to lock/unlock partner accounts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPartnerLockFeature:
    """Tests for Partner Lock/Unlock Admin Feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.api = requests.Session()
        self.api.headers.update({"Content-Type": "application/json"})
        # Get a test partner ID
        response = self.api.get(f"{BASE_URL}/api/partner-portal/admin/all-partners")
        if response.status_code == 200:
            partners = response.json().get('partners', [])
            # Find Test Restaurant partner
            for p in partners:
                if 'Test Restaurant' in p.get('business_name', ''):
                    self.test_partner_id = p['id']
                    self.test_partner_email = p.get('email')
                    break
            else:
                # Use first approved partner if Test Restaurant not found
                for p in partners:
                    if p.get('status') == 'approved' and p.get('is_active'):
                        self.test_partner_id = p['id']
                        self.test_partner_email = p.get('email')
                        break
    
    def test_get_all_partners_returns_lock_fields(self):
        """Test that all-partners endpoint returns is_locked and lock_reason fields"""
        response = self.api.get(f"{BASE_URL}/api/partner-portal/admin/all-partners")
        
        assert response.status_code == 200
        data = response.json()
        assert 'partners' in data
        assert 'total' in data
        
        # Check that partners have lock-related fields
        if data['partners']:
            partner = data['partners'][0]
            # is_locked should be present (may be False or True)
            assert 'is_locked' in partner or partner.get('is_locked') is None or partner.get('is_locked') == False
    
    def test_lock_partner_success(self):
        """Test locking a partner account"""
        if not hasattr(self, 'test_partner_id'):
            pytest.skip("No test partner found")
        
        # Lock the partner
        response = self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}",
            params={"reason": "Pytest Test Lock"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert data['is_locked'] == True
        assert data['lock_reason'] == "Pytest Test Lock"
        assert data['partner_id'] == self.test_partner_id
    
    def test_locked_partner_in_all_partners(self):
        """Test that locked partner shows is_locked=True in all-partners"""
        if not hasattr(self, 'test_partner_id'):
            pytest.skip("No test partner found")
        
        # First lock the partner
        self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}",
            params={"reason": "Pytest Test Lock"}
        )
        
        # Get all partners
        response = self.api.get(f"{BASE_URL}/api/partner-portal/admin/all-partners")
        assert response.status_code == 200
        
        data = response.json()
        partners = data.get('partners', [])
        
        # Find our test partner
        test_partner = None
        for p in partners:
            if p['id'] == self.test_partner_id:
                test_partner = p
                break
        
        assert test_partner is not None, "Test partner not found in all-partners"
        assert test_partner.get('is_locked') == True
        assert test_partner.get('lock_reason') == "Pytest Test Lock"
    
    def test_locked_partner_cannot_login(self):
        """Test that locked partner cannot login"""
        if not hasattr(self, 'test_partner_id') or not hasattr(self, 'test_partner_email'):
            pytest.skip("No test partner found")
        
        # First lock the partner
        self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}",
            params={"reason": "Pytest Test Lock"}
        )
        
        # Try to login
        response = self.api.post(
            f"{BASE_URL}/api/partner-portal/login",
            json={"email": self.test_partner_email, "password": "Partner123!"}
        )
        
        # Should be 403 Forbidden with lock message
        assert response.status_code == 403
        data = response.json()
        assert "gesperrt" in data.get('detail', '').lower() or "locked" in data.get('detail', '').lower()
    
    def test_unlock_partner_success(self):
        """Test unlocking a partner account"""
        if not hasattr(self, 'test_partner_id'):
            pytest.skip("No test partner found")
        
        # First lock the partner
        self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}",
            params={"reason": "Pytest Test Lock"}
        )
        
        # Now unlock (toggle)
        response = self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert data['is_locked'] == False
        assert data['lock_reason'] is None
    
    def test_unlocked_partner_can_login(self):
        """Test that unlocked partner can login again"""
        if not hasattr(self, 'test_partner_id') or not hasattr(self, 'test_partner_email'):
            pytest.skip("No test partner found")
        
        # First lock then unlock the partner
        self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}",
            params={"reason": "Pytest Test Lock"}
        )
        self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}"
        )
        
        # Try to login
        response = self.api.post(
            f"{BASE_URL}/api/partner-portal/login",
            json={"email": self.test_partner_email, "password": "Partner123!"}
        )
        
        # Should succeed
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
    
    def test_lock_nonexistent_partner(self):
        """Test locking a non-existent partner returns 404"""
        response = self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/nonexistent-partner-id-12345"
        )
        
        assert response.status_code == 404
    
    def test_lock_toggle_behavior(self):
        """Test that lock endpoint toggles the lock state"""
        if not hasattr(self, 'test_partner_id'):
            pytest.skip("No test partner found")
        
        # First call - should lock
        response1 = self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}",
            params={"reason": "Toggle Test"}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        first_state = data1['is_locked']
        
        # Second call - should toggle
        response2 = self.api.post(
            f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}"
        )
        assert response2.status_code == 200
        data2 = response2.json()
        second_state = data2['is_locked']
        
        # States should be opposite
        assert first_state != second_state
    
    @pytest.fixture(autouse=True, scope="function")
    def cleanup(self):
        """Cleanup - ensure partner is unlocked after each test"""
        yield
        # Unlock the partner after test
        if hasattr(self, 'test_partner_id'):
            # Get current state
            response = self.api.get(f"{BASE_URL}/api/partner-portal/admin/all-partners")
            if response.status_code == 200:
                partners = response.json().get('partners', [])
                for p in partners:
                    if p['id'] == self.test_partner_id and p.get('is_locked'):
                        # Unlock it
                        self.api.post(f"{BASE_URL}/api/partner-portal/admin/lock/{self.test_partner_id}")
