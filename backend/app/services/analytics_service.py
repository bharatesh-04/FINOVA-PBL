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
        """Forecast future expenses with trend and category detail."""
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
            return {
                "forecast": 0,
                "confidence": 0,
                "days_ahead": days_ahead,
                "daily_average": 0,
                "weekly_projection": 0,
                "trend": "stable",
                "trend_percent": 0,
                "transactions_analyzed": 0,
                "history_days": 0,
                "projected_by_category": [],
                "top_risk_category": None,
                "message": "Add expense transactions to unlock predictions.",
            }
        
        # Group by date
        daily_spending = {}
        category_spending = {}
        for trans in transactions:
            date_key = trans.date.date()
            daily_spending[date_key] = daily_spending.get(date_key, 0) + trans.amount
            category_name = trans.category.name if trans.category else "Other"
            category_spending[category_name] = category_spending.get(category_name, 0) + trans.amount
        
        # Prepare data for prediction
        data = [
            {"date": date, "amount": amount}
            for date, amount in daily_spending.items()
        ]
        data = sorted(data, key=lambda item: item["date"])
        
        expense_predictor.train(data)
        forecast = expense_predictor.predict_next_month(data, days_ahead)

        total_spent = sum(item["amount"] for item in data)
        history_days = max((max(daily_spending) - min(daily_spending)).days + 1, 1)
        fallback_forecast = (total_spent / history_days) * days_ahead
        if forecast <= 0:
            forecast = fallback_forecast

        recent_start = datetime.utcnow() - timedelta(days=30)
        previous_start = datetime.utcnow() - timedelta(days=60)
        recent_total = sum(
            trans.amount for trans in transactions
            if trans.date >= recent_start
        )
        previous_total = sum(
            trans.amount for trans in transactions
            if previous_start <= trans.date < recent_start
        )
        trend_percent = (
            ((recent_total - previous_total) / previous_total) * 100
            if previous_total > 0 else 0
        )
        if trend_percent > 8:
            trend = "increasing"
        elif trend_percent < -8:
            trend = "decreasing"
        else:
            trend = "stable"

        category_total = sum(category_spending.values()) or 1
        projected_by_category = []
        for category, amount in sorted(category_spending.items(), key=lambda item: item[1], reverse=True):
            share = amount / category_total
            projected_by_category.append({
                "category": category,
                "historical_amount": float(amount),
                "share_percent": round(share * 100, 1),
                "projected_amount": round(float(forecast * share), 2),
            })

        sample_score = min(len(data) / 30, 1) * 0.35
        transaction_score = min(len(transactions) / 60, 1) * 0.25
        span_score = min(history_days / 90, 1) * 0.25
        confidence = round(min(0.95, 0.15 + sample_score + transaction_score + span_score), 2)
        
        return {
            "forecast": round(float(forecast), 2),
            "days_ahead": days_ahead,
            "daily_average": round(float(forecast / days_ahead), 2) if days_ahead > 0 else 0,
            "weekly_projection": round(float((forecast / days_ahead) * 7), 2) if days_ahead > 0 else 0,
            "confidence": confidence,
            "trend": trend,
            "trend_percent": round(float(trend_percent), 1),
            "transactions_analyzed": len(transactions),
            "history_days": history_days,
            "projected_by_category": projected_by_category[:6],
            "top_risk_category": projected_by_category[0] if projected_by_category else None,
            "message": (
                "Prediction is based on your last 90 days of expenses. "
                "More transactions improve confidence."
            ),
        }
