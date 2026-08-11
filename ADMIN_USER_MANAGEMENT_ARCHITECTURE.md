# Admin User Management System - Architecture & Dependencies

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APPLICATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PAGES & ROUTES                                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ /admin/users                 Main user management           │   │
│  │ /admin/users/[id]            User details & actions         │   │
│  │ /admin/users/[id]/edit       Edit user form                 │   │
│  │ /admin/audit-logs            Audit log viewer               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    ↓                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ UI COMPONENTS (/app/components/admin/)                      │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ UserManagement         Main container component              │   │
│  │ UserTable              Display users with sorting            │   │
│  │ UserForm               Create/edit user forms               │   │
│  │ UserDetail             Show user information                │   │
│  │ BulkInviteModal        Batch invite interface               │   │
│  │ AuditLogTable          Display audit trail                  │   │
│  │ RoleSelector           Role dropdown (with RBAC)            │   │
│  │ UserStatusBadge        Status indicator                     │   │
│  │ PermissionGuard        Conditional rendering                │   │
│  │ InvitationTokenForm    Accept invite form                   │   │
│  │ PasswordResetForm      Reset password form                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    ↓                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ API ENDPOINTS (/app/api)                                    │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ POST   /admin/users                Create user/invite       │   │
│  │ GET    /admin/users                List users               │   │
│  │ GET    /admin/users/[id]           Get user details         │   │
│  │ PUT    /admin/users/[id]           Update user              │   │
│  │ DELETE /admin/users/[id]           Soft delete user         │   │
│  │ POST   /admin/users/[id]/resend    Resend invitation        │   │
│  │ POST   /admin/users/bulk-invite    Bulk invite users        │   │
│  │ GET    /admin/audit-logs           List audit logs          │   │
│  │ POST   /auth/accept-invitation     Accept & set password    │   │
│  │ POST   /auth/request-password-reset Send reset email        │   │
│  │ POST   /auth/reset-password        Reset with token         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    ↓                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MIDDLEWARE & UTILITIES (/lib)                               │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ auth-middleware.ts    requireAuth, requireRole, requireAdmin │   │
│  │ token-utils.ts        Generate & validate tokens            │   │
│  │ rate-limit.ts         Rate limiting logic                   │   │
│  │ validation.ts         Input validation (email, password)     │   │
│  │ auth.ts               Password hashing & verification        │   │
│  │ email.ts              Email sending functions                │   │
│  │ types.ts              TypeScript interfaces                  │   │
│  │ prisma.ts             Database client                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    ↓                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PRISMA MODELS & DATABASE                                    │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ User (updated)                                              │   │
│  │ ├─ id, email, password, name, role                          │   │
│  │ ├─ isActive, isInvitationPending                            │   │
│  │ ├─ invitationToken, invitationExpiresAt                     │   │
│  │ ├─ passwordResetToken, passwordResetExpiresAt               │   │
│  │ ├─ lastLoginAt, lastLoginIp, createdBy                      │   │
│  │ └─ createdAt, updatedAt                                     │   │
│  │                                                              │   │
│  │ AuditLog (new)                                              │   │
│  │ ├─ id, userId, action, entityType, entityId                 │   │
│  │ ├─ oldValues, newValues (JSON)                              │   │
│  │ ├─ performedBy, ipAddress, userAgent                        │   │
│  │ └─ createdAt                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    ↓                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ EXTERNAL SERVICES                                           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ SMTP/Nodemailer        Email delivery (invites, resets)     │   │
│  │ Database (PostgreSQL)  Data persistence                     │   │
│  │ JWT Token             Session management                    │   │
│  │ bcryptjs              Password hashing                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Invitation Flow
```
Admin Page
    │
    ├─ Form: Email, Role, (optional) Password
    │
    ↓
POST /api/admin/users
    │
    ├─ Validate input (email, role)
    ├─ Check email uniqueness
    ├─ Check admin permissions
    │
    ├─ If password provided:
    │   └─ Create user with hashed password
    │
    └─ If no password:
        ├─ Create user with no password
        ├─ Generate invitation token (24h expiry)
        ├─ Send invitation email with link
        ├─ Set isInvitationPending = true
        └─ Log audit action
            │
            ↓
        Email sent to user
            │
            ↓
        User clicks link: /auth/accept-invitation?token=xxx
            │
            ↓
        InvitationTokenForm component
            │
            ├─ Display: Email, Role info
            ├─ Form: Password input, Terms checkbox
            │
            ↓
        POST /api/auth/accept-invitation
            │
            ├─ Validate token (exists, not expired)
            ├─ Hash password
            ├─ Update User:
            │   ├─ Set password
            │   ├─ Clear invitation fields
            │   └─ Set isInvitationPending = false
            └─ Return JWT token
                │
                ↓
            User logged in, ready to use app
```

### Password Reset Flow
```
Login Page (forgot password)
    │
    ├─ Form: Email
    │
    ↓
POST /api/auth/request-password-reset
    │
    ├─ Validate email exists
    ├─ Check rate limit (3 per hour)
    ├─ Generate reset token (1h expiry)
    ├─ Update User: passwordResetToken, passwordResetExpiresAt
    ├─ Send email with reset link
    └─ Rate limit: record request
        │
        ↓
    Email sent
        │
        ↓
    User clicks link: /auth/reset-password?token=xxx
        │
        ↓
    PasswordResetForm component
        │
        ├─ Display: Password input, strength indicator
        │
        ↓
    POST /api/auth/reset-password
        │
        ├─ Validate token (exists, not expired)
        ├─ Validate password strength
        ├─ Hash password
        ├─ Update User:
        │   ├─ Set password
        │   └─ Clear reset token/expiry
        ├─ Log audit action
        └─ Return success message
            │
            ↓
        User can now login
```

### Role Management Flow
```
Admin: User Detail Page
    │
    ├─ GET /api/admin/users/[id]
    ├─ Display: Current role, permissions
    │
    ↓
Edit: Change role
    │
    ├─ Form: New role selector
    │ (Only shows roles user can assign)
    │
    ↓
PUT /api/admin/users/[id]
    │
    ├─ requireRole check (owner required for sensitive changes)
    ├─ Get old user data
    ├─ Update User: role field
    ├─ Create AuditLog:
    │   ├─ action: "role_changed"
    │   ├─ oldValues: {role: "viewer"}
    │   ├─ newValues: {role: "admin"}
    │   ├─ performedBy: admin ID
    │   └─ entityId: user ID
    ├─ Send email notification: Role changed
    └─ Return updated user
        │
        ↓
    Admin confirmed on frontend
```

### Audit Logging Flow
```
Any Admin Action (create, update, delete user)
    │
    ├─ Extract admin ID from JWT token
    ├─ Extract IP from request headers
    ├─ Get old values (if update/delete)
    │
    ↓
Create AuditLog entry
    │
    ├─ userId: who was affected
    ├─ action: what happened
    ├─ entityType: "user"
    ├─ entityId: ID of affected user
    ├─ oldValues: before data (JSON)
    ├─ newValues: after data (JSON)
    ├─ performedBy: admin ID
    ├─ ipAddress: admin's IP
    └─ userAgent: admin's browser
        │
        ↓
    Stored in audit_logs table
        │
        ↓
    GET /api/admin/audit-logs
        │
        ├─ Filter by date range, action, user, entity type
        ├─ Paginate results
        ├─ Return with user/admin details
        │
        ↓
    AuditLogTable component displays history
```

## Database Schema Relations

```
┌──────────────┐
│    User      │
├──────────────┤
│ id (PK)      │
│ email        │
│ password     │ (nullable - for invites)
│ name         │
│ role         │ (owner, admin, viewer)
│ isActive     │
│ isInvitation │
│ Pending      │
│ inviteToken  │
│ passRstToken │
│ lastLoginAt  │
│ createdBy FK ├──────┐
│ createdAt    │      │
│ updatedAt    │      │
└──────────────┘      │
     ▲                │
     │                │
  1:N└────────────────┤ (self-reference)
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────────┐       ┌────────▼─────────┐
│   AuditLog       │       │  User (createdBy)│
├──────────────────┤       └──────────────────┘
│ id (PK)          │
│ userId FK        ├──────► User
│ action           │
│ entityType       │
│ entityId         │
│ oldValues (JSON) │
│ newValues (JSON) │
│ performedBy FK   ├──────► User (self)
│ ipAddress        │
│ userAgent        │
│ createdAt        │
└──────────────────┘
```

## API Response Structures

### User Creation Response
```json
{
  "success": true,
  "data": {
    "id": "cuid_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "isActive": true,
    "isInvitationPending": true,
    "invitationSentAt": "2026-08-11T15:30:00Z",
    "lastLoginAt": null
  },
  "message": "User created with invitation sent"
}
```

### User List Response
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid_123",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "isActive": true,
      "isInvitationPending": false,
      "lastLoginAt": "2026-08-10T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "pages": 1
  }
}
```

### Audit Log Response
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid_456",
      "userId": "cuid_123",
      "action": "role_changed",
      "entityType": "user",
      "entityId": "cuid_789",
      "oldValues": { "role": "viewer" },
      "newValues": { "role": "admin" },
      "performedBy": "cuid_admin",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-08-11T15:30:00Z",
      "user": { "name": "Jane Doe", "email": "jane@example.com" },
      "admin": { "name": "Admin User", "email": "admin@example.com" }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 250, "pages": 5 }
}
```

## Role Definitions & Permissions

```
┌──────────────────────────────────────────────────────────────┐
│ OWNER (Highest Level - Typically one user)                  │
├──────────────────────────────────────────────────────────────┤
│ ✓ Create, read, update, delete all users                     │
│ ✓ Change any user's role (including admin to viewer)         │
│ ✓ Manage administrators and admins                           │
│ ✓ View all audit logs                                        │
│ ✓ Delete users (soft delete)                                 │
│ ✓ Manage system settings                                     │
│ ✓ Export audit reports                                       │
└──────────────────────────────────────────────────────────────┘
       ▲
       │ Can create/manage

┌──────────────────────────────────────────────────────────────┐
│ ADMIN (Day-to-day management)                                │
├──────────────────────────────────────────────────────────────┤
│ ✓ Create, read, update users (except other admins)           │
│ ✓ Change user roles (only to viewer/same)                    │
│ ✓ Cannot create or demote other admins                       │
│ ✓ Cannot delete users (view disabled users)                  │
│ ✓ View audit logs (filtered to own actions)                  │
│ ✓ Send invitations to new users                              │
│ ✓ Manage projects and contractors                            │
│ ✗ Cannot change own role                                     │
└──────────────────────────────────────────────────────────────┘
       ▲
       │ Can create

┌──────────────────────────────────────────────────────────────┐
│ VIEWER (Read-only access)                                    │
├──────────────────────────────────────────────────────────────┤
│ ✗ Cannot access admin panel                                  │
│ ✓ Can view own profile                                       │
│ ✓ Can change own password                                    │
│ ✗ Cannot create, update, or delete users                    │
│ ✗ Cannot see audit logs                                      │
│ ✓ Can view project information                               │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Order with Dependency Chain

```
START
  │
  ├─ 1.1: Extend User Model (Prisma schema)
  │   └─ 1.2: Create AuditLog Model
  │       └─ 1.3: Run Migration
  │           │
  │           ├──────┬────────┬──────────┐
  │           │      │        │          │
  │           ▼      ▼        ▼          ▼
  │       2.1: Auth  2.2:    2.3: Types 7.1: Validation
  │       Utils     Token    Update     (parallel)
  │           │      │        │          │
  │           └──────┴────────┴──────────┘
  │                  │
  │                  ▼
  │           3.1-3.4: API Endpoints
  │                  │
  │         ┌────────┼────────┐
  │         │        │        │
  │         ▼        ▼        ▼
  │       7.2: Rate 7.3: Auth  4.1-4.2:
  │       Limit    Middleware  Email Templates
  │         │        │        │
  │         └────────┼────────┘
  │                  │
  │                  ▼
  │           5.1-5.2: UI Components
  │                  │
  │                  ▼
  │           6.1: Pages
  │                  │
  │                  ▼
  │           8.1-8.3: Testing & Docs
  │                  │
  └──────────────────┘
                │
                ▼
              END
```

## Critical Path Items

1. **Database Migration** (Task 1.3)
   - Blocker for all other work
   - Must succeed before API endpoints
   - Duration: 5 min

2. **API Endpoints** (Task 3.1-3.4)
   - Core feature set
   - Required for UI components
   - Duration: 250 min

3. **Auth Middleware** (Tasks 2.1, 7.3)
   - Security critical
   - Must be in place before API release
   - Duration: 65 min

4. **UI Components** (Task 5.1-5.2)
   - User-facing features
   - Depends on stable APIs
   - Duration: 300 min

**Total Critical Path:** ~620 minutes (10.3 hours)
**Total Project with Parallels:** ~1,980 minutes (33 hours)

## Testing Strategy

### Unit Tests
- Validation functions (email, password, token)
- Auth utilities (token generation/validation)
- Role checking functions

### Integration Tests
- User CRUD operations
- Invitation flow (create -> email -> accept)
- Password reset flow
- Audit logging
- Role-based access control

### E2E Tests
- Admin creates user and sends invitation
- User accepts invitation and logs in
- Admin updates user role and audit log captures it
- User requests password reset and completes it
- Bulk invite with CSV upload

### Security Tests
- SQL injection attempts in validation
- Token expiration handling
- Rate limiting enforcement
- Password requirements
- Email uniqueness constraints
