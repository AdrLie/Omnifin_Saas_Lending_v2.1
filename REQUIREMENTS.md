# Omnifin SaaS Lending Platform - Requirements Document

## 1. Executive Summary

Omnifin is a comprehensive SaaS Lending Aggregation Platform designed to streamline the loan application process through AI-driven interactions, connecting loan applicants with a network of lenders while managing complex user hierarchies and commission tracking for third-party brokers.

## 2. Core Platform Requirements

### 2.1. System Architecture
- **Backend**: Python Django with PostgreSQL database
- **Frontend**: React Native with Material-UI (MUI)
- **AI Integration**: ChatGPT-compatible LLM, ElevenLabs, Ultravox.ai
- **Deployment**: Linux Ubuntu servers
- **Internationalization**: English and Chinese language support

### 2.2. User Roles and Permissions

#### 2.2.1. Applicant User
- Apply for loans via AI chat/voice interface
- Upload supporting documents (drag-and-drop)
- View application status and loan offers
- Manage personal profile
- No administrative access

#### 2.2.2. Third-Party Broker (TPB) User
- All Applicant permissions
- Dedicated dashboard access
- View referred applicants and application status
- Track commission earnings and payout history
- Authority limited to own referred applicants

#### 2.2.3. Admin User
- All TPB permissions
- Create and manage Applicant and TPB users within assigned group
- Edit user permissions and suspend/ban accounts
- View user activity logs for their group
- Access content moderation tools

#### 2.2.4. SuperAdmin User
- All Admin permissions
- Full platform control
- Create and manage all user types including other SuperAdmins
- Configure system-wide settings, AI integrations, lender APIs
- Access all analytics and administrative functions

### 2.3. Core Functionality Requirements

#### 2.3.1. AI-Powered Loan Application Process
- **Text Chat Interface**: ChatGPT-compatible LLM integration
- **Voice Chat Interface**: ElevenLabs + Ultravox.ai integration
- **Contextual Conversation Management**: Maintain conversation history
- **Dynamic Prompt System**: Version-controlled prompts managed via admin interface
- **Knowledge Bank**: Curated information about lenders, products, criteria

#### 2.3.2. Document Management
- **File Upload System**: Drag-and-drop interface supporting JPG, PNG, GIF, WebP, SVG
- **File Size Limit**: 10MB per file
- **Document Association**: Link documents to specific applications
- **Secure Storage**: Encrypted file storage with access controls

#### 2.3.3. Lender Integration System
- **API Integration Framework**: Flexible system for adding new lenders
- **Data Mapping**: Transform internal data to lender-specific formats
- **Status Tracking**: Real-time updates from lenders (applied, approved, funded, rejected)
- **Response Handling**: Process and display lender decisions

#### 2.3.4. Commission and Payout Tracking
- **TPB Tracking ID**: Unique identifier for commission attribution
- **Commission Calculation**: Automated calculation based on lender agreements
- **Payout Management**: Track commission status and payment history
- **Reporting**: Generate commission reports for TPBs

### 2.4. Administrative Requirements

#### 2.4.1. User Management
- **User Creation**: Admins can create all user types within their group
- **Permission Management**: Granular control over user permissions
- **Activity Monitoring**: Track user actions and system access
- **Account Management**: Suspend, ban, or modify user accounts

#### 2.4.2. AI Management
- **Prompt Management System**: Rich text editor for creating/editing AI prompts
- **Knowledge Bank Management**: Interface for managing AI knowledge base
- **Version Control**: Track changes to prompts and knowledge entries
- **Testing Environment**: Validate AI changes before deployment

#### 2.4.3. Analytics and Reporting
- **Real-time Dashboard**: Interactive charts showing key metrics
- **User Analytics**: Track user engagement and behavior
- **Application Analytics**: Monitor application volume and conversion rates
- **Financial Analytics**: Track commissions and revenue

### 2.5. Security Requirements

#### 2.5.1. Authentication and Authorization
- **Multi-Factor Authentication (MFA)**: Using django-mfa2 library
- **Token-based Authentication**: Secure API access with JWT tokens
- **Role-based Access Control**: Granular permissions based on user roles
- **Session Management**: Secure session handling with timeout controls

#### 2.5.2. Data Protection
- **Encryption**: Encrypt sensitive data at rest and in transit
- **Secure Communications**: HTTPS/TLS for all communications
- **Input Validation**: Sanitize and validate all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM usage

#### 2.5.3. API Security
- **Rate Limiting**: Prevent API abuse with request throttling
- **CORS Configuration**: Secure cross-origin resource sharing
- **API Documentation**: Comprehensive API documentation with examples
- **Mutual TLS (mTLS)**: Secure communication with external services

### 2.6. Performance and Scalability

#### 2.6.1. Performance Requirements
- **Response Time**: API responses under 200ms for standard requests
- **Concurrent Users**: Support for 1000+ concurrent users
- **Database Performance**: Optimized queries with proper indexing
- **Caching**: Redis caching for frequently accessed data

#### 2.6.2. Scalability Requirements
- **Horizontal Scaling**: Support for multiple application instances
- **Database Scaling**: Read replicas and connection pooling
- **Load Balancing**: Distribute traffic across multiple servers
- **Auto-scaling**: Dynamic resource allocation based on demand

### 2.7. Compliance and Legal

#### 2.7.1. Data Privacy
- **GDPR Compliance**: European data protection regulations
- **Data Retention**: Clear policies for data storage and deletion
- **User Consent**: Explicit consent for data processing
- **Right to Deletion**: User data deletion capabilities

#### 2.7.2. Financial Regulations
- **KYC/AML**: Know Your Customer and Anti-Money Laundering compliance
- **Audit Trail**: Complete audit trail of all financial transactions
- **Reporting**: Regulatory reporting capabilities
- **Data Sovereignty**: Compliance with local data storage requirements

### 2.8. Integration Requirements

#### 2.8.1. External APIs
- **Lender APIs**: Integration with multiple lender systems
- **AI Service APIs**: OpenAI, ElevenLabs, Ultravox.ai integrations
- **Payment APIs**: Integration with payment processing systems
- **Identity Verification**: Integration with identity verification services

#### 2.8.2. Third-Party Services
- **Email Services**: Transactional email delivery
- **SMS Services**: SMS notifications and verification
- **Cloud Storage**: Secure document storage
- **Analytics Services**: User behavior tracking and analytics

### 2.9. User Experience Requirements

#### 2.9.1. Interface Design
- **Minimalist Design**: Clean, uncluttered interface
- **Purple Highlights**: Strategic use of purple for key elements
- **Mobile-First**: Optimized for mobile devices
- **Accessibility**: WCAG 2.1 AA compliance

#### 2.9.2. Usability
- **Intuitive Navigation**: Clear and logical navigation structure
- **Progress Indicators**: Show application progress and status
- **Error Handling**: Clear and helpful error messages
- **Loading States**: Visual feedback during processing

### 2.10. Technical Requirements

#### 2.10.1. Backend Requirements
- **Python 3.9+**: Latest stable Python version
- **Django 4.0+**: Latest stable Django version
- **PostgreSQL 13+**: Latest stable PostgreSQL version
- **Redis**: For caching and session storage

#### 2.10.2. Frontend Requirements
- **React Native 0.70+**: Latest stable React Native version
- **Material-UI (MUI)**: Latest stable MUI version
- **React Navigation**: For navigation management
- **Axios**: For API communication

#### 2.10.3. Development Requirements
- **Version Control**: Git with proper branching strategy
- **Testing**: Comprehensive test coverage (unit, integration, e2e)
- **Documentation**: Complete technical and user documentation
- **CI/CD**: Automated testing and deployment pipeline

## 3. Success Criteria

### 3.1. Functional Success Criteria
- All user roles can perform their designated functions
- AI chat and voice interfaces work seamlessly
- Document upload and management functions properly
- Lender integrations successfully process applications
- Commission tracking accurately calculates and tracks payouts

### 3.2. Technical Success Criteria
- System handles 1000+ concurrent users
- API response times under 200ms
- 99.9% uptime in production
- Comprehensive security measures implemented
- All integrations work reliably

### 3.3. Business Success Criteria
- Streamlined loan application process reduces completion time by 50%
- Increased loan approval rates through AI optimization
- Accurate commission tracking for TPBs
- Scalable platform supporting business growth
- Positive user feedback and high satisfaction scores

## 4. Assumptions and Dependencies

### 4.1. Assumptions
- Lender APIs will provide consistent and reliable responses
- AI services will maintain high availability and performance
- Users have access to modern web browsers and mobile devices
- Regulatory requirements will remain stable during development
- Third-party services will maintain backward compatibility

### 4.2. Dependencies
- External AI service providers (OpenAI, ElevenLabs, Ultravox.ai)
- Lender API availability and documentation
- Cloud infrastructure providers
- Payment processing services
- Identity verification services

## 5. Risks and Mitigation

### 5.1. Technical Risks
- **AI Service Downtime**: Implement fallback mechanisms and caching
- **Lender API Changes**: Build flexible integration framework
- **Security Breaches**: Implement comprehensive security measures
- **Performance Issues**: Optimize database queries and implement caching

### 5.2. Business Risks
- **Regulatory Changes**: Build flexible compliance framework
- **Market Competition**: Focus on unique AI-driven features
- **User Adoption**: Provide excellent user experience and support
- **Lender Partnerships**: Diversify lender network to reduce dependency

## 6. Timeline and Milestones

### 6.1. Development Phases
- **Phase 1**: Core platform architecture and user management (Weeks 1-4)
- **Phase 2**: AI integration and loan application process (Weeks 5-8)
- **Phase 3**: Lender integrations and commission tracking (Weeks 9-12)
- **Phase 4**: Administrative tools and analytics (Weeks 13-16)
- **Phase 5**: Testing, optimization, and deployment (Weeks 17-20)

### 6.2. Key Milestones
- **Milestone 1**: Basic user authentication and roles completed
- **Milestone 2**: AI chat interface functional
- **Milestone 3**: First lender integration working
- **Milestone 4**: Commission tracking system operational
- **Milestone 5**: Platform ready for production deployment

This requirements document serves as the foundation for the Omnifin SaaS Lending Platform development, providing clear guidance for all stakeholders and ensuring that the final product meets all specified requirements.