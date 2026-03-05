"""
SmartDine India - Backend API Test Suite v4
Tests all API endpoints for the restaurant ordering application including:
- Auth (customer-entry, login for customer, kitchen, manager)
- Menu (fetch)
- Kitchen (orders, status updates)
- Manager (theme, settings, reports with date range, orders, payment)
- Orders (create, payment flow for customer and manager, invoice)
- Staff Registration (without access code)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from requirements
CUSTOMER_NAME = "TestBot"
CUSTOMER_MOBILE = "1234567890"
KITCHEN_CREDENTIALS = {"username": "Kitchen Staff", "password": "kitchen123"}
MANAGER_CREDENTIALS = {"username": "Manager Admin", "password": "manager123"}


class TestHealthCheck:
    """Health check and API availability tests"""
    
    def test_api_root_endpoint(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api")
        assert response.status_code == 200
        data = response.json()
        assert "SmartDine India API" in data.get("message", "")
        print(f"✓ API is running: {data['message']}")


class TestPublicEndpoints:
    """Test public endpoints that don't require auth"""
    
    def test_theme_endpoint(self):
        """Test GET /api/manager/theme - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/manager/theme")
        assert response.status_code == 200
        data = response.json()
        assert "restaurantName" in data
        assert "primaryColor" in data
        print(f"✓ Theme endpoint returns: {data['restaurantName']}")
    
    def test_menu_endpoint(self):
        """Test GET /api/menu - returns available menu items"""
        response = requests.get(f"{BASE_URL}/api/menu")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Menu should have items"
        item = data[0]
        assert "name" in item
        assert "priceINR" in item
        print(f"✓ Menu endpoint returns {len(data)} items")


class TestCustomerEntry:
    """Test customer-entry endpoint (auto-creates/returns customer)"""
    
    def test_customer_entry_creates_new_customer(self):
        """Test POST /api/auth/customer-entry with new mobile"""
        unique_mobile = f"99{int(time.time()) % 100000000:08d}"
        response = requests.post(f"{BASE_URL}/api/auth/customer-entry", json={
            "name": "Test Customer New",
            "mobile": unique_mobile
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "customer"
        print(f"✓ Customer entry creates new customer: {data['user']['name']}")
    
    def test_customer_entry_returns_existing_customer(self):
        """Test POST /api/auth/customer-entry with existing mobile"""
        response = requests.post(f"{BASE_URL}/api/auth/customer-entry", json={
            "name": CUSTOMER_NAME,
            "mobile": CUSTOMER_MOBILE
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "customer"
        print(f"✓ Customer entry returns existing customer: {data['user']['name']}")
    
    def test_customer_entry_missing_fields(self):
        """Test customer-entry with missing fields"""
        response = requests.post(f"{BASE_URL}/api/auth/customer-entry", json={"name": "Test"})
        assert response.status_code == 400
        print("✓ Customer entry correctly rejects missing mobile")


class TestKitchenAuth:
    """Test kitchen staff authentication"""
    
    def test_kitchen_login_success(self):
        """Test kitchen staff login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=KITCHEN_CREDENTIALS)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "kitchen"
        print(f"✓ Kitchen staff login successful: {data['user']['username']}")


class TestManagerAuth:
    """Test manager authentication"""
    
    def test_manager_login_success(self):
        """Test manager login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDENTIALS)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "manager"
        print(f"✓ Manager login successful: {data['user']['username']}")


class TestStaffRegistration:
    """Test staff registration (without access code)"""
    
    def test_staff_register_kitchen(self):
        """Test POST /api/auth/staff-register for kitchen staff"""
        unique_username = f"kitchen_test_{int(time.time())}"
        response = requests.post(f"{BASE_URL}/api/auth/staff-register", json={
            "name": "Test Kitchen Staff",
            "username": unique_username,
            "password": "testpass123",
            "role": "kitchen"
        })
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "kitchen"
        print(f"✓ Staff registration (kitchen) successful: {data['user']['username']}")
    
    def test_staff_register_missing_fields(self):
        """Test staff registration with missing fields"""
        response = requests.post(f"{BASE_URL}/api/auth/staff-register", json={
            "name": "Test",
            "role": "kitchen"
        })
        assert response.status_code == 400
        print("✓ Staff registration correctly rejects missing fields")
    
    def test_staff_register_invalid_role(self):
        """Test staff registration with invalid role"""
        response = requests.post(f"{BASE_URL}/api/auth/staff-register", json={
            "name": "Test",
            "username": f"test_{int(time.time())}",
            "password": "test123",
            "role": "invalid_role"
        })
        assert response.status_code == 400
        print("✓ Staff registration correctly rejects invalid role")


class TestKitchenDashboard:
    """Test kitchen dashboard functionality"""
    
    @pytest.fixture
    def kitchen_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=KITCHEN_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Kitchen login failed")
        return response.json().get("token")
    
    def test_kitchen_orders_fetch(self, kitchen_token):
        """Test kitchen can fetch orders"""
        headers = {"Authorization": f"Bearer {kitchen_token}"}
        response = requests.get(f"{BASE_URL}/api/kitchen/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Kitchen can fetch orders: {len(data)} orders")


class TestManagerDashboard:
    """Test manager dashboard functionality"""
    
    @pytest.fixture
    def manager_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Manager login failed")
        return response.json().get("token")
    
    def test_manager_reports_daily(self, manager_token):
        """Test manager can fetch daily reports"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/reports/daily", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "totalOrders" in data
        assert "paidOrders" in data
        assert "unpaidOrders" in data
        assert "totalRevenue" in data
        assert "orders" in data
        print(f"✓ Manager reports daily: totalOrders={data['totalOrders']}, revenue=₹{data['totalRevenue']}")
    
    def test_manager_reports_with_date_range(self, manager_token):
        """Test manager reports with date range filter"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        today = time.strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/manager/reports/daily", 
                                params={"startDate": today, "endDate": today},
                                headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "totalOrders" in data
        assert "orders" in data
        print(f"✓ Manager reports with date range: {len(data['orders'])} orders for {today}")
    
    def test_manager_orders_fetch(self, manager_token):
        """Test manager can fetch all orders"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Manager can fetch all orders: {len(data)} orders")
    
    def test_manager_orders_filter_by_status(self, manager_token):
        """Test manager orders filter by status"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/orders", 
                                params={"status": "Ready"},
                                headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # If there are orders, verify they have the correct status
        for order in data:
            assert order.get("orderStatus") == "Ready", f"Expected Ready status, got {order.get('orderStatus')}"
        print(f"✓ Manager orders filtered by Ready status: {len(data)} orders")
    
    def test_manager_orders_filter_by_payment(self, manager_token):
        """Test manager orders filter by payment status"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/orders", 
                                params={"paymentStatus": "Unpaid"},
                                headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for order in data:
            assert order.get("paymentStatus") == "Unpaid"
        print(f"✓ Manager orders filtered by Unpaid: {len(data)} orders")
    
    def test_manager_settings_fetch(self, manager_token):
        """Test manager can fetch settings"""
        headers = {"Authorization": f"Bearer {manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "restaurantName" in data
        print(f"✓ Manager settings endpoint working: {data.get('restaurantName')}")


class TestCustomerOrderFlow:
    """Test customer order flow"""
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/customer-entry", json={
            "name": CUSTOMER_NAME,
            "mobile": CUSTOMER_MOBILE
        })
        if response.status_code != 200:
            pytest.skip("Customer entry failed")
        return response.json().get("token")
    
    def test_customer_my_orders(self, customer_token):
        """Test customer can fetch their orders"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/my-orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customer can fetch orders: {len(data)} orders")
    
    def test_customer_loyalty_info(self, customer_token):
        """Test customer can fetch loyalty info"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/loyalty-info", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "loyaltyPoints" in data
        print(f"✓ Customer loyalty info: {data.get('loyaltyPoints')} points")


class TestInvoiceEndpoint:
    """Test invoice endpoint for both customer and manager"""
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/customer-entry", json={
            "name": CUSTOMER_NAME,
            "mobile": CUSTOMER_MOBILE
        })
        if response.status_code != 200:
            pytest.skip("Customer entry failed")
        return response.json().get("token")
    
    @pytest.fixture
    def manager_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Manager login failed")
        return response.json().get("token")
    
    def test_invoice_endpoint_with_valid_order(self, customer_token, manager_token):
        """Test invoice endpoint returns order and restaurant data"""
        # First get customer orders to find a paid one
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        manager_headers = {"Authorization": f"Bearer {manager_token}"}
        
        orders_response = requests.get(f"{BASE_URL}/api/orders/my-orders", headers=customer_headers)
        orders = orders_response.json()
        
        paid_orders = [o for o in orders if o.get("paymentStatus") == "Paid"]
        
        if not paid_orders:
            # Try from manager side
            manager_orders_response = requests.get(f"{BASE_URL}/api/manager/orders", headers=manager_headers)
            all_orders = manager_orders_response.json()
            paid_orders = [o for o in all_orders if o.get("paymentStatus") == "Paid"]
        
        if not paid_orders:
            pytest.skip("No paid orders found for invoice test")
        
        order_id = paid_orders[0].get("orderId")
        
        # Test customer can get invoice
        invoice_response = requests.get(f"{BASE_URL}/api/orders/invoice/{order_id}", headers=customer_headers)
        if invoice_response.status_code == 200:
            data = invoice_response.json()
            assert "order" in data
            assert "restaurant" in data
            assert "restaurantName" in data["restaurant"]
            print(f"✓ Customer invoice endpoint working for order {order_id}")
        
        # Test manager can get invoice
        invoice_response = requests.get(f"{BASE_URL}/api/orders/invoice/{order_id}", headers=manager_headers)
        assert invoice_response.status_code == 200
        data = invoice_response.json()
        assert "order" in data
        assert "restaurant" in data
        print(f"✓ Manager invoice endpoint working for order {order_id}")
    
    def test_invoice_endpoint_invalid_order(self, customer_token):
        """Test invoice endpoint with non-existent order"""
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/invoice/INVALID-ORDER", headers=headers)
        assert response.status_code == 404
        print("✓ Invoice endpoint correctly returns 404 for invalid order")


class TestPaymentFlowIntegration:
    """Test full payment flow including manager payment capability"""
    
    @pytest.fixture
    def tokens(self):
        """Get all required tokens"""
        customer_response = requests.post(f"{BASE_URL}/api/auth/customer-entry", json={
            "name": CUSTOMER_NAME,
            "mobile": CUSTOMER_MOBILE
        })
        kitchen_response = requests.post(f"{BASE_URL}/api/auth/login", json=KITCHEN_CREDENTIALS)
        manager_response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDENTIALS)
        
        return {
            "customer": customer_response.json().get("token") if customer_response.status_code == 200 else None,
            "kitchen": kitchen_response.json().get("token") if kitchen_response.status_code == 200 else None,
            "manager": manager_response.json().get("token") if manager_response.status_code == 200 else None
        }
    
    def test_customer_payment_flow(self, tokens):
        """Test full customer payment flow: Order -> Kitchen Ready -> Customer Payment"""
        if not all([tokens["customer"], tokens["kitchen"]]):
            pytest.skip("Required tokens not available")
        
        customer_headers = {"Authorization": f"Bearer {tokens['customer']}"}
        kitchen_headers = {"Authorization": f"Bearer {tokens['kitchen']}"}
        
        # Get menu item
        menu_response = requests.get(f"{BASE_URL}/api/menu")
        if menu_response.status_code != 200 or len(menu_response.json()) == 0:
            pytest.skip("No menu items available")
        
        menu_item = menu_response.json()[0]
        
        # Place order
        order_data = {
            "tableNumber": 99,
            "items": [{"name": menu_item["name"], "price": menu_item["priceINR"], "quantity": 1}],
            "totalAmount": menu_item["priceINR"]
        }
        
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=customer_headers)
        assert order_response.status_code == 201
        order_id = order_response.json().get("order", {}).get("orderId")
        print(f"✓ Order placed: {order_id}")
        
        # Kitchen prepares and marks ready
        requests.put(f"{BASE_URL}/api/kitchen/orders/{order_id}/status", json={"status": "Preparing"}, headers=kitchen_headers)
        requests.put(f"{BASE_URL}/api/kitchen/orders/{order_id}/status", json={"status": "Ready"}, headers=kitchen_headers)
        print(f"✓ Order marked Ready")
        
        # Customer initiates payment
        payment_response = requests.post(f"{BASE_URL}/api/orders/create-payment-order/{order_id}", headers=customer_headers)
        assert payment_response.status_code == 200
        payment_data = payment_response.json()
        assert payment_data.get("demoMode") == True
        print(f"✓ Customer payment order created (demo mode)")
        
        # Verify payment
        verify_response = requests.post(f"{BASE_URL}/api/orders/verify-payment/{order_id}", json={
            "razorpayPaymentId": f"pay_demo_{int(time.time())}",
            "razorpayOrderId": payment_data.get("razorpayOrderId"),
            "razorpaySignature": "demo",
            "paymentMode": "UPI",
            "demoMode": True
        }, headers=customer_headers)
        assert verify_response.status_code == 200
        print(f"✓ Customer payment verified successfully!")
    
    def test_manager_payment_flow(self, tokens):
        """Test manager can pay for a Ready order (for customer)"""
        if not all([tokens["customer"], tokens["kitchen"], tokens["manager"]]):
            pytest.skip("Required tokens not available")
        
        customer_headers = {"Authorization": f"Bearer {tokens['customer']}"}
        kitchen_headers = {"Authorization": f"Bearer {tokens['kitchen']}"}
        manager_headers = {"Authorization": f"Bearer {tokens['manager']}"}
        
        # Get menu item
        menu_response = requests.get(f"{BASE_URL}/api/menu")
        menu_item = menu_response.json()[0]
        
        # Place order as customer
        order_data = {
            "tableNumber": 88,
            "items": [{"name": menu_item["name"], "price": menu_item["priceINR"], "quantity": 2}],
            "totalAmount": menu_item["priceINR"] * 2
        }
        
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=customer_headers)
        assert order_response.status_code == 201
        order_id = order_response.json().get("order", {}).get("orderId")
        print(f"✓ Order placed for manager payment test: {order_id}")
        
        # Kitchen marks ready
        requests.put(f"{BASE_URL}/api/kitchen/orders/{order_id}/status", json={"status": "Preparing"}, headers=kitchen_headers)
        requests.put(f"{BASE_URL}/api/kitchen/orders/{order_id}/status", json={"status": "Ready"}, headers=kitchen_headers)
        print(f"✓ Order marked Ready by kitchen")
        
        # Manager initiates payment (key feature test!)
        payment_response = requests.post(f"{BASE_URL}/api/orders/create-payment-order/{order_id}", headers=manager_headers)
        assert payment_response.status_code == 200, f"Manager payment creation failed: {payment_response.text}"
        payment_data = payment_response.json()
        print(f"✓ Manager can create payment order (demo mode: {payment_data.get('demoMode')})")
        
        # Manager verifies payment
        verify_response = requests.post(f"{BASE_URL}/api/orders/verify-payment/{order_id}", json={
            "razorpayPaymentId": f"pay_demo_mgr_{int(time.time())}",
            "razorpayOrderId": payment_data.get("razorpayOrderId"),
            "razorpaySignature": "demo",
            "paymentMode": "UPI",
            "demoMode": True
        }, headers=manager_headers)
        assert verify_response.status_code == 200, f"Manager payment verification failed: {verify_response.text}"
        print(f"✓ Manager payment verified successfully!")
        
        # Verify order is now Paid
        orders_response = requests.get(f"{BASE_URL}/api/manager/orders", headers=manager_headers)
        paid_order = next((o for o in orders_response.json() if o.get("orderId") == order_id), None)
        assert paid_order is not None
        assert paid_order.get("paymentStatus") == "Paid"
        print(f"✓ Order {order_id} confirmed Paid via manager")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
