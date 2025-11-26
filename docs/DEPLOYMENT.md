# Omnifin Deployment Guide

## Overview

This guide provides detailed instructions for deploying the Omnifin SaaS Lending Platform in production environments.

## Deployment Options

### 1. Docker Compose (Recommended)

The easiest way to deploy Omnifin is using Docker Compose.

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB storage minimum

#### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd omnifin
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Access the application**
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### 2. Kubernetes Deployment

For scalable production deployments, use Kubernetes.

#### Prerequisites
- Kubernetes 1.20+
- kubectl configured
- Ingress controller (nginx recommended)

#### Deployment Steps

1. **Create namespace**
   ```bash
   kubectl create namespace omnifin
   ```

2. **Apply configurations**
   ```bash
   kubectl apply -f k8s/postgresql.yaml
   kubectl apply -f k8s/redis.yaml
   kubectl apply -f k8s/backend.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

3. **Initialize database**
   ```bash
   kubectl exec -it deployment/backend -- python manage.py migrate
   kubectl exec -it deployment/backend -- python manage.py createsuperuser
   ```

### 3. Manual Deployment

For custom deployments on Linux servers.

#### Server Requirements
- Ubuntu 20.04 LTS or later
- 4GB RAM minimum
- 20GB storage minimum
- Python 3.9+
- PostgreSQL 13+
- Redis 6+
- Nginx

#### Installation Steps

1. **Update system**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install dependencies**
   ```bash
   # Python and pip
   sudo apt install python3-pip python3-dev libpq-dev
   
   # PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Redis
   sudo apt install redis-server
   
   # Nginx
   sudo apt install nginx
   
   # Additional dependencies
   sudo apt install libffi-dev libjpeg-dev libpng-dev libxml2-dev libxslt1-dev libssl-dev libz-dev
   ```

3. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE omnifin_db;
   CREATE USER omnifin_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE omnifin_db TO omnifin_user;
   \q
   ```

4. **Setup Redis**
   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

5. **Deploy application**
   ```bash
   # Create application user
   sudo useradd -m omnifin
   sudo su - omnifin
   
   # Clone repository
   git clone <repository-url>
   cd omnifin/backend
   
   # Setup virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.example .env
   # Edit .env with production settings
   
   # Setup application
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   ```

6. **Configure Gunicorn**
   Create `/etc/systemd/system/omnifin.service`:
   ```ini
   [Unit]
   Description=Omnifin Django Application
   After=network.target
   
   [Service]
   User=omnifin
   Group=omnifin
   WorkingDirectory=/home/omnifin/omnifin/backend
   Environment=PATH=/home/omnifin/omnifin/backend/venv/bin
   ExecStart=/home/omnifin/omnifin/backend/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/home/omnifin/omnifin/backend/omnifin.sock omnifin.wsgi:application
   
   [Install]
   WantedBy=multi-user.target
   ```

7. **Configure Nginx**
   Create `/etc/nginx/sites-available/omnifin`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       client_max_body_size 20M;
       
       location /static/ {
           alias /home/omnifin/omnifin/backend/staticfiles/;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       location /media/ {
           alias /home/omnifin/omnifin/backend/media/;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       location / {
           include proxy_params;
           proxy_pass http://unix:/home/omnifin/omnifin/backend/omnifin.sock;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/omnifin /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Start services**
   ```bash
   sudo systemctl enable omnifin
   sudo systemctl start omnifin
   ```

## Environment Configuration

### Production Environment Variables

```bash
# Django
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DB_HOST=localhost
DB_NAME=omnifin_db
DB_USER=omnifin_user
DB_PASSWORD=secure-db-password

# Redis
REDIS_URL=redis://localhost:6379/0

# AI Services
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ULTRAVOX_API_KEY=your-ultravox-api-key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### SSL Certificate Setup

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   ```
   Add: `0 12 * * * /usr/bin/certbot renew --quiet`

## Monitoring

### Application Monitoring

1. **Install monitoring tools**
   ```bash
   pip install django-prometheus psutil
   ```

2. **Configure Prometheus**
   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'omnifin'
       static_configs:
         - targets: ['localhost:8000']
   ```

3. **Setup Grafana**
   - Install Grafana
   - Configure data source
   - Import dashboards

### Log Management

1. **Configure logging**
   ```python
   # settings.py
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'verbose': {
               'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
               'style': '{',
           },
       },
       'handlers': {
           'file': {
               'level': 'INFO',
               'class': 'logging.FileHandler',
               'filename': '/var/log/omnifin/omnifin.log',
               'formatter': 'verbose',
           },
       },
       'loggers': {
           'django': {
               'handlers': ['file'],
               'level': 'INFO',
               'propagate': True,
           },
       },
   }
   ```

2. **Setup log rotation**
   ```bash
   sudo nano /etc/logrotate.d/omnifin
   ```
   ```
   /var/log/omnifin/*.log {
       daily
       missingok
       rotate 14
       compress
       delaycompress
       notifempty
       create 0640 omnifin adm
       sharedscripts
       postrotate
           systemctl reload omnifin
       endscript
   }
   ```

## Security

### Basic Security Hardening

1. **Update system regularly**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Secure SSH**
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
   ```
   Port 2222
   PermitRootLogin no
   PasswordAuthentication no
   ```
   ```bash
   sudo systemctl restart sshd
   ```

4. **Install fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

### Application Security

1. **Enable security headers**
   ```nginx
   add_header X-Frame-Options DENY;
   add_header X-Content-Type-Options nosniff;
   add_header X-XSS-Protection "1; mode=block";
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
   ```

2. **Configure CORS**
   ```python
   # settings.py
   CORS_ALLOWED_ORIGINS = [
       "https://yourdomain.com",
       "https://www.yourdomain.com",
   ]
   ```

3. **Enable MFA**
   ```python
   # settings.py
   MFA_UNALLOWED_METHODS = ()
   ```

## Backup and Recovery

### Database Backup

1. **Automated backup script**
   ```bash
   #!/bin/bash
   # backup.sh
   
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/var/backups/omnifin"
   
   mkdir -p $BACKUP_DIR
   
   # Database backup
   pg_dump omnifin_db > $BACKUP_DIR/omnifin_db_$DATE.sql
   
   # Media files backup
   tar -czf $BACKUP_DIR/media_$DATE.tar.gz /home/omnifin/omnifin/backend/media/
   
   # Keep only last 7 days
   find $BACKUP_DIR -type f -mtime +7 -delete
   ```

2. **Setup cron job**
   ```bash
   crontab -e
   ```
   ```
   0 2 * * * /path/to/backup.sh
   ```

### Recovery Procedures

1. **Database recovery**
   ```bash
   sudo -u postgres psql omnifin_db < backup.sql
   ```

2. **Media files recovery**
   ```bash
   tar -xzf media_backup.tar.gz -C /home/omnifin/omnifin/backend/
   ```

## Scaling

### Horizontal Scaling

1. **Load balancer setup**
   ```nginx
   upstream omnifin_backend {
       server 127.0.0.1:8001;
       server 127.0.0.1:8002;
       server 127.0.0.1:8003;
   }
   
   server {
       listen 80;
       location / {
           proxy_pass http://omnifin_backend;
       }
   }
   ```

2. **Multiple Gunicorn instances**
   ```bash
   # Instance 1
   gunicorn --bind 127.0.0.1:8001 --workers 3 omnifin.wsgi:application
   
   # Instance 2
   gunicorn --bind 127.0.0.1:8002 --workers 3 omnifin.wsgi:application
   ```

### Database Scaling

1. **Read replicas**
   ```python
   # settings.py
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'omnifin_db',
           'USER': 'omnifin_user',
           'PASSWORD': 'password',
           'HOST': 'primary-db-host',
           'PORT': '5432',
       },
       'replica': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'omnifin_db',
           'USER': 'omnifin_user',
           'PASSWORD': 'password',
           'HOST': 'replica-db-host',
           'PORT': '5432',
       }
   }
   ```

2. **Connection pooling**
   ```python
   # settings.py
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'omnifin_db',
           'OPTIONS': {
               'MAX_CONNS': 20,
               'MIN_CONNS': 5,
           }
       }
   }
   ```

## Maintenance

### Regular Maintenance Tasks

1. **Update dependencies**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

2. **Clean up old data**
   ```bash
   python manage.py clearsessions
   python manage.py cleanup_old_data
   ```

3. **Optimize database**
   ```bash
   python manage.py dbshell
   ```
   ```sql
   VACUUM ANALYZE;
   ```

4. **Monitor disk usage**
   ```bash
   df -h
   du -sh /var/log/*
   ```

### Health Checks

1. **Application health**
   ```bash
   curl -f http://localhost/health/
   ```

2. **Database connectivity**
   ```bash
   python manage.py dbshell --command "SELECT 1;"
   ```

3. **Redis connectivity**
   ```bash
   redis-cli ping
   ```

## Troubleshooting

### Common Issues

1. **Gunicorn not starting**
   - Check systemd service status
   - Verify virtual environment
   - Check application logs

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check connection parameters
   - Test with psql

3. **Static files not serving**
   - Check collectstatic command
   - Verify nginx configuration
   - Check file permissions

4. **SSL certificate issues**
   - Check certificate expiration
   - Verify nginx configuration
   - Test with openssl

### Log Locations

- **Application logs**: `/var/log/omnifin/`
- **Nginx logs**: `/var/log/nginx/`
- **PostgreSQL logs**: `/var/log/postgresql/`
- **System logs**: `/var/log/syslog`

## Support

For deployment support:
- Email: devops@omnifin.com
- Documentation: docs.omnifin.com/deployment
- Status: status.omnifin.com