"""
Test BNPL (Buy Now Pay Later) and Merchant Dashboard Features
Tests for iteration 113 - BNPL Button Integration and Merchant Field Mapping

Features tested:
1. BNPL Eligibility API (/api/bnpl/eligibility)
2. BNPL Calculate API (/api/bnpl/calculate)
3. Merchant Products API (/api/merchant/products)
4. Merchant Coupons API (/api/merchant/coupons)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CUSTOMER_EMAIL = "kunde@bidblitz.ae"
CUSTOMER_PASSWORD = "Kunde123!"
MERCHANT_EMAIL = "demo@grosshandel.de"
MERCHANT_PASSWORD = "Haendler123!"


class TestBNPLAPIs:
    """Test BNPL (Buy Now Pay Later) APIs"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Customer authentication failed")
    
    def test_bnpl_calculate_3_months(self):
        """Test BNPL calculation for 3 months (0% interest)"""
        response = requests.get(
            f"{BASE_URL}/api/bnpl/calculate",
            params={"amount": 50, "installments": 3}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify calculation
        assert data["original_amount"] == 50
        assert data["interest_rate"] == 0
        assert data["interest_amount"] == 0
        assert data["total_amount"] == 50
        assert data["installments"] == 3
        assert data["monthly_payment"] == pytest.approx(16.67, rel=0.01)
        print(f"✓ BNPL 3 months: €{data['monthly_payment']:.2f}/month (0% interest)")
    
    def test_bnpl_calculate_6_months(self):
        """Test BNPL calculation for 6 months (2.9% interest)"""
        response = requests.get(
            f"{BASE_URL}/api/bnpl/calculate",
            params={"amount": 100, "installments": 6}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify calculation with 2.9% interest
        assert data["original_amount"] == 100
        assert data["interest_rate"] == 2.9
        expected_total = 100 * 1.029  # 102.90
        assert data["total_amount"] == pytest.approx(expected_total, rel=0.01)
        print(f"✓ BNPL 6 months: €{data['monthly_payment']:.2f}/month (2.9% interest)")
    
    def test_bnpl_calculate_12_months(self):
        """Test BNPL calculation for 12 months (5.9% interest)"""
        response = requests.get(
            f"{BASE_URL}/api/bnpl/calculate",
            params={"amount": 100, "installments": 12}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify calculation with 5.9% interest
        assert data["original_amount"] == 100
        assert data["interest_rate"] == 5.9
        expected_total = 100 * 1.059  # 105.90
        assert data["total_amount"] == pytest.approx(expected_total, rel=0.01)
        print(f"✓ BNPL 12 months: €{data['monthly_payment']:.2f}/month (5.9% interest)")
    
    def test_bnpl_eligibility_with_token(self, customer_token):
        """Test BNPL eligibility check for authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/bnpl/eligibility",
            params={"token": customer_token}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "eligible" in data
        assert "reason" in data
        assert "max_amount" in data
        assert "open_plans" in data
        assert "credit_score" in data
        assert "installment_options" in data
        
        # Verify installment options
        assert len(data["installment_options"]) == 3
        options = {opt["months"]: opt["interest"] for opt in data["installment_options"]}
        assert options[3] == 0
        assert options[6] == 2.9
        assert options[12] == 5.9
        
        print(f"✓ BNPL Eligibility: eligible={data['eligible']}, reason={data['reason']}")
        print(f"  Credit score: {data['credit_score']}, Open plans: {data['open_plans']}")
    
    def test_bnpl_eligibility_without_token(self):
        """Test BNPL eligibility check without token (should fail)"""
        response = requests.get(f"{BASE_URL}/api/bnpl/eligibility")
        # Should return 422 (missing required parameter) or 401 (unauthorized)
        assert response.status_code in [401, 422]
        print("✓ BNPL Eligibility correctly requires authentication")


class TestMerchantDashboardAPIs:
    """Test Merchant Dashboard APIs for Products and Coupons"""
    
    @pytest.fixture
    def merchant_token(self):
        """Get merchant authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/wholesale/auth/login",
            json={"email": MERCHANT_EMAIL, "password": MERCHANT_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Merchant authentication failed")
    
    def test_merchant_products_list(self, merchant_token):
        """Test merchant products list API - verify field names"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/products",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "products" in data
        assert "count" in data
        
        # Verify product fields (title, not name)
        if data["count"] > 0:
            product = data["products"][0]
            # API should return 'title' field
            assert "title" in product, "Product should have 'title' field"
            assert "category" in product
            assert "status" in product
            # Either market_value or retail_price should be present
            assert "market_value" in product or "retail_price" in product
            
            print(f"✓ Merchant Products: {data['count']} products found")
            print(f"  First product: {product.get('title', 'N/A')}")
        else:
            print("✓ Merchant Products API working (no products)")
    
    def test_merchant_coupons_list(self, merchant_token):
        """Test merchant coupons list API - verify field names"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/coupons",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "coupons" in data
        
        # Verify coupon fields
        if len(data["coupons"]) > 0:
            coupon = data["coupons"][0]
            # API should return 'code' field
            assert "code" in coupon, "Coupon should have 'code' field"
            # Should have discount info (percent or amount)
            assert "discount_percent" in coupon or "discount_amount" in coupon
            # Should have active status
            assert "active" in coupon or "is_active" in coupon
            
            print(f"✓ Merchant Coupons: {len(data['coupons'])} coupons found")
            print(f"  First coupon: {coupon.get('code', 'N/A')}")
        else:
            print("✓ Merchant Coupons API working (no coupons)")
    
    def test_merchant_dashboard(self, merchant_token):
        """Test merchant dashboard API"""
        response = requests.get(
            f"{BASE_URL}/api/merchant/dashboard",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard data
        assert "merchant_name" in data or "company_name" in data
        print(f"✓ Merchant Dashboard: {data.get('merchant_name', data.get('company_name', 'N/A'))}")


class TestBidPackages:
    """Test Bid Packages API (for BNPL button display logic)"""
    
    def test_bid_packages_list(self):
        """Test bid packages list - verify packages >= €50 exist for BNPL"""
        response = requests.get(f"{BASE_URL}/api/bid-packages")
        assert response.status_code == 200
        packages = response.json()
        
        # Verify packages exist
        assert len(packages) > 0
        
        # Count packages >= €50 (eligible for BNPL)
        bnpl_eligible = [p for p in packages if p.get("price", 0) >= 50]
        print(f"✓ Bid Packages: {len(packages)} total, {len(bnpl_eligible)} BNPL-eligible (>= €50)")
        
        # Verify Pro and Ultimate packages exist
        package_ids = [p.get("id") for p in packages]
        assert "pro" in package_ids, "Pro package should exist"
        assert "ultimate" in package_ids, "Ultimate package should exist"
        
        # Verify Pro is €50 and Ultimate is €100
        pro_pkg = next((p for p in packages if p.get("id") == "pro"), None)
        ultimate_pkg = next((p for p in packages if p.get("id") == "ultimate"), None)
        
        assert pro_pkg and pro_pkg.get("price") == 50, "Pro package should be €50"
        assert ultimate_pkg and ultimate_pkg.get("price") == 100, "Ultimate package should be €100"
        
        print(f"  Pro: €{pro_pkg['price']} ({pro_pkg['bids']} bids)")
        print(f"  Ultimate: €{ultimate_pkg['price']} ({ultimate_pkg['bids']} bids)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
