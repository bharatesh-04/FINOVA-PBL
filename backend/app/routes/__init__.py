"""Routes package"""
from .auth_routes import router as auth_router
from .transaction_routes import router as transaction_router
from .account_routes import router as account_router
from .category_routes import router as category_router
from .budget_routes import router as budget_router
from .goal_routes import router as goal_router
from .recurring_routes import router as recurring_router
from .analytics_routes import router as analytics_router
from .bill_routes import router as bill_router

__all__ = [
    "auth_router",
    "transaction_router",
    "account_router",
    "category_router",
    "budget_router",
    "goal_router",
    "recurring_router",
    "analytics_router",
    "bill_router"
]
