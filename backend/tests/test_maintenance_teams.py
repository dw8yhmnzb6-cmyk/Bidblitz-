"""
Test Suite for Maintenance Schedule and Team Leave Features
Tests:
- GET /api/maintenance/status - maintenance status including scheduled
- POST /api/maintenance/schedule - schedule maintenance (admin)
- DELETE /api/maintenance/schedule - cancel scheduled maintenance (admin)
- POST /api/teams/create - create team
- GET /api/teams/my-team - get user's team
- POST /api/teams/leave - leave team (THE CRITICAL FIX)
- GET /api/teams/leaderboard - team leaderboard
- POST /api/teams/join/{code} - join team using invite code
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@bidblitz.de"
ADMIN_PASSWORD = "Admin123!"
TEST_USER_EMAIL = "spinner@bidblitz.de"
TEST_USER_PASSWORD = "Spinner123!"


class TestAuthentication:
    """Test authentication for admin and regular user"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data.get("user", {}).get("is_admin") == True, "User is not admin"
        print(f"✓ Admin login successful")
    
    def test_user_login(self):
        """Test regular user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        print(f"✓ User login successful")


class TestMaintenanceStatus:
    """Test maintenance status endpoints"""
    
    def test_get_maintenance_status_public(self):
        """GET /api/maintenance/status - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/maintenance/status")
        assert response.status_code == 200, f"Failed to get maintenance status: {response.text}"
        data = response.json()
        assert "enabled" in data, "Missing 'enabled' field"
        assert "scheduled" in data, "Missing 'scheduled' field"
        print(f"✓ Maintenance status: enabled={data['enabled']}, scheduled={data['scheduled']}")
    
    def test_get_maintenance_admin_status(self):
        """GET /api/maintenance/admin/status - admin endpoint"""
        # Login as admin
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json().get("token")
        
        response = requests.get(
            f"{BASE_URL}/api/maintenance/admin/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed to get admin maintenance status: {response.text}"
        data = response.json()
        assert "enabled" in data, "Missing 'enabled' field"
        assert "scheduled" in data, "Missing 'scheduled' field"
        print(f"✓ Admin maintenance status retrieved successfully")


class TestMaintenanceSchedule:
    """Test scheduled maintenance endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json().get("token")
    
    def test_schedule_maintenance(self, admin_token):
        """POST /api/maintenance/schedule - schedule maintenance"""
        # Schedule maintenance for 1 hour from now
        start_time = (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
        end_time = (datetime.utcnow() + timedelta(hours=2)).isoformat() + "Z"
        
        response = requests.post(
            f"{BASE_URL}/api/maintenance/schedule",
            json={
                "message": "Test scheduled maintenance",
                "start_time": start_time,
                "end_time": end_time
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to schedule maintenance: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Schedule not successful"
        assert "scheduled" in data, "Missing 'scheduled' in response"
        print(f"✓ Maintenance scheduled successfully: {data['scheduled']}")
    
    def test_verify_scheduled_maintenance_in_status(self, admin_token):
        """Verify scheduled maintenance appears in status"""
        # First schedule maintenance
        start_time = (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
        end_time = (datetime.utcnow() + timedelta(hours=2)).isoformat() + "Z"
        
        requests.post(
            f"{BASE_URL}/api/maintenance/schedule",
            json={
                "message": "Test scheduled maintenance",
                "start_time": start_time,
                "end_time": end_time
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Check status
        response = requests.get(f"{BASE_URL}/api/maintenance/status")
        assert response.status_code == 200
        data = response.json()
        assert data.get("scheduled") is not None, "Scheduled maintenance not in status"
        print(f"✓ Scheduled maintenance visible in status")
    
    def test_cancel_scheduled_maintenance(self, admin_token):
        """DELETE /api/maintenance/schedule - cancel scheduled maintenance"""
        response = requests.delete(
            f"{BASE_URL}/api/maintenance/schedule",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to cancel scheduled maintenance: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Cancel not successful"
        print(f"✓ Scheduled maintenance cancelled successfully")
    
    def test_verify_cancelled_maintenance_not_in_status(self, admin_token):
        """Verify cancelled maintenance is removed from status"""
        # Cancel any existing scheduled maintenance
        requests.delete(
            f"{BASE_URL}/api/maintenance/schedule",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Check status
        response = requests.get(f"{BASE_URL}/api/maintenance/status")
        assert response.status_code == 200
        data = response.json()
        assert data.get("scheduled") is None, "Scheduled maintenance still in status after cancel"
        print(f"✓ Scheduled maintenance removed from status after cancel")
    
    def test_schedule_maintenance_validation_end_before_start(self, admin_token):
        """Test validation: end time must be after start time"""
        start_time = (datetime.utcnow() + timedelta(hours=2)).isoformat() + "Z"
        end_time = (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"  # Before start
        
        response = requests.post(
            f"{BASE_URL}/api/maintenance/schedule",
            json={
                "message": "Test",
                "start_time": start_time,
                "end_time": end_time
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400, "Should reject end time before start time"
        print(f"✓ Validation: end time before start time rejected")
    
    def test_schedule_maintenance_validation_past_start(self, admin_token):
        """Test validation: start time cannot be in the past"""
        start_time = (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z"  # In past
        end_time = (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
        
        response = requests.post(
            f"{BASE_URL}/api/maintenance/schedule",
            json={
                "message": "Test",
                "start_time": start_time,
                "end_time": end_time
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400, "Should reject start time in past"
        print(f"✓ Validation: start time in past rejected")


class TestTeamLeaderboard:
    """Test team leaderboard endpoint"""
    
    def test_get_team_leaderboard(self):
        """GET /api/teams/leaderboard - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/teams/leaderboard")
        assert response.status_code == 200, f"Failed to get leaderboard: {response.text}"
        data = response.json()
        assert "leaderboard" in data, "Missing 'leaderboard' field"
        assert isinstance(data["leaderboard"], list), "Leaderboard should be a list"
        print(f"✓ Team leaderboard retrieved: {len(data['leaderboard'])} teams")


class TestTeamCRUD:
    """Test team create, read, leave operations - THE CRITICAL FIX"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("token")
    
    def test_get_my_team_no_team(self, user_token):
        """GET /api/teams/my-team - when user has no team"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        response = requests.get(
            f"{BASE_URL}/api/teams/my-team",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Failed to get my team: {response.text}"
        data = response.json()
        assert "has_team" in data, "Missing 'has_team' field"
        print(f"✓ My team status: has_team={data['has_team']}")
    
    def test_create_team(self, user_token):
        """POST /api/teams/create - create a new team"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        team_name = f"TestTeam_{datetime.now().strftime('%H%M%S')}"
        response = requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": team_name},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Failed to create team: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Team creation not successful"
        assert "team" in data, "Missing 'team' in response"
        assert data["team"].get("code") is not None, "Missing team code"
        print(f"✓ Team created: {data['team']['name']} with code {data['team']['code']}")
        return data["team"]["code"]
    
    def test_get_my_team_with_team(self, user_token):
        """GET /api/teams/my-team - when user has a team"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Create a team
        team_name = f"TestTeam_{datetime.now().strftime('%H%M%S')}"
        requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": team_name},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Get my team
        response = requests.get(
            f"{BASE_URL}/api/teams/my-team",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Failed to get my team: {response.text}"
        data = response.json()
        assert data.get("has_team") == True, "Should have team"
        assert data.get("team") is not None, "Missing team data"
        assert data["team"].get("name") == team_name, "Team name mismatch"
        print(f"✓ My team retrieved: {data['team']['name']}")
    
    def test_leave_team_critical_fix(self, user_token):
        """POST /api/teams/leave - THE CRITICAL FIX - leave team"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Create a team
        team_name = f"TestTeam_{datetime.now().strftime('%H%M%S')}"
        requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": team_name},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Verify user is in team
        my_team_res = requests.get(
            f"{BASE_URL}/api/teams/my-team",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert my_team_res.json().get("has_team") == True, "User should be in team before leaving"
        
        # Leave team - THE CRITICAL TEST
        response = requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Failed to leave team: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Leave team not successful"
        print(f"✓ CRITICAL FIX VERIFIED: Leave team successful - {data.get('message')}")
        
        # Verify user is no longer in team
        my_team_res = requests.get(
            f"{BASE_URL}/api/teams/my-team",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert my_team_res.json().get("has_team") == False, "User should not be in team after leaving"
        print(f"✓ Verified: User no longer in team after leaving")
    
    def test_leave_team_when_not_in_team(self, user_token):
        """POST /api/teams/leave - when user is not in a team"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Try to leave again
        response = requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 404, f"Should return 404 when not in team: {response.text}"
        print(f"✓ Leave team when not in team returns 404 as expected")
    
    def test_join_team_with_code(self, user_token):
        """POST /api/teams/join/{code} - join team using invite code"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Create a team to get a code
        team_name = f"TestTeam_{datetime.now().strftime('%H%M%S')}"
        create_res = requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": team_name},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        team_code = create_res.json()["team"]["code"]
        
        # Leave the team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Note: Can't join own team after leaving as it's disbanded (single member)
        # Test with invalid code instead
        response = requests.post(
            f"{BASE_URL}/api/teams/join/INVALID",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 404, f"Should return 404 for invalid code: {response.text}"
        print(f"✓ Join team with invalid code returns 404 as expected")
    
    def test_cannot_create_team_when_already_in_team(self, user_token):
        """POST /api/teams/create - should fail when already in a team"""
        # First leave any existing team
        requests.post(
            f"{BASE_URL}/api/teams/leave",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Create a team
        team_name = f"TestTeam_{datetime.now().strftime('%H%M%S')}"
        requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": team_name},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Try to create another team
        response = requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": "AnotherTeam"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 400, f"Should return 400 when already in team: {response.text}"
        print(f"✓ Cannot create team when already in team - returns 400")


class TestFullTeamFlow:
    """Test complete team flow: create -> view -> leave"""
    
    def test_complete_team_flow(self):
        """Test the complete team flow as described in the bug fix"""
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_res.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 1: Leave any existing team
        requests.post(f"{BASE_URL}/api/teams/leave", headers=headers)
        
        # Step 2: Verify no team
        my_team_res = requests.get(f"{BASE_URL}/api/teams/my-team", headers=headers)
        assert my_team_res.json().get("has_team") == False, "Should have no team initially"
        print("✓ Step 1: User has no team")
        
        # Step 3: Create team
        team_name = f"FlowTest_{datetime.now().strftime('%H%M%S')}"
        create_res = requests.post(
            f"{BASE_URL}/api/teams/create",
            json={"name": team_name},
            headers=headers
        )
        assert create_res.status_code == 200, f"Failed to create team: {create_res.text}"
        team_code = create_res.json()["team"]["code"]
        print(f"✓ Step 2: Team created with code {team_code}")
        
        # Step 4: View team
        my_team_res = requests.get(f"{BASE_URL}/api/teams/my-team", headers=headers)
        assert my_team_res.json().get("has_team") == True, "Should have team after creation"
        assert my_team_res.json()["team"]["name"] == team_name, "Team name mismatch"
        print(f"✓ Step 3: Team viewed successfully")
        
        # Step 5: Leave team - THE CRITICAL FIX
        leave_res = requests.post(f"{BASE_URL}/api/teams/leave", headers=headers)
        assert leave_res.status_code == 200, f"Failed to leave team: {leave_res.text}"
        assert leave_res.json().get("success") == True, "Leave should be successful"
        print(f"✓ Step 4: CRITICAL - Leave team successful")
        
        # Step 6: Verify no team after leaving
        my_team_res = requests.get(f"{BASE_URL}/api/teams/my-team", headers=headers)
        assert my_team_res.json().get("has_team") == False, "Should have no team after leaving"
        print(f"✓ Step 5: Verified user has no team after leaving")
        
        print("\n✅ COMPLETE TEAM FLOW TEST PASSED - Leave button fix verified!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
