# Database Schema Documentation

## Tables Overview

### Users Table
Stores user account information
```
- id (PK)
- email (UNIQUE)
- username (UNIQUE)
- hashed_password
- full_name
- is_active
- currency (USD, INR, EUR, etc.)
- created_at
- updated_at
```

### Accounts Table
Multi-account support (bank, cash, credit card, UPI)
```
- id (PK)
- user_id (FK)
- name
- account_type (bank, cash, credit_card, upi)
- balance
- currency
- is_active
- created_at
- updated_at
```

### Categories Table
Transaction categories (Food, Travel, etc.)
```
- id (PK)
- user_id (FK)
- name
- icon (emoji)
- color (hex)
- is_default
- category_type (expense, income)
- created_at
- updated_at
```

### Transactions Table
All income/expense transactions
```
- id (PK)
- user_id (FK)
- account_id (FK)
- category_id (FK)
- amount
- transaction_type (income, expense)
- merchant
- description
- notes
- date
- recurring_id (FK, nullable)
- is_anomaly
- anomaly_score
- ai_category_confidence
- created_at
- updated_at
```

### Budgets Table
Monthly budget limits per category
```
- id (PK)
- user_id (FK)
- category_id (FK)
- limit_amount
- spent_amount
- month (YYYY-MM)
- alert_threshold (0.8 = 80%)
- is_active
- created_at
- updated_at
```

### Goals Table
Financial goals tracking
```
- id (PK)
- user_id (FK)
- name
- description
- target_amount
- current_amount
- category
- deadline
- priority (low, medium, high)
- status (active, completed, paused)
- created_at
- updated_at
```

### RecurringTransactions Table
Auto-repeating transactions
```
- id (PK)
- user_id (FK)
- account_id (FK)
- category_id (FK)
- name
- amount
- frequency (daily, weekly, monthly, yearly)
- transaction_type (income, expense)
- due_day
- next_due_date
- is_active
- start_date
- end_date
- last_executed
- created_at
- updated_at
```

### BillReceipts Table
OCR-processed receipts and bills
```
- id (PK)
- user_id (FK)
- transaction_id (FK, nullable)
- file_path
- file_name
- file_type (pdf, jpg, png)
- merchant_name
- amount
- transaction_date
- raw_text (OCR output)
- ocr_confidence (0-1)
- processing_status (pending, processing, completed, failed)
- is_verified
- created_at
- updated_at
```

## Relationships

```
users (1) ──→ (many) accounts
users (1) ──→ (many) transactions
users (1) ──→ (many) categories
users (1) ──→ (many) budgets
users (1) ──→ (many) goals
users (1) ──→ (many) recurring_transactions
users (1) ──→ (many) bill_receipts

accounts (1) ──→ (many) transactions

categories (1) ──→ (many) transactions
categories (1) ──→ (many) budgets

recurring_transactions (1) ──→ (many) transactions
```

## Indexes

Optimized indexes for common queries:
- users: email, username
- accounts: user_id
- categories: user_id, name
- transactions: user_id, date, category_id, account_id
- budgets: user_id, month
- goals: user_id, status
- recurring_transactions: user_id, next_due_date
- bill_receipts: user_id, processing_status
