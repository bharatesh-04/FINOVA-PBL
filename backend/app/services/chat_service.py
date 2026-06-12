"""Finance chat assistant service."""
from datetime import datetime, timedelta
from typing import Dict, List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models import Account, BillReceipt, Budget, Goal, Transaction
from app.services.analytics_service import AnalyticsService


class ChatService:
    """Generate finance-aware chat responses from a user's own data."""

    @staticmethod
    def generate_reply(db: Session, user_id: int, message: str) -> Dict:
        question = (message or "").strip()
        normalized = question.lower()

        if not question:
            return {
                "message": "Ask me about your spending, budgets, goals, accounts, bills, or savings plan.",
                "suggestions": ChatService._default_suggestions(),
            }

        context = ChatService._build_context(db, user_id)

        if ChatService._contains_any(normalized, ["budget", "limit", "overspend"]):
            answer = ChatService._budget_answer(context)
        elif ChatService._contains_any(normalized, ["goal", "target", "save for"]):
            answer = ChatService._goal_answer(context)
        elif ChatService._contains_any(normalized, ["bill", "receipt", "ocr", "upload"]):
            answer = ChatService._bill_answer(context)
        elif ChatService._contains_any(normalized, ["account", "balance", "net worth", "wallet"]):
            answer = ChatService._account_answer(context)
        elif ChatService._contains_any(normalized, ["income", "earn", "salary"]):
            answer = ChatService._income_answer(context)
        elif ChatService._contains_any(normalized, ["expense", "spend", "spent", "cost"]):
            answer = ChatService._expense_answer(context)
        elif ChatService._contains_any(normalized, ["saving", "savings", "invest", "advice", "tip"]):
            answer = ChatService._savings_answer(context)
        elif ChatService._contains_any(normalized, ["forecast", "predict", "next month", "future"]):
            answer = ChatService._forecast_answer(db, user_id)
        else:
            answer = ChatService._overview_answer(context)

        return {
            "message": answer,
            "suggestions": ChatService._suggestions_for_question(normalized),
            "snapshot": {
                "month": context["month"],
                "income": context["summary"]["income"],
                "expense": context["summary"]["expense"],
                "net": context["summary"]["net"],
                "savings_rate": context["summary"]["savings_rate"],
            },
        }

    @staticmethod
    def _build_context(db: Session, user_id: int) -> Dict:
        month = datetime.utcnow().strftime("%Y-%m")
        summary = AnalyticsService.get_dashboard_summary(db, user_id, month)
        budgets = AnalyticsService.get_budget_status(db, user_id, month)
        accounts = db.query(Account).filter(
            and_(Account.user_id == user_id, Account.is_active == True)
        ).all()
        goals = db.query(Goal).filter(
            and_(Goal.user_id == user_id, Goal.status == "active")
        ).order_by(Goal.priority.desc(), Goal.deadline.asc()).all()
        pending_bills = db.query(BillReceipt).filter(
            and_(
                BillReceipt.user_id == user_id,
                BillReceipt.processing_status != "completed",
            )
        ).count()
        recent_since = datetime.utcnow() - timedelta(days=30)
        recent_transactions = db.query(Transaction).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.date >= recent_since,
            )
        ).order_by(Transaction.date.desc()).limit(8).all()

        return {
            "month": month,
            "summary": summary,
            "budgets": budgets,
            "accounts": accounts,
            "goals": goals,
            "pending_bills": pending_bills,
            "recent_transactions": recent_transactions,
        }

    @staticmethod
    def _overview_answer(context: Dict) -> str:
        summary = context["summary"]
        top_category = ChatService._top_category(summary["category_breakdown"])
        parts = [
            f"For {context['month']}, your income is {ChatService._money(summary['income'])}, expenses are {ChatService._money(summary['expense'])}, and net cash flow is {ChatService._money(summary['net'])}.",
            f"Your savings rate is {summary['savings_rate']:.1f}%.",
        ]
        if top_category:
            parts.append(f"Your biggest spending category is {top_category[0]} at {ChatService._money(top_category[1])}.")
        if summary["transaction_count"] == 0:
            parts.append("I do not see transactions for this month yet, so add a few expenses or income entries for better advice.")
        return " ".join(parts)

    @staticmethod
    def _budget_answer(context: Dict) -> str:
        budgets = context["budgets"]
        if not budgets:
            return "You do not have active budgets for this month yet. Create budgets for your top expense categories, then I can track remaining money and alert you when spending gets close to the limit."

        highest = max(budgets, key=lambda item: item.get("percentage", 0))
        remaining = highest.get("remaining", 0)
        status = "over budget" if remaining < 0 else "closest to the limit"
        return (
            f"Your {highest['category']} budget is {status}: "
            f"{ChatService._money(highest['spent'])} spent out of {ChatService._money(highest['limit'])} "
            f"({highest['percentage']:.1f}%). Remaining: {ChatService._money(remaining)}."
        )

    @staticmethod
    def _goal_answer(context: Dict) -> str:
        goals = context["goals"]
        if not goals:
            return "You do not have active goals yet. Add a goal with a target amount and deadline, then I can tell you how much to save each month."

        goal = min(goals, key=lambda item: (item.deadline or datetime.max))
        remaining = max(goal.target_amount - goal.current_amount, 0)
        progress = (goal.current_amount / goal.target_amount * 100) if goal.target_amount else 0
        deadline_text = f" Deadline: {goal.deadline.strftime('%d %b %Y')}." if goal.deadline else ""
        return (
            f"Your priority goal is {goal.name}. You have saved {ChatService._money(goal.current_amount)} "
            f"of {ChatService._money(goal.target_amount)} ({progress:.1f}%). "
            f"Remaining: {ChatService._money(remaining)}.{deadline_text}"
        )

    @staticmethod
    def _bill_answer(context: Dict) -> str:
        pending = context["pending_bills"]
        if pending:
            return f"You have {pending} bill or receipt item waiting for processing or verification. Open Bills to review extracted merchant, amount, and date details."
        return "All uploaded bills look processed. You can upload a new receipt from the Bills page and I will include it in your finance picture after verification."

    @staticmethod
    def _account_answer(context: Dict) -> str:
        accounts = context["accounts"]
        if not accounts:
            return "No active accounts are connected yet. Add a cash, bank, UPI, or card account so balances and net worth can be tracked."

        total = sum(account.balance for account in accounts)
        largest = max(accounts, key=lambda account: account.balance)
        return (
            f"Your total active account balance is {ChatService._money(total)} across {len(accounts)} account(s). "
            f"The largest balance is {largest.name} with {ChatService._money(largest.balance)}."
        )

    @staticmethod
    def _income_answer(context: Dict) -> str:
        summary = context["summary"]
        return (
            f"Income for {context['month']} is {ChatService._money(summary['income'])}. "
            f"After expenses, your net cash flow is {ChatService._money(summary['net'])}."
        )

    @staticmethod
    def _expense_answer(context: Dict) -> str:
        summary = context["summary"]
        top_category = ChatService._top_category(summary["category_breakdown"])
        if not top_category:
            return "I do not see expense transactions for this month yet. Add expenses with categories to unlock spending breakdowns."

        return (
            f"You have spent {ChatService._money(summary['expense'])} this month. "
            f"The largest category is {top_category[0]} at {ChatService._money(top_category[1])}."
        )

    @staticmethod
    def _savings_answer(context: Dict) -> str:
        summary = context["summary"]
        rate = summary["savings_rate"]
        if summary["income"] <= 0:
            return "Add this month's income first, then I can calculate a savings rate and suggest a realistic target."
        if rate < 10:
            return f"Your savings rate is {rate:.1f}%. Start with one small target: reduce the biggest expense category by 10% this month."
        if rate < 25:
            return f"Your savings rate is {rate:.1f}%. Nice base. Try automating a fixed transfer to your highest-priority goal after income arrives."
        return f"Your savings rate is {rate:.1f}%. Strong work. Consider increasing goal contributions or building a separate emergency fund."

    @staticmethod
    def _forecast_answer(db: Session, user_id: int) -> str:
        forecast = AnalyticsService.forecast_expenses(db, user_id, 30)
        amount = forecast.get("forecast", 0)
        daily = forecast.get("daily_average", 0)
        if amount <= 0:
            return "I need more recent expense history before I can forecast next month's spending."
        return f"Based on recent expenses, the next 30 days may cost about {ChatService._money(amount)}, around {ChatService._money(daily)} per day."

    @staticmethod
    def _top_category(category_breakdown: Dict[str, float]):
        if not category_breakdown:
            return None
        return max(category_breakdown.items(), key=lambda item: item[1])

    @staticmethod
    def _suggestions_for_question(normalized: str) -> List[str]:
        if ChatService._contains_any(normalized, ["budget", "limit"]):
            return ["Where am I overspending?", "How can I save more?", "Show account balance"]
        if ChatService._contains_any(normalized, ["goal", "target"]):
            return ["What is my savings rate?", "Show my budget status", "Forecast expenses"]
        return ChatService._default_suggestions()

    @staticmethod
    def _default_suggestions() -> List[str]:
        return [
            "How am I doing this month?",
            "Where am I spending the most?",
            "Show my budget status",
            "Forecast expenses",
        ]

    @staticmethod
    def _contains_any(text: str, terms: List[str]) -> bool:
        return any(term in text for term in terms)

    @staticmethod
    def _money(value: float) -> str:
        return f"INR {float(value or 0):,.2f}"
