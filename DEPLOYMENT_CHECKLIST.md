# DocuSign Integration - Deployment Checklist

## Pre-Deployment (Local)

### 1. Database Setup
- [ ] Backup current database (if production)
- [ ] Run migration: `npx prisma migrate dev --name add_docusign_contracts`
- [ ] Verify new fields in contracts table:
  - [ ] envelopeId
  - [ ] signingUrl
  - [ ] signerEmail
  - [ ] signerName
  - [ ] projectDetails
  - [ ] status
  - [ ] sentAt
  - [ ] signedAt
  - [ ] completedAt
  - [ ] documentUrl
- [ ] Verify indexes created on envelopeId, contractorId, status

### 2. Environment Verification
- [ ] Verify `.env.local` contains all DocuSign variables:
  - [ ] DOCUSIGN_INTEGRATION_KEY
  - [ ] DOCUSIGN_USER_ID
  - [ ] DOCUSIGN_ACCOUNT_ID
  - [ ] DOCUSIGN_TEMPLATE_ID
  - [ ] DOCUSIGN_PRIVATE_KEY (with proper formatting)

### 3. Dependencies Check
- [ ] Confirm `jose` is installed: `npm list jose`
- [ ] Confirm `nodemailer` is installed: `npm list nodemailer`
- [ ] No new packages to install

### 4. Code Review
- [ ] Review `/lib/docusign.ts` for correctness
- [ ] Review all API endpoints in `/app/api/contracts/`
- [ ] Review webhook handler: `/app/api/webhooks/docusign/route.ts`
- [ ] Review components (Modal, ContractorsContracts, ContractManagement)
- [ ] Review email functions in `/lib/email.ts`

### 5. Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/contractor` - verify Contracts tab appears
- [ ] Navigate to `/admin` - verify admin page loads
- [ ] Test contract sending API:
  ```bash
  curl -X POST http://localhost:3000/api/contracts/send \
    -H "Content-Type: application/json" \
    -d '{
      "projectId":"test","contractorId":"test",
      "contractorEmail":"test@example.com",
      "contractorName":"Test","projectDetails":{
        "projectName":"Test","tradeService":"Testing","contractAmount":1000
      }}'
  ```
- [ ] Verify contract created in database
- [ ] Verify email sent (check logs)
- [ ] Test contract status endpoint: `curl http://localhost:3000/api/contracts/{envelopeId}/status`
- [ ] Test contractor portal - view contracts
- [ ] Test signing modal opens
- [ ] Verify admin page shows pending contracts

## DocuSign Account Setup

### 1. Configure Webhook
- [ ] Log into DocuSign account
- [ ] Go to Account Settings → Webhooks
- [ ] Add webhook endpoint:
  - [ ] URL: `https://[YOUR_DOMAIN]/api/webhooks/docusign`
  - [ ] Events: `envelope-signed`, `envelope-completed`
  - [ ] Authentication: None (for now)
- [ ] Test webhook connectivity
- [ ] Save webhook configuration

### 2. Verify Template
- [ ] Confirm template ID: `b039551e-d45a-4415-b087-07aec165140a`
- [ ] Verify template has text fields:
  - [ ] ProjectName
  - [ ] ContractAmount
  - [ ] TradeService
  - [ ] LotNumber (optional)
  - [ ] StartDate (optional)
  - [ ] CompletionDate (optional)
- [ ] Verify template has signature field for "Contractor" role

### 3. API Credentials
- [ ] Verify Integration Key is correct
- [ ] Verify User ID is correct
- [ ] Verify Account ID is correct
- [ ] Verify Private Key format (PKCS8, RSA 2048+)

## Staging Deployment

### 1. Deploy Code
- [ ] Push code to staging branch
- [ ] Deploy to staging environment
- [ ] Verify all files present in deployment

### 2. Staging Database
- [ ] Backup staging database
- [ ] Run migration on staging: `npx prisma migrate deploy`
- [ ] Verify schema updated correctly

### 3. Environment Configuration
- [ ] Set environment variables on staging
- [ ] Verify all DocuSign variables present
- [ ] Verify email configuration working

### 4. Integration Testing
- [ ] Test contract sending end-to-end:
  1. [ ] Create/approve a bid
  2. [ ] Go to admin panel
  3. [ ] Send contract to contractor
  4. [ ] Verify email received
  5. [ ] Verify contract status is "sent"

- [ ] Test contractor signing:
  1. [ ] Login as contractor
  2. [ ] View contracts
  3. [ ] Click sign contract
  4. [ ] Open DocuSign
  5. [ ] Sign contract
  6. [ ] Verify status updates to "signed"

- [ ] Test webhook:
  1. [ ] Monitor webhook logs in DocuSign
  2. [ ] Verify webhook received signing event
  3. [ ] Verify contract status updated in DB

- [ ] Test email notifications:
  1. [ ] Verify signing email sent to contractor
  2. [ ] Verify signing link works
  3. [ ] Verify signed notification sent to admin

### 5. Smoke Tests
- [ ] Contractor portal loads
- [ ] Admin panel loads
- [ ] Bid approval flow works
- [ ] Contract sending works
- [ ] Signing works
- [ ] Status updates work

## Production Deployment

### 1. Pre-Deployment Review
- [ ] Get approval from project owner
- [ ] Review all staging test results
- [ ] Create rollback plan
- [ ] Schedule deployment window
- [ ] Notify team of maintenance window (if needed)

### 2. Production Database
- [ ] Backup production database (required!)
- [ ] Export database schema for safety
- [ ] Verify connection to production database
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Verify schema updated correctly
- [ ] Run sanity check queries

### 3. Production Deployment
- [ ] Deploy code to production
- [ ] Verify all files present
- [ ] Verify no old files remain
- [ ] Run health checks

### 4. Configuration
- [ ] Set production environment variables
- [ ] Verify all DocuSign credentials
- [ ] Verify email configuration
- [ ] Verify webhook URL in DocuSign (if different from staging)
- [ ] Update webhook URL in DocuSign account if needed

### 5. Post-Deployment Tests
- [ ] Test contract sending (start with test contractor)
- [ ] Verify email notifications
- [ ] Monitor logs for errors
- [ ] Check database for new records
- [ ] Verify webhook delivery in DocuSign

### 6. Production Monitoring
- [ ] Monitor application logs for 24 hours
- [ ] Check DocuSign webhook delivery
- [ ] Verify email delivery rates
- [ ] Monitor database performance
- [ ] Check for any error spikes

## Rollback Plan

If issues arise in production:

### Quick Rollback
1. [ ] Revert code to previous version
2. [ ] Redeploy previous version
3. [ ] Verify application stability
4. [ ] Keep webhook disabled if needed

### Database Rollback (Last Resort)
```bash
npx prisma migrate resolve --rolled-back add_docusign_contracts
```
Note: This only reverts schema changes, not code changes

### If Webhook Causing Issues
- [ ] Disable webhook in DocuSign account
- [ ] Contracts can still be sent, just won't get auto-updates
- [ ] Re-enable after issues resolved

## Monitoring & Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor DocuSign webhook delivery
- [ ] Verify email delivery

### Weekly
- [ ] Review contract status reports
- [ ] Check for failed sendings
- [ ] Monitor token generation performance

### Monthly
- [ ] Review DocuSign API usage
- [ ] Check rate limits
- [ ] Review signing success rates
- [ ] Plan enhancements

## Known Issues & Workarounds

### Issue: Token generation fails
**Workaround:** Verify private key format and encoding
- Check for extra whitespace
- Verify PKCS8 format
- Check for line ending issues

### Issue: Webhook not received
**Workaround:** Check DocuSign account settings
- Verify webhook URL is correct
- Test webhook connectivity
- Check firewall/network access
- Review DocuSign logs

### Issue: Contract not found in template
**Workaround:** Verify template configuration
- Check template ID is correct
- Verify account permissions
- Ensure text fields match names

### Issue: Email not sent
**Workaround:** Check email configuration
- Verify SMTP credentials
- Check email service status
- Verify domain reputation
- Check spam folder

## Post-Deployment Communication

### Notify Users
- [ ] Inform admins about new contract management feature
- [ ] Explain how to send contracts
- [ ] Inform contractors about signing process
- [ ] Provide support contact information

### Documentation
- [ ] Update user documentation
- [ ] Create FAQ for contractors
- [ ] Create FAQ for admins
- [ ] Document any customizations

### Support
- [ ] Set up support process for signing issues
- [ ] Create escalation procedures
- [ ] Document common issues
- [ ] Train support team

## Success Criteria

- [ ] Contracts can be sent from admin panel
- [ ] Contractors receive signing emails
- [ ] Contractors can sign contracts
- [ ] Signed status updates automatically
- [ ] No errors in application logs
- [ ] DocuSign webhook delivering events
- [ ] Email delivery rate > 95%
- [ ] No database issues or slowdowns

## Final Sign-Off

- [ ] Project Manager: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
- [ ] Business Owner: _________________ Date: _______

---

**Notes:**
- Keep this checklist for future reference
- Document any deviations or custom configurations
- Use this as template for future upgrades
- Review and update after first month of production
