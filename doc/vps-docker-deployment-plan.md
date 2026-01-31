# LINE Members Card - VPS Docker Deployment Plan

## Overview

This document outlines how to deploy the LINE Members Card AWS SAM project to a VPS server using Docker Compose, replacing AWS-managed services with self-hosted alternatives.

---

## 1. Architecture Mapping: AWS to Docker

| AWS Service | Docker Replacement | Notes |
|-------------|-------------------|-------|
| **Lambda** | Flask/FastAPI Container | Python web server |
| **API Gateway** | Nginx Reverse Proxy | SSL termination + routing |
| **DynamoDB** | DynamoDB Local or MongoDB | Database |
| **S3 + CloudFront** | Nginx Static Files | Frontend hosting |
| **EventBridge** | Cron + Python Script | Scheduled token refresh |
| **CloudWatch** | Docker Logs + Loki (optional) | Logging |

---

## 2. Target Architecture

```
                    ┌─────────────────────────────┐
                    │         Internet            │
                    └──────────────┬──────────────┘
                                   │ HTTPS (443)
                    ┌──────────────▼──────────────┐
                    │    Nginx Reverse Proxy      │
                    │  - SSL/TLS termination      │
                    │  - Static file serving      │
                    │  - API routing              │
                    └───┬──────────────────┬──────┘
                        │                  │
        ┌───────────────▼───┐    ┌─────────▼─────────┐
        │ /api/* requests   │    │ /* static files   │
        │                   │    │                   │
        │  Flask/FastAPI    │    │  Frontend (LIFF)  │
        │  Container        │    │  /var/www/html    │
        │  :5000            │    │                   │
        └─────────┬─────────┘    └───────────────────┘
                  │
        ┌─────────▼─────────┐
        │   DynamoDB Local  │
        │   or MongoDB      │
        │   :8000 / :27017  │
        └───────────────────┘
```

---

## 3. Project Structure (Docker Version)

```
line-members-card-docker/
├── docker-compose.yml           # Main orchestration
├── .env                         # Environment variables
├── nginx/
│   ├── nginx.conf               # Nginx configuration
│   ├── ssl/                     # SSL certificates
│   │   ├── cert.pem
│   │   └── key.pem
│   └── html/                    # Frontend files (copied from front/)
│
├── backend/
│   ├── Dockerfile               # Python app container
│   ├── requirements.txt         # Python dependencies
│   ├── app/
│   │   ├── main.py              # Flask/FastAPI entry point
│   │   ├── members_card.py      # Converted Lambda handler
│   │   ├── send_message.py      # Message sending (unchanged)
│   │   └── config.py            # Configuration
│   ├── common/                  # Layer modules (copied)
│   ├── validation/              # Validation modules (copied)
│   └── members_card/            # Members card modules (copied)
│
├── batch/
│   ├── Dockerfile               # Batch job container
│   ├── update_token.py          # Token update script
│   └── crontab                  # Cron schedule
│
└── dynamodb/
    └── init-data/               # Initial data (products, etc.)
        ├── product_master_1.json
        └── product_master_2.json
```

---

## 4. Docker Compose Configuration

### 4.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy + Static Files
  nginx:
    image: nginx:alpine
    container_name: line-members-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/html:/var/www/html:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - line-members-network

  # Backend API (Flask/FastAPI)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: line-members-backend
    expose:
      - "5000"
    environment:
      - OA_CHANNEL_ID=${OA_CHANNEL_ID}
      - LIFF_CHANNEL_ID=${LIFF_CHANNEL_ID}
      - LIFF_ID=${LIFF_ID}
      - DYNAMODB_ENDPOINT=http://dynamodb:8000
      - MEMBERS_INFO_DB=MembersInfoDB
      - PRODUCT_INFO_DB=ProductInfoDB
      - CHANNEL_ACCESS_TOKEN_DB=ChannelAccessTokenDB
      - LOGGER_LEVEL=INFO
    depends_on:
      - dynamodb
    restart: unless-stopped
    networks:
      - line-members-network

  # DynamoDB Local
  dynamodb:
    image: amazon/dynamodb-local:latest
    container_name: line-members-dynamodb
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
    volumes:
      - dynamodb-data:/data
    expose:
      - "8000"
    restart: unless-stopped
    networks:
      - line-members-network

  # Batch Job (Token Refresh)
  batch:
    build:
      context: ./batch
      dockerfile: Dockerfile
    container_name: line-members-batch
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb:8000
      - CHANNEL_ACCESS_TOKEN_DB=ChannelAccessTokenDB
    depends_on:
      - dynamodb
    restart: unless-stopped
    networks:
      - line-members-network

volumes:
  dynamodb-data:

networks:
  line-members-network:
    driver: bridge
```

### 4.2 Environment Variables (.env)

```env
# LINE Configuration
OA_CHANNEL_ID=your_oa_channel_id
LIFF_CHANNEL_ID=your_liff_channel_id
LIFF_ID=your_liff_id

# Channel Secrets (for token refresh)
CHANNEL_SECRET=your_channel_secret

# Server Configuration
DOMAIN=your-domain.com
```

---

## 5. Component Conversion Details

### 5.1 Backend Conversion (Lambda to Flask)

**Original Lambda Handler** (`app.py`):
```python
def lambda_handler(event, context):
    req_param = json.loads(event['body'])
    # ... logic
```

**Converted Flask App** (`main.py`):
```python
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/api/members_card', methods=['POST'])
def members_card():
    req_param = request.get_json()
    # ... same logic as lambda_handler
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 5.2 DynamoDB Adapter Changes

**Original (AWS DynamoDB)**:
```python
import boto3
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)
```

**Converted (DynamoDB Local)**:
```python
import boto3
import os

dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=os.environ.get('DYNAMODB_ENDPOINT', 'http://localhost:8000'),
    region_name='ap-northeast-1',
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy'
)
table = dynamodb.Table(TABLE_NAME)
```

### 5.3 Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate     /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend (LIFF)
        location / {
            root /var/www/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 6. Deployment Steps

### Phase 1: Preparation

1. **Clone/copy project to VPS**
   ```bash
   scp -r line-members-card-docker/ user@your-vps:/opt/
   ```

2. **Set up SSL certificate** (using Let's Encrypt)
   ```bash
   certbot certonly --standalone -d your-domain.com
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your LINE credentials
   ```

### Phase 2: Build and Deploy

4. **Build containers**
   ```bash
   docker-compose build
   ```

5. **Start services**
   ```bash
   docker-compose up -d
   ```

6. **Initialize DynamoDB tables**
   ```bash
   docker-compose exec backend python scripts/init_tables.py
   ```

7. **Load initial product data**
   ```bash
   docker-compose exec backend python scripts/load_products.py
   ```

### Phase 3: Configuration

8. **Update LINE Console settings**
   - Webhook URL: `https://your-domain.com/api/members_card`
   - LIFF Endpoint: `https://your-domain.com`

9. **Register Channel Access Token**
   ```bash
   docker-compose exec backend python scripts/register_token.py
   ```

### Phase 4: Verification

10. **Test the deployment**
    ```bash
    # Check all containers are running
    docker-compose ps

    # Test API endpoint
    curl -X POST https://your-domain.com/api/members_card \
      -H "Content-Type: application/json" \
      -d '{"mode":"init","idToken":"test"}'

    # Check logs
    docker-compose logs -f backend
    ```

---

## 7. File Modifications Required

### 7.1 Files to Create

| File | Description |
|------|-------------|
| `backend/Dockerfile` | Python container configuration |
| `backend/main.py` | Flask/FastAPI entry point |
| `backend/config.py` | Configuration loader |
| `batch/Dockerfile` | Batch job container |
| `batch/crontab` | Cron schedule for token refresh |
| `nginx/nginx.conf` | Nginx reverse proxy config |
| `scripts/init_tables.py` | DynamoDB table creation |
| `scripts/load_products.py` | Product data loader |

### 7.2 Files to Modify

| Original File | Changes Required |
|---------------|------------------|
| `backend/Layer/layer/aws/dynamodb/base.py` | Add DynamoDB endpoint configuration |
| `backend/APP/members_card/app.py` | Convert to Flask route handler |
| `front/index.js` | Update API endpoint URL |
| `front/members_card.js` | Update API endpoint URL |

### 7.3 Files to Copy

| Source | Destination |
|--------|-------------|
| `front/*` | `nginx/html/` |
| `backend/Layer/layer/common/*` | `backend/common/` |
| `backend/Layer/layer/validation/*` | `backend/validation/` |
| `backend/Layer/layer/members_card/*` | `backend/members_card/` |
| `backend/APP/members_card/send_message.py` | `backend/app/send_message.py` |

---

## 8. Alternative: MongoDB Option

If you prefer MongoDB over DynamoDB Local:

### 8.1 docker-compose.yml changes

```yaml
  mongodb:
    image: mongo:6
    container_name: line-members-mongodb
    volumes:
      - mongodb-data:/data/db
    expose:
      - "27017"
    restart: unless-stopped
    networks:
      - line-members-network
```

### 8.2 Database adapter changes

Replace DynamoDB operations with PyMongo:

```python
from pymongo import MongoClient
import os

client = MongoClient(os.environ.get('MONGODB_URI', 'mongodb://mongodb:27017'))
db = client['members_card']

# Get item
def get_item(user_id):
    return db.users.find_one({'userId': user_id})

# Put item
def put_item(item):
    db.users.insert_one(item)
```

---

## 9. Monitoring and Maintenance

### 9.1 Health Checks

Add health check endpoint:

```python
@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}
```

### 9.2 Log Management

```bash
# View logs
docker-compose logs -f

# Rotate logs (add to docker-compose.yml)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 9.3 Backup DynamoDB Data

```bash
# Backup
docker-compose exec dynamodb \
  aws dynamodb scan --table-name MembersInfoDB \
  --endpoint-url http://localhost:8000 > backup.json

# Restore
docker-compose exec backend python scripts/restore_data.py backup.json
```

---

## 10. Security Considerations

1. **SSL/TLS**: Always use HTTPS (required for LIFF)
2. **Firewall**: Only expose ports 80 and 443
3. **Secrets**: Use Docker secrets or environment files (not in git)
4. **Updates**: Regularly update container images
5. **Access**: Use SSH keys, disable password authentication

---

## 11. Estimated Work Items

| Task | Description |
|------|-------------|
| 1. Create Docker structure | Set up directories and base files |
| 2. Convert Lambda to Flask | Rewrite app.py as Flask application |
| 3. Adapt DynamoDB code | Add endpoint configuration |
| 4. Configure Nginx | Set up reverse proxy and SSL |
| 5. Set up batch job | Create cron-based token refresh |
| 6. Update frontend | Change API endpoint URLs |
| 7. Create init scripts | DynamoDB table creation and data loading |
| 8. Testing | End-to-end testing with LINE |
| 9. Documentation | Update deployment docs |

---

## 12. Summary

This plan converts the AWS SAM serverless architecture to a Docker Compose-based deployment suitable for VPS hosting. The core application logic remains largely unchanged, with modifications mainly to:

1. **Entry points**: Lambda handlers become Flask routes
2. **Database access**: Add DynamoDB Local endpoint configuration
3. **Infrastructure**: Replace AWS services with Docker containers
4. **Deployment**: Manual Docker Compose instead of SAM deploy

The result is a fully self-hosted solution that maintains compatibility with the LINE APIs while running on your own infrastructure.
