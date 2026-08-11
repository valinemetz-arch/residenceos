# Admin User Management - Quick Start Guide

## Before You Start

1. Review: `ADMIN_USER_MANAGEMENT_PLAN.md` (detailed plan with all tasks)
2. Reference: `ADMIN_USER_MANAGEMENT_ARCHITECTURE.md` (system design & flows)
3. Current State: User model exists with basic role field in Prisma
4. Existing Auth: JWT tokens, bcrypt hashing, basic login in place

---

## Phase 1: Database Setup (Start Here!) [30 min]

### Step 1.1: Update Prisma Schema
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/prisma/schema.prisma`

Find the User model and replace it with:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?   // Nullable for invited users
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
  
  // Relations
  auditLogs     AuditLog[]
  
  @@map("users")
}

model AuditLog {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  action        String    // "user_created", "user_updated", "user_deleted", etc.
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

### Step 1.2: Run Migration
```bash
cd /sessions/peaceful-confident-euler/mnt/residenceos
npx prisma migrate dev --name add_user_management
```

✓ Database is now ready!

---

## Phase 2: Core Utilities [65 min]

### Step 2.1: Create Auth Middleware
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/auth-middleware.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "./auth";
import { prisma } from "./prisma";

export async function requireAuth(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { error: "Invalid token", status: 401 };
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    return { error: "User not found or inactive", status: 401 };
  }

  return { user, error: null };
}

export async function requireRole(req: NextRequest, requiredRole: string[]) {
  const authResult = await requireAuth(req);
  if (authResult.error) {
    return authResult;
  }

  const user = authResult.user!;
  
  // Define role hierarchy
  const roleHierarchy: Record<string, number> = {
    owner: 3,
    admin: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const minRequired = Math.max(...requiredRole.map(r => roleHierarchy[r] || 0));

  if (userLevel < minRequired) {
    return { error: "Insufficient permissions", status: 403 };
  }

  return { user, error: null };
}

export async function requireAdmin(req: NextRequest) {
  return requireRole(req, ["admin", "owner"]);
}

export async function requireOwner(req: NextRequest) {
  return requireRole(req, ["owner"]);
}

// Get IP address from request
export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0] || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

// Get user agent from request
export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown";
}
```

### Step 2.2: Create Token Utils
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/token-utils.ts` (NEW)

```typescript
import { randomBytes } from "crypto";

// Generate secure random token
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

// Token expiry utilities
export function getTokenExpiry(hoursFromNow: number): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry;
}

// Check if token is expired
export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}

// Generate invitation token (24-hour expiry)
export function generateInvitationToken() {
  return {
    token: generateToken(),
    expiresAt: getTokenExpiry(24),
  };
}

// Generate password reset token (1-hour expiry)
export function generatePasswordResetToken() {
  return {
    token: generateToken(),
    expiresAt: getTokenExpiry(1),
  };
}
```

### Step 2.3: Update Types
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/types.ts` (UPDATE)

Add to existing file:

```typescript
export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  isInvitationPending: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  performedBy: string;
  ipAddress?: string;
  createdAt: string;
}

export type UserRole = "owner" | "admin" | "viewer";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    "create_user",
    "read_user",
    "update_user",
    "delete_user",
    "manage_roles",
    "view_audit_logs",
    "export_data",
  ],
  admin: [
    "create_user",
    "read_user",
    "update_user",
    "manage_projects",
  ],
  viewer: [],
};
```

---

## Phase 3: Validation & Security [50 min]

### Step 3.1: Update Validation
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/validation.ts` (UPDATE)

Add to existing file:

```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include an uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must include a number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must include a special character (!@#$%^&*)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRole(role: string): boolean {
  return ["owner", "admin", "viewer"].includes(role);
}
```

### Step 3.2: Create Rate Limiting
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/rate-limit.ts` (NEW)

```typescript
// Simple in-memory rate limiting
const requestLog: Map<string, number[]> = new Map();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(key) || [];

  // Remove old requests outside the window
  const recentRequests = timestamps.filter(ts => now - ts < windowMs);

  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  requestLog.set(key, recentRequests);
  return true; // OK
}

export const RATE_LIMITS = {
  PASSWORD_RESET: { limit: 3, windowMs: 3600000 }, // 3 per hour
  INVITE_RESEND: { limit: 1, windowMs: 3600000 }, // 1 per hour
  LOGIN_ATTEMPTS: { limit: 5, windowMs: 900000 }, // 5 per 15 min
};
```

---

## Phase 4: API Endpoints [250 min]

### CRITICAL: All API files go in `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/`

### Step 4.1: User List & Create
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/admin/users/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getClientIp, getUserAgent } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/auth";
import { validateEmail, validatePassword, validateRole } from "@/lib/validation";
import { generateInvitationToken } from "@/lib/token-utils";
import { sendUserInvitationEmail } from "@/lib/email";

// GET /api/admin/users - List all users
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (role) where.role = role;
    if (status === "pending") where.isInvitationPending = true;
    if (status === "inactive") where.isActive = false;
    if (status === "active") {
      where.isActive = true;
      where.isInvitationPending = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isInvitationPending: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

// POST /api/admin/users - Create user or send invitation
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { email, name, role, password } = body;
    const admin = authResult.user!;

    // Validation
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role required" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!validateRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    let user: any;

    if (password) {
      // Create user with password immediately
      const validation = validatePassword(password);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role,
          isActive: true,
          createdBy: admin.id,
        },
      });
    } else {
      // Create user with invitation
      const { token, expiresAt } = generateInvitationToken();
      user = await prisma.user.create({
        data: {
          email,
          password: null,
          name: name || null,
          role,
          isInvitationPending: true,
          invitationToken: token,
          invitationExpiresAt: expiresAt,
          invitationSentAt: new Date(),
          createdBy: admin.id,
        },
      });

      // Send invitation email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const invitationLink = `${appUrl}/auth/accept-invitation?token=${token}`;
      await sendUserInvitationEmail(
        email,
        name || email,
        invitationLink,
        role,
        admin.name || admin.email
      );
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "user_created",
        entityType: "user",
        entityId: user.id,
        newValues: {
          email: user.email,
          role: user.role,
          name: user.name,
        },
        performedBy: admin.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isInvitationPending: user.isInvitationPending,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
```

### Step 4.2: User Detail, Update, Delete
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/app/api/admin/users/[id]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwner, getClientIp, getUserAgent } from "@/lib/auth-middleware";
import { validateRole } from "@/lib/validation";
import { sendRoleChangeNotification, sendAccountDisabledNotification } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isInvitationPending: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        createdBy: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { name, role, isActive } = body;
    const admin = authResult.user!;

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role changes require owner
    if (role && role !== user.role) {
      const ownerAuth = await requireOwner(req);
      if (ownerAuth.error) {
        return NextResponse.json(
          { error: "Only owner can change roles" },
          { status: 403 }
        );
      }
    }

    if (role && !validateRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const oldValues = {
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "user_updated",
        entityType: "user",
        entityId: user.id,
        oldValues,
        newValues: {
          ...(name !== undefined && { name }),
          ...(role && { role }),
          ...(isActive !== undefined && { isActive }),
        },
        performedBy: admin.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    // Send notifications
    if (role && role !== user.role) {
      await sendRoleChangeNotification(
        user.email,
        user.name || user.email,
        user.role,
        role
      );
    }

    if (isActive === false && user.isActive) {
      await sendAccountDisabledNotification(
        user.email,
        user.name || user.email,
        "Account disabled by administrator"
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireOwner(req); // Only owner can delete
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === authResult.user!.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "user_deleted",
        entityType: "user",
        entityId: user.id,
        oldValues: {
          email: user.email,
          role: user.role,
          name: user.name,
        },
        performedBy: authResult.user!.id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
```

### Continue with remaining endpoints...
See `ADMIN_USER_MANAGEMENT_PLAN.md` Task 3.2-3.4 for:
- POST `/admin/users/[id]/resend-invitation`
- POST `/admin/users/bulk-invite`
- GET `/admin/audit-logs`
- POST `/auth/accept-invitation`
- POST `/auth/request-password-reset`
- POST `/auth/reset-password`

---

## Phase 5: Email Templates [75 min]

### Update Email File
**File:** `/sessions/peaceful-confident-euler/mnt/residenceos/lib/email.ts` (UPDATE)

Add these functions to the existing file (after existing `sendBidReminderEmail` function):

```typescript
export async function sendUserInvitationEmail(
  recipientEmail: string,
  inviteeName: string,
  invitationLink: string,
  role: string,
  invitedByName: string
) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to ResidenceOS!</h2>
        <p>Hi ${inviteeName},</p>
        <p>${invitedByName} has invited you to join ResidenceOS as a <strong>${role}</strong> user.</p>
        
        <div style="background: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Your invitation expires in 24 hours.</strong></p>
          <a href="${invitationLink}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
        </div>
        
        <p>If you can't click the link, copy this URL into your browser:</p>
        <p style="word-break: break-all; background: #f9f9f9; padding: 10px; border-left: 3px solid #0066cc;">${invitationLink}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message from ResidenceOS. Do not reply to this email.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: "You're invited to join ResidenceOS",
      html: htmlContent,
    });

    console.log(`Invitation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send invitation email:", error);
  }
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string,
  userName: string
) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the link below to create a new password.</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong> This link expires in 1 hour. Never share this link with anyone.</p>
        </div>
        
        <div style="margin: 20px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>If you didn't request this, you can safely ignore this email.</p>
        
        <p style="font-size: 12px; color: #666;">
          Need help? Contact support at vali@legacyandlandgroup.com
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: "Password Reset Request",
      html: htmlContent,
    });

    console.log(`Password reset email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}

export async function sendRoleChangeNotification(
  recipientEmail: string,
  userName: string,
  oldRole: string,
  newRole: string
) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Role Updated</h2>
        <p>Hi ${userName},</p>
        <p>Your user role in ResidenceOS has been updated.</p>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #0066cc;">
          <p style="margin: 0;"><strong>Previous Role:</strong> ${oldRole}</p>
          <p style="margin: 10px 0 0 0;"><strong>New Role:</strong> ${newRole}</p>
        </div>
        
        <p>This change is effective immediately. You may need to log out and log back in to see the changes.</p>
        
        <p style="font-size: 12px; color: #666;">
          If you have questions, contact support.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: "Your ResidenceOS Role Has Been Updated",
      html: htmlContent,
    });

    console.log(`Role change notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send role change notification:", error);
  }
}

export async function sendAccountDisabledNotification(
  recipientEmail: string,
  userName: string,
  reason: string = ""
) {
  try {
    const reasonText = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Account Disabled</h2>
        <p>Hi ${userName},</p>
        <p>Your ResidenceOS account has been disabled.</p>
        
        <div style="background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          ${reasonText}
          <p style="margin: ${reasonText ? "10px 0 0 0" : "0"};">To reactivate your account, please contact the administrator.</p>
        </div>
        
        <p style="font-size: 12px; color: #666;">
          Questions? Contact support at vali@legacyandlandgroup.com
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: "Your ResidenceOS Account Has Been Disabled",
      html: htmlContent,
    });

    console.log(`Account disabled notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send account disabled notification:", error);
  }
}
```

---

## Phase 6: UI Components [300 min]

### Key Components to Create

See full component specs in `ADMIN_USER_MANAGEMENT_PLAN.md` Task 5.1-5.2

**Start with:**
1. `/app/components/admin/RoleSelector.tsx` (simplest - ~80 lines)
2. `/app/components/admin/UserStatusBadge.tsx` (~40 lines)
3. `/app/components/admin/UserTable.tsx` (~150 lines)
4. `/app/components/admin/UserForm.tsx` (~180 lines)
5. `/app/components/admin/UserManagement.tsx` (~200 lines)

---

## Phase 7: Pages [180 min]

Create pages under `/sessions/peaceful-confident-euler/mnt/residenceos/app/admin/`

1. `users/page.tsx` - Main user management page
2. `users/[id]/page.tsx` - User details page
3. `users/[id]/edit/page.tsx` - Edit user page
4. `audit-logs/page.tsx` - Audit log viewer
5. `settings/page.tsx` - Admin settings

---

## Testing Checklist

Before releasing:

- [ ] Create user with password
- [ ] Create user without password (invitation sent)
- [ ] Accept invitation & set password
- [ ] Login as invited user
- [ ] Request password reset
- [ ] Complete password reset flow
- [ ] Admin changes user role
- [ ] Audit log captures the change
- [ ] Deactivate user
- [ ] User cannot login when deactivated
- [ ] Reactivate user
- [ ] Bulk invite users with CSV
- [ ] Only admin+ can access /admin/users
- [ ] Viewers get 403 error
- [ ] Audit logs are searchable & filterable

---

## Environment Variables Needed

Add to `.env.local`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@residenceos.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (already configured)
NEXTAUTH_SECRET=your-secret-key
```

---

## Next Steps After Implementation

1. **Deployed & Live?** Add user management to your admin guide
2. **User Feedback?** Iterate on UI/UX based on usage
3. **Scale?** Implement Redis for rate limiting instead of in-memory
4. **Advanced?** Add 2FA, OAuth integration, role templates

---

## Quick Links

- Database plan: `ADMIN_USER_MANAGEMENT_PLAN.md` → Phase 1
- API endpoints: `ADMIN_USER_MANAGEMENT_PLAN.md` → Phase 3
- Architecture: `ADMIN_USER_MANAGEMENT_ARCHITECTURE.md`
- Current project: `/sessions/peaceful-confident-euler/mnt/residenceos`

