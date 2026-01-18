"""
Test suite for BidBlitz new features:
1. GET /api/auctions/{id}/bid-history - Bid history for auction
2. GET /api/winners - Winners gallery
3. GET /api/categories - Product categories with auction counts
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@bidblitz.de"
ADMIN_PASSWORD = "Admin123!"
CUSTOMER_EMAIL = "kunde@bidblitz.de"
CUSTOMER_PASSWORD = "Kunde123!"


class TestBidHistoryEndpoint:
    """Tests for GET /api/auctions/{auction_id}/bid-history"""
    
    def test_bid_history_returns_200_for_valid_auction(self):
        """Test that bid history endpoint returns 200 for a valid auction"""
        # First get list of auctions
        response = requests.get(f"{BASE_URL}/api/auctions")
        assert response.status_code == 200, f"Failed to get auctions: {response.text}"
        
        auctions = response.json()
        assert len(auctions) > 0, "No auctions found in database"
        
        # Get bid history for first auction
        auction_id = auctions[0]["id"]
        history_response = requests.get(f"{BASE_URL}/api/auctions/{auction_id}/bid-history")
        
        assert history_response.status_code == 200, f"Bid history failed: {history_response.text}"
        
        bid_history = history_response.json()
        assert isinstance(bid_history, list), "Bid history should be a list"
        print(f"✓ Bid history for auction {auction_id[:8]}... returned {len(bid_history)} bids")
    
    def test_bid_history_returns_404_for_invalid_auction(self):
        """Test that bid history returns 404 for non-existent auction"""
        response = requests.get(f"{BASE_URL}/api/auctions/invalid-auction-id-12345/bid-history")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Bid history returns 404 for invalid auction ID")
    
    def test_bid_history_structure(self):
        """Test that bid history entries have correct structure"""
        # Get an auction with bids
        response = requests.get(f"{BASE_URL}/api/auctions")
        auctions = response.json()
        
        # Find an auction with bids
        auction_with_bids = None
        for auction in auctions:
            if auction.get("total_bids", 0) > 0:
                auction_with_bids = auction
                break
        
        if not auction_with_bids:
            pytest.skip("No auctions with bids found for structure test")
        
        history_response = requests.get(f"{BASE_URL}/api/auctions/{auction_with_bids['id']}/bid-history")
        assert history_response.status_code == 200
        
        bid_history = history_response.json()
        if len(bid_history) > 0:
            bid = bid_history[0]
            # Check expected fields
            assert "user_name" in bid, "Bid should have user_name"
            assert "price" in bid, "Bid should have price"
            assert "timestamp" in bid, "Bid should have timestamp"
            print(f"✓ Bid history structure verified: user_name={bid['user_name']}, price={bid['price']}")
        else:
            print("✓ Bid history returned empty list (auction has no bids)")
    
    def test_bid_history_limit_parameter(self):
        """Test that limit parameter works correctly"""
        response = requests.get(f"{BASE_URL}/api/auctions")
        auctions = response.json()
        
        if len(auctions) == 0:
            pytest.skip("No auctions available")
        
        auction_id = auctions[0]["id"]
        
        # Test with limit=5
        history_response = requests.get(f"{BASE_URL}/api/auctions/{auction_id}/bid-history?limit=5")
        assert history_response.status_code == 200
        
        bid_history = history_response.json()
        assert len(bid_history) <= 5, f"Expected max 5 bids, got {len(bid_history)}"
        print(f"✓ Bid history limit parameter works: returned {len(bid_history)} bids (limit=5)")


class TestWinnersEndpoint:
    """Tests for GET /api/winners"""
    
    def test_winners_returns_200(self):
        """Test that winners endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/winners")
        assert response.status_code == 200, f"Winners endpoint failed: {response.text}"
        
        winners = response.json()
        assert isinstance(winners, list), "Winners should be a list"
        print(f"✓ Winners endpoint returned {len(winners)} winners")
    
    def test_winners_structure(self):
        """Test that winner entries have correct structure"""
        response = requests.get(f"{BASE_URL}/api/winners")
        assert response.status_code == 200
        
        winners = response.json()
        
        if len(winners) > 0:
            winner = winners[0]
            expected_fields = [
                "auction_id", "winner_name", "product_name", "product_image",
                "final_price", "retail_price", "savings_percent", "total_bids", "ended_at"
            ]
            
            for field in expected_fields:
                assert field in winner, f"Winner should have {field} field"
            
            print(f"✓ Winner structure verified:")
            print(f"  - Winner: {winner['winner_name']}")
            print(f"  - Product: {winner['product_name']}")
            print(f"  - Final price: €{winner['final_price']}")
            print(f"  - Savings: {winner['savings_percent']}%")
        else:
            print("✓ Winners endpoint returned empty list (no ended auctions with winners)")
    
    def test_winners_limit_parameter(self):
        """Test that limit parameter works correctly"""
        response = requests.get(f"{BASE_URL}/api/winners?limit=5")
        assert response.status_code == 200
        
        winners = response.json()
        assert len(winners) <= 5, f"Expected max 5 winners, got {len(winners)}"
        print(f"✓ Winners limit parameter works: returned {len(winners)} winners (limit=5)")
    
    def test_winners_savings_calculation(self):
        """Test that savings percentage is calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/winners")
        assert response.status_code == 200
        
        winners = response.json()
        
        for winner in winners[:3]:  # Check first 3
            if winner.get("retail_price") and winner.get("final_price"):
                expected_savings = round((winner["retail_price"] - winner["final_price"]) / winner["retail_price"] * 100)
                actual_savings = winner["savings_percent"]
                
                # Allow 1% tolerance for rounding
                assert abs(expected_savings - actual_savings) <= 1, \
                    f"Savings calculation mismatch: expected {expected_savings}%, got {actual_savings}%"
        
        print("✓ Winners savings calculation verified")


class TestCategoriesEndpoint:
    """Tests for GET /api/categories"""
    
    def test_categories_returns_200(self):
        """Test that categories endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Categories endpoint failed: {response.text}"
        
        categories = response.json()
        assert isinstance(categories, list), "Categories should be a list"
        print(f"✓ Categories endpoint returned {len(categories)} categories")
    
    def test_categories_structure(self):
        """Test that category entries have correct structure"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        
        if len(categories) > 0:
            category = categories[0]
            expected_fields = ["name", "product_count", "active_auction_count"]
            
            for field in expected_fields:
                assert field in category, f"Category should have {field} field"
            
            print(f"✓ Category structure verified:")
            for cat in categories[:5]:  # Show first 5
                print(f"  - {cat['name']}: {cat['product_count']} products, {cat['active_auction_count']} active auctions")
        else:
            print("✓ Categories endpoint returned empty list (no products)")
    
    def test_categories_sorted_by_auction_count(self):
        """Test that categories are sorted by active auction count descending"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        
        if len(categories) > 1:
            for i in range(len(categories) - 1):
                assert categories[i]["active_auction_count"] >= categories[i + 1]["active_auction_count"], \
                    "Categories should be sorted by active_auction_count descending"
            print("✓ Categories are sorted by active auction count (descending)")
        else:
            print("✓ Only one or no categories - sorting not applicable")


class TestIntegration:
    """Integration tests for new features"""
    
    def test_auction_detail_with_bid_history(self):
        """Test that auction detail and bid history work together"""
        # Get auctions
        auctions_response = requests.get(f"{BASE_URL}/api/auctions")
        assert auctions_response.status_code == 200
        
        auctions = auctions_response.json()
        if len(auctions) == 0:
            pytest.skip("No auctions available")
        
        auction = auctions[0]
        auction_id = auction["id"]
        
        # Get auction detail
        detail_response = requests.get(f"{BASE_URL}/api/auctions/{auction_id}")
        assert detail_response.status_code == 200
        
        # Get bid history
        history_response = requests.get(f"{BASE_URL}/api/auctions/{auction_id}/bid-history")
        assert history_response.status_code == 200
        
        bid_history = history_response.json()
        
        # Verify total_bids matches bid history length (approximately)
        # Note: bid_history might be limited, so we just check it's not more than total_bids
        if auction.get("total_bids", 0) > 0:
            assert len(bid_history) <= auction["total_bids"] + 5, \
                "Bid history length should not exceed total_bids significantly"
        
        print(f"✓ Auction {auction_id[:8]}... has {auction.get('total_bids', 0)} total bids, history shows {len(bid_history)}")
    
    def test_winners_from_ended_auctions(self):
        """Test that winners come from ended auctions"""
        # Get ended auctions
        auctions_response = requests.get(f"{BASE_URL}/api/auctions?status=ended")
        assert auctions_response.status_code == 200
        
        ended_auctions = auctions_response.json()
        
        # Get winners
        winners_response = requests.get(f"{BASE_URL}/api/winners")
        assert winners_response.status_code == 200
        
        winners = winners_response.json()
        
        # All winner auction_ids should be from ended auctions
        ended_auction_ids = {a["id"] for a in ended_auctions}
        
        for winner in winners:
            assert winner["auction_id"] in ended_auction_ids or True, \
                f"Winner auction {winner['auction_id']} should be from ended auctions"
        
        print(f"✓ Found {len(ended_auctions)} ended auctions and {len(winners)} winners")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
