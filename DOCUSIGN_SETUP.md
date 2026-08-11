# DocuSign eSignature Integration - Setup Guide

## Overview
This guide covers the complete DocuSign eSignature integration for the ResidenceOS contractor portal, enabling contractors to sign contracts digitally.

## Prerequisites

### Environment Variables (Already Set in .env.local)
```
DOCUSIGN_INTEGRATION_KEY=9b2f585e-f7c0-42fb-a63b-a13432721757
DOCUSIGN_USER_ID=22ada70b-a7a9-4ea8-87a9-96a07fe5b197
DOCUSIGN_ACCOUNT_ID=242621313
DOCUSIGN_TEMPLATE_ID=b039551e-d45a-4415-b087-07aec165140a
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### Required npm Package
Ensure `jsonwebtoken` is installed:
```bash
npm install jsonwebtoken
```

## Database Migration

Run the following command to update the database schema:
```bash
npx prisma migrate dev --name add_docusign_contracts
```

### Changes Made to Schema
- Updated `Contract` model with new fields:
  - `envelopeId` - DocuSign envelope ID (unique)
  - `signingUrl` - Cached signing URL
  - `signerEmail` - Contractor email
  - `signerName` - Contractor name
  - `projectDetails` - JSON field storing project information
  - `status` - Contract status (sent, viewed, signed, completed, voided)
  - `documentUrl` - URL to signed PDF
  - Index on `envelopeId` and `status` for faster queries

- Updated `Project` model:
  - Added `contracts` relation

## Architecture

### Service Layer (`/lib/docusign.ts`)
Handles all DocuSign API interactions:
- JWT authentication with token caching
- Contract sending from template
- Envelope status checking
- Signing URL generation (embedded signing)
- Signed document retrieval

### API Endpoints

#### 1. Send Contract
**Endpoint:** `POST /api/contracts/send`

**Body:**
```json
{
  "projectId": "project-123",
  "contractorId": "contractor-456",
  "contractorEmail": "contractor@company.com",
  "contractorName": "Company Name",
  "projectDetails": {
    "projectName": "123 Main St Renovation",
    "tradeService": "Plumbing",
    "contractAmount": 5000,
    "lotNumber": "LOT-123",
    "startDate": "2026-09-01",
    "completionDate": "2026-09-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "contract-123",
    "envelopeId": "docusign-envelope-id",
    "status": "sent",
    "signingUrl": "https://demo.docusign.net/..."
  }
}
```

#### 2. Check Contract Status
**Endpoint:** `GET /api/contracts/:envelopeId/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "contract-123",
    "envelopeId": "docusign-envelope-id",
    "status": "signed",
    "signingUrl": "https://demo.docusign.net/...",
    "sentAt": "2026-08-11T10:00:00Z",
    "signedAt": "2026-08-11T14:30:00Z",
    "completedAt": null,
    "documentUrl": null
  }
}
```

#### 3. DocuSign Webhook
**Endpoint:** `POST /api/webhooks/docusign`

Receives events from DocuSign when envelopes are:
- Signed
- Completed
- Voided
- Declined

Automatically updates contract status in database.

#### 4. Get Project Contracts
**Endpoint:** `GET /api/contracts/project/:projectId`

Returns all contracts for a specific project.

#### 5. Get Contractor Contracts
**Endpoint:** `GET /api/contracts/contractor/:contractorId`

Returns all contracts for a specific contractor.

## User Workflows

### Admin Workflow: Sending Contracts

1. Admin approves a bid in the project
2. Admin goes to **Admin Center** → **Contract Management**
3. Approved bids without contracts are listed
4. Admin clicks "Send Contract"
5. Modal shows contract details (can edit Trade/Service)
6. Confirm and send
7. Contractor receives email with signing link
8. Contract status updates to "sent"

### Contractor Workflow: Signing Contracts

1. Contractor receives email: "Contract Ready to Sign"
2. Contractor logs into portal
3. Goes to **Contracts** tab
4. Views pending contracts
5. Clicks "Sign Contract"
6. Modal opens with signing instructions
7. Clicks "Sign Now in DocuSign"
8. New window opens DocuSign signing interface
9. Contractor reviews and signs contract
10. Portal automatically detects signing completion
11. Status updates to "signed"
12. Can now download signed PDF

## Components

### ContractorsContracts Component
Displays contracts for a contractor with:
- Contract status badges
- Contract details (amount, dates)
- Sign button for pending contracts
- Download button for signed contracts

### ContractSigningModal Component
Provides interface for signing:
- Contract status tracker
- Instructions for signing
- "Sign Now" button (opens DocuSign in new window)
- Auto-refresh when signing completes
- Completion confirmation

### ContractManagement Component
Admin interface for:
- Viewing approved bids without contracts
- Bulk sending contracts
- Tracking contract status
- View sent contracts with signing status

## Email Notifications

### Contract Sent
- Recipient: Contractor
- Subject: "Contract Ready to Sign: [Project Name]"
- Includes signing URL

### Contract Signed
- Recipient: Owner/Admin
- Subject: "Contract Signed: [Project Name]"
- Confirms signing completion

## Security Considerations

1. **JWT Authentication:** Uses RSA key pair for DocuSign API
2. **Token Caching:** Reduces API calls with 5-minute buffer
3. **Webhook Verification:** Validates DocuSign events (basic)
4. **Database Records:** Maintains audit trail of all contract actions
5. **Email Encryption:** SMTP with TLS for email notifications

## DocuSign Template Setup

The template ID `b039551e-d45a-4415-b087-07aec165140a` expects these fields:

**Text Tabs (fillable fields):**
- `ProjectName` - Project name
- `ContractAmount` - Contract amount (formatted as currency)
- `TradeService` - Trade/service description
- `LotNumber` - Lot number (optional)
- `StartDate` - Project start date (optional)
- `CompletionDate` - Project completion date (optional)

**Signature Tab:**
- Role: "Contractor"
- Email and name automatically populated

## Testing

### Test Contract Sending
```bash
curl -X POST http://localhost:3000/api/contracts/send \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project",
    "contractorId": "test-contractor",
    "contractorEmail": "test@example.com",
    "contractorName": "Test Company",
    "projectDetails": {
      "projectName": "Test Project",
      "tradeService": "Testing",
      "contractAmount": 1000
    }
  }'
```

### Test Status Check
```bash
curl http://localhost:3000/api/contracts/{envelopeId}/status
```

## Troubleshooting

### "Missing DocuSign credentials"
- Verify all four environment variables are set
- Check private key is properly formatted with newlines

### "Failed to get DocuSign access token"
- Verify Integration Key and User ID
- Check that Private Key matches the Integration Key

### "Failed to create DocuSign envelope"
- Verify Template ID is correct
- Ensure template has required fields
- Check account has permissions to use template

### Contract status not updating
- Verify webhook endpoint is accessible
- Check DocuSign webhook configuration in account settings
- Monitor `/api/webhooks/docusign` for incoming events

## Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database migration run: `npx prisma migrate deploy`
- [ ] DocuSign webhook URL configured in account
- [ ] Email service tested and working
- [ ] Admin user can access `/admin` page
- [ ] Test contract sending end-to-end
- [ ] Verify contractor receives email
- [ ] Test contract signing flow
- [ ] Verify signed PDF is accessible
- [ ] Monitor logs for errors

## API Rate Limits

DocuSign has rate limits:
- Token requests: Limited per minute
- API calls: Limited per day based on plan
- Token caching minimizes token requests

## Future Enhancements

1. Bulk contract signing for multiple contractors
2. Contract templates management UI
3. Digital signature verification
4. Contract expiration tracking
5. Amendment/revision signing
6. Audit logs with timestamps
7. Integration with payment systems
8. Mobile-optimized signing experience
