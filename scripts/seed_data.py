#!/usr/bin/env python3
"""
Seed script to populate sample data for testing
"""
from datetime import datetime, timedelta
import random
from app.database import SessionLocal, init_db
from app.models import (
    User, Account, Category, Transaction, Budget,
    Goal, RecurringTransaction
)
from app.utils.auth import hash_password

def seed_database():
    """Populate database with sample data"""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Database already has data. Skipping seed.")
            return
        
        # Create sample user
        user = User(
            email="demo@example.com",
            username="demo",
            full_name="Demo User",
            hashed_password=hash_password("demo123456"),
            currency="USD"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created user: {user.username}")
        
        # Create sample accounts
        accounts_data = [
            {"name": "SBI Bank", "account_type": "bank", "balance": 50000},
            {"name": "My Wallet", "account_type": "cash", "balance": 5000},
            {"name": "Credit Card", "account_type": "credit_card", "balance": 0},
        ]
        
        accounts = []
        for acc_data in accounts_data:
            account = Account(user_id=user.id, **acc_data)
            accounts.append(account)
            db.add(account)
        db.commit()
        print(f"Created {len(accounts)} accounts")
        
        # Create sample categories
        categories_data = [
            {"name": "Food", "icon": "🍔", "color": "#FF6B6B", "category_type": "expense"},
            {"name": "Travel", "icon": "✈️", "color": "#4ECDC4", "category_type": "expense"},
            {"name": "Entertainment", "icon": "🎬", "color": "#95E1D3", "category_type": "expense"},
            {"name": "Shopping", "icon": "🛍️", "color": "#FFB3B3", "category_type": "expense"},
            {"name": "Health", "icon": "💊", "color": "#A8D8EA", "category_type": "expense"},
            {"name": "Utilities", "icon": "💡", "color": "#FCBAD3", "category_type": "expense"},
            {"name": "Salary", "icon": "💰", "color": "#52B788", "category_type": "income"},
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Category(user_id=user.id, is_default=True, **cat_data)
            categories.append(category)
            db.add(category)
        db.commit()
        print(f"Created {len(categories)} categories")
        
        # Create sample transactions
        now = datetime.utcnow()
        transaction_data = [
            {"amount": 50, "category": 0, "merchant": "McDonald's", "desc": "Lunch"},
            {"amount": 100, "category": 1, "merchant": "Uber", "desc": "Ride to office"},
            {"amount": 15, "category": 2, "merchant": "Cinema", "desc": "Movie ticket"},
            {"amount": 200, "category": 3, "merchant": "Amazon", "desc": "Books"},
            {"amount": 5000, "category": 6, "merchant": "Company", "desc": "Monthly salary"},
            {"amount": 80, "category": 4, "merchant": "Gym", "desc": "Monthly membership"},
        ]
        
        for i, trans_data in enumerate(transaction_data):
            date = now - timedelta(days=random.randint(1, 30))
            transaction = Transaction(
                user_id=user.id,
                account_id=random.choice(accounts).id,
                category_id=categories[trans_data["category"]].id,
                amount=trans_data["amount"],
                transaction_type=categories[trans_data["category"]].category_type,
                merchant=trans_data["merchant"],
                description=trans_data["desc"],
                date=date,
                ai_category_confidence=random.uniform(0.7, 1.0)
            )
            db.add(transaction)
        db.commit()
        print(f"Created {len(transaction_data)} transactions")
        
        # Create sample budget
        budget = Budget(
            user_id=user.id,
            category_id=categories[0].id,
            limit_amount=500,
            month=now.strftime("%Y-%m"),
            alert_threshold=0.8
        )
        db.add(budget)
        db.commit()
        print("Created 1 budget")
        
        # Create sample goal
        goal = Goal(
            user_id=user.id,
            name="Save for vacation",
            description="Summer trip to Europe",
            target_amount=5000,
            current_amount=2000,
            category="Travel",
            priority="high",
            status="active"
        )
        db.add(goal)
        db.commit()
        print("Created 1 goal")
        
        # Create sample recurring transaction
        recurring = RecurringTransaction(
            user_id=user.id,
            account_id=accounts[0].id,
            category_id=categories[6].id,
            name="Monthly Salary",
            amount=5000,
            frequency="monthly",
            transaction_type="income",
            due_day=1,
            start_date=now,
            next_due_date=now + timedelta(days=30),
            is_active=True
        )
        db.add(recurring)
        db.commit()
        print("Created 1 recurring transaction")
        
        print("\n✅ Database seeded successfully!")
        print("\nDemo Credentials:")
        print("Email: demo@example.com")
        print("Password: demo123456")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    sys.path.insert(0, 'backend')
    seed_database()
