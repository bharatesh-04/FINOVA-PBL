# AI-Powered Personal Finance Tracker & Analyzer

A complete, production-ready web application for managing personal finances with AI-powered features including expense categorization, anomaly detection, predictive analytics, and OCR-based bill scanning.

## 🚀 Features

### Core Features
- **Authentication**: JWT-based secure login/signup with password hashing
- **Multi-Account Support**: Manage multiple accounts (bank, cash, UPI, credit cards)
- **Transaction Management**: Add, edit, delete, and filter transactions
- **Category Management**: Custom + default categories with icons and colors
- **Smart Dashboard**: Real-time summary with charts and insights

### 🔥 AI & Automation Features
- **📸 OCR Bill/Receipt Scanning**: Extract merchant, amount, and date from images/PDFs
- **🧠 AI Expense Categorization**: Automatic ML-based category prediction
- **📊 Predictive Analytics**: Forecast next month expenses using regression models
- **🚨 Anomaly Detection**: Alert on unusual spending patterns (3σ rule)
- **💡 Smart Insights**: Auto-generated financial insights and recommendations

### 💼 Advanced Features
- **Budget Planning**: Set budgets per category with alerts at thresholds
- **Financial Goals**: Track progress towards savings goals
- **Recurring Transactions**: Auto-add salary, rent, subscriptions
- **Advanced Search & Filters**: Filter by date, category, merchant, account
- **Export & Reports**: Export transactions to CSV/PDF
- **Net Worth Tracking**: Monitor total assets across accounts
- **Dark Mode**: Complete dark mode support
- **Mobile Responsive**: Works on all devices

## 📦 Tech Stack

- **Backend**: FastAPI (Python) with SQLAlchemy ORM
- **Frontend**: React 18 with Tailwind CSS
- **Database**: SQLite (local) / PostgreSQL (production)
- **AI/ML**: scikit-learn, pandas, numpy
- **OCR**: Tesseract / pytesseract
- **Authentication**: JWT with bcrypt
- **Charts**: Recharts
- **API Documentation**: Swagger/OpenAPI

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- Git

### Backend Setup

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize database**
```bash
python -c "from app.database import init_db; init_db()"
```

6. **Run backend server**
```bash
python main.py
# Or using uvicorn:
uvicorn main:app --reload --port 8000
```

Backend API will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

4. **Start development server**
```bash
npm start
```

Frontend will open at: `http://localhost:3000`

## 📊 Database Schema

### Tables
- **users**: User accounts and profiles
- **accounts**: Multi-account support (bank, cash, etc.)
- **transactions**: All income/expense transactions
- **categories**: Transaction categories
- **budgets**: Monthly budget limits
- **goals**: Financial goals tracking
- **recurring_transactions**: Auto-repeating transactions
- **bill_receipts**: OCR-processed receipts

See [docs/database_schema.md](docs/database_schema.md) for detailed schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Transactions
- `GET/POST /api/transactions` - List/Create transactions
- `PUT/DELETE /api/transactions/{id}` - Update/Delete

### Accounts
- `GET/POST /api/accounts` - List/Create accounts
- `PUT/DELETE /api/accounts/{id}` - Update/Delete

### Categories
- `GET/POST /api/categories` - List/Create categories
- `POST /api/categories/init-defaults` - Initialize default categories

### Analytics
- `GET /api/analytics/dashboard/summary` - Dashboard summary
- `GET /api/analytics/anomalies` - Spending anomalies
- `GET /api/analytics/insights` - AI insights
- `GET /api/analytics/forecast` - Expense forecast

### Bills & Receipts
- `POST /api/bills/upload` - Upload receipt for OCR
- `GET /api/bills` - List all receipts
- `PUT/DELETE /api/bills/{id}` - Update/Delete receipts

See [docs/api_documentation.md](docs/api_documentation.md) for complete API reference.

## 🧠 ML Models

### 1. Category Classifier
- **Algorithm**: Multinomial Naive Bayes with TF-IDF vectorization
- **Input**: Transaction description + merchant name
- **Output**: Predicted category + confidence score
- **Training**: Auto-trained on user data

### 2. Anomaly Detector
- **Algorithm**: Isolation Forest + Statistical (3-sigma rule)
- **Input**: Transaction amount + historical context
- **Output**: Anomaly flag + anomaly score (0-1)

### 3. Expense Predictor
- **Algorithm**: Linear Regression
- **Input**: Historical daily/monthly spending
- **Output**: Next month forecast + trend (increasing/decreasing/stable)

Models are trained on user data and continuously improved.

## 📸 OCR Features

### Supported Formats
- Images: JPG, JPEG, PNG
- Documents: PDF

### Extraction
- Merchant name
- Transaction amount
- Transaction date
- Raw text

### Confidence Score
- Based on text extraction quality
- Range: 0-1 (higher = better)

## 🐳 Docker Setup

### Build and Run with Docker

```bash
# Build image
docker build -t finance-tracker .

# Run container
docker run -p 8000:8000 -p 3000:3000 finance-tracker
```

See [Dockerfile](Dockerfile) for details.

## 📈 Deployment

### Render.com Deployment

1. **Backend**: Deploy FastAPI app to Render
2. **Frontend**: Deploy React app to Render/Vercel
3. **Database**: Use Render PostgreSQL

See [docs/deployment_guide.md](docs/deployment_guide.md) for detailed steps.

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ SQL injection prevention (SQLAlchemy)
- ✅ XSS protection with React
- ✅ CORS configuration
- ✅ Secure file upload handling
- ✅ User-specific data isolation

## 📝 Sample Data

Run the seed script to populate sample data:

```bash
python scripts/seed_data.py
```

## 🧪 Testing

```bash
# Backend tests
pytest

# Frontend tests
npm test
```

## 🐛 Troubleshooting

### OCR Not Working
- Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
- On Windows, update TESSERACT_PATH in .env

### Database Errors
- Delete `finance_tracker.db` and restart
- Or run migrations for PostgreSQL

### Frontend Not Connecting
- Verify backend is running on port 8000
- Check REACT_APP_API_URL in .env
- Check browser console for CORS errors

## 📚 Documentation

- [Database Schema](docs/database_schema.md)
- [API Documentation](docs/api_documentation.md)
- [Deployment Guide](docs/deployment_guide.md)
- [ML Models Guide](docs/ml_models.md)

## 🤝 Contributing

Contributions are welcome! Please:
1. Create a feature branch
2. Commit your changes
3. Push to branch
4. Create Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Authors

Built as a production-ready finance management application.

## 🙏 Support

For issues and questions:
- Check documentation first
- Review existing issues
- Create new issue with details

---

**Built with ❤️ for better financial management**
