// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_INDICATOR_DELAY: 1000,
  RESPONSE_TIMEOUT: 30000,
};

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
};

// Application Status Configuration
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FUNDED: 'funded',
  CANCELLED: 'cancelled',
};

export const STATUS_COLORS = {
  [APPLICATION_STATUS.PENDING]: '#FFA500',
  [APPLICATION_STATUS.SUBMITTED]: '#4169E1',
  [APPLICATION_STATUS.UNDER_REVIEW]: '#FFD700',
  [APPLICATION_STATUS.APPROVED]: '#32CD32',
  [APPLICATION_STATUS.REJECTED]: '#FF6347',
  [APPLICATION_STATUS.FUNDED]: '#228B22',
  [APPLICATION_STATUS.CANCELLED]: '#808080',
};

// User Roles
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  TPB_MANAGER: 'tpb_manager',
  TPB_STAFF: 'tpb_staff',
  TPB_CUSTOMER: 'tpb_customer',
};

// Loan Purposes
export const LOAN_PURPOSES = [
  'Personal Loan',
  'Home Purchase',
  'Home Improvement',
  'Debt Consolidation',
  'Business Loan',
  'Auto Loan',
  'Medical Expenses',
  'Education',
  'Emergency Fund',
  'Other',
];

// Employment Status
export const EMPLOYMENT_STATUS = [
  'Employed',
  'Self-Employed',
  'Unemployed',
  'Retired',
  'Student',
];

// Document Types
export const DOCUMENT_TYPES = {
  IDENTIFICATION: 'identification',
  PROOF_OF_INCOME: 'proof_of_income',
  BANK_STATEMENT: 'bank_statement',
  TAX_RETURN: 'tax_return',
  PROOF_OF_ADDRESS: 'proof_of_address',
  BUSINESS_LICENSE: 'business_license',
  OTHER: 'other',
};

// Commission Status
export const COMMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication error. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  APPLICATION_SUBMITTED: 'Application submitted successfully!',
  DOCUMENT_UPLOADED: 'Document uploaded successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  COMMISSION_PAID: 'Commission paid successfully!',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  CHAT: '/chat',
  VOICE_CHAT: '/voice-chat',
  CHAT_HISTORY: '/chat-history',
  PROFILE: '/profile',
  USERS: '/admin/users',
  ADD_USER: '/users/add',
  MODIFY_PERMISSIONS: '/users/permissions',
  ANALYTICS: '/admin/analytics',
  LOANS: '/admin/loans',
  LOAN_MANAGEMENT: '/loan-management',
  ADMIN: '/admin',
  CONFIG: '/config',
  PROMPTS: '/prompts',
  KNOWLEDGE: '/admin/knowledge',
  SUBSCRIPTION_PLANS: '/subscription-plans',
  MANAGE_ADMIN_SUBSCRIPTIONS: '/manage-admin-subscriptions',
  SUBSCRIBE: '/subscribe',
  USAGE: '/usage',
  ADMIN_DASHBOARD: '/admin-dashboard',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  CHAT_HISTORY: 'chatHistory',
  APPLICATION_DRAFT: 'applicationDraft',
  SETTINGS: 'settings',
};

// Table Configuration
export const TABLE_CONFIG = {
  ROWS_PER_PAGE: [10, 25, 50, 100],
  DEFAULT_ROWS_PER_PAGE: 25,
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#6200EE',
  SECONDARY: '#03DAC6',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
};

// AI Models
export const AI_MODELS = {
  TEXT: 'gpt-4',
  VOICE_TTS: 'elevenlabs',
  VOICE_STT: 'ultravox',
};

// Configuration
export const CONFIG = {
  APP_NAME: 'Omnifin',
  APP_DESCRIPTION: 'AI-Powered Lending Platform',
  COMPANY_NAME: 'Omnifin Platform',
  SUPPORT_EMAIL: 'support@omnifin.com',
  VERSION: '1.0.0',
};