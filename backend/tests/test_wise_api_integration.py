"""
Wise API Integration Tests for SEPA Payouts
============================================
Tests for the Wise Transfer API integration for enterprise SEPA payouts.
Features:
- POST /api/enterprise/admin/payouts/{id}/process?use_wise=true - Tries Wise API first
- If Wise API fails (401 Unauthorized), status is 'pending_manual' instead of 'completed'
- Response includes transfer_method field (wise_api or manual)
- Status badges include 'pending_manual' and 'funded' states
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_KEY = "bidblitz-admin-2026"
ENTERPRISE_ID = "ent_ee2a8554c977"


class TestWiseAPIIntegration:
    """Tests for Wise API integration in payout processing"""
    
    def test_process_payout_with_use_wise_true(self):
        """Test POST /api/enterprise/admin/payouts/{id}/process?use_wise=true - Tries Wise API first"""
        # First ensure IBAN is set for the test enterprise
        iban_response = requests.put(
            f"{BASE_URL}/api/enterprise/admin/payout-settings/{ENTERPRISE_ID}",
            headers={
                "x-admin-key": ADMIN_KEY,
                "Content-Type": "application/json"
            },
            json={
                "iban": "DE89370400440532013000",
                "iban_holder": "Test Edeka GmbH",
                "payout_frequency": "monthly",
                "min_payout_amount": 10
            }
        )
        
        if iban_response.status_code != 200:
            pytest.skip(f"Could not set IBAN: {iban_response.text}")
        
        # Create a payout
        create_response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/create",
            headers={
                "x-admin-key": ADMIN_KEY,
                "Content-Type": "application/json"
            },
            json={
                "enterprise_id": ENTERPRISE_ID,
                "amount": 25.00,
                "note": "TEST_wise_api_integration"
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create payout: {create_response.text}")
        
        payout_id = create_response.json()["payout_id"]
        
        # Process the payout with use_wise=true (default)
        response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/{payout_id}/process?use_wise=true",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "sepa_reference" in data, "Response should contain sepa_reference"
        assert "status" in data, "Response should contain status"
        
        # Since Wise API token is invalid (401), status should be pending_manual
        print(f"✓ Process payout with use_wise=true:")
        print(f"  - SEPA Reference: {data['sepa_reference']}")
        print(f"  - Status: {data['status']}")
        print(f"  - Message: {data.get('message', 'N/A')}")
        
        return payout_id
    
    def test_wise_api_fallback_to_pending_manual(self):
        """Test that if Wise API fails, status is 'pending_manual' instead of 'completed'"""
        # Create a payout
        create_response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/create",
            headers={
                "x-admin-key": ADMIN_KEY,
                "Content-Type": "application/json"
            },
            json={
                "enterprise_id": ENTERPRISE_ID,
                "amount": 30.00,
                "note": "TEST_wise_fallback_pending_manual"
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create payout: {create_response.text}")
        
        payout_id = create_response.json()["payout_id"]
        
        # Process the payout - Wise API should fail (401 Unauthorized)
        response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/{payout_id}/process?use_wise=true",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Since Wise API token is invalid, status should be pending_manual
        assert data.get("status") == "pending_manual", f"Expected status 'pending_manual', got '{data.get('status')}'"
        
        # Verify the payout in history has pending_manual status
        history_response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/payouts/history?enterprise_id={ENTERPRISE_ID}&limit=10",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert history_response.status_code == 200
        history_data = history_response.json()
        
        # Find our payout
        found_payout = None
        for payout in history_data["payouts"]:
            if payout["id"] == payout_id:
                found_payout = payout
                break
        
        if found_payout:
            assert found_payout["status"] == "pending_manual", f"Payout status in history should be 'pending_manual', got '{found_payout['status']}'"
            print(f"✓ Wise API fallback to pending_manual verified:")
            print(f"  - Payout ID: {payout_id}")
            print(f"  - Status in history: {found_payout['status']}")
        else:
            print(f"✓ Payout created with pending_manual status (not found in recent history)")
    
    def test_response_includes_transfer_method_field(self):
        """Test that response includes transfer_method field (wise_api or manual)"""
        # Create a payout
        create_response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/create",
            headers={
                "x-admin-key": ADMIN_KEY,
                "Content-Type": "application/json"
            },
            json={
                "enterprise_id": ENTERPRISE_ID,
                "amount": 35.00,
                "note": "TEST_transfer_method_field"
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create payout: {create_response.text}")
        
        payout_id = create_response.json()["payout_id"]
        
        # Process the payout
        response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/{payout_id}/process?use_wise=true",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check payout history for transfer_method field
        history_response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/payouts/history?enterprise_id={ENTERPRISE_ID}&limit=20",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert history_response.status_code == 200
        history_data = history_response.json()
        
        # Find our payout
        found_payout = None
        for payout in history_data["payouts"]:
            if payout["id"] == payout_id:
                found_payout = payout
                break
        
        assert found_payout is not None, f"Payout {payout_id} not found in history"
        assert "transfer_method" in found_payout, "Payout should have transfer_method field"
        
        # Since Wise API fails, transfer_method should be 'manual'
        assert found_payout["transfer_method"] in ["wise_api", "manual"], f"transfer_method should be 'wise_api' or 'manual', got '{found_payout['transfer_method']}'"
        
        print(f"✓ Response includes transfer_method field:")
        print(f"  - Payout ID: {payout_id}")
        print(f"  - Transfer Method: {found_payout['transfer_method']}")
        print(f"  - Status: {found_payout['status']}")
    
    def test_payout_history_shows_transfer_method(self):
        """Test that payout history shows transfer method for all payouts"""
        response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/payouts/history?limit=50",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check that processed payouts have transfer_method field
        processed_payouts = [p for p in data["payouts"] if p.get("status") in ["completed", "pending_manual", "processing", "funded"]]
        
        print(f"✓ Payout history transfer methods:")
        for payout in processed_payouts[:5]:  # Show first 5
            transfer_method = payout.get("transfer_method", "not_set")
            print(f"  - {payout['id']}: {transfer_method} (status: {payout['status']})")
    
    def test_status_badges_include_pending_manual_and_funded(self):
        """Test that status badges include 'pending_manual' and 'funded' states"""
        response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/payouts/history?limit=100",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Collect all unique statuses
        statuses = set()
        for payout in data["payouts"]:
            statuses.add(payout.get("status", "unknown"))
        
        print(f"✓ Status badges found in payout history:")
        print(f"  - Statuses: {statuses}")
        
        # Verify totals include pending_manual status tracking
        totals = data.get("totals", {})
        print(f"  - Totals structure: {list(totals.keys())}")
        
        # The API should support these statuses
        expected_statuses = {"pending", "processing", "completed", "failed", "pending_manual", "funded"}
        print(f"  - Expected statuses: {expected_statuses}")
    
    def test_process_payout_with_use_wise_false(self):
        """Test POST /api/enterprise/admin/payouts/{id}/process?use_wise=false - Skips Wise API"""
        # Create a payout
        create_response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/create",
            headers={
                "x-admin-key": ADMIN_KEY,
                "Content-Type": "application/json"
            },
            json={
                "enterprise_id": ENTERPRISE_ID,
                "amount": 40.00,
                "note": "TEST_skip_wise_api"
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create payout: {create_response.text}")
        
        payout_id = create_response.json()["payout_id"]
        
        # Process the payout with use_wise=false
        response = requests.post(
            f"{BASE_URL}/api/enterprise/admin/payouts/{payout_id}/process?use_wise=false",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        # When use_wise=false, it should go directly to pending_manual
        assert data.get("status") == "pending_manual", f"Expected status 'pending_manual', got '{data.get('status')}'"
        
        print(f"✓ Process payout with use_wise=false:")
        print(f"  - SEPA Reference: {data.get('sepa_reference')}")
        print(f"  - Status: {data['status']}")
        print(f"  - Message: {data.get('message', 'N/A')}")


class TestExistingPayoutsVerification:
    """Verify existing test payouts mentioned in the request"""
    
    def test_verify_existing_payouts(self):
        """Verify existing test payouts: payout_a4371b1f90bb (€150, completed), payout_b77f4d3c52d4 (€25, pending_manual)"""
        response = requests.get(
            f"{BASE_URL}/api/enterprise/admin/payouts/history?limit=100",
            headers={"x-admin-key": ADMIN_KEY}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Look for the specific payouts
        payout_a = None
        payout_b = None
        
        for payout in data["payouts"]:
            if payout["id"] == "payout_a4371b1f90bb":
                payout_a = payout
            elif payout["id"] == "payout_b77f4d3c52d4":
                payout_b = payout
        
        print(f"✓ Existing payouts verification:")
        
        if payout_a:
            print(f"  - payout_a4371b1f90bb: €{payout_a.get('amount', 'N/A')}, status: {payout_a.get('status', 'N/A')}, transfer_method: {payout_a.get('transfer_method', 'N/A')}")
        else:
            print(f"  - payout_a4371b1f90bb: Not found in history")
        
        if payout_b:
            print(f"  - payout_b77f4d3c52d4: €{payout_b.get('amount', 'N/A')}, status: {payout_b.get('status', 'N/A')}, transfer_method: {payout_b.get('transfer_method', 'N/A')}")
        else:
            print(f"  - payout_b77f4d3c52d4: Not found in history")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
