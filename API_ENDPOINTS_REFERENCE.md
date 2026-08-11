# ResidenceOS Admin User Management - API Reference

## Overview
This document provides a quick reference for all API endpoints in the Admin User Management system.

---

## Authentication
All endpoints marked with `[AUTH]` require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Trades API

### GET /api/trades
**Description:** List all available trades  
**Auth:** Not required  
**Method:** GET  
**Response:**
```json
{
  "trades": [
    { "id": "cuid", "name": "Plumbing", "description": "..." },
    { "id": "cuid", "name": "Electrical", "description": "..." }
  ]
}
```

### POST /api/trades
**Description:** Create a new trade (Admin only)  
**Auth:** Required [ADMIN]  
**Method:** POST  
**Body:**
```json
{
  "name": "Solar Installation",
  "description": "Solar panel installation and maintenance"
}
```
**Response:** `201 Created`
```json
{
  "trade": { "id": "cuid", "name": "Solar Installation", "description": "..." }
}
```

---

## User Management API (Admin Only)

### GET /api/admin/users
**Description:** List all users with pagination and filtering  
**Auth:** Required [ADMIN]  
**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `role` (optional: "admin" or "viewer")

**Response:**
```json
{
  "users": [
    {
      "id": "cuid",
      "email": "admin@example.com",
      "name": "John Admin",
      "role": "admin",
      "company": "Acme Inc",
      "isActive": true,
      "lastLoginAt": "2026-08-11T10:00:00Z",
      "createdAt": "2026-08-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### POST /api/admin/users
**Description:** Create a new user (Admin only)  
**Auth:** Required [ADMIN]  
**Body:**
```json
{
  "email": "user@example.com",
  "name": "Jane Viewer",
  "role": "viewer",
  "company": "Company Name",
  "password": "SecurePassword123!"
}
```
**Response:** `201 Created`
```json
{
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "Jane Viewer",
    "role": "viewer",
    "company": "Company Name",
    "isActive": true,
    "createdAt": "2026-08-11T10:00:00Z"
  }
}
```

### GET /api/admin/users/:id
**Description:** Get details for a specific user  
**Auth:** Required [ADMIN]  
**Response:**
```json
{
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "Jane Viewer",
    "role": "viewer",
    "company": "Company Name",
    "isActive": true,
    "lastLoginAt": "2026-08-11T10:00:00Z",
    "createdAt": "2026-08-10T10:00:00Z",
    "updatedAt": "2026-08-11T10:00:00Z"
  }
}
```

### PUT /api/admin/users/:id
**Description:** Update user details  
**Auth:** Required [ADMIN]  
**Body:**
```json
{
  "name": "Jane Updated",
  "role": "admin",
  "company": "New Company",
  "isActive": true
}
```
**Response:** `200 OK`
```json
{
  "user": { /* updated user object */ }
}
```

### DELETE /api/admin/users/:id
**Description:** Deactivate a user (soft delete - marks as inactive)  
**Auth:** Required [OWNER]  
**Note:** Cannot delete owner accounts or self  
**Response:** `200 OK`
```json
{
  "message": "User deactivated",
  "user": { "id": "cuid", "email": "user@example.com" }
}
```

---

## Admin Invitation API

### POST /api/admin/invite
**Description:** Send invitation email to create new admin account  
**Auth:** Required [ADMIN]  
**Body:**
```json
{
  "email": "newadmin@example.com"
}
```
**Response:** `201 Created`
```json
{
  "message": "Invitation sent successfully",
  "invitation": {
    "email": "newadmin@example.com",
    "expiresAt": "2026-08-18T10:00:00Z",
    "code": "hex-string-here"
  }
}
```

### GET /api/admin/invitations/:code
**Description:** Verify an invitation code is valid  
**Auth:** Not required  
**Response:** `200 OK`
```json
{
  "email": "newadmin@example.com",
  "isValid": true
}
```
**Error Response (Invalid/Expired):** `400/404 Bad Request`
```json
{
  "error": "Invitation has expired"
}
```

### POST /api/admin/signup
**Description:** Create admin account from valid invitation code  
**Auth:** Not required  
**Body:**
```json
{
  "code": "hex-string-from-invitation",
  "name": "Admin User",
  "password": "SecurePassword123!",
  "passwordConfirm": "SecurePassword123!"
}
```
**Response:** `201 Created`
```json
{
  "message": "Admin account created successfully",
  "user": {
    "id": "cuid",
    "email": "newadmin@example.com",
    "name": "Admin User",
    "role": "admin",
    "createdAt": "2026-08-11T10:00:00Z"
  }
}
```

---

## Contractor API

### POST /api/auth/contractor/signup
**Description:** Self-register as a contractor with trade selection  
**Auth:** Not required  
**Body:**
```json
{
  "email": "contractor@example.com",
  "password": "SecurePassword123!",
  "companyName": "ABC Plumbing",
  "contactName": "John Smith",
  "phone": "(555) 123-4567",
  "trades": ["trade-id-1", "trade-id-2"]
}
```
**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "contractor@example.com",
    "companyName": "ABC Plumbing",
    "trades": [
      { "id": "trade-id-1", "name": "Plumbing" },
      { "id": "trade-id-2", "name": "HVAC" }
    ]
  },
  "message": "Contractor registered successfully"
}
```

### GET /api/contractor/trades
**Description:** Get contractor's current trades  
**Auth:** Required  
**Headers:** Add `x-contractor-id: contractor-id` header  
**Response:**
```json
{
  "trades": [
    { "id": "trade-id-1", "name": "Plumbing" },
    { "id": "trade-id-2", "name": "HVAC" }
  ]
}
```

### POST /api/contractor/trades
**Description:** Update contractor's trade specialties  
**Auth:** Required  
**Body:**
```json
{
  "contractorId": "contractor-id",
  "tradeIds": ["trade-id-1", "trade-id-2", "trade-id-3"]
}
```
**Response:** `200 OK`
```json
{
  "message": "Trades updated successfully",
  "trades": [
    { "id": "trade-id-1", "name": "Plumbing" },
    { "id": "trade-id-2", "name": "HVAC" },
    { "id": "trade-id-3", "name": "Electrical" }
  ]
}
```

---

## Projects API

### GET /api/projects
**Description:** List projects, optionally filtered by contractor  
**Auth:** Not required  
**Query Parameters:**
- `contractorId` (optional) - Returns only projects matching contractor's trades

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-id",
      "name": "Kitchen Renovation",
      "address": "123 Main St",
      "description": "Full kitchen remodel",
      "budget": 50000,
      "startDate": "2026-09-01T00:00:00Z",
      "endDate": "2026-11-01T00:00:00Z",
      "status": "active",
      "spaces": [
        { "id": "space-id", "name": "Kitchen" }
      ],
      "bids": [],
      "trades": [
        { "trade": { "id": "trade-id-1", "name": "Plumbing" } },
        { "trade": { "id": "trade-id-2", "name": "Electrical" } }
      ]
    }
  ]
}
```

### POST /api/projects
**Description:** Create a new project  
**Auth:** Not required (should be)  
**Body:**
```json
{
  "name": "New Project",
  "address": "456 Oak Ave",
  "description": "Project description",
  "budget": 100000,
  "startDate": "2026-09-01T00:00:00Z",
  "endDate": "2026-12-01T00:00:00Z"
}
```
**Response:** `201 Created`

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** Missing or invalid authentication token

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```
**Cause:** User lacks required permissions for this action

### 400 Bad Request
```json
{
  "error": "Valid email is required"
}
```
**Cause:** Invalid input data

### 404 Not Found
```json
{
  "error": "User not found"
}
```
**Cause:** Resource doesn't exist

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```
**Cause:** Duplicate resource

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch users"
}
```
**Cause:** Server-side error

---

## Common Usage Examples

### Inviting a New Admin
```bash
curl -X POST http://localhost:3000/api/admin/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newadmin@example.com"}'
```

### Creating a New User
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@example.com",
    "name": "Viewer User",
    "role": "viewer",
    "password": "Password123!"
  }'
```

### Registering as Contractor
```bash
curl -X POST http://localhost:3000/api/auth/contractor/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contractor@example.com",
    "password": "Password123!",
    "companyName": "ABC Plumbing",
    "trades": ["plumbing-id", "hvac-id"]
  }'
```

### Getting Projects for Contractor
```bash
curl http://localhost:3000/api/projects?contractorId=contractor-id
```

---

## Rate Limiting
Currently not implemented. Recommended for production:
- 100 requests per minute per IP for public endpoints
- 50 requests per minute per user for authenticated endpoints
- 10 invitations per hour per admin

---

**Last Updated:** 2026-08-11  
**API Version:** 1.0
