"""
Test Staff Permission System - Role-based POS Access
Tests the staff role permissions for Counter, Support, and Marketing roles
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStaffPermissionSystem:
    """Test staff role permissions and POS access"""
    
    def test_counter_role_permissions(self):
        """Test Counter role (TS-001) has correct POS permissions"""
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/login",
            json={
                "staff_number": "TS-001",
                "password": "Test123!"
            }
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify login success
        assert data.get("success") == True
        assert "token" in data
        assert "staff" in data
        
        # Verify role
        staff = data["staff"]
        assert staff["role"] == "counter", f"Expected role 'counter', got '{staff['role']}'"
        
        # Verify permissions
        expected_permissions = ["pos.scan", "pos.pay", "pos.topup"]
        assert staff["permissions"] == expected_permissions, f"Expected {expected_permissions}, got {staff['permissions']}"
        
        print(f"✓ Counter role: {staff['role']}")
        print(f"✓ Counter permissions: {staff['permissions']}")
        print(f"✓ Counter should see tabs: topup, giftcard-redeem, payment")
    
    def test_support_role_permissions(self):
        """Test Support role (TS-002) has NO POS permissions"""
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/login",
            json={
                "staff_number": "TS-002",
                "password": "Test123!"
            }
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify login success
        assert data.get("success") == True
        assert "token" in data
        assert "staff" in data
        
        # Verify role
        staff = data["staff"]
        assert staff["role"] == "support", f"Expected role 'support', got '{staff['role']}'"
        
        # Verify permissions - Support has NO POS permissions
        expected_permissions = ["support.view", "support.manage", "tickets.view", "tickets.reply", "users.view"]
        assert staff["permissions"] == expected_permissions, f"Expected {expected_permissions}, got {staff['permissions']}"
        
        # Verify NO POS permissions
        pos_permissions = [p for p in staff["permissions"] if p.startswith("pos.")]
        assert len(pos_permissions) == 0, f"Support should have NO POS permissions, but has: {pos_permissions}"
        
        print(f"✓ Support role: {staff['role']}")
        print(f"✓ Support permissions: {staff['permissions']}")
        print(f"✓ Support should see: 'Kein Kassen-Zugang' message (NO tabs)")
    
    def test_marketing_role_permissions(self):
        """Test Marketing role (TS-003) has only voucher permissions"""
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/login",
            json={
                "staff_number": "TS-003",
                "password": "Test123!"
            }
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify login success
        assert data.get("success") == True
        assert "token" in data
        assert "staff" in data
        
        # Verify role
        staff = data["staff"]
        assert staff["role"] == "marketing", f"Expected role 'marketing', got '{staff['role']}'"
        
        # Verify permissions - Marketing has voucher permissions
        expected_permissions = ["vouchers.view", "vouchers.create", "campaigns.view", "campaigns.manage"]
        assert staff["permissions"] == expected_permissions, f"Expected {expected_permissions}, got {staff['permissions']}"
        
        # Verify has vouchers.create permission
        assert "vouchers.create" in staff["permissions"], "Marketing should have vouchers.create permission"
        
        # Verify NO POS permissions
        pos_permissions = [p for p in staff["permissions"] if p.startswith("pos.")]
        assert len(pos_permissions) == 0, f"Marketing should have NO POS permissions, but has: {pos_permissions}"
        
        print(f"✓ Marketing role: {staff['role']}")
        print(f"✓ Marketing permissions: {staff['permissions']}")
        print(f"✓ Marketing should see: only 'giftcard-create' tab")
    
    def test_role_permissions_mapping(self):
        """Test that all role permissions are correctly mapped"""
        expected_mappings = {
            "counter": ["pos.scan", "pos.pay", "pos.topup"],
            "support": ["support.view", "support.manage", "tickets.view", "tickets.reply", "users.view"],
            "marketing": ["vouchers.view", "vouchers.create", "campaigns.view", "campaigns.manage"],
            "manager": ["staff.view", "staff.manage", "reports.view", "stats.view"],
            "admin": ["*"]
        }
        
        # Test each available role
        test_credentials = {
            "counter": ("TS-001", "Test123!"),
            "support": ("TS-002", "Test123!"),
            "marketing": ("TS-003", "Test123!")
        }
        
        for role, (staff_number, password) in test_credentials.items():
            response = requests.post(
                f"{BASE_URL}/api/partner-portal/staff/login",
                json={
                    "staff_number": staff_number,
                    "password": password
                }
            )
            
            assert response.status_code == 200, f"Login failed for {role}: {response.text}"
            data = response.json()
            
            actual_role = data["staff"]["role"]
            actual_permissions = data["permissions"]
            
            assert actual_role == role, f"Expected role '{role}', got '{actual_role}'"
            assert actual_permissions == expected_mappings[role], f"Permissions mismatch for {role}"
            
            print(f"✓ {role}: {actual_permissions}")


class TestPOSAccessLogic:
    """Test POS access logic based on permissions"""
    
    def test_counter_pos_access(self):
        """Counter should have access to: topup, giftcard-redeem, payment"""
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/login",
            json={"staff_number": "TS-001", "password": "Test123!"}
        )
        
        data = response.json()
        permissions = data["permissions"]
        role = data["staff"]["role"]
        
        # Counter access logic (from StaffPOS.js canAccessMode function)
        can_access_topup = "pos.topup" in permissions or role == "counter"
        can_access_payment = "pos.pay" in permissions or role == "counter"
        can_access_giftcard_create = "vouchers.create" in permissions or role == "marketing"
        can_access_giftcard_redeem = "pos.scan" in permissions or role == "counter"
        
        assert can_access_topup == True, "Counter should access topup"
        assert can_access_payment == True, "Counter should access payment"
        assert can_access_giftcard_create == False, "Counter should NOT access giftcard-create"
        assert can_access_giftcard_redeem == True, "Counter should access giftcard-redeem"
        
        print("✓ Counter POS access: topup=True, payment=True, giftcard-create=False, giftcard-redeem=True")
    
    def test_support_pos_access(self):
        """Support should have NO POS access"""
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/login",
            json={"staff_number": "TS-002", "password": "Test123!"}
        )
        
        data = response.json()
        permissions = data["permissions"]
        role = data["staff"]["role"]
        
        # Support access logic (from StaffPOS.js hasAnyPOSAccess function)
        has_any_pos_access = (
            role == "admin" or 
            role == "counter" or 
            role == "marketing" or
            any(p == "*" or p.startswith("pos.") or p == "vouchers.create" for p in permissions)
        )
        
        assert has_any_pos_access == False, "Support should have NO POS access"
        
        print("✓ Support POS access: hasAnyPOSAccess=False (shows 'Kein Kassen-Zugang' message)")
    
    def test_marketing_pos_access(self):
        """Marketing should have access to: giftcard-create only"""
        response = requests.post(
            f"{BASE_URL}/api/partner-portal/staff/login",
            json={"staff_number": "TS-003", "password": "Test123!"}
        )
        
        data = response.json()
        permissions = data["permissions"]
        role = data["staff"]["role"]
        
        # Marketing access logic (from StaffPOS.js canAccessMode function)
        can_access_topup = "pos.topup" in permissions or role == "counter"
        can_access_payment = "pos.pay" in permissions or role == "counter"
        can_access_giftcard_create = "vouchers.create" in permissions or role == "marketing"
        can_access_giftcard_redeem = "pos.scan" in permissions or role == "counter"
        
        assert can_access_topup == False, "Marketing should NOT access topup"
        assert can_access_payment == False, "Marketing should NOT access payment"
        assert can_access_giftcard_create == True, "Marketing should access giftcard-create"
        assert can_access_giftcard_redeem == False, "Marketing should NOT access giftcard-redeem"
        
        print("✓ Marketing POS access: topup=False, payment=False, giftcard-create=True, giftcard-redeem=False")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
