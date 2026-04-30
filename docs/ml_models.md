# ML Models Documentation

## 1. Category Classifier

### Algorithm
Multinomial Naive Bayes with TF-IDF Vectorization

### Purpose
Automatically categorize transactions based on description and merchant name

### Input
- Transaction description (e.g., "lunch at mcd")
- Merchant name (e.g., "McDonald's")

### Output
- Predicted category (e.g., "Food")
- Confidence score (0-1)

### Training
```python
from app.ml import category_classifier

# Train on user data
training_data = [
    ("McDonald's lunch", "Food"),
    ("Uber ride home", "Travel"),
    ("Netflix subscription", "Entertainment"),
]

category_classifier.train(training_data)
```

### Usage
```python
category, confidence = category_classifier.predict(
    description="lunch at mcd",
    merchant="McDonald's"
)
# Returns: ("Food", 0.95)
```

### Default Categories
- Food
- Travel
- Entertainment
- Shopping
- Health
- Education
- Utilities
- Income
- Other

### Accuracy Improvement
- More training data improves accuracy
- Regularly retrain on user data
- Confidence score indicates model uncertainty

---

## 2. Anomaly Detector

### Algorithm
Hybrid approach:
- Isolation Forest (ML-based)
- 3-Sigma Rule (Statistical)

### Purpose
Detect unusual spending patterns and alert user

### Input
- Current transaction amount
- Historical similar transactions (last 90 days)

### Output
- Anomaly flag (True/False)
- Anomaly score (0-1, where 1 = most anomalous)

### Training
```python
from app.ml import anomaly_detector

# Train on historical data
historical_amounts = [100, 120, 110, 105, 95, 115, 108, ...]
anomaly_detector.train(historical_amounts)
```

### Usage
```python
is_anomaly, score = anomaly_detector.detect(
    amount=500.00,  # Current transaction
    context_amounts=[100, 120, 110, 105]  # Similar past transactions
)
# Returns: (True, 0.85)  # 85% likely to be anomalous
```

### Interpretation
- **Score 0-0.3**: Normal spending
- **Score 0.3-0.6**: Slightly unusual
- **Score 0.6-0.8**: Unusual (alert user)
- **Score 0.8-1.0**: Highly unusual (strong alert)

### Customization
Adjust 3-sigma threshold or contamination parameter for sensitivity

---

## 3. Expense Predictor

### Algorithm
Linear Regression with time-series data

### Purpose
Forecast expenses for next period

### Input
- Historical daily/monthly spending
- Days ahead to predict

### Output
- Predicted total expenses
- Daily average
- Trend (increasing/decreasing/stable)

### Training
```python
from app.ml import expense_predictor

# Train on historical data
historical_data = [
    {"date": "2024-01-01", "amount": 50.00},
    {"date": "2024-01-02", "amount": 45.00},
    {"date": "2024-01-03", "amount": 55.00},
    ...
]

expense_predictor.train(historical_data)
```

### Usage
```python
# Forecast next 30 days
forecast = expense_predictor.predict_next_month(
    historical_data,
    days_ahead=30
)
# Returns: 1500.00  # Predicted total for 30 days

# Get trend
trend = expense_predictor.get_trend(historical_data)
# Returns: "increasing" or "decreasing" or "stable"
```

### Accuracy
- Requires minimum 3 historical records
- More data = better predictions
- Works best with consistent spending patterns
- Less accurate for irregular expenses

---

## Model Management

### Saving Models
```python
import pickle

# Models are auto-saved to ml_models/ directory
# category_model.pkl
# vectorizer.pkl
```

### Retraining
```python
# Automatically triggered when:
# 1. New user data is available
# 2. Model file not found
# 3. Manual retraining requested

# Manual retrain:
category_classifier.train(new_data)
anomaly_detector.train(amounts)
expense_predictor.train(historical)
```

### Performance Monitoring
Monitor model performance through:
- Prediction accuracy on test set
- User feedback on predictions
- Confidence scores distribution
- Anomaly detection true positive rate

---

## Customization

### Adjust Model Parameters

#### Category Classifier
```python
# Increase max_features for better granularity
vectorizer = TfidfVectorizer(max_features=300)

# Use different classifier
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100)
```

#### Anomaly Detector
```python
# Adjust contamination percentage
model = IsolationForest(contamination=0.05)  # 5% expected anomalies

# Adjust 3-sigma threshold
z_score > 2  # More sensitive
z_score > 4  # Less sensitive
```

#### Expense Predictor
```python
# Use polynomial regression for better fit
from sklearn.preprocessing import PolynomialFeatures
poly = PolynomialFeatures(degree=2)

# Use more advanced time-series model
from statsmodels.tsa.arima.model import ARIMA
```

---

## Integration with Frontend

### Model Predictions
```javascript
// Frontend receives:
{
  "category": "Food",
  "ai_category_confidence": 0.95,
  "is_anomaly": true,
  "anomaly_score": 0.85
}
```

### User Feedback Loop
```
1. User sees ML prediction
2. User confirms or corrects
3. Feedback sent to backend
4. Model retrains with new data
5. Future predictions improve
```

---

## Best Practices

1. **Data Quality**: More and better labeled data improves predictions
2. **Regular Retraining**: Retrain models monthly or when new patterns emerge
3. **Feature Engineering**: Include merchant, time, category, amount
4. **Threshold Tuning**: Adjust alerts based on user tolerance
5. **Monitoring**: Track prediction accuracy and adjust models

---

## Limitations

- **Cold Start**: Limited predictions for new users
- **Pattern Changes**: Models may not adapt quickly to major spending changes
- **Seasonal Effects**: Need historical data covering different seasons
- **External Factors**: Market events not considered in predictions

---

## Future Enhancements

1. LSTM/RNN for better time-series forecasting
2. Multi-class anomaly detection by category
3. User cohort analysis for benchmarking
4. Custom model per user for personalization
5. Ensemble methods combining multiple models
