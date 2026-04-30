"""Analytics service for financial insights"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models import Transaction, Category, Budget
from app.ml import expense_predictor
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import statistics

class AnalyticsService:
    """Analytics and insights service"""
    
    @staticmethod
    def get_dashboard_summary(db: Session, user_id: int, month: str = None) -> Dict:
        """Get dashboard summary for a month"""
        if not month:
            month = datetime.utcnow().strftime("%Y-%m")
        
        year, month_num = map(int, month.split('-'))
        
        # Get first and last day of month
        first_day = datetime(year, month_num, 1)
        if month_num == 12:
            last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = datetime(year, month_num + 1, 1) - timedelta(days=1)
        
        # Get transactions for the month
        transactions = db.query(Transaction).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.date >= first_day,
                Transaction.date <= last_day
            )
        ).all()
        
        # Calculate totals
        income = sum(t.amount for t in transactions if t.transaction_type == "income")
        expense = sum(t.amount for t in transactions if t.transaction_type == "expense")
        
        # Category breakdown
        category_breakdown = {}
        for trans in transactions:
            if trans.transaction_type == "expense":
                cat_name = trans.category.name
                category_breakdown[cat_name] = category_breakdown.get(cat_name, 0) + trans.amount
        
        return {
            "month": month,
            "income": income,
            "expense": expense,
            "net": income - expense,
            "transaction_count": len(transactions),
            "category_breakdown": category_breakdown,
            "savings_rate": (income - expense) / income * 100 if income > 0 else 0
        }
    
    @staticmethod
    def get_category_trends(
        db: Session,
        user_id: int,
        category_id: int,
        months: int = 12
    ) -> List[Dict]:
        """Get spending trends for a category"""
        today = datetime.utcnow()
        trends = []
        
        for i in range(months):
            # Calculate month
            month_date = today - timedelta(days=30 * i)
            month_str = month_date.strftime("%Y-%m")
            
            # Get transactions
            first_day = datetime(month_date.year, month_date.month, 1)
            if month_date.month == 12:
                last_day = datetime(month_date.year + 1, 1, 1) - timedelta(days=1)
            else:
                last_day = datetime(month_date.year, month_date.month + 1, 1) - timedelta(days=1)
            
            total = db.query(func.sum(Transaction.amount)).filter(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category_id == category_id,
                    Transaction.date >= first_day,
                    Transaction.date <= last_day,
                    Transaction.transaction_type == "expense"
                )
            ).scalar() or 0
            
            trends.append({
                "month": month_str,
                "amount": float(total)
            })
        
        return list(reversed(trends))
    
    @staticmethod
    def get_anomalies(db: Session, user_id: int) -> List[Dict]:
        """Get detected anomalies"""
        anomalies = db.query(Transaction).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.is_anomaly == True
            )
        ).order_by(Transaction.date.desc()).limit(10).all()
        
        return [
            {
                "id": a.id,
                "description": a.description,
                "amount": a.amount,
                "category": a.category.name,
                "date": a.date,
                "anomaly_score": a.anomaly_score,
                "message": f"This expense is {a.anomaly_score * 100:.0f}% higher than usual for {a.category.name}"
            }
            for a in anomalies
        ]
    
    @staticmethod
    def get_insights(db: Session, user_id: int, month: str = None) -> List[str]:
        """Generate AI insights"""
        if not month:
            month = datetime.utcnow().strftime("%Y-%m")
        
        insights = []
        summary = AnalyticsService.get_dashboard_summary(db, user_id, month)
        
        # Insight: High spending in category
        for category, amount in summary["category_breakdown"].items():
            pct = (amount / summary["expense"] * 100) if summary["expense"] > 0 else 0
            if pct > 25:
                insights.append(f"You spent {pct:.0f}% on {category} this month")
        
        # Insight: Savings rate
        if summary["savings_rate"] < 10:
            insights.append("Your savings rate is low. Consider reducing expenses.")
        elif summary["savings_rate"] > 30:
            insights.append(f"Great job! You saved {summary['savings_rate']:.0f}% of your income.")
        
        return insights
    
    @staticmethod
    def get_budget_status(db: Session, user_id: int, month: str = None) -> List[Dict]:
        """Get budget vs actual spending"""
        if not month:
            month = datetime.utcnow().strftime("%Y-%m")
        
        budgets = db.query(Budget).filter(
            and_(
                Budget.user_id == user_id,
                Budget.month == month,
                Budget.is_active == 1
            )
        ).all()
        
        result = []
        for budget in budgets:
            # Calculate spent amount
            year, month_num = map(int, month.split('-'))
            first_day = datetime(year, month_num, 1)
            if month_num == 12:
                last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                last_day = datetime(year, month_num + 1, 1) - timedelta(days=1)
            
            spent = db.query(func.sum(Transaction.amount)).filter(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category_id == budget.category_id,
                    Transaction.date >= first_day,
                    Transaction.date <= last_day,
                    Transaction.transaction_type == "expense"
                )
            ).scalar() or 0
            
            budget.spent_amount = spent
            
            result.append({
                "category": budget.category.name,
                "limit": budget.limit_amount,
                "spent": float(spent),
                "remaining": budget.limit_amount - spent,
                "percentage": (spent / budget.limit_amount * 100) if budget.limit_amount > 0 else 0,
                "status": "warning" if spent >= budget.limit_amount * budget.alert_threshold else "ok"
            })
        
        return result
    
    @staticmethod
    def forecast_expenses(
        db: Session,
        user_id: int,
        days_ahead: int = 30
    ) -> Dict:
        """Forecast future expenses"""
        # Get last 90 days of transactions
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        transactions = db.query(Transaction).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.date >= ninety_days_ago,
                Transaction.transaction_type == "expense"
            )
        ).all()
        
        if not transactions:
            return {"forecast": 0, "confidence": 0}
        
        # Group by date
        daily_spending = {}
        for trans in transactions:
            date_key = trans.date.date()
            daily_spending[date_key] = daily_spending.get(date_key, 0) + trans.amount
        
        # Prepare data for prediction
        data = [
            {"date": date, "amount": amount}
            for date, amount in daily_spending.items()
        ]
        
        expense_predictor.train(data)
        forecast = expense_predictor.predict_next_month(data, days_ahead)
        
        return {
            "forecast": forecast,
            "days_ahead": days_ahead,
            "daily_average": forecast / days_ahead if days_ahead > 0 else 0
        }
