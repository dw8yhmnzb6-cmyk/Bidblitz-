"""
Test Personalized Homepage API - /api/personalized/homepage
Tests personalized recommendations based on user activity
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPersonalizedHomepage:
    """Test personalized homepage recommendations API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@bidblitz.ae",
            "password": "Admin123!"
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_personalized_homepage_requires_auth(self):
        """Test that /personalized/homepage requires authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/personalized/homepage")
        
        # Should return 401 or 403 for unauthenticated requests
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        print(f"✓ Unauthenticated request correctly rejected: {data['detail']}")
    
    def test_personalized_homepage_returns_sections(self):
        """Test that /personalized/homepage returns all expected sections"""
        response = self.session.get(f"{BASE_URL}/api/personalized/homepage")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify sections exist
        assert "sections" in data, "Response should contain 'sections'"
        sections = data["sections"]
        
        # Check all expected section keys
        expected_sections = [
            "recommended_for_you",
            "continue_bidding", 
            "hot_right_now",
            "ending_soon",
            "similar_to_won"
        ]
        
        for section in expected_sections:
            assert section in sections, f"Missing section: {section}"
            assert isinstance(sections[section], list), f"Section {section} should be a list"
        
        print(f"✓ All sections present: {list(sections.keys())}")
        print(f"  - recommended_for_you: {len(sections['recommended_for_you'])} items")
        print(f"  - continue_bidding: {len(sections['continue_bidding'])} items")
        print(f"  - hot_right_now: {len(sections['hot_right_now'])} items")
        print(f"  - ending_soon: {len(sections['ending_soon'])} items")
        print(f"  - similar_to_won: {len(sections['similar_to_won'])} items")
    
    def test_personalized_homepage_returns_greeting(self):
        """Test that /personalized/homepage returns personalized greeting"""
        response = self.session.get(f"{BASE_URL}/api/personalized/homepage")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify greeting exists
        assert "greeting" in data, "Response should contain 'greeting'"
        greeting = data["greeting"]
        
        # Greeting should have German and English versions
        assert "de" in greeting, "Greeting should have German version"
        assert "en" in greeting, "Greeting should have English version"
        
        # German greeting should contain time-based greeting
        de_greeting = greeting["de"]
        valid_greetings = ["Guten Morgen", "Hallo", "Guten Abend"]
        has_valid_greeting = any(g in de_greeting for g in valid_greetings)
        assert has_valid_greeting, f"German greeting should contain time-based greeting: {de_greeting}"
        
        # Greeting should contain username (Admin)
        assert "Admin" in de_greeting, f"Greeting should contain username: {de_greeting}"
        
        print(f"✓ Personalized greeting: {de_greeting}")
    
    def test_personalized_homepage_returns_user_preferences(self):
        """Test that /personalized/homepage returns user preferences"""
        response = self.session.get(f"{BASE_URL}/api/personalized/homepage")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify user_preferences exists
        assert "user_preferences" in data, "Response should contain 'user_preferences'"
        prefs = data["user_preferences"]
        
        # Check expected preference fields
        assert "favorite_categories" in prefs, "Preferences should have favorite_categories"
        assert "is_active_user" in prefs, "Preferences should have is_active_user"
        
        assert isinstance(prefs["favorite_categories"], list), "favorite_categories should be a list"
        assert isinstance(prefs["is_active_user"], bool), "is_active_user should be a boolean"
        
        print(f"✓ User preferences: favorite_categories={prefs['favorite_categories']}, is_active_user={prefs['is_active_user']}")
    
    def test_hot_right_now_section_structure(self):
        """Test that hot_right_now section items have correct structure"""
        response = self.session.get(f"{BASE_URL}/api/personalized/homepage")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        hot_items = data["sections"]["hot_right_now"]
        
        if len(hot_items) > 0:
            item = hot_items[0]
            
            # Check required fields
            required_fields = ["auction_id", "product_name", "current_price", "total_bids", "reason"]
            for field in required_fields:
                assert field in item, f"Hot item missing field: {field}"
            
            # Validate data types
            assert isinstance(item["auction_id"], str), "auction_id should be string"
            assert isinstance(item["product_name"], str), "product_name should be string"
            assert isinstance(item["current_price"], (int, float)), "current_price should be number"
            assert isinstance(item["total_bids"], int), "total_bids should be integer"
            assert isinstance(item["reason"], str), "reason should be string"
            
            print(f"✓ Hot item structure valid: {item['product_name']} - {item['total_bids']} bids")
        else:
            print("⚠ No hot_right_now items to validate structure")
    
    def test_similar_products_endpoint(self):
        """Test /personalized/similar-products/{product_id} endpoint"""
        # First get a product ID from hot_right_now
        response = self.session.get(f"{BASE_URL}/api/personalized/homepage")
        assert response.status_code == 200
        
        hot_items = response.json()["sections"]["hot_right_now"]
        
        if len(hot_items) > 0:
            # Get products to find a product_id
            products_response = self.session.get(f"{BASE_URL}/api/products")
            if products_response.status_code == 200 and len(products_response.json()) > 0:
                product_id = products_response.json()[0]["id"]
                
                # Test similar products endpoint
                similar_response = self.session.get(f"{BASE_URL}/api/personalized/similar-products/{product_id}")
                assert similar_response.status_code == 200, f"Expected 200, got {similar_response.status_code}"
                
                data = similar_response.json()
                assert "similar" in data, "Response should contain 'similar'"
                assert isinstance(data["similar"], list), "similar should be a list"
                
                print(f"✓ Similar products endpoint works: {len(data['similar'])} similar products found")
            else:
                print("⚠ No products available to test similar products endpoint")
        else:
            print("⚠ No hot items to get product ID from")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
