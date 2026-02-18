"""
Test Customer Number System (Kundennummer-System)
Tests for BID-XXXXXX customer number format for payments and credits

Endpoints tested:
- GET /api/bidblitz-pay/my-customer-number - Get own customer number (auto-generates if missing)
- GET /api/bidblitz-pay/lookup/{customer_number} - Verify customer (returns masked name)
- POST /api/bidblitz-pay/admin/credit-by-customer-number - Admin: Credit by customer number
- GET /api/bidblitz-pay/admin/search-customer - Admin: Search customer
- GET /api/admin/wallet-topup/search - Admin: Wallet topup search with customer number support
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@bidblitz.ae"
ADMIN_PASSWORD = "Admin123!"
TEST_CUSTOMER_NUMBER = "BID-286446"


class TestCustomerNumberSystem:
    """Test suite for Customer Number System"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth token"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    # ==================== MY CUSTOMER NUMBER ====================
    
    def test_my_customer_number_authenticated(self, admin_headers):
        """Test GET /api/bidblitz-pay/my-customer-number - returns customer number for authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/my-customer-number",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to get customer number: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "customer_number" in data, "Missing customer_number in response"
        assert "name" in data, "Missing name in response"
        assert "email" in data, "Missing email in response"
        assert "info" in data, "Missing info in response"
        
        # Verify customer number format: BID-XXXXXX (6 digits)
        customer_number = data["customer_number"]
        assert customer_number.startswith("BID-"), f"Customer number should start with 'BID-': {customer_number}"
        assert re.match(r"^BID-\d{6}$", customer_number), f"Invalid customer number format: {customer_number}"
        
        print(f"✅ my-customer-number: {customer_number}")
        print(f"   Name: {data['name']}, Email: {data['email']}")
    
    def test_my_customer_number_unauthenticated(self):
        """Test GET /api/bidblitz-pay/my-customer-number - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/bidblitz-pay/my-customer-number")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print("✅ my-customer-number requires authentication")
    
    # ==================== LOOKUP CUSTOMER ====================
    
    def test_lookup_customer_valid(self):
        """Test GET /api/bidblitz-pay/lookup/{customer_number} - valid customer number"""
        response = requests.get(f"{BASE_URL}/api/bidblitz-pay/lookup/{TEST_CUSTOMER_NUMBER}")
        assert response.status_code == 200, f"Failed to lookup customer: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "customer_number" in data, "Missing customer_number in response"
        assert "name_masked" in data, "Missing name_masked in response"
        assert "valid" in data, "Missing valid in response"
        
        # Verify values
        assert data["customer_number"] == TEST_CUSTOMER_NUMBER.upper(), "Customer number mismatch"
        assert data["valid"] == True, "Valid should be True"
        
        # Verify name is masked (first char + asterisks + last char)
        name_masked = data["name_masked"]
        assert len(name_masked) >= 1, "Masked name should not be empty"
        
        print(f"✅ lookup customer: {TEST_CUSTOMER_NUMBER}")
        print(f"   Masked name: {name_masked}, Valid: {data['valid']}")
    
    def test_lookup_customer_invalid(self):
        """Test GET /api/bidblitz-pay/lookup/{customer_number} - invalid customer number"""
        response = requests.get(f"{BASE_URL}/api/bidblitz-pay/lookup/BID-000000")
        assert response.status_code == 404, f"Expected 404 for invalid customer, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Missing error detail"
        print(f"✅ lookup invalid customer returns 404: {data['detail']}")
    
    def test_lookup_customer_case_insensitive(self):
        """Test GET /api/bidblitz-pay/lookup/{customer_number} - case insensitive"""
        # Test lowercase
        response = requests.get(f"{BASE_URL}/api/bidblitz-pay/lookup/{TEST_CUSTOMER_NUMBER.lower()}")
        assert response.status_code == 200, f"Lookup should be case-insensitive: {response.text}"
        
        data = response.json()
        assert data["customer_number"] == TEST_CUSTOMER_NUMBER.upper(), "Should return uppercase customer number"
        print("✅ lookup is case-insensitive")
    
    # ==================== ADMIN CREDIT BY CUSTOMER NUMBER ====================
    
    def test_admin_credit_by_customer_number_success(self, admin_headers):
        """Test POST /api/bidblitz-pay/admin/credit-by-customer-number - successful credit"""
        # First get user's current balance
        lookup_response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q={TEST_CUSTOMER_NUMBER}",
            headers=admin_headers
        )
        
        # Credit the customer
        credit_data = {
            "customer_number": TEST_CUSTOMER_NUMBER,
            "amount": 5.00,
            "description": "Test credit via customer number",
            "reference": "TEST-REF-001"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bidblitz-pay/admin/credit-by-customer-number",
            headers=admin_headers,
            json=credit_data
        )
        assert response.status_code == 200, f"Failed to credit customer: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Missing success in response"
        assert "message" in data, "Missing message in response"
        assert "customer_number" in data, "Missing customer_number in response"
        assert "customer_name" in data, "Missing customer_name in response"
        assert "amount" in data, "Missing amount in response"
        
        # Verify values
        assert data["success"] == True, "Success should be True"
        assert data["customer_number"] == TEST_CUSTOMER_NUMBER.upper(), "Customer number mismatch"
        assert data["amount"] == 5.00, "Amount mismatch"
        
        print(f"✅ admin credit by customer number: €{data['amount']}")
        print(f"   Customer: {data['customer_number']} ({data['customer_name']})")
        print(f"   Reference: {data.get('reference', 'N/A')}")
    
    def test_admin_credit_invalid_customer_number(self, admin_headers):
        """Test POST /api/bidblitz-pay/admin/credit-by-customer-number - invalid customer"""
        credit_data = {
            "customer_number": "BID-000000",
            "amount": 10.00,
            "description": "Test invalid customer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bidblitz-pay/admin/credit-by-customer-number",
            headers=admin_headers,
            json=credit_data
        )
        assert response.status_code == 404, f"Expected 404 for invalid customer, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Missing error detail"
        print(f"✅ admin credit invalid customer returns 404: {data['detail']}")
    
    def test_admin_credit_invalid_amount(self, admin_headers):
        """Test POST /api/bidblitz-pay/admin/credit-by-customer-number - invalid amount"""
        credit_data = {
            "customer_number": TEST_CUSTOMER_NUMBER,
            "amount": -10.00,  # Negative amount
            "description": "Test negative amount"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bidblitz-pay/admin/credit-by-customer-number",
            headers=admin_headers,
            json=credit_data
        )
        assert response.status_code == 400, f"Expected 400 for negative amount, got {response.status_code}"
        print("✅ admin credit rejects negative amount")
    
    def test_admin_credit_zero_amount(self, admin_headers):
        """Test POST /api/bidblitz-pay/admin/credit-by-customer-number - zero amount"""
        credit_data = {
            "customer_number": TEST_CUSTOMER_NUMBER,
            "amount": 0,
            "description": "Test zero amount"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bidblitz-pay/admin/credit-by-customer-number",
            headers=admin_headers,
            json=credit_data
        )
        assert response.status_code == 400, f"Expected 400 for zero amount, got {response.status_code}"
        print("✅ admin credit rejects zero amount")
    
    # ==================== ADMIN SEARCH CUSTOMER ====================
    
    def test_admin_search_customer_by_number(self, admin_headers):
        """Test GET /api/bidblitz-pay/admin/search-customer - search by customer number"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q={TEST_CUSTOMER_NUMBER}",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to search customer: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "results" in data, "Missing results in response"
        assert "count" in data, "Missing count in response"
        
        # Verify we found the customer
        assert data["count"] >= 1, "Should find at least one customer"
        
        # Verify customer data
        found_customer = None
        for user in data["results"]:
            if user.get("customer_number") == TEST_CUSTOMER_NUMBER:
                found_customer = user
                break
        
        assert found_customer is not None, f"Customer {TEST_CUSTOMER_NUMBER} not found in results"
        assert "id" in found_customer, "Missing id in customer data"
        assert "name" in found_customer, "Missing name in customer data"
        assert "email" in found_customer, "Missing email in customer data"
        
        print(f"✅ admin search by customer number: found {data['count']} result(s)")
        print(f"   Customer: {found_customer.get('name')} ({found_customer.get('email')})")
    
    def test_admin_search_customer_by_email(self, admin_headers):
        """Test GET /api/bidblitz-pay/admin/search-customer - search by email"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q=admin@bidblitz",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to search customer: {response.text}"
        
        data = response.json()
        assert "results" in data, "Missing results in response"
        assert data["count"] >= 1, "Should find at least one customer by email"
        
        print(f"✅ admin search by email: found {data['count']} result(s)")
    
    def test_admin_search_customer_by_name(self, admin_headers):
        """Test GET /api/bidblitz-pay/admin/search-customer - search by name"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q=Admin",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to search customer: {response.text}"
        
        data = response.json()
        assert "results" in data, "Missing results in response"
        
        print(f"✅ admin search by name: found {data['count']} result(s)")
    
    def test_admin_search_customer_min_length(self, admin_headers):
        """Test GET /api/bidblitz-pay/admin/search-customer - minimum query length"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q=ab",  # Only 2 chars
            headers=admin_headers
        )
        # Should return 422 (validation error) for query < 3 chars
        assert response.status_code == 422, f"Expected 422 for short query, got {response.status_code}"
        print("✅ admin search requires minimum 3 characters")
    
    # ==================== ADMIN WALLET TOPUP SEARCH ====================
    
    def test_admin_wallet_topup_search_by_customer_number(self, admin_headers):
        """Test GET /api/admin/wallet-topup/search - search by customer number"""
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search?query={TEST_CUSTOMER_NUMBER}",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to search wallet topup: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "users" in data, "Missing users in response"
        
        # Check if customer_number is in the search results
        found = False
        for user in data["users"]:
            if user.get("customer_number") == TEST_CUSTOMER_NUMBER:
                found = True
                # Verify user data includes customer_number
                assert "customer_number" in user, "Missing customer_number in user data"
                assert "bidblitz_balance" in user, "Missing bidblitz_balance in user data"
                break
        
        assert found, f"Customer {TEST_CUSTOMER_NUMBER} not found in wallet topup search"
        print(f"✅ admin wallet topup search by customer number: found {len(data['users'])} user(s)")
    
    def test_admin_wallet_topup_search_by_email(self, admin_headers):
        """Test GET /api/admin/wallet-topup/search - search by email"""
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search?query=admin@bidblitz",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to search wallet topup: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing users in response"
        assert len(data["users"]) >= 1, "Should find at least one user by email"
        
        print(f"✅ admin wallet topup search by email: found {len(data['users'])} user(s)")
    
    def test_admin_wallet_topup_search_by_name(self, admin_headers):
        """Test GET /api/admin/wallet-topup/search - search by name"""
        response = requests.get(
            f"{BASE_URL}/api/admin/wallet-topup/search?query=Admin",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to search wallet topup: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing users in response"
        
        print(f"✅ admin wallet topup search by name: found {len(data['users'])} user(s)")


class TestCustomerNumberFormat:
    """Test customer number format validation"""
    
    def test_customer_number_format_regex(self):
        """Test customer number format: BID-XXXXXX"""
        valid_numbers = ["BID-123456", "BID-000001", "BID-999999", "BID-286446"]
        invalid_numbers = ["BID-12345", "BID-1234567", "BID123456", "123456", "BID-ABCDEF"]
        
        pattern = r"^BID-\d{6}$"
        
        for num in valid_numbers:
            assert re.match(pattern, num), f"Should be valid: {num}"
        
        for num in invalid_numbers:
            assert not re.match(pattern, num), f"Should be invalid: {num}"
        
        print("✅ Customer number format validation works correctly")


class TestCustomerNumberIntegration:
    """Integration tests for customer number system"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth token"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    def test_credit_and_verify_balance(self, admin_headers):
        """Test credit flow: credit customer and verify balance increased"""
        # Step 1: Get current balance via search
        search_response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q={TEST_CUSTOMER_NUMBER}",
            headers=admin_headers
        )
        assert search_response.status_code == 200
        
        search_data = search_response.json()
        initial_balance = 0
        for user in search_data["results"]:
            if user.get("customer_number") == TEST_CUSTOMER_NUMBER:
                initial_balance = user.get("bidblitz_balance", 0)
                break
        
        # Step 2: Credit the customer
        credit_amount = 1.50
        credit_response = requests.post(
            f"{BASE_URL}/api/bidblitz-pay/admin/credit-by-customer-number",
            headers=admin_headers,
            json={
                "customer_number": TEST_CUSTOMER_NUMBER,
                "amount": credit_amount,
                "description": "Integration test credit",
                "reference": "INT-TEST-001"
            }
        )
        assert credit_response.status_code == 200
        
        # Step 3: Verify balance increased
        verify_response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/admin/search-customer?q={TEST_CUSTOMER_NUMBER}",
            headers=admin_headers
        )
        assert verify_response.status_code == 200
        
        verify_data = verify_response.json()
        new_balance = 0
        for user in verify_data["results"]:
            if user.get("customer_number") == TEST_CUSTOMER_NUMBER:
                new_balance = user.get("bidblitz_balance", 0)
                break
        
        # Balance should have increased by credit amount
        expected_balance = initial_balance + credit_amount
        assert abs(new_balance - expected_balance) < 0.01, f"Balance mismatch: expected {expected_balance}, got {new_balance}"
        
        print(f"✅ Credit integration test passed")
        print(f"   Initial balance: €{initial_balance:.2f}")
        print(f"   Credit amount: €{credit_amount:.2f}")
        print(f"   New balance: €{new_balance:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
