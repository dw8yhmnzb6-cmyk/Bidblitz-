"""
KYC Verification System Tests
Tests for KYC document upload, submission, status, and admin approval/rejection
"""
import pytest
import requests
import os
import time
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@bidblitz.ae"
ADMIN_PASSWORD = "Admin123!"
TEST_USER_EMAIL = f"kyc-test-{int(time.time())}@test.de"
TEST_USER_PASSWORD = "Test123!"
TEST_USER_NAME = "KYC Test User"


class TestKYCVerificationSystem:
    """KYC Verification System Tests"""
    
    admin_token = None
    test_user_token = None
    test_user_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    # ==================== ADMIN LOGIN ====================
    
    def test_01_admin_login(self):
        """Test admin login to get token for KYC approval tests"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data.get("user", {}).get("is_admin") == True, "User is not admin"
        
        TestKYCVerificationSystem.admin_token = data["token"]
        print(f"✓ Admin login successful")
    
    # ==================== USER REGISTRATION ====================
    
    def test_02_register_new_user(self):
        """Test registering a new user for KYC testing"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "source": "test"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        
        TestKYCVerificationSystem.test_user_token = data["token"]
        TestKYCVerificationSystem.test_user_id = data["user"]["id"]
        print(f"✓ User registered: {TEST_USER_EMAIL}")
    
    # ==================== KYC STATUS CHECK ====================
    
    def test_03_get_kyc_status_initial(self):
        """Test getting initial KYC status for new user"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/status",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC status check failed: {response.text}"
        data = response.json()
        
        # New user should have pending status with no documents
        assert data.get("status") == "pending", f"Expected pending status, got: {data.get('status')}"
        assert data.get("id_front_uploaded") == False, "ID front should not be uploaded"
        assert data.get("id_back_uploaded") == False, "ID back should not be uploaded"
        assert data.get("selfie_uploaded") == False, "Selfie should not be uploaded"
        
        print(f"✓ Initial KYC status is pending with no documents")
    
    # ==================== KYC DOCUMENT UPLOAD ====================
    
    def test_04_upload_id_front(self):
        """Test uploading ID front document"""
        # Create a simple test image (1x1 pixel PNG)
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("id_front.png", test_image, "image/png")}
        
        response = requests.post(
            f"{BASE_URL}/api/auth/kyc/upload?document_type=id_front",
            files=files,
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"ID front upload failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Upload not successful"
        assert data.get("document_type") == "id_front", "Wrong document type"
        assert "url" in data, "No URL in response"
        
        print(f"✓ ID front uploaded successfully")
    
    def test_05_upload_id_back(self):
        """Test uploading ID back document"""
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("id_back.png", test_image, "image/png")}
        
        response = requests.post(
            f"{BASE_URL}/api/auth/kyc/upload?document_type=id_back",
            files=files,
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"ID back upload failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Upload not successful"
        assert data.get("document_type") == "id_back", "Wrong document type"
        
        print(f"✓ ID back uploaded successfully")
    
    def test_06_upload_selfie(self):
        """Test uploading selfie document"""
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("selfie.png", test_image, "image/png")}
        
        response = requests.post(
            f"{BASE_URL}/api/auth/kyc/upload?document_type=selfie",
            files=files,
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"Selfie upload failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Upload not successful"
        assert data.get("document_type") == "selfie", "Wrong document type"
        
        print(f"✓ Selfie uploaded successfully")
    
    def test_07_upload_invalid_document_type(self):
        """Test uploading with invalid document type"""
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test.png", test_image, "image/png")}
        
        response = requests.post(
            f"{BASE_URL}/api/auth/kyc/upload?document_type=invalid_type",
            files=files,
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid type, got: {response.status_code}"
        print(f"✓ Invalid document type correctly rejected")
    
    # ==================== KYC SUBMISSION ====================
    
    def test_08_submit_kyc_documents(self):
        """Test submitting KYC documents for review"""
        # Use data URLs for the submission (simulating what frontend sends)
        test_data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = self.session.post(
            f"{BASE_URL}/api/auth/kyc/submit",
            json={
                "id_front_url": test_data_url,
                "id_back_url": test_data_url,
                "selfie_url": test_data_url
            },
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC submission failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Submission not successful"
        
        print(f"✓ KYC documents submitted successfully")
    
    def test_09_get_kyc_status_after_submission(self):
        """Test KYC status after document submission"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/status",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC status check failed: {response.text}"
        data = response.json()
        
        # After submission, status should still be pending but documents uploaded
        assert data.get("status") == "pending", f"Expected pending status, got: {data.get('status')}"
        assert data.get("id_front_uploaded") == True, "ID front should be uploaded"
        assert data.get("id_back_uploaded") == True, "ID back should be uploaded"
        assert data.get("selfie_uploaded") == True, "Selfie should be uploaded"
        assert data.get("submitted_at") is not None, "Submitted at should be set"
        
        print(f"✓ KYC status shows documents uploaded and pending review")
    
    # ==================== LOGIN BLOCKED FOR UNVERIFIED USER ====================
    
    def test_10_login_blocked_for_unverified_user(self):
        """Test that login is blocked for user with pending KYC"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        # Should get 403 with kyc_pending_approval message
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        data = response.json()
        assert "kyc_pending_approval" in data.get("detail", ""), f"Expected kyc_pending_approval, got: {data.get('detail')}"
        
        print(f"✓ Login correctly blocked for unverified user")
    
    # ==================== ADMIN KYC ENDPOINTS ====================
    
    def test_11_admin_get_pending_kyc_users(self):
        """Test admin getting list of pending KYC users"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/pending",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get pending users failed: {response.text}"
        data = response.json()
        assert "pending_users" in data, "No pending_users in response"
        assert "count" in data, "No count in response"
        
        # Our test user should be in the pending list
        pending_emails = [u.get("email") for u in data["pending_users"]]
        assert TEST_USER_EMAIL in pending_emails, f"Test user not in pending list: {pending_emails}"
        
        print(f"✓ Admin can see pending KYC users (count: {data['count']})")
    
    def test_12_admin_get_all_kyc_users(self):
        """Test admin getting all users with KYC info"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/all",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get all users failed: {response.text}"
        data = response.json()
        assert "users" in data, "No users in response"
        assert "count" in data, "No count in response"
        
        print(f"✓ Admin can see all KYC users (count: {data['count']})")
    
    def test_13_admin_get_kyc_users_filtered(self):
        """Test admin getting KYC users filtered by status"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/all?status=pending",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get filtered users failed: {response.text}"
        data = response.json()
        
        # All returned users should have pending status
        for user in data.get("users", []):
            assert user.get("kyc_status") == "pending", f"User has wrong status: {user.get('kyc_status')}"
        
        print(f"✓ Admin can filter KYC users by status")
    
    # ==================== KYC REJECTION ====================
    
    def test_14_admin_reject_kyc(self):
        """Test admin rejecting KYC verification"""
        rejection_reason = "Dokumente nicht lesbar - bitte erneut hochladen"
        
        response = self.session.post(
            f"{BASE_URL}/api/auth/kyc/approve",
            json={
                "user_id": TestKYCVerificationSystem.test_user_id,
                "approved": False,
                "rejection_reason": rejection_reason
            },
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.admin_token}"}
        )
        
        assert response.status_code == 200, f"KYC rejection failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Rejection not successful"
        
        print(f"✓ Admin rejected KYC successfully")
    
    def test_15_get_kyc_status_after_rejection(self):
        """Test KYC status after rejection"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/status",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC status check failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "rejected", f"Expected rejected status, got: {data.get('status')}"
        assert data.get("rejection_reason") is not None, "Rejection reason should be set"
        assert data.get("reviewed_at") is not None, "Reviewed at should be set"
        
        print(f"✓ KYC status shows rejected with reason: {data.get('rejection_reason')}")
    
    def test_16_login_blocked_for_rejected_user(self):
        """Test that login shows rejection message"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        data = response.json()
        assert "kyc_rejected:" in data.get("detail", ""), f"Expected kyc_rejected message, got: {data.get('detail')}"
        
        print(f"✓ Login shows rejection reason for rejected user")
    
    # ==================== KYC RESUBMISSION ====================
    
    def test_17_resubmit_kyc(self):
        """Test user resubmitting KYC after rejection"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/kyc/resubmit",
            json={},
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC resubmit failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Resubmit not successful"
        
        print(f"✓ User can resubmit KYC after rejection")
    
    def test_18_submit_kyc_again(self):
        """Test submitting KYC documents again after resubmit"""
        test_data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = self.session.post(
            f"{BASE_URL}/api/auth/kyc/submit",
            json={
                "id_front_url": test_data_url,
                "id_back_url": test_data_url,
                "selfie_url": test_data_url
            },
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC resubmission failed: {response.text}"
        print(f"✓ KYC documents resubmitted successfully")
    
    # ==================== KYC APPROVAL ====================
    
    def test_19_admin_approve_kyc(self):
        """Test admin approving KYC verification"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/kyc/approve",
            json={
                "user_id": TestKYCVerificationSystem.test_user_id,
                "approved": True
            },
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.admin_token}"}
        )
        
        assert response.status_code == 200, f"KYC approval failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Approval not successful"
        
        print(f"✓ Admin approved KYC successfully")
    
    def test_20_get_kyc_status_after_approval(self):
        """Test KYC status after approval"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/status",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 200, f"KYC status check failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "approved", f"Expected approved status, got: {data.get('status')}"
        assert data.get("reviewed_at") is not None, "Reviewed at should be set"
        
        print(f"✓ KYC status shows approved")
    
    def test_21_login_allowed_for_verified_user(self):
        """Test that login works for verified user"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed for verified user: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        
        print(f"✓ Verified user can login successfully")
    
    # ==================== ADMIN EXEMPTION ====================
    
    def test_22_admin_login_bypasses_kyc(self):
        """Test that admin login bypasses KYC check"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data.get("user", {}).get("is_admin") == True, "User is not admin"
        
        print(f"✓ Admin login bypasses KYC check")
    
    # ==================== NON-ADMIN ACCESS DENIED ====================
    
    def test_23_non_admin_cannot_access_pending_users(self):
        """Test that non-admin cannot access pending KYC users"""
        response = self.session.get(
            f"{BASE_URL}/api/auth/kyc/pending",
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print(f"✓ Non-admin cannot access pending KYC users")
    
    def test_24_non_admin_cannot_approve_kyc(self):
        """Test that non-admin cannot approve KYC"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/kyc/approve",
            json={
                "user_id": "some-user-id",
                "approved": True
            },
            headers={"Authorization": f"Bearer {TestKYCVerificationSystem.test_user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print(f"✓ Non-admin cannot approve KYC")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
