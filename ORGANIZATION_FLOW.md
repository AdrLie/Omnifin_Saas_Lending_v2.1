# Omnifin Organization & Subscription Flow

## Overview

The system now enforces organization isolation with subscription requirements for TPB Managers to access loan management services.

## User Flows

### 1. TPB Manager Registration Flow

**Endpoint:** `POST /auth/register/`

```
1. Manager registers with:
   - role='tpb_manager'
   - organization_name='Company Name'
   - organization_description='Optional description'
   ↓
2. System auto-assigns:
   - group_id = user.id (their UUID)
   - Creates Organization with group_id, name, description
   ↓
3. Manager receives registration response
   ↓
4. Manager redirected to Dashboard (no loans accessible yet)
   - Payment page prompts manager to subscribe
  x` ↓
5. Manager chooses subscription plan and pays
   ↓
6. System creates Subscription:
   - Status changes to 'active' or 'trialing'
   - If free trial: trial_ends_at = now + 14 days
   ↓
7. Manager can now:
   - Access Loan Management
   - Invite applicants via invitation codes
   - Manage team members
```

**Data Created:**

- User (role=tpb_manager, group_id=UUID)
- Organization (group_id=UUID, owner=user, name, description)
- Subscription (status='active' or 'trialing', group_id=UUID) - created after payment

### 2. TPB Applicant Registration Flow

**Endpoint:** `POST /auth/register/` (with invitation code)

```
1. Applicant receives invitation code from TPB Manager
   (Email: user@example.com or generic code)
   ↓
2. Applicant registers:
   - role='tpb_customer'
   - invitation_code=<code>
   ↓
3. System validates:
   - Code exists
   - Code not used
   - Code not expired
   - Email matches (if specified)
   ↓
4. System auto-assigns:
   - group_id = organization.group_id (from invitation code)
   - User linked to TPB Manager's organization
   ↓
5. Applicant can now:
   - Create loan applications
   - See only loans within their organization
```

**Data Flow:**

```
Applicant registers with code ABC123
  ↓ Code belongs to Organization (group_id=XYZ)
  ↓ Applicant.group_id = XYZ
  ↓ Applicant can see all loans where group_id=XYZ
  ↓ TPB Manager (owner of XYZ) can see all loans in XYZ
```

### 3. Loan Management Access Control

**Who sees what:**

- **System Admin:** All loans across all organizations
- **TPB Manager:** Only loans in their organization (group_id matches)
- **TPB Staff:** Only loans in their organization (group_id matches)
- **Applicant:** Only their own loans (applicant=user.applicant_profile)

**Access Requirements:**

```
Request to /loans/  or /loans/create/
  ↓ Check: Is user authenticated?
  ↓ Check: Does user have active subscription?
     - System Admin: Always allowed
     - TPB Customer: Always allowed
     - TPB Manager/Staff: Must have subscription status='active' or 'trialing'
  ↓ Get queryset filtered by group_id/user
  ↓ Return data
```

## API Endpoints

### Authentication

```
POST /auth/register/
  - Create new user account
  - Auto-creates org/subscription for TPB managers
  - Validates invitation code for applicants

POST /auth/login/
  - User login, returns auth token
```

### Subscriptions

```
POST /subscriptions/activate_trial/
  - Start 14-day free trial for TPB Manager
  - Only callable by tpb_manager role
  - Sets status='trialing'

POST /subscriptions/create_subscription/
  - Purchase paid subscription
  - Requires payment_method_id

GET /subscriptions/
  - List subscriptions
  - TPB Manager sees their organization's subscription
  - System Admin sees all
```

### Invitation Codes

```
GET /auth/invitation-codes/
  - List org's invitation codes
  - TPB Manager only

POST /auth/invitation-codes/create/
  - Generate new invitation code
  - TPB Manager only
  - Fields: email (optional), days_valid (default 7)
```

### Loans

```
GET /loans/
  - List loans (filtered by permission)
  - Returns 403 if no active subscription (for TPB Manager/Staff)

POST /loans/apply/ or /loans/create/
  - Create new loan application
  - Auto-assigns applicant's group_id
  - Requires active subscription (for TPB Manager/Staff)
```

## Database Schema Changes

### Applications Table

```sql
ALTER TABLE loans_application ADD COLUMN group_id UUID;
CREATE INDEX idx_application_group_id ON loans_application(group_id);
```

### Organizations Table (existing)

```
- group_id: UUID (unique)
- owner: FK(User) tpb_manager
- name: string
- is_active: boolean
```

### Subscriptions Table (existing)

```
- group_id: UUID (linked to organization)
- status: 'active'|'trialing'|'inactive'|'suspended'
- is_paid: boolean
- trial_ends_at: datetime
- plan: FK(SubscriptionPlan)
```

## Permission Classes

### HasActiveSubscription

```python
# Returns True if:
- User is system_admin, OR
- User is tpb_customer, OR
- User is tpb_manager/tpb_staff AND has subscription with:
  - status='active', OR
  - status='trialing' AND trial not expired
```

## Workflow Examples

### Example 1: TPB Manager Workflow

```
1. Manager signs up → group_id=UUID1, subscription created
2. Manager calls activate_trial → subscription.status='trialing'
3. Manager logs into Loan Management → HasActiveSubscription check passes
4. Manager invites applicant:
   - Generates code ABC123 for john@example.com
   - Code linked to org.group_id=UUID1
5. Manager pays subscription → status='active'
6. Manager can continue accessing beyond trial period
```

### Example 2: Applicant Workflow

```
1. Manager generates code ABC123 for john@example.com
2. John registers with code ABC123
   - Receives: role='tpb_customer', group_id=UUID1
3. John logs in → no subscription check (always allowed)
4. John accesses Loan Management
5. John creates application
   - Auto-assigned group_id=UUID1
6. John's application visible to Manager (same group_id)
7. John cannot see other organizations' applications
```

### Example 3: Data Isolation

```
Organization A (group_id=UUID1)
├─ Manager: alice@example.com (group_id=UUID1)
├─ Staff: staff1@example.com (group_id=UUID1)
├─ Applicant: john@example.com (group_id=UUID1)
└─ Applications: 5 loans (all with group_id=UUID1)

Organization B (group_id=UUID2)
├─ Manager: bob@example.com (group_id=UUID2)
├─ Applicant: jane@example.com (group_id=UUID2)
└─ Applications: 3 loans (all with group_id=UUID2)

Query: alice queries /loans/ (group_id=UUID1)
Result: Only 5 loans from Organization A
Query: jane queries /loans/ (group_id=UUID2)
Result: Only her own loans in Organization B
```

## Trial Period Details

**Default:** 14 days
**After Trial Expires:**

- Manager must pay for subscription
- Or subscription status reverts to 'inactive'
- Loan Management access denied (403 Forbidden)
- Can reactivate by paying or starting new trial

**During Trial:**

- Full access to all loan features
- Can invite unlimited applicants
- Can create unlimited applications
- Payment information optional

## Subscription Plans

**Free Plan:**

- 0 cost
- Limited features (for trial)
- Default for new TPB managers

**Starter/Professional/Enterprise:**

- Paid plans
- Different feature sets
- Usage limits per plan

## Migration Steps (Completed)

1. ✅ Added group_id field to Application model
2. ✅ Created migration: 0003_add_group_id_to_application
3. ✅ Populated existing applications with group_id
4. ✅ Updated ApplicationViewSet to filter by group_id
5. ✅ Created HasActiveSubscription permission
6. ✅ Updated registration to auto-create subscription
7. ✅ Added activate_trial endpoint

## Testing Checklist

- [ ] TPB Manager registers → subscription created in 'inactive' status
- [ ] TPB Manager calls activate_trial → status changes to 'trialing'
- [ ] TPB Manager accesses /loans/ → returns 200 OK
- [ ] Subscription expired → access denied
- [ ] Applicant registers with code → assigned correct group_id
- [ ] Applicant creates loan → group_id auto-assigned
- [ ] Manager sees only own organization loans
- [ ] Manager cannot see other organization loans
- [ ] System admin sees all loans
- [ ] TPB Customer cannot access loan endpoints (no subscription check)
