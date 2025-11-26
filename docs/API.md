# Omnifin API Documentation

## Overview

The Omnifin API is a RESTful API that provides access to all platform functionality. The API uses token-based authentication and returns JSON responses.

## Base URL

```
http://localhost:8000/api/
```

## Authentication

The API uses token-based authentication. Include the token in the Authorization header:

```
Authorization: Token your-auth-token
```

### Get Authentication Token

```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "applicant"
  },
  "token": "your-auth-token"
}
```

## Users

### Register User

```http
POST /auth/register/
Content-Type: application/json

{
  "email": "newuser@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword",
  "password_confirm": "securepassword",
  "role": "applicant"
}
```

### Get User Profile

```http
GET /auth/me/
Authorization: Token your-auth-token
```

### Update Profile

```http
PATCH /auth/profile/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890"
}
```

## Loan Applications

### Create Application

```http
POST /loans/applications/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "loan_purpose": "Home Purchase",
  "loan_amount": "500000.00",
  "loan_term": 360,
  "interest_rate": "3.5"
}
```

### List Applications

```http
GET /loans/applications/
Authorization: Token your-auth-token
```

### Submit Application

```http
POST /loans/applications/{id}/submit/
Authorization: Token your-auth-token
```

### Update Application Status

```http
POST /loans/applications/{id}/update_status/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "status": "submitted",
  "notes": "Application submitted for review"
}
```

## AI Chat

### Send Message

```http
POST /ai/chat/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "session_id": "conv_1234567890",
  "message": "I need a loan for home purchase",
  "context": {
    "application_id": "app_id"
  }
}
```

**Response:**
```json
{
  "response": "I'd be happy to help you with a home purchase loan. How much are you looking to borrow?",
  "session_id": "conv_1234567890"
}
```

### Create Conversation

```http
POST /ai/conversations/create/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "application": "app_id",
  "is_voice_chat": false
}
```

## Documents

### Upload Document

```http
POST /documents/upload/
Authorization: Token your-auth-token
Content-Type: multipart/form-data

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

(binary data)
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="document_type"

proof_of_income
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="application"

app_id
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### List Documents

```http
GET /documents/applications/{app_id}/documents/
Authorization: Token your-auth-token
```

## Lenders

### List Lenders

```http
GET /loans/lenders/
Authorization: Token your-auth-token
```

### Create Lender (SuperAdmin only)

```http
POST /loans/lenders/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "name": "Example Lender",
  "api_endpoint": "https://api.lender.com",
  "api_key": "lender-api-key",
  "commission_rate": "2.5",
  "minimum_loan_amount": "10000.00",
  "maximum_loan_amount": "1000000.00"
}
```

## Commissions

### Get Commission Summary (TPB only)

```http
GET /commissions/summary/
Authorization: Token your-auth-token
```

### Get Payout History (TPB only)

```http
GET /commissions/payouts/
Authorization: Token your-auth-token
```

## Analytics

### Get Dashboard Metrics

```http
GET /analytics/dashboard/?days=30
Authorization: Token your-auth-token
```

### Get Application Funnel

```http
GET /analytics/funnel/?days=30
Authorization: Token your-auth-token
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": {
    "field": ["This field is required"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are rate limited to prevent abuse:
- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

```http
GET /loans/applications/?page=2&page_size=20
```

**Response:**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/loans/applications/?page=3",
  "previous": "http://localhost:8000/api/loans/applications/?page=1",
  "results": [...]
}
```

## Webhooks

The platform supports webhooks for real-time updates:

### Application Status Update Webhook
```json
{
  "event": "application.status_updated",
  "data": {
    "application_id": "app_id",
    "old_status": "pending",
    "new_status": "approved",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

### Commission Paid Webhook
```json
{
  "event": "commission.paid",
  "data": {
    "commission_id": "comm_id",
    "tpb_id": "tpb_id",
    "amount": "1000.00",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

## SDKs

### Python SDK
```bash
pip install omnifin-sdk
```

```python
from omnifin import OmnifinClient

client = OmnifinClient(api_key='your-api-key')

# Create application
application = client.applications.create({
    'loan_purpose': 'Home Purchase',
    'loan_amount': 500000
})

# Send chat message
response = client.ai.chat({
    'session_id': 'conv_123',
    'message': 'I need a loan'
})
```

### JavaScript SDK
```bash
npm install omnifin-js-sdk
```

```javascript
import OmnifinClient from 'omnifin-js-sdk';

const client = new OmnifinClient({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:8000/api'
});

// Create application
const application = await client.applications.create({
  loan_purpose: 'Home Purchase',
  loan_amount: 500000
});

// Send chat message
const response = await client.ai.chat({
  session_id: 'conv_123',
  message: 'I need a loan'
});
```

## Support

For API support, please contact:
- Email: api-support@omnifin.com
- Documentation: docs.omnifin.com/api
- Status: status.omnifin.com