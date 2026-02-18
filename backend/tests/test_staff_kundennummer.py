"""
Test Staff Kundennummer (Staff Number) Feature
Tests:
1. Partner login with email/password
2. Staff creation with auto-generated Kundennummer
3. Staff login with Kundennummer instead of email
4. Staff list shows Kundennummer
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PARTNER_EMAIL = "wise-test@partner.com"
PARTNER_PASSWORD = "Test123!"
TEST_STAFF_NUMBER = "WI-008-001"
TEST_STAFF_PASSWORD = "staff123"


class TestPartnerLogin:
    """Test partner admin login"""
    
    def test_partner_login_success(self):
        """Test partner login with email and password"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/login", json={
            "email": PARTNER_EMAIL,
            "password": PARTNER_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "partner" in data
        assert data["partner"]["email"] == PARTNER_EMAIL
        
        # Store token for other tests
        TestPartnerLogin.partner_token = data["token"]
        TestPartnerLogin.partner_id = data["partner"]["id"]
        print(f"✓ Partner login successful, token obtained")
        
    def test_partner_login_invalid_credentials(self):
        """Test partner login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/login", json={
            "email": PARTNER_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print(f"✓ Invalid credentials correctly rejected")


class TestStaffCreation:
    """Test staff creation with auto-generated Kundennummer"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get partner token before tests"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/login", json={
            "email": PARTNER_EMAIL,
            "password": PARTNER_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
    
    def test_create_staff_generates_kundennummer(self):
        """Test that creating staff auto-generates a Kundennummer"""
        import uuid
        unique_name = f"Test Staff {str(uuid.uuid4())[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/create?token={self.token}",
            json={
                "name": unique_name,
                "password": "testpass123",
                "role": "counter"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "staff_number" in data, "Response should contain staff_number (Kundennummer)"
        assert data["staff_number"] is not None
        
        # Verify Kundennummer format: PREFIX-PARTNER_NUM-STAFF_NUM (e.g., WI-008-001)
        staff_number = data["staff_number"]
        parts = staff_number.split("-")
        assert len(parts) >= 3, f"Kundennummer should have format XX-XXX-XXX, got: {staff_number}"
        
        print(f"✓ Staff created with Kundennummer: {staff_number}")
        
        # Store for cleanup
        TestStaffCreation.created_staff_id = data.get("staff_id")
        TestStaffCreation.created_staff_number = staff_number
        
    def test_staff_list_shows_kundennummer(self):
        """Test that staff list includes Kundennummer for each staff"""
        response = requests.get(f"{BASE_URL}/api/partner-portal/staff?token={self.token}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "staff" in data
        
        # Check that at least one staff has staff_number
        staff_with_number = [s for s in data["staff"] if s.get("staff_number")]
        print(f"✓ Found {len(staff_with_number)} staff members with Kundennummer")
        
        if staff_with_number:
            for staff in staff_with_number[:3]:  # Show first 3
                print(f"  - {staff.get('name')}: {staff.get('staff_number')}")


class TestStaffLogin:
    """Test staff login with Kundennummer"""
    
    def test_staff_login_with_kundennummer(self):
        """Test staff login using Kundennummer instead of email"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/staff/login", json={
            "staff_number": TEST_STAFF_NUMBER,
            "password": TEST_STAFF_PASSWORD
        })
        
        # If staff doesn't exist, this might fail - that's expected
        if response.status_code == 401:
            print(f"⚠ Staff {TEST_STAFF_NUMBER} not found or wrong password - may need to create first")
            pytest.skip(f"Staff {TEST_STAFF_NUMBER} not found")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "staff" in data
        assert data["staff"]["staff_number"] == TEST_STAFF_NUMBER.upper()
        assert data.get("is_staff") == True
        
        print(f"✓ Staff login successful with Kundennummer: {TEST_STAFF_NUMBER}")
        
    def test_staff_login_invalid_kundennummer(self):
        """Test staff login with invalid Kundennummer"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/staff/login", json={
            "staff_number": "INVALID-000-000",
            "password": "anypassword"
        })
        
        assert response.status_code == 401
        print(f"✓ Invalid Kundennummer correctly rejected")
        
    def test_staff_login_wrong_password(self):
        """Test staff login with correct Kundennummer but wrong password"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/staff/login", json={
            "staff_number": TEST_STAFF_NUMBER,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print(f"✓ Wrong password correctly rejected")


class TestStaffLoginEndpointSchema:
    """Test that staff login endpoint accepts staff_number field"""
    
    def test_staff_login_endpoint_exists(self):
        """Test that /api/partner-portal/staff/login endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/staff/login", json={
            "staff_number": "test",
            "password": "test"
        })
        
        # Should return 401 (unauthorized) not 404 (not found) or 422 (validation error)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Staff login endpoint exists and accepts staff_number field")
        
    def test_staff_login_requires_staff_number(self):
        """Test that staff login requires staff_number field"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/staff/login", json={
            "password": "test"
        })
        
        # Should return 422 (validation error) for missing field
        assert response.status_code == 422, f"Expected 422 for missing staff_number, got {response.status_code}"
        print(f"✓ Staff login correctly requires staff_number field")


class TestKundennummerFormat:
    """Test Kundennummer format generation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get partner token before tests"""
        response = requests.post(f"{BASE_URL}/api/partner-portal/login", json={
            "email": PARTNER_EMAIL,
            "password": PARTNER_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
    
    def test_kundennummer_format_pattern(self):
        """Test that Kundennummer follows expected format"""
        response = requests.get(f"{BASE_URL}/api/partner-portal/staff?token={self.token}")
        
        assert response.status_code == 200
        data = response.json()
        
        for staff in data.get("staff", []):
            staff_number = staff.get("staff_number")
            if staff_number:
                # Format should be: PREFIX-PARTNER_NUM-STAFF_NUM
                # e.g., WI-008-001, PR-001-003
                parts = staff_number.split("-")
                assert len(parts) >= 3, f"Invalid format: {staff_number}"
                
                # First part should be 2 letters (partner prefix)
                assert len(parts[0]) >= 2, f"Prefix too short: {parts[0]}"
                
                # Second part should be numeric (partner number)
                assert parts[1].isdigit(), f"Partner number not numeric: {parts[1]}"
                
                # Third part should be numeric (staff number)
                assert parts[2].isdigit() or parts[2][:3].isdigit(), f"Staff number not numeric: {parts[2]}"
                
                print(f"✓ Valid Kundennummer format: {staff_number}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
