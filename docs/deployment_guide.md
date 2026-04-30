# Deployment Guide

## Deployment Platforms

### Option 1: Render.com (Recommended)

#### Backend Deployment

1. **Create Render Account**: https://render.com

2. **Deploy FastAPI App**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `cd backend && uvicorn main:app --host 0.0.0.0`
   - Environment variables:
     ```
     DATABASE_URL=postgresql://...
     SECRET_KEY=<strong-secret>
     DEBUG=False
     ```

3. **Create PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Copy connection URL to DATABASE_URL

#### Frontend Deployment

1. **Deploy React App**:
   - Click "New +" → "Static Site"
   - Connect GitHub repository
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
   - Environment variables:
     ```
     REACT_APP_API_URL=https://your-backend.onrender.com/api
     ```

---

### Option 2: Railway.app

#### Backend
```bash
railway link
railway variables set DATABASE_URL=<postgresql-url>
railway variables set SECRET_KEY=<secret>
railway deploy
```

#### Frontend
```bash
railway service add
railway service select frontend
railway variables set REACT_APP_API_URL=https://your-backend.railway.app/api
railway deploy
```

---

### Option 3: Heroku

**Note**: Heroku free tier discontinued. Use paid plans.

```bash
heroku create finance-tracker
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

---

## Docker Deployment

### Build Docker Image
```bash
docker build -t finance-tracker:latest .
```

### Push to Docker Hub
```bash
docker tag finance-tracker:latest username/finance-tracker:latest
docker push username/finance-tracker:latest
```

### Deploy to Docker Hub Registry
```bash
# Pull on server
docker pull username/finance-tracker:latest

# Run
docker run -p 8000:8000 -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  username/finance-tracker:latest
```

---

## Environment Setup

### Production .env
```
# Database
DATABASE_URL=postgresql://user:password@host:5432/finance_tracker

# Security
SECRET_KEY=<generate-strong-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# App
DEBUG=False
APP_NAME=Finance Tracker
APP_VERSION=1.0.0

# CORS
CORS_ORIGINS=https://yourdomain.com

# File Upload
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760

# OCR
OCR_ENABLED=True
```

### Generate Strong Secret
```python
import secrets
secret = secrets.token_urlsafe(32)
print(secret)
```

---

## Database Migration

### From SQLite to PostgreSQL

1. **Export SQLite**:
```python
import sqlite3
conn = sqlite3.connect('finance_tracker.db')
cursor = conn.cursor()
# Dump data
```

2. **Import to PostgreSQL**:
```bash
psql -h host -U user -d finance_tracker < dump.sql
```

Or use automated migration tools.

---

## SSL/HTTPS Setup

### Using Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:8000;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## Monitoring & Logging

### Application Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Error Tracking (Sentry)
```bash
pip install sentry-sdk
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://your-sentry-dsn@sentry.io/...",
    traces_sample_rate=1.0
)
```

### Monitoring Tools
- Uptime Robot (uptime monitoring)
- DataDog (performance monitoring)
- New Relic (APM)
- Cloudflare (CDN & DDoS protection)

---

## Performance Optimization

### Frontend
```javascript
// Production build
npm run build

// Minification enabled by default
// Code splitting with React.lazy()
```

### Backend
```python
# Use gunicorn for production
gunicorn -w 4 -b 0.0.0.0:8000 main:app

# Enable caching
from fastapi_cache2 import FastAPICache2

# Database connection pooling
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=0
```

### Database
```sql
-- Create indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_users_email ON users(email);

-- Query optimization
ANALYZE transactions;
VACUUM ANALYZE transactions;
```

---

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/finance-tracker"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/uploads/

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Cloud Backup
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- DigitalOcean Spaces

---

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Render
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }} -X POST
```

---

## Scaling Considerations

### Horizontal Scaling
- Load balancer (Nginx, HAProxy)
- Multiple app instances
- Shared database (PostgreSQL)
- Redis for caching

### Vertical Scaling
- Increase server resources
- Database optimization
- Query optimization

---

## Security Checklist

- ✅ Use HTTPS/SSL
- ✅ Environment variables for secrets
- ✅ Database backups
- ✅ WAF (Web Application Firewall)
- ✅ Rate limiting
- ✅ API key rotation
- ✅ Security headers
- ✅ Regular updates
- ✅ Database encryption
- ✅ Audit logging

---

## Troubleshooting Deployment

### 502 Bad Gateway
- Check backend is running
- Verify database connection
- Check logs: `docker logs <container>`

### CORS Errors
- Update CORS_ORIGINS in .env
- Verify frontend URL matches

### Database Connection Issues
- Test connection: `psql -c "SELECT 1"`
- Check credentials
- Verify network access

### Out of Memory
- Increase server RAM
- Optimize queries
- Implement caching

---

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
