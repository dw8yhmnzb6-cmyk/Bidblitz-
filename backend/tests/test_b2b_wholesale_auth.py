"""
B2B Wholesale Auth API Tests
Tests for the new B2B wholesale customer portal:
- Registration (/api/wholesale/auth/register)
- Login (/api/wholesale/auth/login)
- Profile (/api/wholesale/auth/me)
- Pricing (/api/wholesale/auth/pricing)
- Orders (/api/wholesale/auth/orders)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_B2B_EMAIL = "hans@testb2b.de"
TEST_B2B_PASSWORD = "TestPass123!"
ADMIN_EMAIL = "admin@bidblitz.ae"
ADMIN_PASSWORD = "Admin123!"


class TestB2BWholesaleAuth:
    """B2B Wholesale Authentication Tests"""
    
    def test_b2b_login_success(self):
        """Test B2B login with valid credentials (already approved customer)"""
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": TEST_B2B_EMAIL,
                "password": TEST_B2B_PASSWORD
            }
        )
        
        print(f"B2B Login Response Status: {response.status_code}")
        print(f"B2B Login Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "customer" in data
        
        customer = data["customer"]
        assert customer.get("email") == TEST_B2B_EMAIL.lower()
        assert "company_name" in customer
        assert "discount_percent" in customer
        assert "credit_limit" in customer
        assert customer.get("status") == "active"
    
    def test_b2b_login_wrong_password(self):
        """Test B2B login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": TEST_B2B_EMAIL,
                "password": "WrongPassword123!"
            }
        )
        
        print(f"Wrong Password Response: {response.status_code}")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_b2b_login_nonexistent_email(self):
        """Test B2B login with non-existent email"""
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": "nonexistent@test.de",
                "password": "SomePassword123!"
            }
        )
        
        print(f"Non-existent Email Response: {response.status_code}")
        
        assert response.status_code == 401
    
    def test_b2b_profile_with_valid_token(self):
        """Test getting B2B profile with valid token"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": TEST_B2B_EMAIL,
                "password": TEST_B2B_PASSWORD
            }
        )
        
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Get profile
        profile_response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Profile Response Status: {profile_response.status_code}")
        print(f"Profile Response: {profile_response.json()}")
        
        assert profile_response.status_code == 200
        
        profile = profile_response.json()
        assert profile.get("email") == TEST_B2B_EMAIL.lower()
        assert "company_name" in profile
        assert "contact_name" in profile
        assert "discount_percent" in profile
        assert "credit_limit" in profile
        assert "credit_used" in profile
        assert "payment_terms" in profile
        assert "status" in profile
    
    def test_b2b_profile_without_token(self):
        """Test getting B2B profile without token"""
        response = requests.get(f"{BASE_URL}/api/wholesale/auth/me")
        
        print(f"No Token Response: {response.status_code}")
        
        assert response.status_code == 401
    
    def test_b2b_profile_with_invalid_token(self):
        """Test getting B2B profile with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        print(f"Invalid Token Response: {response.status_code}")
        
        assert response.status_code == 401
    
    def test_b2b_pricing_endpoint(self):
        """Test B2B pricing endpoint with discounts"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": TEST_B2B_EMAIL,
                "password": TEST_B2B_PASSWORD
            }
        )
        
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Get pricing
        pricing_response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/pricing",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Pricing Response Status: {pricing_response.status_code}")
        print(f"Pricing Response: {pricing_response.json()}")
        
        assert pricing_response.status_code == 200
        
        pricing = pricing_response.json()
        assert "packages" in pricing
        assert "discount_percent" in pricing
        assert "credit_limit" in pricing
        assert "credit_available" in pricing
        assert "payment_terms" in pricing
        
        # Check packages have discounted prices
        if pricing["packages"]:
            pkg = pricing["packages"][0]
            assert "original_price" in pkg
            assert "discounted_price" in pkg
            assert "discount_percent" in pkg
            assert "savings" in pkg
    
    def test_b2b_orders_endpoint(self):
        """Test B2B orders endpoint"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": TEST_B2B_EMAIL,
                "password": TEST_B2B_PASSWORD
            }
        )
        
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Get orders
        orders_response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/orders",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Orders Response Status: {orders_response.status_code}")
        print(f"Orders Response: {orders_response.json()}")
        
        assert orders_response.status_code == 200
        
        data = orders_response.json()
        assert "orders" in data
        assert isinstance(data["orders"], list)


class TestB2BRegistration:
    """B2B Registration Tests"""
    
    def test_b2b_registration_new_customer(self):
        """Test B2B registration with new customer data"""
        unique_email = f"test_b2b_{uuid.uuid4().hex[:8]}@testcompany.de"
        
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/register",
            json={
                "company_name": "Test GmbH",
                "contact_name": "Test Person",
                "email": unique_email,
                "phone": "+49 123 456789",
                "password": "SecureTest@Pass123!",  # Stronger password with special chars
                "website": "www.testcompany.de",
                "tax_id": "DE123456789",
                "expected_volume": "500-1000",
                "message": "Test registration"
            }
        )
        
        print(f"Registration Response Status: {response.status_code}")
        print(f"Registration Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "wholesale_id" in data
        assert "message" in data
    
    def test_b2b_registration_duplicate_email(self):
        """Test B2B registration with existing email"""
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/register",
            json={
                "company_name": "Duplicate Test GmbH",
                "contact_name": "Test Person",
                "email": TEST_B2B_EMAIL,  # Already exists
                "phone": "+49 123 456789",
                "password": "TestPassword123!",
                "expected_volume": "500-1000"
            }
        )
        
        print(f"Duplicate Email Response: {response.status_code}")
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_b2b_registration_weak_password(self):
        """Test B2B registration with weak password"""
        unique_email = f"test_weak_{uuid.uuid4().hex[:8]}@testcompany.de"
        
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/register",
            json={
                "company_name": "Weak Password GmbH",
                "contact_name": "Test Person",
                "email": unique_email,
                "phone": "+49 123 456789",
                "password": "weak",  # Too weak
                "expected_volume": "500-1000"
            }
        )
        
        print(f"Weak Password Response: {response.status_code}")
        
        assert response.status_code == 400
    
    def test_b2b_registration_pending_cannot_login(self):
        """Test that newly registered (pending) customer cannot login"""
        unique_email = f"test_pending_{uuid.uuid4().hex[:8]}@testcompany.de"
        password = "SecureTest@Pass123!"  # Stronger password with special chars
        
        # Register
        reg_response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/register",
            json={
                "company_name": "Pending Test GmbH",
                "contact_name": "Test Person",
                "email": unique_email,
                "phone": "+49 123 456789",
                "password": password,
                "expected_volume": "500-1000"
            }
        )
        
        assert reg_response.status_code == 200
        
        # Try to login (should fail - pending status)
        login_response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": unique_email,
                "password": password
            }
        )
        
        print(f"Pending Login Response: {login_response.status_code}")
        print(f"Pending Login Response: {login_response.json()}")
        
        assert login_response.status_code == 403  # Forbidden - pending approval


class TestAdminWholesaleApproval:
    """Admin Wholesale Approval Tests"""
    
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_admin_get_wholesale_applications(self):
        """Test admin can get wholesale applications"""
        token = self.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/wholesale/applications",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Applications Response Status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_wholesale_customers(self):
        """Test admin can get wholesale customers"""
        token = self.get_admin_token()
        assert token is not None, "Admin login failed"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/wholesale/customers",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Customers Response Status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check that our test customer exists
        test_customer = next((c for c in data if c.get("email") == TEST_B2B_EMAIL.lower()), None)
        if test_customer:
            print(f"Found test customer: {test_customer.get('company_name')}")
            assert test_customer.get("status") == "active"


class TestB2BDashboardFlow:
    """End-to-end B2B Dashboard Flow Tests"""
    
    def test_full_b2b_login_and_dashboard_flow(self):
        """Test complete B2B login and dashboard data retrieval"""
        # Step 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={
                "email": TEST_B2B_EMAIL,
                "password": TEST_B2B_PASSWORD
            }
        )
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        token = login_data.get("token")
        customer = login_data.get("customer")
        
        print(f"Logged in as: {customer.get('company_name')}")
        print(f"Discount: {customer.get('discount_percent')}%")
        print(f"Credit Limit: €{customer.get('credit_limit')}")
        
        # Step 2: Get Profile
        profile_response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert profile_response.status_code == 200
        profile = profile_response.json()
        
        # Step 3: Get Pricing
        pricing_response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/pricing",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert pricing_response.status_code == 200
        pricing = pricing_response.json()
        
        print(f"Available packages: {len(pricing.get('packages', []))}")
        print(f"Credit available: €{pricing.get('credit_available')}")
        
        # Step 4: Get Orders
        orders_response = requests.get(
            f"{BASE_URL}/api/wholesale/auth/orders",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert orders_response.status_code == 200
        orders = orders_response.json()
        
        print(f"Total orders: {len(orders.get('orders', []))}")
        
        # All steps passed
        print("SUCCESS: Full B2B dashboard flow completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
