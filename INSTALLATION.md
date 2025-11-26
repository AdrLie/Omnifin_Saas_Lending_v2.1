# Omnifin Installation Guide

## Quick Start

This guide will help you install and run the Omnifin SaaS Lending Platform on your local machine or server.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Python 3.9+** - Backend runtime
- **Node.js 16+** - Frontend runtime
- **PostgreSQL 13+** - Database
- **Redis 6+** - Caching and sessions
- **Git** - Version control

### Optional Software
- **Docker** - Container deployment
- **Nginx** - Web server (production)

## Installation Methods

### Method 1: Docker Compose (Recommended)

This is the easiest way to get started with Omnifin.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd omnifin
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Access the application**
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Method 2: Manual Installation

For development or custom deployments.

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd omnifin/backend
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb omnifin_db
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd omnifin/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoint
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=omnifin_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

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
EMAIL_HOST_PASSWORD=your-email-password
```

#### Frontend (.env)
```env
API_BASE_URL=http://localhost:8000/api
```

### Database Setup

#### PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### Create Database

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE omnifin_db;
CREATE USER omnifin_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE omnifin_db TO omnifin_user;
\q
```

### Redis Setup

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

## First Time Setup

### 1. Initialize Database

```bash
# Run database migrations
python manage.py migrate

# Create a superuser account
python manage.py createsuperuser

# Load initial data (optional)
python manage.py loaddata initial_data
```

### 2. Configure AI Services

1. **Get API Keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - ElevenLabs: https://elevenlabs.io/app/api-keys
   - Ultravox.ai: https://ultravox.ai/api

2. **Add API keys to .env file**

### 3. Setup Lenders

1. **Access admin panel**
   - Navigate to http://localhost:8000/admin
   - Login with superuser credentials

2. **Add lenders**
   - Go to Loans > Lenders
   - Click "Add Lender"
   - Fill in lender details and API credentials

### 4. Configure AI Prompts

1. **Access AI admin**
   - Go to AI Integration > Prompts
   - Review and customize prompts
   - Activate relevant prompts

2. **Setup knowledge base**
   - Go to AI Integration > Knowledge
   - Add lender-specific information
   - Upload compliance documents

## Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.authentication
python manage.py test apps.loans

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react-native

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Production Deployment

### Using Docker (Recommended)

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start production services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Setup SSL with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Obtain certificate
   sudo certbot --nginx -d yourdomain.com
   ```

### Manual Production Setup

1. **Install production dependencies**
   ```bash
   # Install Gunicorn
   pip install gunicorn
   
   # Install Nginx
   sudo apt install nginx
   ```

2. **Configure Gunicorn**
   ```bash
   gunicorn --bind 0.0.0.0:8000 --workers 3 omnifin.wsgi:application
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location /static/ {
           alias /path/to/omnifin/backend/staticfiles/;
       }
       
       location /media/ {
           alias /path/to/omnifin/backend/media/;
       }
   }
   ```

## Troubleshooting

### Common Issues

1. **Database connection error**
   - Check PostgreSQL is running
   - Verify credentials in .env file
   - Test connection with `psql`

2. **Redis connection error**
   - Check Redis is running
   - Verify Redis URL in settings
   - Test with `redis-cli ping`

3. **Static files not found**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT setting
   - Verify nginx configuration

4. **AI service errors**
   - Check API keys are valid
   - Verify internet connection
   - Check rate limits

### Log Files

- **Django logs**: `backend/logs/omnifin.log`
- **Database logs**: `/var/log/postgresql/`
- **Redis logs**: `/var/log/redis/redis-server.log`
- **Nginx logs**: `/var/log/nginx/`

## Development Workflow

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. **Push and create pull request**
   ```bash
   git push origin feature/new-feature
   ```

### Code Style

- **Backend**: Follow PEP 8
- **Frontend**: Follow ESLint rules
- **Git commits**: Use conventional commits

## Support

### Getting Help

- **Documentation**: Check `/docs` directory
- **API Reference**: See `/docs/API.md`
- **Deployment Guide**: See `/docs/DEPLOYMENT.md`
- **Issues**: Create GitHub issue
- **Email**: support@omnifin.com

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.