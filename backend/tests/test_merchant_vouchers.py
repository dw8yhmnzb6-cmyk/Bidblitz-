"""
Test Merchant Vouchers API - Händler-Gutscheine System
Tests for:
- GET /api/merchant-vouchers/merchants - Get all merchants
- GET /api/merchant-vouchers/merchant/{id} - Get merchant details
- GET /api/merchant-vouchers/merchant/{id}/vouchers - Get merchant vouchers
- POST /api/merchant-vouchers/admin/create - Create voucher for merchant
- GET /api/merchant-vouchers/admin/all - Get all vouchers (admin)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test partner ID that exists in the database
TEST_PARTNER_ID = "ed528d81-a804-48bd-a00c-05d9ff16d202"


class TestMerchantVouchersAPI:
    """Test Merchant Vouchers API endpoints"""
    
    def test_get_merchants(self):
        """Test GET /api/merchant-vouchers/merchants - returns all merchants"""
        response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchants")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "merchants" in data, "Response should contain 'merchants' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["merchants"], list), "merchants should be a list"
        assert len(data["merchants"]) > 0, "Should have at least one merchant"
        
        # Verify merchant structure
        merchant = data["merchants"][0]
        assert "id" in merchant, "Merchant should have 'id'"
        assert "business_name" in merchant, "Merchant should have 'business_name'"
        assert "voucher_count" in merchant, "Merchant should have 'voucher_count'"
        
        print(f"PASS: Found {data['total']} merchants")
    
    def test_get_merchant_details(self):
        """Test GET /api/merchant-vouchers/merchant/{id} - returns merchant details"""
        response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchant/{TEST_PARTNER_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "merchant" in data, "Response should contain 'merchant' key"
        
        merchant = data["merchant"]
        assert merchant["id"] == TEST_PARTNER_ID, "Merchant ID should match"
        assert "business_name" in merchant, "Merchant should have 'business_name'"
        assert "city" in merchant, "Merchant should have 'city'"
        
        print(f"PASS: Got merchant details for {merchant['business_name']}")
    
    def test_get_merchant_details_not_found(self):
        """Test GET /api/merchant-vouchers/merchant/{id} - returns 404 for invalid ID"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchant/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Returns 404 for non-existent merchant")
    
    def test_get_merchant_vouchers(self):
        """Test GET /api/merchant-vouchers/merchant/{id}/vouchers - returns merchant vouchers"""
        response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchant/{TEST_PARTNER_ID}/vouchers")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "vouchers" in data, "Response should contain 'vouchers' key"
        assert "count" in data, "Response should contain 'count' key"
        assert isinstance(data["vouchers"], list), "vouchers should be a list"
        
        # If there are vouchers, verify structure
        if len(data["vouchers"]) > 0:
            voucher = data["vouchers"][0]
            assert "id" in voucher, "Voucher should have 'id'"
            assert "name" in voucher, "Voucher should have 'name'"
            assert "voucher_value" in voucher, "Voucher should have 'voucher_value'"
            assert "current_price" in voucher, "Voucher should have 'current_price'"
            assert "status" in voucher, "Voucher should have 'status'"
            print(f"PASS: Found {data['count']} vouchers for merchant")
        else:
            print("PASS: No vouchers found (empty list returned)")
    
    def test_admin_create_voucher(self):
        """Test POST /api/merchant-vouchers/admin/create - creates voucher auction"""
        unique_name = f"TEST_Voucher_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "partner_id": TEST_PARTNER_ID,
            "name": unique_name,
            "description": "Test voucher created by pytest",
            "voucher_value": 75.0,
            "start_price": 0.01,
            "duration_hours": 24
        }
        
        response = requests.post(
            f"{BASE_URL}/api/merchant-vouchers/admin/create",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "voucher_id" in data, "Response should contain 'voucher_id'"
        assert "auction_id" in data, "Response should contain 'auction_id'"
        assert "end_time" in data, "Response should contain 'end_time'"
        
        # Verify the voucher was created by fetching it
        voucher_id = data["voucher_id"]
        verify_response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchant/{TEST_PARTNER_ID}/vouchers")
        verify_data = verify_response.json()
        
        voucher_found = any(v["id"] == voucher_id for v in verify_data["vouchers"])
        assert voucher_found, "Created voucher should be retrievable"
        
        print(f"PASS: Created voucher {unique_name} with ID {voucher_id}")
    
    def test_admin_create_voucher_invalid_partner(self):
        """Test POST /api/merchant-vouchers/admin/create - returns 404 for invalid partner"""
        fake_partner_id = str(uuid.uuid4())
        
        payload = {
            "partner_id": fake_partner_id,
            "name": "Test Invalid Partner",
            "voucher_value": 50.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/merchant-vouchers/admin/create",
            json=payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Returns 404 for non-existent partner")
    
    def test_admin_get_all_vouchers(self):
        """Test GET /api/merchant-vouchers/admin/all - returns all vouchers"""
        response = requests.get(f"{BASE_URL}/api/merchant-vouchers/admin/all")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "vouchers" in data, "Response should contain 'vouchers' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["vouchers"], list), "vouchers should be a list"
        
        # Verify voucher structure if any exist
        if len(data["vouchers"]) > 0:
            voucher = data["vouchers"][0]
            assert "id" in voucher, "Voucher should have 'id'"
            assert "partner_name" in voucher, "Voucher should have 'partner_name'"
            assert "voucher_value" in voucher, "Voucher should have 'voucher_value'"
            assert "status" in voucher, "Voucher should have 'status'"
        
        print(f"PASS: Admin endpoint returned {data['total']} vouchers")


class TestMerchantVouchersIntegration:
    """Integration tests for merchant vouchers flow"""
    
    def test_full_voucher_creation_flow(self):
        """Test complete flow: get merchants -> create voucher -> verify in list"""
        # Step 1: Get merchants
        merchants_response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchants")
        assert merchants_response.status_code == 200
        merchants = merchants_response.json()["merchants"]
        assert len(merchants) > 0, "Need at least one merchant"
        
        # Step 2: Pick first merchant with voucher_count tracking
        merchant = merchants[0]
        merchant_id = merchant["id"]
        initial_voucher_count = merchant.get("voucher_count", 0)
        
        # Step 3: Create a voucher for this merchant
        unique_name = f"TEST_Integration_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/merchant-vouchers/admin/create",
            json={
                "partner_id": merchant_id,
                "name": unique_name,
                "voucher_value": 100.0,
                "start_price": 0.01,
                "duration_hours": 24
            }
        )
        assert create_response.status_code == 200
        voucher_id = create_response.json()["voucher_id"]
        
        # Step 4: Verify voucher appears in merchant's vouchers
        vouchers_response = requests.get(f"{BASE_URL}/api/merchant-vouchers/merchant/{merchant_id}/vouchers")
        assert vouchers_response.status_code == 200
        vouchers = vouchers_response.json()["vouchers"]
        
        voucher_found = any(v["id"] == voucher_id for v in vouchers)
        assert voucher_found, "Created voucher should appear in merchant's vouchers"
        
        # Step 5: Verify voucher appears in admin list
        admin_response = requests.get(f"{BASE_URL}/api/merchant-vouchers/admin/all")
        assert admin_response.status_code == 200
        admin_vouchers = admin_response.json()["vouchers"]
        
        admin_voucher_found = any(v["id"] == voucher_id for v in admin_vouchers)
        assert admin_voucher_found, "Created voucher should appear in admin list"
        
        print(f"PASS: Full integration flow completed for voucher {unique_name}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
