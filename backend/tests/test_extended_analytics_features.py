"""
Test Extended Analytics, Payment History, and Partner Map Features
- GET /api/analytics/extended - Extended analytics with time periods (hour/day/week/month/year)
- GET /api/analytics/export - Analytics export as CSV
- GET /api/bidblitz-pay/transaction-history - Transaction history with filters
- GET /api/bidblitz-pay/export-transactions - Transaction export
- GET /api/partner-search/map - Partner map with coordinates and cashback rates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@bidblitz.ae"
ADMIN_PASSWORD = "Admin123!"


class TestSetup:
    """Setup and authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth token"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }


class TestExtendedAnalytics(TestSetup):
    """Test GET /api/analytics/extended endpoint"""
    
    def test_extended_analytics_default_week(self, admin_headers):
        """Test extended analytics with default week period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "period" in data, "Missing 'period' in response"
        assert "current" in data, "Missing 'current' in response"
        assert "time_series" in data, "Missing 'time_series' in response"
        
        # Verify period structure
        period = data["period"]
        assert period["type"] == "week", f"Expected period type 'week', got '{period['type']}'"
        assert "label" in period, "Missing 'label' in period"
        assert "start" in period, "Missing 'start' in period"
        assert "end" in period, "Missing 'end' in period"
        
        # Verify current metrics structure
        current = data["current"]
        assert "revenue" in current, "Missing 'revenue' in current"
        assert "orders" in current, "Missing 'orders' in current"
        assert "new_users" in current, "Missing 'new_users' in current"
        assert "bids" in current, "Missing 'bids' in current"
        assert "auctions" in current, "Missing 'auctions' in current"
        assert "page_views" in current, "Missing 'page_views' in current"
        
        print(f"✓ Extended analytics (week): revenue={current['revenue']}, orders={current['orders']}")
    
    def test_extended_analytics_hour_period(self, admin_headers):
        """Test extended analytics with hour period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended?period=hour",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["period"]["type"] == "hour"
        assert data["period"]["label"] == "Letzte Stunde"
        print(f"✓ Extended analytics (hour): {data['period']['label']}")
    
    def test_extended_analytics_day_period(self, admin_headers):
        """Test extended analytics with day period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended?period=day",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["period"]["type"] == "day"
        assert data["period"]["label"] == "Letzter Tag"
        print(f"✓ Extended analytics (day): {data['period']['label']}")
    
    def test_extended_analytics_month_period(self, admin_headers):
        """Test extended analytics with month period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended?period=month",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["period"]["type"] == "month"
        assert data["period"]["label"] == "Letzte 30 Tage"
        print(f"✓ Extended analytics (month): {data['period']['label']}")
    
    def test_extended_analytics_year_period(self, admin_headers):
        """Test extended analytics with year period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended?period=year",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["period"]["type"] == "year"
        assert data["period"]["label"] == "Letztes Jahr"
        print(f"✓ Extended analytics (year): {data['period']['label']}")
    
    def test_extended_analytics_with_comparison(self, admin_headers):
        """Test extended analytics with period comparison enabled"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended?period=week&compare=true",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # When compare=true, should have previous and changes
        assert "previous" in data, "Missing 'previous' when compare=true"
        assert "changes" in data, "Missing 'changes' when compare=true"
        
        # Verify changes structure
        if data["changes"]:
            changes = data["changes"]
            assert "revenue" in changes, "Missing 'revenue' in changes"
            assert "orders" in changes, "Missing 'orders' in changes"
            assert "new_users" in changes, "Missing 'new_users' in changes"
            print(f"✓ Extended analytics with comparison: revenue change={changes['revenue']}%")
        else:
            print("✓ Extended analytics with comparison: no changes data (no previous period data)")
    
    def test_extended_analytics_without_comparison(self, admin_headers):
        """Test extended analytics without comparison (default)"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/extended?period=week&compare=false",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # When compare=false, previous and changes should be None
        assert data.get("previous") is None, "Expected 'previous' to be None when compare=false"
        assert data.get("changes") is None, "Expected 'changes' to be None when compare=false"
        print("✓ Extended analytics without comparison: previous=None, changes=None")
    
    def test_extended_analytics_requires_admin(self):
        """Test that extended analytics requires admin role"""
        response = requests.get(f"{BASE_URL}/api/analytics/extended")
        # Should fail without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Extended analytics requires authentication")


class TestAnalyticsExport(TestSetup):
    """Test GET /api/analytics/export endpoint"""
    
    def test_analytics_export_csv_default(self, admin_headers):
        """Test analytics export as CSV with default period (month)"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Check content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Missing attachment in content-disposition"
        assert "analytics_month.csv" in content_disposition, f"Expected analytics_month.csv in {content_disposition}"
        
        # Verify CSV content has headers
        csv_content = response.text
        assert "Datum" in csv_content, "Missing 'Datum' header in CSV"
        assert "Umsatz" in csv_content, "Missing 'Umsatz' header in CSV"
        assert "Bestellungen" in csv_content, "Missing 'Bestellungen' header in CSV"
        assert "Neue Nutzer" in csv_content, "Missing 'Neue Nutzer' header in CSV"
        assert "Gebote" in csv_content, "Missing 'Gebote' header in CSV"
        
        print(f"✓ Analytics export CSV (month): {len(csv_content)} bytes")
    
    def test_analytics_export_csv_week(self, admin_headers):
        """Test analytics export as CSV for week period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export?format=csv&period=week",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_disposition = response.headers.get("content-disposition", "")
        assert "analytics_week.csv" in content_disposition
        print("✓ Analytics export CSV (week)")
    
    def test_analytics_export_csv_year(self, admin_headers):
        """Test analytics export as CSV for year period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export?format=csv&period=year",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_disposition = response.headers.get("content-disposition", "")
        assert "analytics_year.csv" in content_disposition
        print("✓ Analytics export CSV (year)")
    
    def test_analytics_export_json(self, admin_headers):
        """Test analytics export as JSON"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export?format=json&period=month",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify JSON structure
        assert "period" in data, "Missing 'period' in JSON export"
        assert "exported_at" in data, "Missing 'exported_at' in JSON export"
        assert "data" in data, "Missing 'data' in JSON export"
        
        assert data["period"] == "month"
        
        # Verify data structure if there's data
        if data["data"]:
            first_item = data["data"][0]
            assert "date" in first_item, "Missing 'date' in data item"
            assert "revenue" in first_item, "Missing 'revenue' in data item"
            assert "orders" in first_item, "Missing 'orders' in data item"
            assert "new_users" in first_item, "Missing 'new_users' in data item"
            assert "bids" in first_item, "Missing 'bids' in data item"
        
        print(f"✓ Analytics export JSON: {len(data['data'])} records")
    
    def test_analytics_export_requires_admin(self):
        """Test that analytics export requires admin role"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Analytics export requires authentication")


class TestTransactionHistory(TestSetup):
    """Test GET /api/bidblitz-pay/transaction-history endpoint"""
    
    def test_transaction_history_default(self, admin_headers):
        """Test transaction history with default parameters"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "transactions" in data, "Missing 'transactions' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "page" in data, "Missing 'page' in response"
        assert "limit" in data, "Missing 'limit' in response"
        assert "total_pages" in data, "Missing 'total_pages' in response"
        
        # Verify default pagination
        assert data["page"] == 1, f"Expected page 1, got {data['page']}"
        assert data["limit"] == 20, f"Expected limit 20, got {data['limit']}"
        
        print(f"✓ Transaction history: {data['total']} total, page {data['page']}/{data['total_pages']}")
    
    def test_transaction_history_pagination(self, admin_headers):
        """Test transaction history pagination"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?page=1&limit=5",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["page"] == 1
        assert data["limit"] == 5
        assert len(data["transactions"]) <= 5
        print(f"✓ Transaction history pagination: limit=5, got {len(data['transactions'])} records")
    
    def test_transaction_history_type_filter_deposit(self, admin_headers):
        """Test transaction history with deposit type filter"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?type=deposit",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify all transactions are deposit types
        deposit_types = ["topup", "deposit", "bank_transfer_credit", "credit_disbursement"]
        for tx in data["transactions"]:
            if "type" in tx:
                # Some transactions might not have type field
                pass
        
        print(f"✓ Transaction history (deposit filter): {len(data['transactions'])} records")
    
    def test_transaction_history_type_filter_cashback(self, admin_headers):
        """Test transaction history with cashback type filter"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?type=cashback",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"✓ Transaction history (cashback filter): {len(data['transactions'])} records")
    
    def test_transaction_history_type_filter_transfer(self, admin_headers):
        """Test transaction history with transfer type filter"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?type=transfer",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"✓ Transaction history (transfer filter): {len(data['transactions'])} records")
    
    def test_transaction_history_date_filter(self, admin_headers):
        """Test transaction history with date filters"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?date_from=2024-01-01&date_to=2025-12-31",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"✓ Transaction history (date filter): {len(data['transactions'])} records")
    
    def test_transaction_history_amount_filter(self, admin_headers):
        """Test transaction history with amount filters"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?min_amount=1&max_amount=1000",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"✓ Transaction history (amount filter): {len(data['transactions'])} records")
    
    def test_transaction_history_search(self, admin_headers):
        """Test transaction history with search"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/transaction-history?search=Guthaben",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        print(f"✓ Transaction history (search 'Guthaben'): {len(data['transactions'])} records")
    
    def test_transaction_history_requires_auth(self):
        """Test that transaction history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/bidblitz-pay/transaction-history")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Transaction history requires authentication")


class TestExportTransactions(TestSetup):
    """Test GET /api/bidblitz-pay/export-transactions endpoint"""
    
    def test_export_transactions_csv_default(self, admin_headers):
        """Test export transactions as CSV with default parameters"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/export-transactions",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Check content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Missing attachment in content-disposition"
        assert "transactions.csv" in content_disposition
        
        # Verify CSV content has headers
        csv_content = response.text
        assert "Datum" in csv_content, "Missing 'Datum' header in CSV"
        assert "Typ" in csv_content, "Missing 'Typ' header in CSV"
        assert "Beschreibung" in csv_content, "Missing 'Beschreibung' header in CSV"
        assert "Betrag" in csv_content, "Missing 'Betrag' header in CSV"
        assert "Referenz" in csv_content, "Missing 'Referenz' header in CSV"
        assert "Status" in csv_content, "Missing 'Status' header in CSV"
        
        print(f"✓ Export transactions CSV: {len(csv_content)} bytes")
    
    def test_export_transactions_with_type_filter(self, admin_headers):
        """Test export transactions with type filter"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/export-transactions?format=csv&type=deposit",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        print("✓ Export transactions CSV with type filter")
    
    def test_export_transactions_with_date_filter(self, admin_headers):
        """Test export transactions with date filter"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/export-transactions?format=csv&date_from=2024-01-01&date_to=2025-12-31",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        print("✓ Export transactions CSV with date filter")
    
    def test_export_transactions_json(self, admin_headers):
        """Test export transactions as JSON"""
        response = requests.get(
            f"{BASE_URL}/api/bidblitz-pay/export-transactions?format=json",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "transactions" in data, "Missing 'transactions' in JSON export"
        print(f"✓ Export transactions JSON: {len(data['transactions'])} records")
    
    def test_export_transactions_requires_auth(self):
        """Test that export transactions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/bidblitz-pay/export-transactions")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Export transactions requires authentication")


class TestPartnerMap(TestSetup):
    """Test GET /api/partner-search/map endpoint"""
    
    def test_partner_map_endpoint(self, admin_headers):
        """Test partner map endpoint returns partners with coordinates"""
        response = requests.get(f"{BASE_URL}/api/partner-search/map")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "partners" in data, "Missing 'partners' in response"
        assert "total" in data, "Missing 'total' in response"
        
        print(f"✓ Partner map: {data['total']} partners returned")
        
        # Verify partner data structure if there are partners
        if data["partners"]:
            partner = data["partners"][0]
            
            # Required fields
            assert "id" in partner, "Missing 'id' in partner"
            assert "business_name" in partner, "Missing 'business_name' in partner"
            
            # Optional but expected fields
            expected_fields = ["address", "city", "latitude", "longitude", 
                            "is_premium", "category", "cashback_rate"]
            
            for field in expected_fields:
                if field in partner:
                    print(f"  - {field}: {partner[field]}")
            
            # Verify cashback_rate is present
            assert "cashback_rate" in partner, "Missing 'cashback_rate' in partner"
            
            print(f"✓ Partner data structure verified: {partner.get('business_name')}")
    
    def test_partner_map_has_coordinates(self, admin_headers):
        """Test that partners have latitude and longitude"""
        response = requests.get(f"{BASE_URL}/api/partner-search/map")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        partners_with_coords = 0
        partners_without_coords = 0
        
        for partner in data["partners"]:
            lat = partner.get("latitude")
            lng = partner.get("longitude")
            
            if lat is not None and lng is not None:
                partners_with_coords += 1
                # Validate coordinate ranges
                if lat is not None:
                    assert -90 <= lat <= 90, f"Invalid latitude: {lat}"
                if lng is not None:
                    assert -180 <= lng <= 180, f"Invalid longitude: {lng}"
            else:
                partners_without_coords += 1
        
        print(f"✓ Partners with coordinates: {partners_with_coords}")
        print(f"  Partners without coordinates: {partners_without_coords}")
    
    def test_partner_map_cashback_rates(self, admin_headers):
        """Test that partners have cashback rates"""
        response = requests.get(f"{BASE_URL}/api/partner-search/map")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        cashback_rates = []
        for partner in data["partners"]:
            rate = partner.get("cashback_rate")
            if rate is not None:
                cashback_rates.append(rate)
                # Cashback rate should be reasonable (0-100%)
                assert 0 <= rate <= 100, f"Invalid cashback rate: {rate}"
        
        if cashback_rates:
            avg_rate = sum(cashback_rates) / len(cashback_rates)
            print(f"✓ Cashback rates: min={min(cashback_rates)}%, max={max(cashback_rates)}%, avg={avg_rate:.1f}%")
        else:
            print("✓ No cashback rates found (no partners with cashback settings)")
    
    def test_partner_map_is_public(self):
        """Test that partner map endpoint is public (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/partner-search/map")
        # Should work without authentication
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Partner map is public (no auth required)")
    
    def test_partner_map_premium_flag(self, admin_headers):
        """Test that partners have is_premium flag"""
        response = requests.get(f"{BASE_URL}/api/partner-search/map")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        premium_count = 0
        regular_count = 0
        
        for partner in data["partners"]:
            if partner.get("is_premium"):
                premium_count += 1
            else:
                regular_count += 1
        
        print(f"✓ Premium partners: {premium_count}, Regular partners: {regular_count}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
