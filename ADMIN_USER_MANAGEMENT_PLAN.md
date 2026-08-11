# Admin User Management System - Implementation Plan

## Overview
Build a complete Admin User Management system for the ResidenceOS application. The system allows admin users (with `admin` or `owner` roles) to manage platform users, assign roles, track user activity, and send invitations.

**Current Date:** August 11, 2026  
**Target User Role:** Owner/Admin  
**Existing Context:** Basic User model with role field (owner, admin, viewer), JWT auth, bcrypt password hashing

---

## PHASE 1: DATABASE SCHEMA UPDATES

### Task 1.1: Extend User Model
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/prisma/schema.prisma`

Add these fields to the User model:
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?   // Nullable for invited users (password set on first login)
  name          String?
  role          String    @default("viewer") // owner, admin, viewer
  
  // User Management Fields
  isActive      Boolean   @default(true)
  isInvitationPending Boolean @default(false)
  invitationToken String?  @unique
  invitationSentAt DateTime?
  invitationExpiresAt DateTime?
  passwordResetToken String? @unique
  passwordResetExpiresAt DateTime?
  lastLoginAt   DateTime?
  lastLoginIp   String?
  
  // Audit Fields
  createdBy     String?   // Admin ID who created this user
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations (for future audit logs)
  auditLogs     AuditLog[]
  
  @@map("users")
}
```

### Task 1.2: Create AuditLog Model
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/prisma/schema.prisma`

Add new model for tracking admin actions:
```prisma
model AuditLog {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  action        String    // "user_created", "user_updated", "user_deleted", "role_changed", "password_reset", etc.
  entityType    String    // "user", "project", etc.
  entityId      String?   // ID of affected entity
  oldValues     Json?     // Previous values
  newValues     Json?     // Updated values
  
  performedBy   String    // Admin ID who performed action
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime  @default(now())
  
  @@map("audit_logs")
  @@index([userId])
  @@index([performedBy])
  @@index([action])
  @@index([createdAt])
}
```

### Task 1.3: Create Migration
**Command:**
```bash
cd /sessions/peaceful-confident-euler/mnt/residenceos
npx prisma migrate dev --name add_user_management
```

**Estimated Duration:** 5 minutes

---

## PHASE 2: AUTH & MIDDLEWARE UPDATES

### Task 2.1: Create Auth Utilities for User Management
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/auth-middleware.ts` (NEW)

```typescript
// Auth middleware utilities
// - verifyAdminToken(req): Verify user is admin/owner
// - getRoleFromToken(req): Extract role from JWT
// - requireRole(requiredRole): Middleware wrapper
// - generateInvitationToken(): Create secure token
// - validateInvitationToken(): Verify token not expired
```

**Estimated Duration:** 30 minutes

### Task 2.2: Create Token Generation Utilities
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/token-utils.ts` (NEW)

Generate secure tokens for:
- Invitation links (24-hour expiry)
- Password reset (1-hour expiry)
- Email verification

**Estimated Duration:** 20 minutes

### Task 2.3: Update Auth Types
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/types.ts`

Add TypeScript interfaces for user management:
```typescript
interface UserWithoutPassword {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface UserInvitation {
  email: string;
  role: string;
  invitedBy: string;
  invitationLink: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedBy: string;
  createdAt: string;
}
```

**Estimated Duration:** 15 minutes

---

## PHASE 3: API ENDPOINTS

### Task 3.1: User CRUD Endpoints
**Folder:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/admin/users/`

Create the following routes:

#### GET `/api/admin/users`
- List all users with pagination
- Filter by role, status, lastLogin
- Sort by createdAt, lastLoginAt, name
- Requires admin role

**File:** `route.ts` - ~80 lines

#### POST `/api/admin/users`
- Create new user OR send invitation
- Validate email uniqueness
- If password provided: create user immediately
- If no password: send invitation email with token link
- Log audit action

**File:** `route.ts` - ~120 lines

#### GET `/api/admin/users/[id]`
- Get single user details
- Include last login info, activity summary
- Requires admin role

**File:** `[id]/route.ts` - ~50 lines

#### PUT `/api/admin/users/[id]`
- Update user (name, role, active status)
- Log before/after values in audit log
- Cannot update own role (requires owner)
- Validate role against permissions

**File:** `[id]/route.ts` - ~90 lines

#### DELETE `/api/admin/users/[id]`
- Soft delete (set isActive = false)
- Cannot delete self
- Log deletion with reason
- Requires owner role

**File:** `[id]/route.ts` - ~60 lines

#### POST `/api/admin/users/[id]/resend-invitation`
- Resend invitation to pending users
- Generate new invitation token
- Rate limit: 1 per hour per user

**File:** `[id]/resend-invitation/route.ts` - ~50 lines

### Task 3.2: Bulk User Operations
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/admin/users/bulk-invite/route.ts`

- Accept CSV or JSON with email list
- Validate emails
- Send batch invitations
- Return success/failure report

**Estimated Duration:** 60 lines - 45 minutes

### Task 3.3: User Authentication Endpoints

#### POST `/api/auth/accept-invitation`
- Accept invitation using token
- Set password for first time
- Clear invitation fields
- Return auth token

**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/auth/accept-invitation/route.ts` - ~70 lines

#### POST `/api/auth/request-password-reset`
- Accept email
- Generate reset token
- Send email with reset link
- Rate limit: 3 per hour per email

**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/auth/request-password-reset/route.ts` - ~60 lines

#### POST `/api/auth/reset-password`
- Accept token and new password
- Validate token not expired
- Update password
- Clear token
- Log action

**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/auth/reset-password/route.ts` - ~70 lines

### Task 3.4: Audit Log Endpoints
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/admin/audit-logs/route.ts`

#### GET `/api/admin/audit-logs`
- List audit logs
- Filter by action, user, entity type
- Pagination
- Sort by date descending
- Export to CSV support

**Estimated Duration:** 80 lines - 40 minutes

---

## PHASE 4: EMAIL TEMPLATES

### Task 4.1: Email Template Functions
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/email.ts` (UPDATE)

Add new email functions to existing file:

#### `sendUserInvitationEmail()`
Parameters: email, inviteeName, invitationLink, role, invitedByName
- Professional HTML template with branding
- Clear CTA button
- 24-hour expiry notice
- Fallback text link

#### `sendPasswordResetEmail()`
Parameters: email, resetLink, userName
- Clear security notice
- 1-hour expiry
- Security warning about never sharing links
- Alternative support contact

#### `sendWelcomeEmail()`
Parameters: email, userName
- Welcome message
- Getting started guide
- Permission/role explanation
- Support contact

#### `sendRoleChangeNotification()`
Parameters: email, userName, oldRole, newRole
- Notification of role change
- Effective immediately
- Link to documentation

#### `sendAccountDisabledNotification()`
Parameters: email, userName, reason
- Account disabled notice
- Contact admin for reactivation
- Reason (if provided)

**Estimated Duration:** 150 lines - 45 minutes

### Task 4.2: Email Template Files
Create HTML/text template files for better management:
- `templates/invitation-email.html`
- `templates/password-reset-email.html`
- `templates/welcome-email.html`
- `templates/role-change-email.html`

**Estimated Duration:** 30 minutes

---

## PHASE 5: UI COMPONENTS

### Task 5.1: Core Components
**Folder:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/components/admin/`

#### UserTable.tsx
- Display user list in table format
- Columns: Name, Email, Role, Last Login, Status, Actions
- Sortable columns
- Clickable rows to view details
- Batch selection checkboxes
- 100-150 lines

#### UserForm.tsx
- Create/Edit user form
- Fields: Email, Name, Role, Active status
- Email validation and uniqueness check
- Role selector with descriptions
- Option to send invitation instead of setting password
- Form validation
- 150-180 lines

#### UserDetail.tsx
- Full user information view
- Last login details, IP address
- Role information
- Activity history
- Edit/delete/reset password buttons
- 120-150 lines

#### UserManagement.tsx (Main Page Component)
- Header with search and create button
- Tab navigation (Active Users, Pending Invitations, Inactive Users)
- UserTable component with different filters per tab
- Bulk actions dropdown
- Statistics cards (total users, admins, etc.)
- 180-220 lines

#### BulkInviteModal.tsx
- CSV/JSON upload interface
- Email list textarea
- Role selector
- Validation preview
- Send button with confirmation
- Success/error report
- 140-170 lines

#### AuditLogTable.tsx
- Display audit logs
- Columns: Date, Action, User, Entity, Details
- Filtering by date range, action type
- Export to CSV
- 100-130 lines

#### InvitationTokenForm.tsx (For accepting invitations)
- Display invitation details
- Password creation form
- Terms acceptance checkbox
- Submit button
- 80-110 lines

#### PasswordResetForm.tsx
- Request form (email input)
- Reset form (new password input)
- Password strength indicator
- 90-120 lines

### Task 5.2: Utility Components
**Folder:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/components/admin/`

#### RoleSelector.tsx
- Dropdown for role selection
- Show role descriptions/permissions
- Disable options user isn't allowed to assign
- 60-80 lines

#### UserStatusBadge.tsx
- Display user status (active, pending invitation, inactive)
- Color coded
- 30-40 lines

#### PermissionGuard.tsx
- Wrapper component for permission-based rendering
- Accept required role prop
- Show fallback if unauthorized
- 40-50 lines

---

## PHASE 6: PAGES

### Task 6.1: User Management Pages
**Folder:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/admin/`

#### `users/page.tsx` - Main Users Page
- Layout with header
- Integration of UserManagement component
- Breadcrumb navigation
- Quick stats
- 80-100 lines

#### `users/[id]/page.tsx` - User Detail Page
- Integration of UserDetail component
- Edit/Delete actions
- Back button
- Related activity section
- 70-90 lines

#### `users/[id]/edit/page.tsx` - Edit User Page
- Integration of UserForm in edit mode
- Pre-fill current data
- Cancel/Save buttons
- 60-80 lines

#### `audit-logs/page.tsx` - Audit Logs Page
- Integration of AuditLogTable
- Date range filter sidebar
- Export controls
- 80-100 lines

#### `settings/page.tsx` - Admin Settings (Future)
- User management settings
- Notification preferences
- Placeholder for future features
- 50 lines (initially sparse)

---

## PHASE 7: SECURITY & VALIDATION

### Task 7.1: Validation Layer
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/validation.ts` (UPDATE)

Add validation functions:
```typescript
- validateEmail(email): Check format and uniqueness
- validatePassword(password): Strength requirements (min 8 chars, uppercase, number, special char)
- validateRole(role): Ensure valid role value
- validateInvitationToken(token): Check validity and expiry
- validatePasswordResetToken(token): Check validity and expiry
```

**Estimated Duration:** 60 lines - 20 minutes

### Task 7.2: Rate Limiting
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/rate-limit.ts` (NEW)

Simple in-memory rate limiting:
```typescript
- rateLimitByEmail(email, action, limit, windowMs): Limit requests per email
- rateLimitByIp(ip, action, limit, windowMs): Limit requests per IP
```

For production: integrate with Redis or similar

**Estimated Duration:** 80 lines - 30 minutes

### Task 7.3: Authorization Middleware
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/auth-middleware.ts` (UPDATE)

Add middleware for API routes:
```typescript
- requireAuth(req): Verify token exists and is valid
- requireRole(req, role): Verify user has required role
- requireAdmin(req): Verify user is admin or owner
- requireOwner(req): Verify user is owner
```

**Estimated Duration:** 100 lines - 35 minutes

---

## PHASE 8: TESTING & DOCUMENTATION

### Task 8.1: API Testing
Create test cases for:
- User creation/update/delete
- Invitation flow
- Password reset flow
- Role-based access control
- Audit logging

**Estimated Duration:** 2 hours

### Task 8.2: Component Testing
Test components:
- UserTable sorting/filtering
- Forms validation
- Modal interactions
- Permission checks

**Estimated Duration:** 1.5 hours

### Task 8.3: Documentation
- Update README with admin features
- Create user role documentation
- Add API endpoint documentation
- Create admin guide for users

**Estimated Duration:** 1 hour

---

## DEPENDENCIES & EXECUTION ORDER

### Dependency Graph:

```
1.1 Extend User Model
1.2 Create AuditLog Model
    ↓
1.3 Create Migration ← Must run before any code using new fields
    ↓
2.1 Auth Utilities ← Depends on User model updates
2.2 Token Utils ← Independent
2.3 Types Update ← Depends on models
    ↓
3.1-3.4 API Endpoints ← Depends on 2.x
    ↓
4.1-4.2 Email Templates ← Independent, can run parallel
    ↓
5.1-5.2 UI Components ← Depends on 3.x and 4.x
    ↓
6.1 Pages ← Depends on 5.x
    ↓
7.1-7.3 Security/Validation ← Should be done early but after 3.x
    ↓
8.x Testing & Documentation ← Final phase
```

### Recommended Execution Order:

**Day 1 (Database & Auth):**
1. Task 1.1-1.3: Database schema & migration (30 min)
2. Task 2.1-2.3: Auth utilities & types (60 min)
3. Task 7.1-7.3: Validation & auth middleware (90 min)

**Day 2 (API Endpoints):**
4. Task 3.1: User CRUD endpoints (120 min)
5. Task 3.2-3.4: Additional endpoints (120 min)
6. Task 7.1-7.3: Complete security layer (30 min remaining)

**Day 3 (Email & UI):**
7. Task 4.1-4.2: Email templates (75 min)
8. Task 5.1-5.2: UI components (180 min)

**Day 4 (Pages & Polish):**
9. Task 6.1: Pages (120 min)
10. Task 8.1-8.3: Testing & documentation (180 min)

---

## ESTIMATED TOTALS

| Phase | Tasks | Lines of Code | Duration |
|-------|-------|----------------|----------|
| 1. Database | 1.1-1.3 | 150 | 30 min |
| 2. Auth & Middleware | 2.1-2.3 | 200 | 65 min |
| 3. API Endpoints | 3.1-3.4 | 800 | 250 min |
| 4. Email Templates | 4.1-4.2 | 300 | 75 min |
| 5. UI Components | 5.1-5.2 | 1,500 | 300 min |
| 6. Pages | 6.1 | 400 | 180 min |
| 7. Security | 7.1-7.3 | 250 | 85 min |
| 8. Testing & Docs | 8.1-8.3 | 200 | 240 min |
| **TOTAL** | **32** | **~3,800** | **~33 hours** |

---

## KEY CONSIDERATIONS

### Security:
- Never expose passwords in logs or responses
- Always hash passwords before storage
- Validate tokens on every use
- Rate limit sensitive endpoints
- Log all admin actions
- Clear sensitive data from memory

### Performance:
- Index audit logs by userId, performedBy, action, createdAt
- Paginate user lists (default 50 per page)
- Cache role definitions
- Consider lazy loading audit logs

### UX:
- Clear error messages for validation
- Loading states for async operations
- Confirmation dialogs for destructive actions
- Dark mode support (already in design system)
- Mobile responsive tables

### Future Enhancements:
- Two-factor authentication (2FA)
- OAuth/SAML integration
- Role templates (create custom roles)
- Time-based role expiration
- Webhook notifications for admin actions
- Advanced audit log filtering/export
- User activity dashboard

---

## TESTING CHECKLIST

- [ ] User creation with password
- [ ] User creation with invitation email
- [ ] Invitation acceptance and password set
- [ ] Password reset flow
- [ ] Role change audit logging
- [ ] User deactivation
- [ ] Bulk user invite with CSV
- [ ] Audit log filtering and export
- [ ] Role-based access control (viewer can't access admin panel)
- [ ] Rate limiting on sensitive endpoints
- [ ] Token expiration handling
- [ ] Email delivery
- [ ] Database constraints (unique email, etc.)

---

## FILE CHECKLIST

### New Files to Create:
- [ ] prisma/schema.prisma (updated)
- [ ] lib/auth-middleware.ts
- [ ] lib/token-utils.ts
- [ ] lib/rate-limit.ts
- [ ] app/api/admin/users/route.ts
- [ ] app/api/admin/users/[id]/route.ts
- [ ] app/api/admin/users/[id]/resend-invitation/route.ts
- [ ] app/api/admin/users/bulk-invite/route.ts
- [ ] app/api/admin/audit-logs/route.ts
- [ ] app/api/auth/accept-invitation/route.ts
- [ ] app/api/auth/request-password-reset/route.ts
- [ ] app/api/auth/reset-password/route.ts
- [ ] app/components/admin/UserTable.tsx
- [ ] app/components/admin/UserForm.tsx
- [ ] app/components/admin/UserDetail.tsx
- [ ] app/components/admin/UserManagement.tsx
- [ ] app/components/admin/BulkInviteModal.tsx
- [ ] app/components/admin/AuditLogTable.tsx
- [ ] app/components/admin/RoleSelector.tsx
- [ ] app/components/admin/UserStatusBadge.tsx
- [ ] app/components/admin/PermissionGuard.tsx
- [ ] app/admin/users/page.tsx
- [ ] app/admin/users/[id]/page.tsx
- [ ] app/admin/users/[id]/edit/page.tsx
- [ ] app/admin/audit-logs/page.tsx
- [ ] app/admin/settings/page.tsx

### Files to Update:
- [ ] lib/email.ts (add new email templates)
- [ ] lib/validation.ts (add new validators)
- [ ] lib/auth.ts (no changes needed - already good)
- [ ] lib/types.ts (add new interfaces)
