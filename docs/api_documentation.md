# API Documentation

## Base URL
`http://localhost:8000/api`

## Authentication
All endpoints (except auth) require Bearer token in header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "password": "securepassword",
  "currency": "INR"
}

Response (200):
{
  "access_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "is_active": true,
    "currency": "INR",
    "created_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:00:00"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response (200): [Same as signup]
```

### Get Current User
```
GET /auth/me

Response (200): [User object]
```

---

## Transaction Endpoints

### Create Transaction
```
POST /transactions
Content-Type: application/json

{
  "account_id": 1,
  "category_id": 2,
  "amount": 50.00,
  "transaction_type": "expense",
  "merchant": "McDonald's",
  "description": "Lunch",
  "date": "2024-01-15T12:30:00"
}

Response (200): [Transaction object]
```

### Get Transactions
```
GET /transactions?skip=0&limit=100&start_date=2024-01-01&end_date=2024-01-31&category_id=2&transaction_type=expense

Response (200): [Array of transactions]
```

### Update Transaction
```
PUT /transactions/{id}
{
  "amount": 55.00,
  "category_id": 3
}

Response (200): [Updated transaction]
```

### Delete Transaction
```
DELETE /transactions/{id}

Response (200): {"message": "Transaction deleted successfully"}
```

---

## Account Endpoints

### Create Account
```
POST /accounts

{
  "name": "My Savings",
  "account_type": "bank",
  "balance": 1000.00,
  "currency": "INR"
}

Response (200): [Account object]
```

### Get All Accounts
```
GET /accounts

Response (200): [Array of accounts]
```

### Update Account
```
PUT /accounts/{id}

{
  "name": "Updated Name",
  "balance": 1500.00
}

Response (200): [Updated account]
```

### Delete Account
```
DELETE /accounts/{id}

Response (200): {"message": "Account deleted successfully"}
```

---

## Category Endpoints

### Initialize Default Categories
```
POST /categories/init-defaults

Response (200): {"message": "Default categories initialized", "count": 11}
```

### Create Category
```
POST /categories

{
  "name": "Shopping",
  "icon": "🛍️",
  "color": "#FFB3B3",
  "category_type": "expense"
}

Response (200): [Category object]
```

### Get All Categories
```
GET /categories

Response (200): [Array of categories]
```

### Update Category
```
PUT /categories/{id}

{
  "name": "Online Shopping",
  "color": "#FF6B6B"
}

Response (200): [Updated category]
```

### Delete Category
```
DELETE /categories/{id}

Response (200): {"message": "Category deleted successfully"}
```

---

## Budget Endpoints

### Create Budget
```
POST /budgets

{
  "category_id": 2,
  "limit_amount": 500.00,
  "month": "2024-01",
  "alert_threshold": 0.80
}

Response (200): [Budget object]
```

### Get Budgets
```
GET /budgets?month=2024-01

Response (200): [Array of budgets for month]
```

### Update Budget
```
PUT /budgets/{id}

{
  "limit_amount": 600.00,
  "alert_threshold": 0.75
}

Response (200): [Updated budget]
```

### Delete Budget
```
DELETE /budgets/{id}

Response (200): {"message": "Budget deleted successfully"}
```

---

## Goal Endpoints

### Create Goal
```
POST /goals

{
  "name": "Save for vacation",
  "description": "Summer trip to Europe",
  "target_amount": 5000.00,
  "category": "Travel",
  "priority": "high",
  "deadline": "2024-06-30T00:00:00"
}

Response (200): [Goal object]
```

### Get Goals
```
GET /goals?status_filter=active

Response (200): [Array of goals]
```

### Update Goal
```
PUT /goals/{id}

{
  "current_amount": 1000.00,
  "status": "active"
}

Response (200): [Updated goal]
```

### Contribute to Goal
```
POST /goals/{id}/contribute

{
  "amount": 500.00
}

Response (200): {"goal": {...}, "progress_percentage": 50}
```

### Delete Goal
```
DELETE /goals/{id}

Response (200): {"message": "Goal deleted successfully"}
```

---

## Analytics Endpoints

### Dashboard Summary
```
GET /analytics/dashboard/summary?month=2024-01

Response (200):
{
  "month": "2024-01",
  "income": 3000.00,
  "expense": 1500.00,
  "net": 1500.00,
  "transaction_count": 45,
  "category_breakdown": {
    "Food": 300.00,
    "Travel": 200.00,
    "Entertainment": 150.00
  },
  "savings_rate": 50.0
}
```

### Category Trends
```
GET /analytics/category/{category_id}/trends?months=12

Response (200): [
  {"month": "2023-01", "amount": 250.00},
  {"month": "2023-02", "amount": 280.00},
  ...
]
```

### Anomalies
```
GET /analytics/anomalies

Response (200): [
  {
    "id": 1,
    "description": "Unusual expense",
    "amount": 500.00,
    "category": "Food",
    "date": "2024-01-15T12:00:00",
    "anomaly_score": 0.85,
    "message": "This expense is 85% higher than usual for Food"
  }
]
```

### AI Insights
```
GET /analytics/insights?month=2024-01

Response (200): [
  "You spent 25% more on food this month",
  "Your savings rate is 50% - Great job!",
  "Subscriptions are increasing steadily"
]
```

### Budget Status
```
GET /analytics/budget/status?month=2024-01

Response (200): [
  {
    "category": "Food",
    "limit": 500.00,
    "spent": 420.00,
    "remaining": 80.00,
    "percentage": 84.0,
    "status": "warning"
  }
]
```

### Expense Forecast
```
GET /analytics/forecast?days_ahead=30

Response (200):
{
  "forecast": 1450.00,
  "days_ahead": 30,
  "daily_average": 48.33
}
```

### Net Worth
```
GET /analytics/net-worth

Response (200):
{
  "net_worth": 25000.00,
  "accounts_count": 3,
  "accounts": [
    {"id": 1, "name": "Savings", "type": "bank", "balance": 10000.00},
    {"id": 2, "name": "Checking", "type": "bank", "balance": 5000.00},
    {"id": 3, "name": "Wallet", "type": "cash", "balance": 10000.00}
  ]
}
```

---

## Bill & Receipt Endpoints

### Upload Receipt
```
POST /bills/upload
Content-Type: multipart/form-data

file: <binary file>

Response (200):
{
  "id": 1,
  "user_id": 1,
  "file_path": "uploads/receipts/1/abc123.jpg",
  "file_name": "abc123.jpg",
  "file_type": "jpg",
  "merchant_name": "McDonald's",
  "amount": 25.50,
  "transaction_date": "2024-01-15T12:30:00",
  "raw_text": "...",
  "ocr_confidence": 0.92,
  "processing_status": "completed",
  "is_verified": false,
  "created_at": "2024-01-15T12:35:00",
  "updated_at": "2024-01-15T12:35:00"
}
```

### Get Receipts
```
GET /bills?status=completed

Response (200): [Array of receipts]
```

### Update Receipt
```
PUT /bills/{id}

{
  "merchant_name": "McDonalds",
  "amount": 26.00,
  "is_verified": true
}

Response (200): [Updated receipt]
```

### Delete Receipt
```
DELETE /bills/{id}

Response (200): {"message": "Receipt deleted successfully"}
```

---

## Error Responses

### 400 Bad Request
```
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```
{
  "detail": "Invalid authentication credentials"
}
```

### 404 Not Found
```
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting
Currently not implemented. To be added in production.

## Pagination
Use `skip` and `limit` query parameters (default: skip=0, limit=100)
