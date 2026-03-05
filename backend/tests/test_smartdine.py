"""
SmartDine India - Backend API Test Suite
Tests all API endpoints for the restaurant ordering application:
- Auth (login for customer, kitchen, manager)
- Menu (fetch)
- Kitchen (orders)
- Manager (theme, settings, reports)
- Orders (create, payment flow)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from requirements
CUSTOMER_CREDENTIALS = {"username": "1234567890", "password": "1234567890"}
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
        # Check theme data structure
        assert "restaurantName" in data
        assert "primaryColor" in data
        assert "secondaryColor" in data
        assert "accentColor" in data
        assert "backgroundColor" in data
        print(f"✓ Theme endpoint returns: {data['restaurantName']}")
        print(f"  Colors - Primary: {data['primaryColor']}, Secondary: {data['secondaryColor']}, Accent: {data['accentColor']}")
    
    def test_menu_endpoint(self):
        """Test GET /api/menu - returns available menu items"""
        response = requests.get(f"{BASE_URL}/api/menu")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Menu endpoint returns {len(data)} items")
        if len(data) > 0:
            item = data[0]
            assert "name" in item
            assert "priceINR" in item
            print(f"  Sample item: {item['name']} - ₹{item['priceINR']}")


class TestCustomerAuth:
    """Test customer authentication flows"""
    
    def test_customer_login_success(self):
        """Test customer login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDENTIALS)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "customer"
        print(f"✓ Customer login successful: {data['user']['username']}")
    
    def test_customer_login_invalid_password(self):
        """Test customer login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "1234567890",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid password correctly rejected")
    
    def test_customer_login_invalid_username(self):
        """Test customer login with non-existent username"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "nonexistent_user",
            "password": "password123"
        })
        assert response.status_code == 401
        print("✓ Non-existent user correctly rejected")


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
        assert "totalOrders" in data or isinstance(data, dict)
        print(f"✓ Manager reports endpoint working")
    
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
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Customer login failed")
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


class TestPaymentDemoMode:
    """Test payment demo mode flow"""
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Customer login failed")
        return response.json().get("token")
    
    @pytest.fixture
    def kitchen_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=KITCHEN_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Kitchen login failed")
        return response.json().get("token")
    
    def test_payment_flow_integration(self, customer_token, kitchen_token):
        """Test full payment flow: Order -> Kitchen Ready -> Payment"""
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        kitchen_headers = {"Authorization": f"Bearer {kitchen_token}"}
        
        # Step 1: Get menu items
        menu_response = requests.get(f"{BASE_URL}/api/menu")
        if menu_response.status_code != 200 or len(menu_response.json()) == 0:
            pytest.skip("No menu items available")
        
        menu_item = menu_response.json()[0]
        
        # Step 2: Place an order
        order_data = {
            "tableNumber": 99,
            "items": [{
                "name": menu_item["name"],
                "price": menu_item["priceINR"],
                "quantity": 1,
                "itemId": menu_item.get("_id", "test")
            }],
            "totalAmount": menu_item["priceINR"]
        }
        
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=customer_headers)
        assert order_response.status_code == 201, f"Order creation failed: {order_response.text}"
        order = order_response.json().get("order", {})
        order_id = order.get("orderId")
        print(f"✓ Order placed: {order_id}")
        
        # Step 3: Kitchen marks as Preparing
        status_response = requests.put(
            f"{BASE_URL}/api/kitchen/orders/{order_id}/status",
            json={"status": "Preparing"},
            headers=kitchen_headers
        )
        assert status_response.status_code == 200
        print(f"✓ Order {order_id} marked as Preparing")
        
        # Step 4: Kitchen marks as Ready
        status_response = requests.put(
            f"{BASE_URL}/api/kitchen/orders/{order_id}/status",
            json={"status": "Ready"},
            headers=kitchen_headers
        )
        assert status_response.status_code == 200
        print(f"✓ Order {order_id} marked as Ready")
        
        # Step 5: Create payment order (demo mode)
        payment_response = requests.post(
            f"{BASE_URL}/api/orders/create-payment-order/{order_id}",
            headers=customer_headers
        )
        assert payment_response.status_code == 200, f"Payment order creation failed: {payment_response.text}"
        payment_data = payment_response.json()
        assert payment_data.get("demoMode") == True, "Expected demo mode"
        print(f"✓ Payment order created in demo mode: {payment_data.get('razorpayOrderId')}")
        
        # Step 6: Verify payment (demo)
        verify_response = requests.post(
            f"{BASE_URL}/api/orders/verify-payment/{order_id}",
            json={
                "razorpayPaymentId": f"pay_demo_{int(time.time())}",
                "razorpayOrderId": payment_data.get("razorpayOrderId"),
                "razorpaySignature": "demo_signature",
                "paymentMode": "UPI",
                "demoMode": True
            },
            headers=customer_headers
        )
        assert verify_response.status_code == 200, f"Payment verification failed: {verify_response.text}"
        print(f"✓ Payment verified successfully!")
        
        # Verify order is now paid
        orders_response = requests.get(f"{BASE_URL}/api/orders/my-orders", headers=customer_headers)
        my_orders = orders_response.json()
        paid_order = next((o for o in my_orders if o.get("orderId") == order_id), None)
        assert paid_order is not None
        assert paid_order.get("paymentStatus") == "Paid"
        print(f"✓ Order {order_id} is now Paid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
