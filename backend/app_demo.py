"""Minimal FastAPI backend for demo (without ML/analytics libraries)"""
from fastapi import FastAPI, HTTPException, Depends, status
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
accounts_db = {
    1: {
        "id": 1,
        "user_id": 1,
        "name": "Savings Account",
        "account_type": "bank",
        "balance": 5000.00,
        "currency": "USD",
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
    date: Optional[datetime] = None

class AccountCreate(BaseModel):
    name: str
    account_type: str
    balance: float = 0.0

class CategoryCreate(BaseModel):
    name: str
    type: str
    icon: str = "📁"
    color: str = "#000000"

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
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_db[credentials.email]
    if user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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
        "currency": "USD",
        "created_at": datetime.now()
    }
    accounts_db[new_id] = new_account
    return new_account

# Category endpoints
@app.get("/api/categories")
async def list_categories(credentials: HTTPBearer = Depends(HTTPBearer())):
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

# Dashboard/Analytics endpoints
@app.get("/api/analytics/dashboard/summary")
async def dashboard_summary(credentials: HTTPBearer = Depends(HTTPBearer())):
    total_income = sum(t["amount"] for t in transactions_db if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions_db if t["type"] == "expense")
    total_balance = sum(a["balance"] for a in accounts_db.values())
    
    return {
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

@app.get("/api/analytics/forecast")
async def get_forecast(credentials: HTTPBearer = Depends(HTTPBearer())):
    return {"forecast": {}}

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
