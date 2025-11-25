-- Omnifin SaaS Lending Platform - Database Schema
-- PostgreSQL Database Schema for Core Platform

-- Create database
CREATE DATABASE omnifin_db;
\c omnifin_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Management Tables

CREATE TABLE users_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('applicant', 'tpb', 'admin', 'superadmin')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_by UUID REFERENCES users_user(id),
    group_id UUID
);

-- Third-Party Broker (TPB) specific table
CREATE TABLE users_tpbprofile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users_user(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    payout_method VARCHAR(50),
    bank_account_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applicant specific table
CREATE TABLE users_applicantprofile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users_user(id) ON DELETE CASCADE,
    date_of_birth DATE,
    ssn_last_four VARCHAR(4),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'US',
    employment_status VARCHAR(50),
    annual_income DECIMAL(12,2),
    credit_score INTEGER,
    referred_by UUID REFERENCES users_tpbprofile(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan Application Tables

CREATE TABLE loans_application (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID REFERENCES users_applicantprofile(id) ON DELETE CASCADE,
    tpb_id UUID REFERENCES users_tpbprofile(id),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    loan_purpose VARCHAR(100) NOT NULL,
    loan_amount DECIMAL(12,2) NOT NULL,
    loan_term INTEGER,
    interest_rate DECIMAL(5,2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected', 'funded', 'cancelled')),
    submission_date TIMESTAMP,
    decision_date TIMESTAMP,
    funding_date TIMESTAMP,
    lender_id UUID,
    lender_response TEXT,
    ai_conversation_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans_lender (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    minimum_loan_amount DECIMAL(12,2),
    maximum_loan_amount DECIMAL(12,2),
    supported_loan_types JSONB,
    requirements JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Management Tables

CREATE TABLE documents_document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES loans_application(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users_user(id),
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100),
    storage_path TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users_user(id),
    verified_at TIMESTAMP
);

-- AI Management Tables

CREATE TABLE ai_prompt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

CREATE TABLE ai_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_conversation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_user(id) ON DELETE CASCADE,
    application_id UUID REFERENCES loans_application(id),
    session_id VARCHAR(100) NOT NULL,
    is_voice_chat BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB
);

CREATE TABLE ai_message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversation(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'document', 'system')),
    content TEXT NOT NULL,
    audio_url TEXT,
    audio_duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission Tracking Tables

CREATE TABLE commissions_commission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tpb_id UUID REFERENCES users_tpbprofile(id) ON DELETE CASCADE,
    application_id UUID REFERENCES loans_application(id) ON DELETE CASCADE,
    commission_amount DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_reference VARCHAR(100),
    metadata JSONB
);

CREATE TABLE commissions_payout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tpb_id UUID REFERENCES users_tpbprofile(id) ON DELETE CASCADE,
    payout_batch_id VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    commission_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failure_reason TEXT
);

-- Analytics and Logging Tables

CREATE TABLE analytics_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_user(id),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    session_id VARCHAR(100),
    application_id UUID REFERENCES loans_application(id),
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_user(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration Tables

CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys and External Service Configuration
CREATE TABLE external_service (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    endpoint_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_user_email ON users_user(email);
CREATE INDEX idx_users_user_role ON users_user(role);
CREATE INDEX idx_users_user_created_at ON users_user(created_at);
CREATE INDEX idx_users_tpbprofile_tracking_id ON users_tpbprofile(tracking_id);
CREATE INDEX idx_loans_application_applicant_id ON loans_application(applicant_id);
CREATE INDEX idx_loans_application_status ON loans_application(status);
CREATE INDEX idx_loans_application_created_at ON loans_application(created_at);
CREATE INDEX idx_documents_application_id ON documents_document(application_id);
CREATE INDEX idx_ai_conversation_user_id ON ai_conversation(user_id);
CREATE INDEX idx_ai_message_conversation_id ON ai_message(conversation_id);
CREATE INDEX idx_commissions_tpb_id ON commissions_commission(tpb_id);
CREATE INDEX idx_commissions_status ON commissions_commission(status);
CREATE INDEX idx_analytics_user_id ON analytics_event(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_event(created_at);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create initial data
INSERT INTO users_user (email, password, first_name, last_name, role) VALUES 
('superadmin@omnifin.com', 'pbkdf2_sha256$260000$...', 'Super', 'Admin', 'superadmin');

INSERT INTO system_config (key, value, description) VALUES 
('platform_name', 'Omnifin Lending Platform', 'Platform display name'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes'),
('allowed_file_types', '[".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]', 'Allowed file extensions'),
('default_commission_rate', '2.5', 'Default commission percentage for TPBs'),
('ai_model', 'gpt-4', 'Default AI model for chat interface'),
('voice_model', 'elevenlabs', 'Default voice synthesis model');

-- Create initial AI prompts
INSERT INTO ai_prompt (name, category, content, version) VALUES 
('welcome_message', 'greeting', 'Hello! I''m your AI loan assistant. I''ll help you find the perfect loan for your needs. Let''s start by understanding what type of loan you''re looking for.', 1),
('loan_purpose_query', 'information_gathering', 'What is the primary purpose of your loan? (e.g., home purchase, debt consolidation, business expansion, emergency expenses)', 1),
('amount_query', 'information_gathering', 'How much would you like to borrow? Please provide the loan amount you''re seeking.', 1),
('personal_info_query', 'information_gathering', 'To provide you with the best loan options, I''ll need some basic personal information. Could you please provide your full name and date of birth?', 1),
('income_query', 'information_gathering', 'What is your current annual income? This will help me match you with lenders who can accommodate your financial situation.', 1),
('document_request', 'document_collection', 'To complete your application, you''ll need to upload some supporting documents. Please have ready: proof of income, identification, and any relevant financial statements.', 1);

-- Create initial AI knowledge entries
INSERT INTO ai_knowledge (category, title, content, tags) VALUES 
('lender_criteria', 'General Eligibility Requirements', 'Most lenders require applicants to be at least 18 years old, have a steady source of income, and maintain a reasonable debt-to-income ratio.', ARRAY['eligibility', 'requirements', 'general']),
('loan_types', 'Personal Loans', 'Personal loans are unsecured loans that can be used for various purposes including debt consolidation, home improvements, or major purchases. Terms typically range from 12 to 84 months.', ARRAY['personal', 'unsecured', 'general']),
('loan_types', 'Business Loans', 'Business loans are designed for business purposes including working capital, equipment purchases, or expansion. May require business financial statements and tax returns.', ARRAY['business', 'commercial', 'working-capital']),
('process', 'Application Timeline', 'Most loan applications are processed within 1-3 business days. Funding typically occurs within 1-2 business days after approval.', ARRAY['timeline', 'processing', 'funding']),
('requirements', 'Documentation Needed', 'Common documents required: government-issued ID, proof of income (pay stubs, tax returns), bank statements, and proof of address.', ARRAY['documents', 'requirements', 'verification']);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;