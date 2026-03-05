# SmartDine India - Product Requirements Document

## Original Problem Statement
Build a full-stack, mobile-responsive "SmartDine India" restaurant ordering application where customers order first and can only pay after the kitchen staff marks the order status as "Ready".

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, Shadcn/UI, i18next
- **Backend:** Node.js/Express.js
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.IO
- **Payments:** Razorpay (DEMO MODE - mocked)

## User Roles
1. **Customer** - Browse menu, place orders, track status, pay when ready
2. **Kitchen Staff** - View incoming orders, update status (Preparing → Ready)
3. **Manager** - View reports, manage menu, configure restaurant settings & theme, pay for orders

## Core Features

### Implemented
- [x] Three-role authentication (JWT + bcrypt)
- [x] Simplified customer entry - Just name + mobile, auto-creates or logs in
- [x] Staff registration (no access code required) - Feb 27, 2026
- [x] Menu browsing and ordering with mandatory table number
- [x] Real-time order status updates via Socket.IO
- [x] Kitchen dashboard with 3-column order management
- [x] Manager dashboard with stats, reports, menu management
- [x] Loyalty points system (earn on payments, redeem for discounts)
- [x] Menu item image upload from local device/camera
- [x] Dynamic theme & branding (colors, logo, background image)
- [x] Theme consistency - All pages use useTheme() for dynamic colors
- [x] Multi-lingual support - 6 languages (EN, HI, KN, TE, TA, ML) on ALL pages - Feb 27, 2026
- [x] Payment demo mode - Razorpay simulation with placeholder keys
- [x] Role-specific landing pages (Customer, Kitchen, Manager portals)
- [x] PDF Invoice Generation - Auto-download on payment, available on all order views - Feb 27, 2026
- [x] Manager Payment Flow - Manager can pay for Ready orders on behalf of customers - Feb 27, 2026
- [x] Enhanced Reports Page - Date range, stats cards, expandable order details, invoice download - Feb 27, 2026
- [x] Glass-morphism premium UI design
- [x] **Mobile cart below menu** - Cart visible inline below menu on mobile (not drawer) - Feb 27, 2026
- [x] **GST billing** — SGST/CGST configurable in settings, shown in cart/payment/invoice - Feb 27, 2026
- [x] **Loyalty points on mobile** — Fixed visibility on mobile header - Feb 27, 2026

### Backlog (P2)
- [ ] Menu from Internet API - Fetch base menu from TheMealDB, manager approves and prices
- [ ] Refine role-based URL routing for better separation
- [ ] GST/tax calculation on orders
- [ ] File cleanup (remove unused files)
- [ ] QR code table ordering

## Key API Endpoints
- `POST /api/auth/customer-entry` - Simplified customer login/registration (mobile as unique ID)
- `POST /api/auth/login` - All role login
- `POST /api/auth/staff-register` - Kitchen/Manager registration (no access code)
- `GET /api/menu` - Public menu listing
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Customer's orders
- `POST /api/orders/create-payment-order/:orderId` - Initiate payment (customer OR manager)
- `POST /api/orders/verify-payment/:orderId` - Verify payment (customer OR manager)
- `GET /api/orders/invoice/:orderId` - Get invoice data (customer OR manager)
- `GET /api/kitchen/orders` - Kitchen order list
- `PUT /api/kitchen/orders/:orderId/status` - Update order status
- `GET /api/manager/orders` - All orders for manager
- `GET /api/manager/reports/daily` - Reports with date filtering
- `GET /api/manager/theme` - Public theme settings
- `PUT /api/manager/settings` - Save restaurant settings

## Test Credentials
- **Customer:** Any name + mobile number (auto-creates)
- **Kitchen:** Kitchen Staff / kitchen123
- **Manager:** Manager Admin / manager123

## Test Results
- Backend: 100% (24/24 tests) - iteration_4
- Frontend: 95%+ - all 13 features verified
- Test report: /app/test_reports/iteration_4.json

## Mocked Services
- **Razorpay Payments** - Demo mode when keys are placeholder values
- **Menu Data** - Static seeded menu (not from live external API yet)
