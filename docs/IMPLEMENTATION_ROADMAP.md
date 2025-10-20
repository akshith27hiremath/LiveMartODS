# Live MART - Implementation Roadmap

This document provides a step-by-step guide to implement the Live MART project based on the created structure.

---

## Phase 1: Project Setup (Week 1)

### ✅ Completed
- [x] Project structure created
- [x] Docker configuration ready
- [x] Environment files configured
- [x] Package.json files setup
- [x] TypeScript configuration
- [x] Documentation written
- [x] UML structure finalized

### 🎯 Next Steps
- [ ] Run `scripts/setup.bat` (Windows) or `scripts/setup.sh` (Linux/macOS)
- [ ] Verify all services start correctly
- [ ] Create initial Git commit

```bash
# Initialize and commit
git add .
git commit -m "chore: initial project setup with complete structure"
```

---

## Phase 2: Backend Foundation (Week 1-2)

### 2.1 Database Setup

**Priority: High** | **Estimated Time: 2 days**

#### Tasks:
1. Create MongoDB Models (in `server/src/models/`)
   - [ ] `User.model.ts` (base abstract class)
   - [ ] `Customer.model.ts`
   - [ ] `Retailer.model.ts`
   - [ ] `Wholesaler.model.ts`
   - [ ] `Product.model.ts`
   - [ ] `Order.model.ts`
   - [ ] `UPITransaction.model.ts`
   - [ ] `Inventory.model.ts`

2. Setup Database Connection
   - [ ] Create `server/src/config/database.ts`
   - [ ] Implement connection pooling
   - [ ] Add error handling

3. Create Database Indexes
   - [ ] Add indexes for search optimization
   - [ ] Location-based indexes (GeoJSON)

**Files to Create:**
```
server/src/
├── models/
│   ├── User.model.ts
│   ├── Customer.model.ts
│   ├── Retailer.model.ts
│   ├── Wholesaler.model.ts
│   ├── Product.model.ts
│   ├── Order.model.ts
│   ├── Inventory.model.ts
│   └── UPITransaction.model.ts
└── config/
    └── database.ts
```

### 2.2 Authentication System

**Priority: High** | **Estimated Time: 3 days**

#### Tasks:
1. JWT Service
   - [ ] Create `server/src/services/jwt.service.ts`
   - [ ] Implement token generation/validation
   - [ ] Add refresh token logic

2. Authentication Middleware
   - [ ] Create `server/src/middleware/auth.middleware.ts`
   - [ ] Implement role-based access control
   - [ ] Add token verification

3. OTP Service
   - [ ] Create `server/src/services/otp.service.ts`
   - [ ] Integrate Twilio for SMS
   - [ ] Implement OTP generation/verification

4. OAuth Integration
   - [ ] Setup Passport.js
   - [ ] Configure Google OAuth
   - [ ] Configure Facebook OAuth

**Files to Create:**
```
server/src/
├── services/
│   ├── jwt.service.ts
│   ├── otp.service.ts
│   └── oauth.service.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── rbac.middleware.ts
└── controllers/
    └── auth.controller.ts
```

### 2.3 API Routes

**Priority: High** | **Estimated Time: 2 days**

#### Tasks:
1. Create Route Files
   - [ ] `server/src/routes/auth.routes.ts`
   - [ ] `server/src/routes/user.routes.ts`
   - [ ] `server/src/routes/product.routes.ts`
   - [ ] `server/src/routes/order.routes.ts`
   - [ ] `server/src/routes/payment.routes.ts`

2. Setup Express App
   - [ ] Create `server/src/app.ts`
   - [ ] Configure middleware (helmet, cors, etc.)
   - [ ] Setup error handling
   - [ ] Add logging (Winston)

**Files to Create:**
```
server/src/
├── app.ts
├── routes/
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── product.routes.ts
│   ├── order.routes.ts
│   └── payment.routes.ts
└── middleware/
    └── error.middleware.ts
```

---

## Phase 3: Core Features (Week 3-4)

### 3.1 Module 1: Registration & Authentication

**Priority: Critical** | **Estimated Time: 4 days**

#### Backend Tasks:
- [ ] Implement registration endpoint (`POST /api/auth/register`)
- [ ] Add OTP verification endpoint (`POST /api/auth/verify-otp`)
- [ ] Create login endpoint (`POST /api/auth/login`)
- [ ] Implement social login callbacks
- [ ] Add password reset functionality

#### Frontend Tasks:
- [ ] Create registration form (`client/src/pages/auth/Register.tsx`)
- [ ] Build OTP verification page
- [ ] Design login page
- [ ] Add social login buttons
- [ ] Implement form validation with Zod

**API Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-otp
POST   /api/auth/resend-otp
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/google
GET    /api/auth/google/callback
GET    /api/auth/facebook
GET    /api/auth/facebook/callback
POST   /api/auth/refresh-token
POST   /api/auth/logout
```

### 3.2 Module 2: User Dashboards

**Priority: High** | **Estimated Time: 6 days**

#### Customer Dashboard
- [ ] Create customer dashboard layout
- [ ] Implement product browsing
- [ ] Add category filters
- [ ] Build wishlist feature
- [ ] Create order history view
- [ ] Integrate Google Maps for nearby stores

#### Retailer Dashboard
- [ ] Create inventory management interface
- [ ] Build sales analytics charts
- [ ] Add customer history view
- [ ] Implement wholesaler order form
- [ ] Create low stock alerts

#### Wholesaler Dashboard
- [ ] Build retailer network view
- [ ] Create bulk order management
- [ ] Add pricing strategy tools
- [ ] Implement performance metrics

**Files Structure:**
```
client/src/pages/
├── customer/
│   ├── Dashboard.tsx
│   ├── ProductBrowse.tsx
│   ├── Wishlist.tsx
│   └── OrderHistory.tsx
├── retailer/
│   ├── Dashboard.tsx
│   ├── InventoryManagement.tsx
│   ├── SalesAnalytics.tsx
│   └── CustomerHistory.tsx
└── wholesaler/
    ├── Dashboard.tsx
    ├── RetailerNetwork.tsx
    ├── BulkOrders.tsx
    └── Analytics.tsx
```

### 3.3 Module 3: Search & Navigation

**Priority: High** | **Estimated Time: 4 days**

#### Backend Tasks:
- [ ] Setup Elasticsearch client
- [ ] Create product indexing service
- [ ] Implement search endpoint with filters
- [ ] Add auto-complete suggestions
- [ ] Implement location-based search

#### Frontend Tasks:
- [ ] Create search bar component
- [ ] Build filter panel
- [ ] Add search results grid
- [ ] Implement map view with markers
- [ ] Add pagination

**Files to Create:**
```
server/src/services/
└── search.service.ts

client/src/components/
└── search/
    ├── SearchBar.tsx
    ├── FilterPanel.tsx
    ├── SearchResults.tsx
    └── MapView.tsx
```

### 3.4 Module 4: Order & Payment

**Priority: Critical** | **Estimated Time: 5 days**

#### Shopping Cart
- [ ] Implement cart state management (Zustand)
- [ ] Add/remove/update cart items
- [ ] Calculate totals with discounts
- [ ] Persist cart to localStorage

#### Order Management
- [ ] Create order placement endpoint
- [ ] Implement inventory reservation
- [ ] Add order status tracking
- [ ] Build order history view

#### UPI Payment Integration
- [ ] Integrate PhonePe gateway
- [ ] Add Google Pay support
- [ ] Implement Paytm integration
- [ ] Create payment verification webhook
- [ ] Add transaction history

**Payment Flow:**
```
1. Customer adds items to cart
2. Proceeds to checkout
3. Selects UPI payment method
4. Backend generates payment request
5. Customer completes payment
6. Webhook verifies transaction
7. Order status updated
8. Inventory decremented
9. Confirmation email/SMS sent
```

### 3.5 Module 5: Feedback & Notifications

**Priority: Medium** | **Estimated Time: 3 days**

#### Feedback System
- [ ] Create feedback model
- [ ] Add rating/review endpoints
- [ ] Implement feedback moderation
- [ ] Display reviews on product pages

#### Notification System
- [ ] Setup Socket.IO server
- [ ] Implement real-time order updates
- [ ] Configure SendGrid email templates
- [ ] Setup Twilio SMS notifications
- [ ] Create in-app notification center

**Files to Create:**
```
server/src/
├── services/
│   ├── notification.service.ts
│   ├── email.service.ts
│   ├── sms.service.ts
│   └── socket.service.ts
└── controllers/
    └── feedback.controller.ts

client/src/components/
└── notifications/
    ├── NotificationCenter.tsx
    └── NotificationBell.tsx
```

---

## Phase 4: Advanced Features (Week 5-6)

### 4.1 AI Recommendations

**Priority: Low** | **Estimated Time: 4 days**

- [ ] Implement collaborative filtering
- [ ] Add purchase history analysis
- [ ] Create recommendation endpoint
- [ ] Display recommendations on dashboard

### 4.2 Analytics & Reporting

**Priority: Medium** | **Estimated Time: 3 days**

- [ ] Create analytics service
- [ ] Implement sales reports
- [ ] Add customer insights
- [ ] Build inventory analytics
- [ ] Create Chart.js visualizations

### 4.3 Calendar Integration

**Priority: Low** | **Estimated Time: 2 days**

- [ ] Setup Google Calendar API
- [ ] Implement scheduled orders
- [ ] Add delivery slot booking
- [ ] Create email reminders

---

## Phase 5: Testing (Week 7)

### 5.1 Unit Tests

**Priority: High** | **Estimated Time: 4 days**

- [ ] Write model tests
- [ ] Test service layer
- [ ] Test utility functions
- [ ] Test React components

### 5.2 Integration Tests

**Priority: High** | **Estimated Time: 3 days**

- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test payment flow
- [ ] Test authentication flow

### 5.3 E2E Tests

**Priority: Medium** | **Estimated Time: 2 days**

- [ ] Setup Cypress or Playwright
- [ ] Test user registration flow
- [ ] Test product purchase flow
- [ ] Test dashboard interactions

**Test Structure:**
```
tests/
├── unit/
│   ├── server/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   └── client/
│       └── components/
├── integration/
│   └── api/
│       ├── auth.test.ts
│       ├── products.test.ts
│       └── orders.test.ts
└── e2e/
    ├── registration.spec.ts
    ├── checkout.spec.ts
    └── dashboard.spec.ts
```

---

## Phase 6: Deployment (Week 8)

### 6.1 Production Setup

**Priority: Critical** | **Estimated Time: 3 days**

- [ ] Configure production environment variables
- [ ] Setup SSL certificates
- [ ] Configure production database
- [ ] Setup CDN for static assets
- [ ] Configure monitoring (Sentry)

### 6.2 CI/CD Pipeline

**Priority: High** | **Estimated Time: 2 days**

- [ ] Configure GitHub Actions (already created)
- [ ] Setup automated testing
- [ ] Add Docker image building
- [ ] Configure deployment scripts

### 6.3 Cloud Deployment

**Priority: Critical** | **Estimated Time: 3 days**

- [ ] Choose cloud provider (AWS/DigitalOcean)
- [ ] Setup EC2/Droplet instances
- [ ] Configure load balancer
- [ ] Setup database backups
- [ ] Configure monitoring and logging

---

## Suggested Development Order

### Week 1: Foundation
1. ✅ Project setup (DONE)
2. Database models
3. Authentication system
4. Basic API structure

### Week 2: Core Backend
1. All API endpoints
2. UPI payment integration
3. Search service
4. File upload service

### Week 3: Frontend Foundation
1. Authentication pages
2. Dashboard layouts
3. Component library
4. State management setup

### Week 4: Feature Implementation
1. Product browsing
2. Shopping cart
3. Order placement
4. User dashboards

### Week 5: Advanced Features
1. Real-time notifications
2. Feedback system
3. Analytics dashboards
4. Recommendations

### Week 6: Polish & Optimization
1. UI/UX improvements
2. Performance optimization
3. Security hardening
4. Documentation

### Week 7: Testing
1. Unit tests
2. Integration tests
3. E2E tests
4. Bug fixes

### Week 8: Deployment
1. Production setup
2. CI/CD pipeline
3. Cloud deployment
4. Final testing

---

## Key Metrics to Track

### Development Progress
- [ ] API endpoints completed: 0/50+
- [ ] Frontend pages created: 0/20+
- [ ] Tests written: 0/100+
- [ ] Code coverage: 0/80%

### Performance Targets
- [ ] API response time: < 200ms
- [ ] Page load time: < 2s
- [ ] Lighthouse score: > 90
- [ ] Database query time: < 100ms

### Code Quality
- [ ] TypeScript strict mode: Enabled
- [ ] ESLint errors: 0
- [ ] Security vulnerabilities: 0
- [ ] Test coverage: > 80%

---

## Resources & References

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Socket.IO Docs](https://socket.io/docs/)

### Payment Gateways
- [PhonePe Integration](https://developer.phonepe.com/)
- [Google Pay for Web](https://developers.google.com/pay/api/web)
- [Paytm Developer](https://developer.paytm.com/)

### APIs
- [Google Maps API](https://developers.google.com/maps)
- [SendGrid API](https://docs.sendgrid.com/)
- [Twilio API](https://www.twilio.com/docs)

---

## Tips for Success

1. **Start Simple**: Implement basic features first, then add complexity
2. **Test Early**: Write tests alongside features
3. **Use Git**: Commit frequently with meaningful messages
4. **Document**: Add comments and update docs as you build
5. **Review Code**: Do peer reviews before merging
6. **Monitor Performance**: Use profiling tools regularly
7. **Security First**: Never commit secrets, use environment variables
8. **User Feedback**: Test with real users early and often

---

## Team Collaboration Guidelines

### Git Workflow
```bash
# Always work on feature branches
git checkout -b feature/module-name

# Commit with conventional commits
git commit -m "feat: add user registration"
git commit -m "fix: resolve payment gateway issue"
git commit -m "docs: update API documentation"

# Push and create PR
git push origin feature/module-name
```

### Code Review Checklist
- [ ] Code follows project style guide
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Performance considered

---

**Remember**: This is a learning project. Focus on understanding concepts and building quality code over rushing to completion.

Good luck with your implementation! 🚀
