// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

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
  APPLICANT: 'applicant',
  TPB: 'tpb',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
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
  HOME: 'Home',
  LOGIN: 'Login',
  REGISTER: 'Register',
  CHAT: 'Chat',
  VOICE_CHAT: 'VoiceChat',
  PROFILE: 'Profile',
  APPLICATIONS: 'Applications',
  DOCUMENTS: 'Documents',
  DASHBOARD: 'Dashboard',
  ADMIN_DASHBOARD: 'AdminDashboard',
  TPB_DASHBOARD: 'TPBDashboard',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  CHAT_HISTORY: 'chatHistory',
  APPLICATION_DRAFT: 'applicationDraft',
  SETTINGS: 'settings',
};