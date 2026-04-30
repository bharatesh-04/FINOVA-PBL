# Quick Start Guide

## 5-Minute Setup (Local Development)

### Step 1: Backend Setup (2 min)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
✅ Backend runs on http://localhost:8000

### Step 2: Frontend Setup (2 min)
```bash
cd frontend
npm install
npm start
```
✅ Frontend opens on http://localhost:3000

### Step 3: Test Login (1 min)
1. Navigate to http://localhost:3000
2. Click "Sign up" or use demo account:
   - Email: demo@example.com
   - Password: demo123456
3. You're in! 🎉

---

## Common Tasks

### Add a Transaction
1. Navigate to "Transactions" page
2. Click "+ Add Transaction"
3. Fill form and submit
4. Watch AI auto-categorize and detect anomalies!

### Check Dashboard
- Income vs Expense summary
- Spending by category (pie chart)
- AI-generated insights
- Anomaly alerts

### Upload a Receipt (OCR)
1. Go to "Bills & Receipts"
2. Upload image or PDF
3. AI extracts merchant, amount, date
4. Create transaction from extracted data

### View Analytics
1. Navigate to "Analytics"
2. See trends, forecasts, budget status
3. Get recommendations from ML models

---

## Development Tips

### Database
```bash
# View SQLite database
sqlite3 finance_tracker.db

# Reset database
rm finance_tracker.db
python -c "from app.database import init_db; init_db()"

# Seed sample data
python scripts/seed_data.py
```

### API Testing
```bash
# View Swagger docs
http://localhost:8000/docs

# Test with curl
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"test","password":"test1234"}'
```

### Frontend Debug
```javascript
// Check auth state
console.log(localStorage.getItem('token'))

// View API calls (DevTools → Network)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | `lsof -i :8000` then kill process |
| Port 3000 already in use | `lsof -i :3000` then kill process |
| OCR not working | Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki |
| CORS errors | Check frontend URL in backend CORS_ORIGINS |
| Database locked | Delete database file and reinit |
| Module not found | Ensure virtual environment is activated |

---

## Next Steps

1. **Customize categories** - Add your own categories
2. **Set budgets** - Define monthly spending limits
3. **Create goals** - Track savings goals
4. **Upload receipts** - Let OCR auto-categorize
5. **Monitor analytics** - Track spending trends

---

## Production Deployment

See [deployment_guide.md](docs/deployment_guide.md) for:
- Render.com deployment
- Docker setup
- PostgreSQL setup
- SSL/HTTPS configuration

---

## Support

- 📖 Check [README.md](README.md) for full documentation
- 📚 API docs at http://localhost:8000/docs
- 🐛 Check existing issues or create new one

Happy tracking! 💰
