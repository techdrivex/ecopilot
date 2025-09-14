# EcoPilot Deployment Guide

This guide covers deploying EcoPilot to production environments using various platforms and methods.

## Overview

EcoPilot consists of three main components:
- **Backend API** (Node.js/Express)
- **Frontend Web App** (React)
- **Mobile App** (React Native)
- **Database** (MongoDB)
- **Cache** (Redis)

## Deployment Options

### 1. Docker Compose (Recommended for VPS)

### 2. Kubernetes (Recommended for Cloud)

### 3. Platform-as-a-Service (PaaS)

### 4. Serverless (AWS Lambda, Vercel, etc.)

## Docker Compose Deployment

### Prerequisites

- Docker and Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

### 1. Production Environment Setup

Create production environment file:

```bash
# .env.production
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/ecopilot
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-production-jwt-secret
FRONTEND_URL=https://ecopilot.com
API_URL=https://api.ecopilot.com
PORT=3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@ecopilot.com
EMAIL_PASS=your-app-password

# External APIs
OPENWEATHER_API_KEY=your-openweather-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Security
CORS_ORIGIN=https://ecopilot.com
HELMET_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000
```

### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d ecopilot.com -d api.ecopilot.com

# Copy certificates to deployment directory
sudo cp /etc/letsencrypt/live/ecopilot.com/fullchain.pem deployment/nginx/ssl/
sudo cp /etc/letsencrypt/live/ecopilot.com/privkey.pem deployment/nginx/ssl/
```

### 3. Nginx Configuration

Create `deployment/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # API Server
    server {
        listen 443 ssl http2;
        server_name api.ecopilot.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Web Application
    server {
        listen 443 ssl http2;
        server_name ecopilot.com www.ecopilot.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        location / {
            limit_req zone=web burst=50 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name ecopilot.com www.ecopilot.com api.ecopilot.com;
        return 301 https://$server_name$request_uri;
    }
}
```

### 4. Deploy with Docker Compose

```bash
# Clone repository
git clone https://github.com/techdrivex/ecopilot.git
cd ecopilot

# Set production environment
cp .env.production .env

# Build and start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Database Migration

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data
docker-compose exec backend npm run seed
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- kubectl configured
- Helm (optional)

### 1. Create Namespace

```bash
kubectl create namespace ecopilot
```

### 2. Deploy MongoDB

```yaml
# k8s/mongodb.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: ecopilot
spec:
  serviceName: mongodb
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: password
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: mongodb-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: ecopilot
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

### 3. Deploy Redis

```yaml
# k8s/redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ecopilot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7.2-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server", "--appendonly", "yes", "--requirepass", "redis123"]
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: ecopilot
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### 4. Deploy Backend

```yaml
# k8s/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: ecopilot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ecopilot/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          value: "mongodb://mongodb:27017/ecopilot"
        - name: REDIS_URL
          value: "redis://redis:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: ecopilot
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
```

### 5. Deploy Frontend

```yaml
# k8s/frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ecopilot
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ecopilot/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: REACT_APP_API_URL
          value: "https://api.ecopilot.com/api"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: ecopilot
spec:
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
```

### 6. Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecopilot-ingress
  namespace: ecopilot
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - ecopilot.com
    - api.ecopilot.com
    secretName: ecopilot-tls
  rules:
  - host: ecopilot.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
  - host: api.ecopilot.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
```

### 7. Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods -n ecopilot
kubectl get services -n ecopilot
kubectl get ingress -n ecopilot
```

## Platform-as-a-Service Deployment

### Heroku

#### 1. Backend Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create ecopilot-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secure-jwt-secret

# Deploy
git subtree push --prefix backend heroku main
```

#### 2. Frontend Deployment

```bash
# Create frontend app
heroku create ecopilot-web

# Set environment variables
heroku config:set REACT_APP_API_URL=https://ecopilot-api.herokuapp.com/api

# Deploy
git subtree push --prefix frontend heroku main
```

### Vercel

#### 1. Backend Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend
vercel --prod
```

#### 2. Frontend Deployment

```bash
# Deploy frontend
cd frontend
vercel --prod
```

### Railway

#### 1. Connect Repository

1. Go to [Railway](https://railway.app)
2. Connect your GitHub repository
3. Select the backend folder
4. Add environment variables
5. Deploy

#### 2. Database Setup

Railway provides managed MongoDB and Redis services.

## Mobile App Deployment

### iOS App Store

#### 1. Prepare for Production

```bash
cd mobile

# Install dependencies
npm install

# iOS setup
cd ios
pod install
cd ..
```

#### 2. Build for Production

```bash
# Build iOS app
npx react-native run-ios --configuration Release

# Build Android app
npx react-native run-android --variant=release
```

#### 3. App Store Submission

1. Open Xcode
2. Archive the app
3. Upload to App Store Connect
4. Submit for review

### Google Play Store

#### 1. Generate Signed APK

```bash
cd mobile/android
./gradlew assembleRelease
```

#### 2. Play Store Submission

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload APK/AAB
4. Fill store listing
5. Submit for review

## Monitoring and Maintenance

### 1. Health Checks

```bash
# Check API health
curl https://api.ecopilot.com/health

# Check database connection
curl https://api.ecopilot.com/health/db

# Check Redis connection
curl https://api.ecopilot.com/health/redis
```

### 2. Log Monitoring

```bash
# Docker logs
docker-compose logs -f backend

# Kubernetes logs
kubectl logs -f deployment/backend -n ecopilot

# Heroku logs
heroku logs --tail -a ecopilot-api
```

### 3. Performance Monitoring

Set up monitoring with:
- **Prometheus** + **Grafana**
- **New Relic**
- **DataDog**
- **AWS CloudWatch**

### 4. Backup Strategy

#### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/ecopilot" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/ecopilot" /backup/20240101/ecopilot
```

#### Automated Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="$MONGODB_URI" --out="/backup/$DATE"
tar -czf "/backup/$DATE.tar.gz" "/backup/$DATE"
rm -rf "/backup/$DATE"
```

## Security Considerations

### 1. Environment Variables

- Use strong, unique secrets
- Rotate secrets regularly
- Never commit secrets to version control

### 2. Database Security

- Enable authentication
- Use SSL/TLS connections
- Restrict network access
- Regular security updates

### 3. API Security

- Rate limiting
- Input validation
- CORS configuration
- Security headers

### 4. Infrastructure Security

- Firewall configuration
- SSL/TLS certificates
- Regular security updates
- Access control

## Scaling Considerations

### 1. Horizontal Scaling

- Load balancers
- Multiple backend instances
- Database clustering
- Redis clustering

### 2. Vertical Scaling

- Increase server resources
- Optimize database queries
- Cache frequently accessed data
- CDN for static assets

### 3. Performance Optimization

- Database indexing
- Query optimization
- Caching strategies
- Image optimization

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check MongoDB status
mongo --eval "db.adminCommand('ismaster')"

# Check Redis status
redis-cli ping
```

#### 2. Memory Issues

```bash
# Check memory usage
docker stats

# Kubernetes memory
kubectl top pods -n ecopilot
```

#### 3. SSL Certificate Issues

```bash
# Check certificate
openssl x509 -in /path/to/cert.pem -text -noout

# Renew certificate
certbot renew
```

## Cost Optimization

### 1. Resource Optimization

- Right-size instances
- Use spot instances for non-critical workloads
- Implement auto-scaling
- Monitor resource usage

### 2. Database Optimization

- Use appropriate instance sizes
- Implement connection pooling
- Optimize queries
- Use read replicas

### 3. CDN and Caching

- Use CDN for static assets
- Implement Redis caching
- Browser caching
- Image optimization

---

For more detailed information, refer to the specific platform documentation and the [API Documentation](API.md).