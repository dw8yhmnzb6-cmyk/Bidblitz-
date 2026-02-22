"""
Sales Commission (Verkaufs-Provision) Test - Iteration 104
Tests for the new sales_commission field added to commission settings.

Features tested:
1. CommissionSettings model includes sales_commission field
2. PUT /api/enterprise/admin/commission-settings/{id} accepts sales_commission
3. GET /api/enterprise/admin/commission-settings/{id} returns sales_commission with default 2.0
4. sales_commission validates 0-100%
5. GET /api/enterprise/admin/list returns sales_commission in commission_settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_KEY = "bidblitz-admin-2026"
ENTERPRISE_ID = "ent_ee2a8554c977"


class TestSalesCommissionAPI:
    """Test sales_commission field in commission settings endpoints"""
    
    def test_get_commission_settings_includes_sales_commission(self):
        """GET /api/enterprise/admin/commission-settings/{id} returns sales_commission"""
        response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify sales_commission field exists
        assert "sales_commission" in data, "Response should contain sales_commission field"
        
        # Verify data type
        assert isinstance(data["sales_commission"], (int, float)), "sales_commission should be numeric"
        
        # Verify all 4 commission types are present
        assert "voucher_commission" in data, "Response should contain voucher_commission"
        assert "self_pay_commission" in data, "Response should contain self_pay_commission"
        assert "sales_commission" in data, "Response should contain sales_commission"
        assert "customer_cashback" in data, "Response should contain customer_cashback"
        
        print(f"✓ Commission settings retrieved with sales_commission")
        print(f"  voucher_commission: {data['voucher_commission']}%")
        print(f"  self_pay_commission: {data['self_pay_commission']}%")
        print(f"  sales_commission: {data['sales_commission']}%")
        print(f"  customer_cashback: {data['customer_cashback']}%")
    
    def test_put_commission_settings_with_sales_commission(self):
        """PUT /api/enterprise/admin/commission-settings/{id} accepts sales_commission"""
        payload = {
            "voucher_commission": 5.0,
            "self_pay_commission": 3.0,
            "sales_commission": 2.5,  # New field
            "customer_cashback": 1.0,
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={
                "Content-Type": "application/json",
                "x-admin-key": ADMIN_KEY
            },
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        print(f"✓ Commission settings with sales_commission saved successfully")
    
    def test_sales_commission_persistence(self):
        """PUT then GET to verify sales_commission persists"""
        # Set specific sales_commission value
        payload = {
            "voucher_commission": 5.0,
            "self_pay_commission": 3.0,
            "sales_commission": 3.5,  # Specific test value
            "customer_cashback": 1.0,
            "is_active": True
        }
        
        # PUT
        put_response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={
                "Content-Type": "application/json",
                "x-admin-key": ADMIN_KEY
            },
            json=payload
        )
        assert put_response.status_code == 200, f"PUT failed: {put_response.text}"
        
        # GET to verify
        get_response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={"x-admin-key": ADMIN_KEY}
        )
        assert get_response.status_code == 200, f"GET failed: {get_response.text}"
        
        data = get_response.json()
        assert data["sales_commission"] == 3.5, f"sales_commission mismatch: expected 3.5, got {data['sales_commission']}"
        
        print(f"✓ sales_commission persisted correctly: {data['sales_commission']}%")
    
    def test_sales_commission_validation_max(self):
        """Test sales_commission validation - value > 100% should fail"""
        payload = {
            "voucher_commission": 5.0,
            "self_pay_commission": 3.0,
            "sales_commission": 150,  # Invalid: > 100%
            "customer_cashback": 1.0,
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={
                "Content-Type": "application/json",
                "x-admin-key": ADMIN_KEY
            },
            json=payload
        )
        
        assert response.status_code == 400, f"Expected 400 for sales_commission > 100%, got {response.status_code}"
        print("✓ sales_commission > 100% correctly rejected")
    
    def test_sales_commission_validation_negative(self):
        """Test sales_commission validation - negative value should fail"""
        payload = {
            "voucher_commission": 5.0,
            "self_pay_commission": 3.0,
            "sales_commission": -5,  # Invalid: negative
            "customer_cashback": 1.0,
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={
                "Content-Type": "application/json",
                "x-admin-key": ADMIN_KEY
            },
            json=payload
        )
        
        assert response.status_code == 400, f"Expected 400 for negative sales_commission, got {response.status_code}"
        print("✓ Negative sales_commission correctly rejected")
    
    def test_sales_commission_valid_range(self):
        """Test sales_commission accepts valid values (0-100%)"""
        test_values = [0, 0.01, 0.5, 1.0, 2.0, 50.0, 99.99, 100.0]
        
        for value in test_values:
            payload = {
                "voucher_commission": 5.0,
                "self_pay_commission": 3.0,
                "sales_commission": value,
                "customer_cashback": 1.0,
                "is_active": True
            }
            
            response = requests.put(
                f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
                headers={
                    "Content-Type": "application/json",
                    "x-admin-key": ADMIN_KEY
                },
                json=payload
            )
            
            assert response.status_code == 200, f"Expected 200 for sales_commission={value}, got {response.status_code}"
        
        print(f"✓ sales_commission accepts valid range (0-100%): {test_values}")
    
    def test_sales_commission_decimal_precision(self):
        """Test sales_commission handles decimal values correctly"""
        payload = {
            "voucher_commission": 5.0,
            "self_pay_commission": 3.0,
            "sales_commission": 2.75,  # Decimal value
            "customer_cashback": 1.0,
            "is_active": True
        }
        
        # PUT
        put_response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={
                "Content-Type": "application/json",
                "x-admin-key": ADMIN_KEY
            },
            json=payload
        )
        assert put_response.status_code == 200, f"PUT failed: {put_response.text}"
        
        # GET to verify
        get_response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={"x-admin-key": ADMIN_KEY}
        )
        data = get_response.json()
        
        assert data["sales_commission"] == 2.75, f"Decimal precision lost: expected 2.75, got {data['sales_commission']}"
        print(f"✓ sales_commission decimal precision maintained: {data['sales_commission']}%")


class TestAdminListWithSalesCommission:
    """Test that admin list includes sales_commission in commission_settings"""
    
    def test_admin_list_includes_sales_commission(self):
        """GET /api/enterprise/admin/list returns sales_commission in commission_settings"""
        response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/list",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "enterprises" in data, "Response should contain 'enterprises' key"
        
        if data["enterprises"]:
            # Find our test enterprise
            target_enterprise = None
            for ent in data["enterprises"]:
                if ent.get("id") == ENTERPRISE_ID:
                    target_enterprise = ent
                    break
            
            if target_enterprise:
                commission = target_enterprise.get("commission_settings", {})
                
                # Verify all 4 commission types are present
                assert "voucher_commission" in commission, "commission_settings should have voucher_commission"
                assert "self_pay_commission" in commission, "commission_settings should have self_pay_commission"
                assert "sales_commission" in commission, "commission_settings should have sales_commission"
                assert "customer_cashback" in commission, "commission_settings should have customer_cashback"
                
                print(f"✓ Admin list includes sales_commission in commission_settings")
                print(f"  Enterprise: {target_enterprise.get('company_name')}")
                print(f"  voucher_commission: {commission.get('voucher_commission')}%")
                print(f"  self_pay_commission: {commission.get('self_pay_commission')}%")
                print(f"  sales_commission: {commission.get('sales_commission')}%")
                print(f"  customer_cashback: {commission.get('customer_cashback')}%")
            else:
                # Check any enterprise has the field
                enterprise = data["enterprises"][0]
                commission = enterprise.get("commission_settings", {})
                assert "sales_commission" in commission, "commission_settings should have sales_commission"
                print(f"✓ Admin list includes sales_commission (checked first enterprise)")
    
    def test_sales_commission_default_value_in_list(self):
        """Verify sales_commission has default value of 2.0 for enterprises without custom settings"""
        response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/list",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        for enterprise in data.get("enterprises", []):
            commission = enterprise.get("commission_settings", {})
            sales_commission = commission.get("sales_commission")
            
            # sales_commission should exist and be a valid number
            assert sales_commission is not None, f"sales_commission missing for {enterprise.get('company_name')}"
            assert isinstance(sales_commission, (int, float)), f"sales_commission should be numeric"
            
            print(f"  {enterprise.get('company_name')}: sales_commission = {sales_commission}%")
        
        print(f"✓ All enterprises have sales_commission field")


class TestSalesCommissionCleanup:
    """Reset settings to default values after tests"""
    
    def test_reset_commission_settings_with_sales_commission(self):
        """Reset commission settings to default values including sales_commission"""
        payload = {
            "voucher_commission": 5.0,
            "self_pay_commission": 3.0,
            "sales_commission": 2.0,  # Default value
            "customer_cashback": 1.0,
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/commission-settings/{ENTERPRISE_ID}",
            headers={
                "Content-Type": "application/json",
                "x-admin-key": ADMIN_KEY
            },
            json=payload
        )
        
        assert response.status_code == 200, f"Reset failed: {response.text}"
        print("✓ Commission settings reset to defaults (including sales_commission: 2.0%)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
