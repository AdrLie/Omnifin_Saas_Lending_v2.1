# Omnifin SaaS Lending Platform

A comprehensive, AI-powered SaaS lending aggregation platform that connects loan applicants with lenders through intelligent conversational interfaces.

## 🚀 Features

### Core Functionality
- **AI-Powered Loan Applications**: ChatGPT-compatible text and voice interfaces
- **Multi-User Role System**: Applicants, TPBs, Admins, and SuperAdmins
- **Lender Integration**: Automated submission to multiple lender APIs
- **Commission Tracking**: Automated commission calculation and payout for TPBs
- **Document Management**: Secure upload and verification system
- **Real-time Analytics**: Comprehensive dashboard and reporting

### Technical Features
- **Scalable Architecture**: Django + PostgreSQL backend
- **Modern Frontend**: React Native with Material-UI
- **Security**: Multi-factor authentication, mTLS, WAF integration
- **AI Integration**: OpenAI, ElevenLabs, Ultravox.ai
- **Internationalization**: English and Chinese support

## 📁 Project Structure

```
omnifin/
├── backend/                    # Django backend
│   ├── apps/
│   │   ├── authentication/     # User management
│   │   ├── loans/             # Loan applications
│   │   ├── ai_integration/    # AI services
│   │   ├── documents/         # Document management
│   │   ├── commissions/       # Commission tracking
│   │   └── analytics/         # Analytics and reporting
│   ├── omnifin/               # Django project settings
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React Native frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── screens/          # App screens
│   │   ├── contexts/         # React contexts
│   │   ├── services/         # API services
│   │   └── utils/            # Utilities
│   └── package.json          # Node.js dependencies
├── database/                  # Database schemas
├── workflows/                # Process diagrams
└── docs/                     # Documentation
```

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 4.2
- **Database**: PostgreSQL 13
- **API**: Django REST Framework
- **Authentication**: Token-based with MFA
- **Caching**: Redis
- **Task Queue**: Celery

### Frontend
- **Framework**: React Native 0.72
- **UI Library**: Material-UI (React Native Paper)
- **Navigation**: React Navigation
- **State Management**: Context API
- **HTTP Client**: Axios

### AI Services
- **Text AI**: OpenAI GPT-4
- **Voice AI**: ElevenLabs (TTS), Ultravox.ai (STT)
- **Integration**: Custom AI service layer

### Infrastructure
- **Server**: Linux Ubuntu
- **Web Server**: Nginx
- **Application Server**: Gunicorn
- **Security**: ModSecurity WAF, Fail2ban

## 🚦 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd omnifin/backend
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

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
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

### Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE omnifin_db;
   CREATE USER omnifin_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE omnifin_db TO omnifin_user;
   ```

2. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

3. **Load initial data**
   ```bash
   python manage.py loaddata initial_data
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=omnifin_db
DB_USER=omnifin_user
DB_PASSWORD=your_password
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

### Frontend Configuration

Create a `.env` file in the frontend directory:

```env
API_BASE_URL=http://localhost:8000/api
```

## 📱 User Roles

### Applicant
- Apply for loans via AI chat/voice
- Upload supporting documents
- View application status and offers
- Manage personal profile

### Third-Party Broker (TPB)
- All applicant permissions
- Dedicated dashboard
- View referred applicants
- Track commission earnings

### Admin
- All TPB permissions
- Manage users within group
- View activity logs
- Content moderation

### SuperAdmin
- Full platform control
- Manage all users
- Configure system settings
- Access all analytics

## 🤖 AI Integration

### Chat Interface
- Text-based conversation with GPT-4
- Context-aware responses
- Guided application process
- Real-time validation

### Voice Interface
- Speech-to-text with Ultravox.ai
- Text-to-speech with ElevenLabs
- Hands-free interaction
- Natural conversation flow

### Knowledge Management
- Version-controlled prompts
- Dynamic knowledge base
- Lender-specific information
- Regulatory compliance

## 📊 Analytics

### Dashboard Metrics
- User engagement
- Application conversion rates
- Lender performance
- Commission tracking
- System health

### Reports
- Custom report builder
- Export capabilities
- Real-time monitoring
- Trend analysis

## 🔒 Security

### Authentication
- Multi-factor authentication
- Token-based API access
- Session management
- Password policies

### Data Protection
- Encryption at rest and in transit
- Secure file storage
- Audit logging
- GDPR compliance

### API Security
- Rate limiting
- CORS configuration
- Input validation
- SQL injection prevention

## 🚀 Deployment

### Production Setup

1. **Server Configuration**
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install python3-pip python3-dev libpq-dev nginx redis-server
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd omnifin
   
   # Backend setup
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Configure production settings
   python manage.py collectstatic
   python manage.py migrate
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
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

### Docker Deployment

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Run containers**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker-compose exec web python manage.py migrate
   docker-compose exec web python manage.py createsuperuser
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get user profile

### Loan Application Endpoints
- `GET /api/loans/applications/` - List applications
- `POST /api/loans/applications/` - Create application
- `GET /api/loans/applications/{id}/` - Get application details
- `POST /api/loans/applications/{id}/submit/` - Submit application

### AI Integration Endpoints
- `POST /api/ai/chat/` - Send chat message
- `POST /api/ai/voice/` - Send voice message
- `GET /api/ai/conversations/` - List conversations

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.authentication
python manage.py test apps.loans

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**
   - Check PostgreSQL is running
   - Verify credentials in .env file
   - Ensure database exists

2. **Redis Connection**
   - Check Redis is running
   - Verify Redis URL in settings
   - Test connection with redis-cli

3. **AI Service Errors**
   - Verify API keys are valid
   - Check rate limits
   - Monitor service status

4. **Frontend Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version
   - Verify environment variables

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, please contact:
- Email: support@omnifin.com
- Documentation: docs.omnifin.com
- Issues: GitHub Issues

## 🔄 Changelog

### Version 1.0.0
- Initial release
- AI-powered loan application system
- Multi-user role management
- Lender integration framework
- Commission tracking system
- Document management
- Analytics dashboard