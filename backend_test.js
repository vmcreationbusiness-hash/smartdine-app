const axios = require('axios');

class SmartDineAPITester {
    constructor() {
        this.baseURL = 'https://kitchen-dash-beta.preview.emergentagent.com';
        this.tokens = {};
        this.testData = {};
        this.testsRun = 0;
        this.testsPassed = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔍';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runTest(name, testFunction) {
        this.testsRun++;
        this.log(`Testing ${name}...`);
        
        try {
            const result = await testFunction();
            if (result) {
                this.testsPassed++;
                this.log(`${name} - PASSED`, 'success');
                return true;
            } else {
                this.log(`${name} - FAILED`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`${name} - ERROR: ${error.message}`, 'error');
            return false;
        }
    }

    async makeRequest(method, endpoint, data = null, token = null) {
        const config = {
            method,
            url: `${this.baseURL}/api${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        if (data && ['POST', 'PUT'].includes(method.toUpperCase())) {
            config.data = data;
        }

        const response = await axios(config);
        return response;
    }

    // Test health check
    async testHealthCheck() {
        try {
            const response = await this.makeRequest('GET', '');
            return response.status === 200 && response.data.message.includes('SmartDine');
        } catch (error) {
            return false;
        }
    }

    // Test customer registration
    async testCustomerRegistration() {
        const timestamp = Date.now();
        const customerData = {
            name: `TestCustomer${timestamp}`,
            mobile: `98765${timestamp.toString().slice(-5)}`
        };
        
        try {
            const response = await this.makeRequest('POST', '/auth/register', customerData);
            if (response.status === 201 && response.data.token) {
                this.tokens.customer = response.data.token;
                this.testData.customer = customerData;
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Test kitchen staff login
    async testKitchenLogin() {
        try {
            const response = await this.makeRequest('POST', '/auth/login', {
                username: 'Kitchen Staff',
                password: 'kitchen123'
            });
            
            if (response.status === 200 && response.data.token && response.data.user.role === 'kitchen') {
                this.tokens.kitchen = response.data.token;
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Test manager login
    async testManagerLogin() {
        try {
            const response = await this.makeRequest('POST', '/auth/login', {
                username: 'Manager Admin',
                password: 'manager123'
            });
            
            if (response.status === 200 && response.data.token && response.data.user.role === 'manager') {
                this.tokens.manager = response.data.token;
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Test menu fetch (public endpoint)
    async testMenuFetch() {
        try {
            const response = await this.makeRequest('GET', '/menu');
            return response.status === 200 && Array.isArray(response.data);
        } catch (error) {
            return false;
        }
    }

    // Test TheMealDB API integration (Manager only)
    async testTheMealDBIntegration() {
        try {
            const response = await this.makeRequest('GET', '/menu/fetch-from-api', null, this.tokens.manager);
            return response.status === 200 && Array.isArray(response.data) && response.data.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Test order placement (Customer)
    async testOrderPlacement() {
        const orderData = {
            tableNumber: 5,
            items: [
                { name: 'Test Dish', price: 299, quantity: 2 }
            ],
            totalAmount: 598
        };

        try {
            const response = await this.makeRequest('POST', '/orders', orderData, this.tokens.customer);
            if (response.status === 201 && response.data.order) {
                this.testData.orderId = response.data.order.orderId;
                return response.data.order.paymentStatus === 'Unpaid' && 
                       response.data.order.orderStatus === 'Ordered';
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Test customer orders fetch
    async testCustomerOrdersFetch() {
        try {
            const response = await this.makeRequest('GET', '/orders/my-orders', null, this.tokens.customer);
            return response.status === 200 && Array.isArray(response.data) && response.data.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Test kitchen orders fetch
    async testKitchenOrdersFetch() {
        try {
            const response = await this.makeRequest('GET', '/kitchen/orders', null, this.tokens.kitchen);
            return response.status === 200 && Array.isArray(response.data);
        } catch (error) {
            return false;
        }
    }

    // Test order status update (Kitchen)
    async testOrderStatusUpdate() {
        try {
            // Update to Preparing
            let response = await this.makeRequest('PUT', `/kitchen/orders/${this.testData.orderId}/status`, 
                { status: 'Preparing' }, this.tokens.kitchen);
            
            if (response.status !== 200) return false;

            // Update to Ready
            response = await this.makeRequest('PUT', `/kitchen/orders/${this.testData.orderId}/status`, 
                { status: 'Ready' }, this.tokens.kitchen);
            
            return response.status === 200 && response.data.order.orderStatus === 'Ready';
        } catch (error) {
            return false;
        }
    }

    // Test payment order creation (should work only when Ready)
    async testPaymentOrderCreation() {
        try {
            const response = await this.makeRequest('POST', `/orders/create-payment-order/${this.testData.orderId}`, 
                null, this.tokens.customer);
            
            return response.status === 200 && 
                   response.data.razorpayOrderId && 
                   response.data.keyId;
        } catch (error) {
            return false;
        }
    }

    // Test manager settings fetch
    async testManagerSettings() {
        try {
            const response = await this.makeRequest('GET', '/manager/settings', null, this.tokens.manager);
            return response.status === 200 && response.data.restaurantName;
        } catch (error) {
            return false;
        }
    }

    // Test manager orders fetch
    async testManagerOrdersFetch() {
        try {
            const response = await this.makeRequest('GET', '/manager/orders', null, this.tokens.manager);
            return response.status === 200 && Array.isArray(response.data);
        } catch (error) {
            return false;
        }
    }

    // Test daily report
    async testDailyReport() {
        try {
            const response = await this.makeRequest('GET', '/manager/reports/daily', null, this.tokens.manager);
            return response.status === 200 && 
                   typeof response.data.totalOrders === 'number' &&
                   typeof response.data.totalRevenue === 'number';
        } catch (error) {
            return false;
        }
    }

    // Test unauthorized access
    async testUnauthorizedAccess() {
        try {
            const response = await this.makeRequest('GET', '/kitchen/orders');
            return false; // Should fail
        } catch (error) {
            return error.response && error.response.status === 401;
        }
    }

    // Run all tests
    async runAllTests() {
        this.log('Starting SmartDine India API Testing...', 'info');
        this.log(`Backend URL: ${this.baseURL}`, 'info');

        const tests = [
            ['Health Check', () => this.testHealthCheck()],
            ['Customer Registration', () => this.testCustomerRegistration()],
            ['Kitchen Staff Login', () => this.testKitchenLogin()],
            ['Manager Login', () => this.testManagerLogin()],
            ['Menu Fetch (Public)', () => this.testMenuFetch()],
            ['TheMealDB API Integration', () => this.testTheMealDBIntegration()],
            ['Order Placement', () => this.testOrderPlacement()],
            ['Customer Orders Fetch', () => this.testCustomerOrdersFetch()],
            ['Kitchen Orders Fetch', () => this.testKitchenOrdersFetch()],
            ['Order Status Update (Kitchen)', () => this.testOrderStatusUpdate()],
            ['Payment Order Creation', () => this.testPaymentOrderCreation()],
            ['Manager Settings', () => this.testManagerSettings()],
            ['Manager Orders Fetch', () => this.testManagerOrdersFetch()],
            ['Daily Report', () => this.testDailyReport()],
            ['Unauthorized Access Check', () => this.testUnauthorizedAccess()]
        ];

        for (const [name, testFn] of tests) {
            await this.runTest(name, testFn);
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.log(`\n📊 TESTING COMPLETE`, 'info');
        this.log(`Tests Passed: ${this.testsPassed}/${this.testsRun}`, 'info');
        this.log(`Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`, 'info');

        if (this.testsPassed === this.testsRun) {
            this.log('🎉 All tests passed!', 'success');
            return 0;
        } else {
            this.log(`⚠️  ${this.testsRun - this.testsPassed} test(s) failed`, 'error');
            return 1;
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new SmartDineAPITester();
    tester.runAllTests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = SmartDineAPITester;