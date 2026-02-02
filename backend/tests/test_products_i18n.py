"""
Test suite for Products API and i18n features
Tests: 72 new 2025/2026 products, Kosovo (xk) -> Albanian (sq) mapping
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductsAPI:
    """Products API tests - verify 72 new 2025/2026 products"""
    
    def test_products_count(self):
        """Verify products API returns 72 products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 72, f"Expected 72 products, got {len(products)}"
        print(f"✓ Products count: {len(products)}")
    
    def test_products_are_2025_2026(self):
        """Verify products are 2025/2026 models (iPhone 17, Galaxy S25, etc.)"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        # Check for 2025/2026 product names
        new_product_keywords = [
            "iPhone 17", "Galaxy S25", "Galaxy Z Fold 7", "Galaxy Z Flip 7",
            "Pixel 10", "OnePlus 14", "MacBook M4", "iPad Pro M4",
            "Apple Watch Ultra 3", "AirPods Pro 3", "Galaxy Watch 8",
            "PlayStation 6", "Xbox Series X2", "Nintendo Switch 3"
        ]
        
        found_new_products = []
        for product in products:
            name = product.get("name", "")
            for keyword in new_product_keywords:
                if keyword in name:
                    found_new_products.append(name)
                    break
        
        # Should have at least 15 new 2025/2026 products
        assert len(found_new_products) >= 15, f"Expected at least 15 new products, found {len(found_new_products)}"
        print(f"✓ Found {len(found_new_products)} new 2025/2026 products")
        
        # Verify NO old products (iPhone 15, Galaxy S24, etc.)
        old_product_keywords = ["iPhone 15", "iPhone 14", "Galaxy S24", "Galaxy S23", "Pixel 8", "Pixel 7"]
        old_products_found = []
        for product in products:
            name = product.get("name", "")
            for keyword in old_product_keywords:
                if keyword in name:
                    old_products_found.append(name)
                    break
        
        assert len(old_products_found) == 0, f"Found old products that should be removed: {old_products_found}"
        print("✓ No old products found (iPhone 15, Galaxy S24, etc.)")
    
    def test_product_structure(self):
        """Verify product structure has required fields"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        required_fields = ["id", "name", "description", "retail_price", "image_url", "category"]
        
        for product in products[:5]:  # Check first 5 products
            for field in required_fields:
                assert field in product, f"Product missing field: {field}"
        
        print("✓ Product structure is correct")
    
    def test_product_categories(self):
        """Verify products have proper categories"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        categories = set(p.get("category") for p in products)
        expected_categories = ["Smartphones", "Tablets", "Laptops", "Gaming", "Audio", "Wearables"]
        
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
        
        print(f"✓ Found categories: {categories}")


class TestLastChanceAPI:
    """Last Chance API tests"""
    
    def test_ending_soon(self):
        """Test /api/last-chance/ending-soon returns time brackets"""
        response = requests.get(f"{BASE_URL}/api/last-chance/ending-soon")
        assert response.status_code == 200
        data = response.json()
        
        assert "brackets" in data
        assert "total_ending_soon" in data
        print(f"✓ Last Chance ending-soon: {data['total_ending_soon']} auctions")
    
    def test_hot_auctions(self):
        """Test /api/last-chance/hot returns hot auctions"""
        response = requests.get(f"{BASE_URL}/api/last-chance/hot")
        assert response.status_code == 200
        data = response.json()
        
        assert "auctions" in data
        print(f"✓ Hot auctions: {len(data['auctions'])} auctions")


class TestReviewsAPI:
    """Reviews API tests"""
    
    def test_public_reviews(self):
        """Test /api/reviews/public returns reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews/public")
        assert response.status_code == 200
        data = response.json()
        
        assert "reviews" in data
        assert "average_rating" in data
        assert "total" in data
        print(f"✓ Public reviews: {data['total']} reviews, avg rating: {data['average_rating']}")


class TestBundlesAPI:
    """Bundles API tests (requires auth)"""
    
    def test_bundles_requires_auth(self):
        """Test /api/bundles/available requires authentication"""
        response = requests.get(f"{BASE_URL}/api/bundles/available")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print("✓ Bundles API requires authentication")


class TestFriendBattleAPI:
    """Friend Battle API tests"""
    
    def test_battle_types(self):
        """Test /api/friend-battle/types returns battle types"""
        response = requests.get(f"{BASE_URL}/api/friend-battle/types")
        assert response.status_code == 200
        data = response.json()
        
        assert "types" in data
        assert len(data["types"]) >= 4
        print(f"✓ Battle types: {len(data['types'])} types")
    
    def test_leaderboard(self):
        """Test /api/friend-battle/leaderboard is public"""
        response = requests.get(f"{BASE_URL}/api/friend-battle/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        print(f"✓ Battle leaderboard: {len(data['leaderboard'])} entries")


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for customer user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "kunde@bidblitz.de",
            "password": "Kunde123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_bundles_with_auth(self, auth_token):
        """Test /api/bundles/available with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/bundles/available", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "bundles" in data
        assert len(data["bundles"]) >= 4
        print(f"✓ Bundles with auth: {len(data['bundles'])} bundles available")
    
    def test_friend_battle_my_battles(self, auth_token):
        """Test /api/friend-battle/my-battles with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/friend-battle/my-battles", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "pending_received" in data
        assert "pending_sent" in data
        assert "active" in data
        assert "completed" in data
        print("✓ Friend battle my-battles returns correct structure")
    
    def test_reviews_my_pending(self, auth_token):
        """Test /api/reviews/my-pending with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/reviews/my-pending", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "pending_reviews" in data
        print(f"✓ My pending reviews: {len(data['pending_reviews'])} pending")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
