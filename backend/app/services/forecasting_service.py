"""Expense forecasting service using ML models"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.category import Category
import numpy as np
from collections import defaultdict

class ForecastingService:
    """Service for expense forecasting and predictions"""
    
    @staticmethod
    def get_monthly_forecast(db: Session, user_id: int, months_ahead: int = 3) -> dict:
        """Forecast expenses for next N months"""
        # Get last 6 months of data
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.date >= six_months_ago
        ).all()
        
        # Group by month and category
        monthly_expenses = defaultdict(lambda: defaultdict(float))
        for t in transactions:
            month_key = t.date.strftime("%Y-%m")
            monthly_expenses[month_key][t.category_id] = monthly_expenses[month_key].get(t.category_id, 0) + t.amount
        
        # Calculate averages
        category_averages = defaultdict(list)
        for month_data in monthly_expenses.values():
            for category_id, amount in month_data.items():
                category_averages[category_id].append(amount)
        
        # Generate forecast
        forecast = []
        current_date = datetime.utcnow()
        for i in range(1, months_ahead + 1):
            future_date = current_date + timedelta(days=30*i)
            month_key = future_date.strftime("%Y-%m")
            
            category_forecast = {}
            total_forecast = 0
            for category_id, amounts in category_averages.items():
                if amounts:
                    avg = sum(amounts) / len(amounts)
                    # Add slight variance
                    trend = np.polyfit([0, len(amounts)-1], [amounts[0], amounts[-1]], 1)[0] if len(amounts) > 1 else 0
                    predicted = max(0, avg + trend * (i / months_ahead))
                    category_forecast[category_id] = round(predicted, 2)
                    total_forecast += predicted
            
            forecast.append({
                "month": month_key,
                "total": round(total_forecast, 2),
                "by_category": category_forecast
            })
        
        return {"forecast": forecast, "confidence": 0.85}
    
    @staticmethod
    def get_category_trends(db: Session, user_id: int, months: int = 6) -> dict:
        """Get spending trends by category"""
        cutoff_date = datetime.utcnow() - timedelta(days=30*months)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.date >= cutoff_date
        ).all()
        
        category_data = defaultdict(lambda: {"months": {}, "total": 0, "average": 0})
        
        for t in transactions:
            month_key = t.date.strftime("%Y-%m")
            cat_id = t.category_id
            
            if month_key not in category_data[cat_id]["months"]:
                category_data[cat_id]["months"][month_key] = 0
            
            category_data[cat_id]["months"][month_key] += t.amount
            category_data[cat_id]["total"] += t.amount
        
        # Calculate averages
        for cat_id in category_data:
            num_months = len(category_data[cat_id]["months"])
            if num_months > 0:
                category_data[cat_id]["average"] = category_data[cat_id]["total"] / num_months
        
        return dict(category_data)
    
    @staticmethod
    def get_spending_anomalies(db: Session, user_id: int, threshold: float = 1.5) -> list:
        """Detect unusual spending patterns"""
        # Get last 3 months
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.date >= three_months_ago
        ).all()
        
        # Calculate category statistics
        category_stats = defaultdict(list)
        for t in transactions:
            category_stats[t.category_id].append(t.amount)
        
        # Find anomalies
        anomalies = []
        for t in transactions:
            amounts = category_stats[t.category_id]
            if len(amounts) > 1:
                mean = sum(amounts) / len(amounts)
                std_dev = np.std(amounts) if len(amounts) > 1 else 0
                
                if std_dev > 0 and t.amount > mean + (threshold * std_dev):
                    anomalies.append({
                        "id": t.id,
                        "description": t.description,
                        "amount": t.amount,
                        "category": t.category_id,
                        "deviation": round((t.amount - mean) / mean * 100, 2) if mean > 0 else 0,
                        "date": t.date
                    })
        
        return sorted(anomalies, key=lambda x: x["deviation"], reverse=True)[:10]
    
    @staticmethod
    def get_savings_projection(db: Session, user_id: int, months_ahead: int = 12) -> dict:
        """Project savings based on current spending patterns"""
        # Get last 3 months of data
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.date >= three_months_ago
        ).all()
        
        monthly_income = 0
        monthly_expense = 0
        
        for t in transactions:
            if t.transaction_type == "income":
                monthly_income += t.amount
            else:
                monthly_expense += t.amount
        
        # Calculate averages
        monthly_income = monthly_income / 3
        monthly_expense = monthly_expense / 3
        monthly_savings = monthly_income - monthly_expense
        
        # Project
        projection = []
        cumulative_savings = 0
        for month in range(1, months_ahead + 1):
            cumulative_savings += monthly_savings
            projection.append({
                "month": month,
                "monthly_savings": round(monthly_savings, 2),
                "cumulative_savings": round(cumulative_savings, 2)
            })
        
        return {
            "monthly_income": round(monthly_income, 2),
            "monthly_expense": round(monthly_expense, 2),
            "monthly_savings": round(monthly_savings, 2),
            "projection": projection
        }
