"""Machine Learning models and services"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from config import settings

class CategoryClassifier:
    """ML model for automatic expense categorization"""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize category classifier"""
        self.model_path = model_path or os.path.join(settings.MODEL_PATH, "category_model.pkl")
        self.vectorizer_path = os.path.join(settings.MODEL_PATH, "vectorizer.pkl")
        
        self.model = None
        self.vectorizer = None
        self.category_map = {}
        
        self.load_model()
    
    def load_model(self):
        """Load saved model and vectorizer"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.vectorizer_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.vectorizer_path, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                print("Model loaded successfully")
            else:
                print("Model files not found, using default model")
                self._create_default_model()
        except Exception as e:
            print(f"Error loading model: {e}")
            self._create_default_model()
    
    def _create_default_model(self):
        """Create a default model for demo purposes"""
        # Sample training data
        descriptions = [
            "McDonald's", "KFC", "Swiggy", "Zomato", "Restaurant",
            "Uber", "OLA", "Taxi", "Flight", "Train",
            "Netflix", "Spotify", "Gym", "Movie",
            "Amazon", "Flipkart", "Shopping", "Clothes",
            "Salary", "Income", "Bonus", "Freelance"
        ]
        categories = [
            "Food", "Food", "Food", "Food", "Food",
            "Travel", "Travel", "Travel", "Travel", "Travel",
            "Entertainment", "Entertainment", "Health", "Entertainment",
            "Shopping", "Shopping", "Shopping", "Shopping",
            "Income", "Income", "Income", "Income"
        ]
        
        self.category_map = {
            "Food": 0,
            "Travel": 1,
            "Entertainment": 2,
            "Shopping": 3,
            "Income": 4,
            "Utilities": 5,
            "Health": 6,
            "Education": 7,
            "Other": 8
        }
        
        self.vectorizer = TfidfVectorizer(max_features=100)
        X = self.vectorizer.fit_transform(descriptions)
        y = [self.category_map[cat] for cat in categories]
        
        self.model = MultinomialNB()
        self.model.fit(X, y)
    
    def predict(self, description: str, merchant: str = "") -> Tuple[str, float]:
        """
        Predict category for transaction
        Returns: (category_name, confidence)
        """
        if not self.model or not self.vectorizer:
            return "Other", 0.5
        
        # Combine description and merchant
        text = f"{description} {merchant}".strip().lower()
        
        try:
            X = self.vectorizer.transform([text])
            category_idx = self.model.predict(X)[0]
            confidence = max(self.model.predict_proba(X)[0])
            
            # Reverse lookup category
            category_name = [k for k, v in self.category_map.items() if v == category_idx][0]
            
            return category_name, float(confidence)
        except Exception as e:
            print(f"Prediction error: {e}")
            return "Other", 0.5
    
    def train(self, transactions_data: List[Tuple[str, str]]):
        """
        Train model on user data
        transactions_data: List of (description_text, category) tuples
        """
        descriptions = [desc for desc, _ in transactions_data]
        categories = [cat for _, cat in transactions_data]
        
        # Create category map
        unique_cats = list(set(categories))
        self.category_map = {cat: idx for idx, cat in enumerate(unique_cats)}
        
        # Train vectorizer and model
        self.vectorizer = TfidfVectorizer(max_features=200)
        X = self.vectorizer.fit_transform(descriptions)
        y = [self.category_map[cat] for cat in categories]
        
        self.model = MultinomialNB()
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(settings.MODEL_PATH, exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        with open(self.vectorizer_path, 'wb') as f:
            pickle.dump(self.vectorizer, f)

class AnomalyDetector:
    """Detect unusual spending patterns"""
    
    def __init__(self):
        """Initialize anomaly detector"""
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False
    
    def train(self, amounts: List[float], percentiles: bool = True):
        """
        Train anomaly detection model
        amounts: List of historical transaction amounts
        """
        if len(amounts) < 10:
            self.is_trained = False
            return
        
        X = np.array(amounts).reshape(-1, 1)
        self.model.fit(X)
        self.is_trained = True
    
    def detect(self, amount: float, context_amounts: List[float]) -> Tuple[bool, float]:
        """
        Detect if amount is anomalous
        Returns: (is_anomaly, anomaly_score)
        """
        if not self.is_trained or len(context_amounts) < 5:
            # Fallback: use statistical approach
            mean = np.mean(context_amounts)
            std = np.std(context_amounts)
            
            if std == 0:
                return False, 0.0
            
            z_score = abs((amount - mean) / std)
            is_anomaly = z_score > 3  # 3 sigma rule
            
            return is_anomaly, min(z_score / 4, 1.0)
        
        # Use trained model
        X = np.array([[amount]])
        prediction = self.model.predict(X)[0]
        anomaly_score = abs(self.model.score_samples(X)[0])
        
        is_anomaly = prediction == -1
        
        return is_anomaly, min(anomaly_score, 1.0)

class ExpensePredictor:
    """Predict future expenses using time series forecasting"""
    
    def __init__(self):
        """Initialize expense predictor"""
        self.model = LinearRegression()
        self.is_trained = False
    
    def train(self, historical_data: List[Dict]):
        """
        Train predictor on historical data
        historical_data: List of dicts with 'date' and 'amount' keys
        """
        if len(historical_data) < 3:
            self.is_trained = False
            return
        
        # Convert to time-series format
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create features (days since start)
        df['days'] = (df['date'] - df['date'].min()).dt.days.values
        
        X = df['days'].values.reshape(-1, 1)
        y = df['amount'].values
        
        self.model.fit(X, y)
        self.is_trained = True
    
    def predict_next_month(
        self,
        historical_data: List[Dict],
        days_ahead: int = 30
    ) -> float:
        """Predict total expenses for next period"""
        if not self.is_trained or len(historical_data) < 3:
            # Return average of last 3 records
            if historical_data:
                amounts = [d.get('amount', 0) for d in historical_data[-3:]]
                return sum(amounts) / len(amounts) if amounts else 0
            return 0
        
        # Get latest day number
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df['days'] = (df['date'] - df['date'].min()).dt.days.values
        
        latest_day = df['days'].max()
        
        # Predict for next days_ahead days
        future_days = np.arange(latest_day + 1, latest_day + days_ahead + 1).reshape(-1, 1)
        predictions = self.model.predict(future_days)
        
        return float(np.sum(predictions))
    
    def get_trend(self, historical_data: List[Dict]) -> str:
        """
        Get spending trend
        Returns: 'increasing', 'decreasing', or 'stable'
        """
        if len(historical_data) < 2:
            return "stable"
        
        amounts = [d.get('amount', 0) for d in historical_data[-12:]]  # Last 12 months
        
        if len(amounts) < 2:
            return "stable"
        
        recent_avg = np.mean(amounts[-3:])
        older_avg = np.mean(amounts[:-3]) if len(amounts) > 3 else np.mean(amounts[:1])
        
        change_pct = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
        
        if change_pct > 5:
            return "increasing"
        elif change_pct < -5:
            return "decreasing"
        else:
            return "stable"

# Global ML instances
category_classifier = CategoryClassifier()
anomaly_detector = AnomalyDetector()
expense_predictor = ExpensePredictor()
