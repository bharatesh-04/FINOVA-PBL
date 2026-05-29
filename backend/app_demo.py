"""Minimal FastAPI backend for demo (without ML/analytics libraries)"""
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from starlette.authentication import AuthCredentials
from pydantic import BaseModel, EmailStr
import os
from datetime import datetime, timedelta
from typing import Optional, List
import json
from dotenv import load_dotenv

load_dotenv()

# Production settings
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
DEFAULT_CORS_ORIGINS = ",".join([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://finova-qvey.onrender.com",
])
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI(
    title="AI Finance Tracker",
    version="1.0.0",
    description="Personal Finance Tracker & Analyzer",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# Add CORS with production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# In-memory storage for demo
users_db = {
    "demo@example.com": {
        "id": 1,
        "email": "demo@example.com",
        "username": "demo",
        "password": "demo123456",  # Demo only!
        "created_at": datetime.now()
    }
}

transactions_db = []
budgets_db = []
goals_db = []
bills_db = []
accounts_db = {
    1: {
        "id": 1,
        "user_id": 1,
        "name": "Savings Account",
        "account_type": "bank",
        "balance": 5000.00,
        "currency": "INR",
        "created_at": datetime.now()
    }
}

categories_db = {
    1: {"id": 1, "user_id": 1, "name": "Food", "type": "expense", "icon": "🍔", "color": "#FF6B6B"},
    2: {"id": 2, "user_id": 1, "name": "Transport", "type": "expense", "icon": "🚗", "color": "#4ECDC4"},
    3: {"id": 3, "user_id": 1, "name": "Entertainment", "type": "expense", "icon": "🎬", "color": "#45B7D1"},
    4: {"id": 4, "user_id": 1, "name": "Salary", "type": "income", "icon": "💰", "color": "#96CEB4"},
}

# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TransactionCreate(BaseModel):
    account_id: int
    category_id: int
    amount: float
    description: str
    transaction_type: str = "expense"
    merchant: Optional[str] = None
    date: Optional[str] = None

class AccountCreate(BaseModel):
    name: str
    account_type: str
    balance: float = 0.0
    currency: str = "INR"

class CategoryCreate(BaseModel):
    name: str
    type: str
    icon: str = "📁"
    color: str = "#000000"

class BudgetCreate(BaseModel):
    category_id: int
    limit_amount: float
    alert_threshold: float = 0.8
    month: str

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: float
    current_amount: float = 0.0
    category: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[str] = None

class ContributionCreate(BaseModel):
    amount: float

# Auth endpoints
@app.post("/api/auth/signup")
async def signup(user: UserSignup):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users_db[user.email] = {
        "id": len(users_db) + 1,
        "email": user.email,
        "username": user.username,
        "password": user.password,  # Demo - never do this in production!
        "created_at": datetime.now()
    }
    
    return {
        "user": {
            "id": users_db[user.email]["id"],
            "email": user.email,
            "username": user.username
        },
        "token": f"demo-token-{user.email}",
        "message": "Signup successful"
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    if credentials.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found. Please sign up first.")
    
    user = users_db[credentials.email]
    if user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"]
        },
        "token": f"demo-token-{credentials.email}"
    }

@app.get("/api/auth/me")
async def get_me(credentials: HTTPBearer = Depends(HTTPBearer())):
    token = credentials.credentials if hasattr(credentials, 'credentials') else str(credentials)
    email = token.replace("demo-token-", "")
    
    if email not in users_db:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user = users_db[email]
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"]
    }

# Transaction endpoints
@app.get("/api/transactions")
async def list_transactions(credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"transactions": transactions_db, "total": len(transactions_db)}

@app.post("/api/transactions")
async def create_transaction(transaction: TransactionCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    new_trans = {
        "id": len(transactions_db) + 1,
        "account_id": transaction.account_id,
        "category_id": transaction.category_id,
        "amount": transaction.amount,
        "description": transaction.description,
        "type": transaction.transaction_type,
        "transaction_type": transaction.transaction_type,
        "merchant": transaction.merchant or "",
        "date": transaction.date or datetime.now(),
        "created_at": datetime.now()
    }
    transactions_db.append(new_trans)
    
    # Update account balance
    if transaction.account_id in accounts_db:
        if transaction.transaction_type == "expense":
            accounts_db[transaction.account_id]["balance"] -= transaction.amount
        else:
            accounts_db[transaction.account_id]["balance"] += transaction.amount
    
    return new_trans

@app.put("/api/transactions/{transaction_id}")
async def update_transaction(transaction_id: int, transaction: TransactionCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    for item in transactions_db:
        if item["id"] == transaction_id:
            item.update({
                "account_id": transaction.account_id,
                "category_id": transaction.category_id,
                "amount": transaction.amount,
                "description": transaction.description,
                "type": transaction.transaction_type,
                "transaction_type": transaction.transaction_type,
                "merchant": transaction.merchant or "",
                "date": transaction.date or item.get("date"),
            })
            return item
    raise HTTPException(status_code=404, detail="Transaction not found")

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    for index, item in enumerate(transactions_db):
        if item["id"] == transaction_id:
            return transactions_db.pop(index)
    raise HTTPException(status_code=404, detail="Transaction not found")

# Account endpoints
@app.get("/api/accounts")
async def list_accounts(credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"accounts": list(accounts_db.values())}

@app.post("/api/accounts")
async def create_account(account: AccountCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    new_id = max(accounts_db.keys()) + 1 if accounts_db else 1
    new_account = {
        "id": new_id,
        "user_id": 1,
        "name": account.name,
        "account_type": account.account_type,
        "balance": account.balance,
        "currency": account.currency,
        "created_at": datetime.now()
    }
    accounts_db[new_id] = new_account
    return new_account

@app.put("/api/accounts/{account_id}")
async def update_account(account_id: int, account: AccountCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    if account_id not in accounts_db:
        raise HTTPException(status_code=404, detail="Account not found")
    accounts_db[account_id].update({
        "name": account.name,
        "account_type": account.account_type,
        "balance": account.balance,
        "currency": account.currency,
    })
    return accounts_db[account_id]

@app.delete("/api/accounts/{account_id}")
async def delete_account(account_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    if account_id not in accounts_db:
        raise HTTPException(status_code=404, detail="Account not found")
    return accounts_db.pop(account_id)

# Category endpoints
@app.get("/api/categories")
async def list_categories(credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"categories": list(categories_db.values())}

@app.post("/api/categories/init-defaults")
async def init_default_categories(credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"categories": list(categories_db.values())}

@app.post("/api/categories")
async def create_category(category: CategoryCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    new_id = max(categories_db.keys()) + 1 if categories_db else 1
    new_cat = {
        "id": new_id,
        "user_id": 1,
        "name": category.name,
        "type": category.type,
        "icon": category.icon,
        "color": category.color
    }
    categories_db[new_id] = new_cat
    return new_cat

@app.put("/api/categories/{category_id}")
async def update_category(category_id: int, category: CategoryCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    if category_id not in categories_db:
        raise HTTPException(status_code=404, detail="Category not found")
    categories_db[category_id].update({
        "name": category.name,
        "type": category.type,
        "icon": category.icon,
        "color": category.color,
    })
    return categories_db[category_id]

@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    if category_id not in categories_db:
        raise HTTPException(status_code=404, detail="Category not found")
    return categories_db.pop(category_id)

# Budget endpoints
@app.get("/api/budgets")
async def list_budgets(month: Optional[str] = None, credentials: HTTPBearer = Depends(HTTPBearer())):
    items = budgets_db
    if month:
        items = [budget for budget in budgets_db if budget.get("month") == month]
    return {"budgets": items}

@app.post("/api/budgets")
async def create_budget(budget: BudgetCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    category = categories_db.get(budget.category_id, {})
    new_budget = {
        "id": len(budgets_db) + 1,
        "category_id": budget.category_id,
        "category": category,
        "limit_amount": budget.limit_amount,
        "spent_amount": 0.0,
        "alert_threshold": budget.alert_threshold,
        "month": budget.month,
        "created_at": datetime.now(),
    }
    budgets_db.append(new_budget)
    return new_budget

@app.put("/api/budgets/{budget_id}")
async def update_budget(budget_id: int, budget: BudgetCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    for item in budgets_db:
        if item["id"] == budget_id:
            item.update({
                "category_id": budget.category_id,
                "category": categories_db.get(budget.category_id, {}),
                "limit_amount": budget.limit_amount,
                "alert_threshold": budget.alert_threshold,
                "month": budget.month,
            })
            return item
    raise HTTPException(status_code=404, detail="Budget not found")

@app.delete("/api/budgets/{budget_id}")
async def delete_budget(budget_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    for index, item in enumerate(budgets_db):
        if item["id"] == budget_id:
            return budgets_db.pop(index)
    raise HTTPException(status_code=404, detail="Budget not found")

# Goal endpoints
@app.get("/api/goals")
async def list_goals(status_filter: Optional[str] = None, credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"goals": goals_db}

@app.post("/api/goals")
async def create_goal(goal: GoalCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    new_goal = {
        "id": len(goals_db) + 1,
        "name": goal.name,
        "description": goal.description or "",
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "category": goal.category or "",
        "priority": goal.priority,
        "deadline": goal.deadline,
        "created_at": datetime.now(),
    }
    goals_db.append(new_goal)
    return new_goal

@app.put("/api/goals/{goal_id}")
async def update_goal(goal_id: int, goal: GoalCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    for item in goals_db:
        if item["id"] == goal_id:
            item.update({
                "name": goal.name,
                "description": goal.description or "",
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "category": goal.category or "",
                "priority": goal.priority,
                "deadline": goal.deadline,
            })
            return item
    raise HTTPException(status_code=404, detail="Goal not found")

@app.post("/api/goals/{goal_id}/contribute")
async def contribute_to_goal(goal_id: int, contribution: ContributionCreate, credentials: HTTPBearer = Depends(HTTPBearer())):
    for item in goals_db:
        if item["id"] == goal_id:
            item["current_amount"] = item.get("current_amount", 0.0) + contribution.amount
            return item
    raise HTTPException(status_code=404, detail="Goal not found")

@app.delete("/api/goals/{goal_id}")
async def delete_goal(goal_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    for index, item in enumerate(goals_db):
        if item["id"] == goal_id:
            return goals_db.pop(index)
    raise HTTPException(status_code=404, detail="Goal not found")

# Bill and receipt endpoints
@app.get("/api/bills")
async def list_bills(status: Optional[str] = None, credentials: HTTPBearer = Depends(HTTPBearer())):
    items = bills_db
    if status:
        items = [bill for bill in bills_db if bill.get("processing_status") == status]
    return {"bills": items}

@app.post("/api/bills/upload")
async def upload_bill(file: UploadFile = File(...), credentials: HTTPBearer = Depends(HTTPBearer())):
    new_bill = {
        "id": len(bills_db) + 1,
        "merchant_name": file.filename or "Uploaded Receipt",
        "amount": 0.0,
        "transaction_date": datetime.now(),
        "file_type": (file.filename or "").split(".")[-1].lower(),
        "ocr_confidence": 0.0,
        "raw_text": "Demo deployment stores receipt metadata only.",
        "processing_status": "completed",
        "is_verified": False,
        "created_at": datetime.now(),
    }
    bills_db.append(new_bill)
    return new_bill

@app.put("/api/bills/{bill_id}")
async def update_bill(bill_id: int, data: dict, credentials: HTTPBearer = Depends(HTTPBearer())):
    for item in bills_db:
        if item["id"] == bill_id:
            item.update(data)
            return item
    raise HTTPException(status_code=404, detail="Bill not found")

@app.delete("/api/bills/{bill_id}")
async def delete_bill(bill_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    for index, item in enumerate(bills_db):
        if item["id"] == bill_id:
            return bills_db.pop(index)
    raise HTTPException(status_code=404, detail="Bill not found")

# Dashboard/Analytics endpoints
@app.get("/api/analytics/dashboard/summary")
async def dashboard_summary(credentials: HTTPBearer = Depends(HTTPBearer())):
    total_income = sum(t["amount"] for t in transactions_db if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in transactions_db if t.get("type") == "expense")
    total_balance = sum(a["balance"] for a in accounts_db.values())
    category_breakdown = {}
    for transaction in transactions_db:
        if transaction.get("type") != "expense":
            continue
        category = categories_db.get(transaction.get("category_id"), {})
        name = category.get("name", "Other")
        category_breakdown[name] = category_breakdown.get(name, 0.0) + transaction.get("amount", 0.0)
    savings_rate = ((total_income - total_expense) / total_income * 100) if total_income else 0.0
    
    return {
        "income": total_income,
        "expense": total_expense,
        "savings_rate": savings_rate,
        "category_breakdown": category_breakdown,
        "total_balance": total_balance,
        "total_income": total_income,
        "total_expense": total_expense,
        "net": total_income - total_expense,
        "transaction_count": len(transactions_db),
        "account_count": len(accounts_db)
    }

@app.get("/api/analytics/anomalies")
async def get_anomalies(credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"anomalies": []}

@app.get("/api/analytics/insights")
async def get_insights(credentials: HTTPBearer = Depends(HTTPBearer())):
    if not transactions_db:
        return {"insights": ["Add a few transactions to generate spending insights."]}
    return {"insights": ["Your demo dashboard is using live transaction data."]}

@app.get("/api/analytics/budget/status")
async def get_budget_status(credentials: HTTPBearer = Depends(HTTPBearer())):
    status_items = []
    for budget in budgets_db:
        limit = budget.get("limit_amount", 0.0) or 1
        spent = budget.get("spent_amount", 0.0)
        percentage = spent / limit * 100
        status_items.append({
            "category": budget.get("category", {}).get("name", "Budget"),
            "spent": spent,
            "limit": budget.get("limit_amount", 0.0),
            "percentage": percentage,
            "status": "danger" if percentage >= 100 else "warning" if percentage >= 80 else "good",
        })
    return {"budget_status": status_items}

@app.get("/api/analytics/forecast")
async def get_forecast(credentials: HTTPBearer = Depends(HTTPBearer())):
    expense_total = sum(t["amount"] for t in transactions_db if t.get("type") == "expense")
    daily_average = expense_total / 30 if expense_total else 0.0
    return {"forecast": daily_average * 30, "daily_average": daily_average}

@app.get("/api/analytics/net-worth")
async def get_net_worth(credentials: HTTPBearer = Depends(HTTPBearer())):
    accounts = list(accounts_db.values())
    net_worth = sum(account.get("balance", 0.0) for account in accounts)
    return {"net_worth": net_worth, "accounts": accounts}

@app.get("/api/analytics/category/{category_id}/trends")
async def get_category_trends(category_id: int, credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"trends": []}

# Health check
@app.get("/")
async def root():
    return {"message": "Finance Tracker API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
