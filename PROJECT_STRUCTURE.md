# Project Structure

```
PBL-PYTHON/
├── backend/
│   ├── app/
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── account.py
│   │   │   ├── transaction.py
│   │   │   ├── category.py
│   │   │   ├── budget.py
│   │   │   ├── goal.py
│   │   │   ├── recurring.py
│   │   │   ├── bill_receipt.py
│   │   │   └── __init__.py
│   │   ├── schemas/             # Pydantic validation schemas
│   │   │   ├── user.py
│   │   │   ├── account.py
│   │   │   ├── transaction.py
│   │   │   ├── category.py
│   │   │   ├── budget.py
│   │   │   ├── goal.py
│   │   │   ├── recurring.py
│   │   │   ├── bill_receipt.py
│   │   │   └── __init__.py
│   │   ├── routes/              # FastAPI route handlers
│   │   │   ├── auth_routes.py
│   │   │   ├── transaction_routes.py
│   │   │   ├── account_routes.py
│   │   │   ├── category_routes.py
│   │   │   ├── budget_routes.py
│   │   │   ├── goal_routes.py
│   │   │   ├── recurring_routes.py
│   │   │   ├── analytics_routes.py
│   │   │   ├── bill_routes.py
│   │   │   └── __init__.py
│   │   ├── services/            # Business logic
│   │   │   ├── user_service.py
│   │   │   ├── transaction_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── bill_service.py
│   │   │   └── __init__.py
│   │   ├── utils/               # Utilities
│   │   │   ├── auth.py          # JWT, password hashing
│   │   │   ├── ocr.py           # OCR processing
│   │   │   ├── file_handler.py  # File upload handling
│   │   │   └── __init__.py
│   │   ├── ml/                  # Machine Learning models
│   │   │   ├── models.py        # Classifier, detector, predictor
│   │   │   └── __init__.py
│   │   ├── database.py          # Database connection and init
│   │   └── __init__.py
│   ├── main.py                  # FastAPI application entry
│   ├── config.py                # Configuration settings
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   └── finance_tracker.db        # SQLite database (local)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   └── Navigation.js
│   │   ├── pages/               # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── SignupPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── TransactionsPage.js
│   │   │   ├── AccountsPage.js
│   │   │   ├── BudgetsPage.js
│   │   │   ├── GoalsPage.js
│   │   │   ├── AnalyticsPage.js
│   │   │   └── BillsPage.js
│   │   ├── services/            # API service layer
│   │   │   └── api.js
│   │   ├── context/             # State management
│   │   │   └── store.js
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── useAuth.js
│   │   ├── utils/               # Utility functions
│   │   │   └── helpers.js
│   │   ├── App.js               # Main app component
│   │   ├── index.js             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Node dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│   └── .gitignore
│
├── ml_models/
│   ├── category_model.pkl       # Trained classifier
│   ├── vectorizer.pkl           # TF-IDF vectorizer
│   └── README.md                # ML documentation
│
├── database/
│   └── [database files]
│
├── uploads/
│   ├── receipts/                # Uploaded receipts
│   └── [organized by user_id]
│
├── docs/
│   ├── database_schema.md       # Database design documentation
│   ├── api_documentation.md     # Complete API reference
│   ├── ml_models.md             # ML models guide
│   └── deployment_guide.md      # Deployment instructions
│
├── scripts/
│   └── seed_data.py             # Populate sample data
│
├── README.md                     # Project documentation
├── QUICKSTART.md                # Quick start guide
├── Dockerfile                    # Docker image config
├── docker-compose.yml           # Docker Compose setup
└── .gitignore                   # Git ignore patterns
```

## File Organization

### Backend (/backend)
- **main.py**: FastAPI app initialization
- **config.py**: Settings and environment variables
- **requirements.txt**: All Python dependencies
- **app/models**: Database ORM models
- **app/schemas**: Request/response validation
- **app/routes**: API endpoints
- **app/services**: Business logic layer
- **app/utils**: Authentication, OCR, file handling
- **app/ml**: Machine learning models

### Frontend (/frontend)
- **src/pages**: Full-page components
- **src/components**: Reusable UI components
- **src/services**: API integration layer
- **src/context**: Global state (Zustand)
- **src/hooks**: Custom React hooks
- **src/utils**: Helper functions

### Documentation (/docs)
- **database_schema.md**: Table definitions and relationships
- **api_documentation.md**: All API endpoints with examples
- **ml_models.md**: ML algorithms and training guide
- **deployment_guide.md**: Production deployment steps

### Scripts (/scripts)
- **seed_data.py**: Generate sample data for testing

## Key Files

| File | Purpose |
|------|---------|
| main.py | FastAPI application entry point |
| config.py | Environment and settings management |
| database.py | Database connection and session management |
| auth.py | JWT tokens, password hashing, authentication |
| ocr.py | OCR processing for receipts |
| models.py | ML classifiers, detectors, predictors |
| App.js | React main component and routing |
| api.js | API client and endpoints |
| store.js | Global state management |
| helpers.js | Utility functions for frontend |

## Dependencies Summary

### Backend
- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **Pydantic**: Data validation
- **python-jose**: JWT handling
- **passlib**: Password hashing
- **pytesseract**: OCR integration
- **scikit-learn**: ML models
- **pandas**: Data manipulation
- **numpy**: Numerical computing

### Frontend
- **React**: UI framework
- **React Router**: Navigation
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Zustand**: State management
- **react-hot-toast**: Notifications

## Environment Files

### .env (Backend)
```
DATABASE_URL=sqlite:///./finance_tracker.db
SECRET_KEY=your-secret-key-min-32-chars
DEBUG=True
```

### .env (Frontend)
```
REACT_APP_API_URL=http://localhost:8000/api
```

## Database

- **SQLite**: Local development (finance_tracker.db)
- **PostgreSQL**: Production recommended
- 8 tables with proper relationships and indexes
- Automatic migrations on app start

## API

- **Base URL**: http://localhost:8000
- **Prefix**: /api/v1 (for future versioning)
- **Authentication**: Bearer JWT tokens
- **Documentation**: http://localhost:8000/docs

---

For more details, see individual README files in each directory.
