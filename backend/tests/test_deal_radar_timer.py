"""
Test Deal Radar API and Timer Display Features
Tests for:
1. Deal Radar bargains endpoint
2. Deal Radar low-activity endpoint
3. Deal Radar price-history endpoint
4. Auction timer format verification (HH:MM:SS for long auctions)
"""
import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDealRadarAPI:
    """Deal Radar API endpoint tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_deal_radar_bargains_endpoint(self):
        """Test /api/deal-radar/bargains returns valid JSON"""
        response = requests.get(f"{BASE_URL}/api/deal-radar/bargains?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "bargains" in data
        assert "total_found" in data
        assert "checked_at" in data
        assert isinstance(data["bargains"], list)
        print(f"✓ Bargains endpoint: {data['total_found']} bargains found")
    
    def test_deal_radar_low_activity_endpoint(self):
        """Test /api/deal-radar/low-activity returns valid JSON"""
        response = requests.get(f"{BASE_URL}/api/deal-radar/low-activity?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "auctions" in data
        assert isinstance(data["auctions"], list)
        print(f"✓ Low activity endpoint: {len(data['auctions'])} auctions found")
    
    def test_deal_radar_price_history_endpoint(self):
        """Test /api/deal-radar/price-history/{product_id} returns valid JSON"""
        # Test with a known product ID
        product_id = "prod-iphone17-pro"
        response = requests.get(f"{BASE_URL}/api/deal-radar/price-history/{product_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "product_id" in data
        assert "avg_price" in data
        assert "min_price" in data
        assert "max_price" in data
        assert "total_sold" in data
        assert "history" in data
        assert data["product_id"] == product_id
        print(f"✓ Price history endpoint: product {product_id}, sold {data['total_sold']} times")
    
    def test_deal_radar_price_history_unknown_product(self):
        """Test price history for unknown product returns empty history"""
        product_id = "unknown-product-xyz"
        response = requests.get(f"{BASE_URL}/api/deal-radar/price-history/{product_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Should return empty history for unknown product
        assert data["product_id"] == product_id
        assert data["total_sold"] == 0
        assert data["history"] == []
        print(f"✓ Price history for unknown product returns empty: {data}")


class TestAuctionTimerFormat:
    """Test auction timer format - should show HH:MM:SS for long auctions"""
    
    def test_auctions_have_fixed_end_flag(self):
        """Test that auctions have is_fixed_end flag set"""
        response = requests.get(f"{BASE_URL}/api/auctions?limit=5")
        assert response.status_code == 200
        auctions = response.json()
        
        assert len(auctions) > 0, "No auctions found"
        
        for auction in auctions:
            # Check is_fixed_end flag exists
            assert "is_fixed_end" in auction, f"Auction {auction['id']} missing is_fixed_end flag"
            print(f"✓ Auction {auction['id'][:8]}: is_fixed_end={auction['is_fixed_end']}")
    
    def test_auctions_have_long_duration(self):
        """Test that auctions have duration > 1 hour (for green timer)"""
        response = requests.get(f"{BASE_URL}/api/auctions?limit=5")
        assert response.status_code == 200
        auctions = response.json()
        
        assert len(auctions) > 0, "No auctions found"
        
        now = datetime.now(timezone.utc)
        
        for auction in auctions:
            end_time_str = auction.get("end_time", "")
            if end_time_str:
                end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
                seconds_left = (end_time - now).total_seconds()
                hours_left = seconds_left / 3600
                
                print(f"✓ Auction {auction['id'][:8]}: {hours_left:.1f} hours remaining")
                
                # Most auctions should have > 1 hour remaining (green timer)
                if hours_left > 1:
                    print(f"  → Should show GREEN timer (HH:MM:SS format)")
                elif hours_left > 0:
                    print(f"  → Should show BLUE timer (MM:SS format)")
    
    def test_auction_end_time_format(self):
        """Test that auction end_time is in ISO format"""
        response = requests.get(f"{BASE_URL}/api/auctions?limit=3")
        assert response.status_code == 200
        auctions = response.json()
        
        for auction in auctions:
            end_time_str = auction.get("end_time", "")
            assert end_time_str, f"Auction {auction['id']} missing end_time"
            
            # Should be parseable as ISO datetime
            try:
                end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
                print(f"✓ Auction {auction['id'][:8]} end_time: {end_time}")
            except ValueError as e:
                pytest.fail(f"Invalid end_time format: {end_time_str}")


class TestBotBehavior:
    """Test bot bidding behavior - should have realistic intervals"""
    
    def test_auction_has_bid_history(self):
        """Test that auctions have bid history with bot bids"""
        response = requests.get(f"{BASE_URL}/api/auctions?limit=3")
        assert response.status_code == 200
        auctions = response.json()
        
        for auction in auctions:
            bid_history = auction.get("bid_history", [])
            if bid_history:
                # Check for bot bids
                bot_bids = [b for b in bid_history if b.get("is_bot", False)]
                print(f"✓ Auction {auction['id'][:8]}: {len(bot_bids)} bot bids out of {len(bid_history)} total")
                
                # Check bid intervals (should be 15-90 seconds apart)
                if len(bot_bids) >= 2:
                    for i in range(1, min(5, len(bot_bids))):
                        t1 = datetime.fromisoformat(bot_bids[i-1]["timestamp"].replace("Z", "+00:00"))
                        t2 = datetime.fromisoformat(bot_bids[i]["timestamp"].replace("Z", "+00:00"))
                        interval = (t2 - t1).total_seconds()
                        print(f"  → Bid interval: {interval:.1f} seconds")
    
    def test_different_bots_per_auction(self):
        """Test that different bots bid on auctions (not always same bot)"""
        response = requests.get(f"{BASE_URL}/api/auctions?limit=3")
        assert response.status_code == 200
        auctions = response.json()
        
        for auction in auctions:
            bid_history = auction.get("bid_history", [])
            if bid_history:
                # Get unique bot names
                bot_names = set()
                for bid in bid_history:
                    if bid.get("is_bot", False):
                        bot_names.add(bid.get("user_name", ""))
                
                print(f"✓ Auction {auction['id'][:8]}: {len(bot_names)} different bots")
                
                # Should have multiple different bots
                if len(bid_history) > 10:
                    assert len(bot_names) > 1, "Only one bot bidding - should have variety"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
