# ResidenceOS Admin User Management - Deployment Checklist

## Pre-Deployment (Local Testing)

### Database & Schema
- [ ] Run database migrations: `npx prisma migrate dev --name add_user_management_system`
- [ ] Verify schema updated: `npx prisma db push`
- [ ] Seed default trades: `npm run db:seed`
- [ ] Verify 12 trades created in database
- [ ] Check tables created: trades, contractor_trades, project_trades, admin_invitations

### API Endpoints Testing
- [ ] Test POST /api/trades (create trade)
- [ ] Test GET /api/trades (list trades)
- [ ] Test POST /api/admin/users (create user)
- [ ] Test GET /api/admin/users (list users)
- [ ] Test GET /api/admin/users/:id (get user)
- [ ] Test PUT /api/admin/users/:id (update user)
- [ ] Test DELETE /api/admin/users/:id (delete user)
- [ ] Test POST /api/admin/invite (send invitation)
- [ ] Test GET /api/admin/invitations/:code (verify invitation)
- [ ] Test POST /api/admin/signup (create admin from invitation)
- [ ] Test POST /api/auth/contractor/signup (contractor registration)
- [ ] Test GET /api/contractor/trades
- [ ] Test POST /api/contractor/trades
- [ ] Test GET /api/projects?contractorId=X

### UI Pages Testing
- [ ] Navigate to /admin - verify dashboard loads
- [ ] Navigate to /admin/users - verify user list loads
  - [ ] Try "Invite Admin" button
  - [ ] Try "Edit" on a user
  - [ ] Try filtering by role
- [ ] Navigate to /admin/trades - verify trades list loads
  - [ ] Try creating a new trade
- [ ] Navigate to /contractor/register - verify registration form
  - [ ] Try registering with trades
  - [ ] Verify redirect to login on success
- [ ] Navigate to /admin/signup/INVALID_CODE - verify error message
- [ ] Request invitation, get code, test /admin/signup/:code
  - [ ] Verify email is pre-filled
  - [ ] Verify can create account
  - [ ] Verify redirect after success

### Authentication & Authorization
- [ ] Test admin can access /admin/users
- [ ] Test viewer cannot access /admin/users
- [ ] Test owner can delete users
- [ ] Test admin cannot delete owner accounts
- [ ] Test jwt token generation
- [ ] Test token expiration

### Email Testing
- [ ] Configure SMTP settings in .env
- [ ] Test email sending for invitations
- [ ] Verify email template renders correctly
- [ ] Verify invitation link is correct

### Functionality Testing
- [ ] Create admin user via invitation
- [ ] Update admin user (name, company, role)
- [ ] Deactivate user
- [ ] Register contractor with multiple trades
- [ ] Update contractor trades
- [ ] Verify contractor sees matching projects only
- [ ] Create project with required trades
- [ ] Verify trade-based filtering works

### Build & Performance
- [ ] Run `npm run build` - verify no errors
- [ ] Check for TypeScript errors: `npx tsc --noEmit`
- [ ] Test production build locally: `npm run build && npm start`
- [ ] Verify all pages load in production mode
- [ ] Check console for any errors or warnings
- [ ] Test API response times

---

## Staging Deployment

### Pre-Deployment
- [ ] Create staging database
- [ ] Set staging environment variables in .env.staging
- [ ] Backup production database
- [ ] Set NEXTAUTH_URL to staging domain

### Deployment
- [ ] Deploy code to staging
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed trades (if first deployment): `npm run db:seed`
- [ ] Verify all environment variables are set
- [ ] Run build process
- [ ] Start application

### Post-Deployment Testing
- [ ] Verify all pages load
- [ ] Test admin panel (/admin)
- [ ] Test user management (/admin/users)
- [ ] Test trades management (/admin/trades)
- [ ] Test contractor registration
- [ ] Test admin invitation flow
- [ ] Test project filtering by contractor
- [ ] Check error logs for issues
- [ ] Monitor database connections

### Security Testing
- [ ] Test SQL injection prevention
- [ ] Test CSRF protection
- [ ] Verify passwords are hashed (not plaintext)
- [ ] Test authorization on protected endpoints
- [ ] Verify email validation works
- [ ] Test invitation code expiration
- [ ] Test invitation code one-time use

---

## Production Deployment

### Pre-Production
- [ ] Review all code changes
- [ ] Run security audit: `npm audit`
- [ ] Update dependencies: `npm update`
- [ ] Set production environment variables
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up email service (SES, SendGrid, etc.)
- [ ] Configure DNS for production domain

### Database
- [ ] Create production database
- [ ] Test database connection
- [ ] Set connection pooling limits
- [ ] Enable SSL for database connections
- [ ] Set up automated backups (daily minimum)
- [ ] Test backup restoration
- [ ] Configure retention policies

### Deployment
- [ ] Deploy code to production
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify database schema matches expectations
- [ ] Seed initial data if needed
- [ ] Verify all environment variables
- [ ] Test application startup
- [ ] Monitor error logs

### Post-Deployment
- [ ] Test all critical user flows
- [ ] Verify email sending works
- [ ] Check dashboard loads correctly
- [ ] Test admin functionality
- [ ] Monitor application performance
- [ ] Check database query performance
- [ ] Verify backups are running

### Monitoring & Maintenance
- [ ] Set up error tracking (Sentry/NewRelic)
- [ ] Monitor application logs
- [ ] Monitor database performance
- [ ] Set up alerting for errors
- [ ] Monitor email delivery
- [ ] Track user signups/invitations
- [ ] Monitor API response times

---

## Production Safety Checks

### Security
- [ ] HTTPS enabled (SSL certificate valid)
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] Password hashing verified
- [ ] Secrets not logged
- [ ] Environment variables not in code

### Data Protection
- [ ] Database encryption at rest
- [ ] Database encryption in transit
- [ ] Backups encrypted
- [ ] Sensitive data not logged
- [ ] PII protected
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policies defined

### Compliance
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] GDPR compliance (EU users)
- [ ] CCPA compliance (CA users)
- [ ] Audit logging enabled
- [ ] Audit logs stored securely

---

## Rollback Plan

If issues occur in production:

1. **Identify the issue**
   - Check error logs
   - Monitor application metrics
   - Check database performance

2. **Rollback steps**
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   npm run build
   npm start
   ```

3. **Database rollback**
   ```bash
   # Revert last migration
   npx prisma migrate resolve --rolled-back <migration-name>
   npx prisma migrate deploy
   ```

4. **Verification**
   - Test all critical flows
   - Check error logs
   - Monitor performance metrics
   - Verify database integrity

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor error logs closely
- [ ] Track user signups
- [ ] Test all critical paths
- [ ] Respond to any user issues
- [ ] Document any problems

### Week 1
- [ ] Review analytics
- [ ] Check performance metrics
- [ ] Plan improvements
- [ ] Update documentation

### Ongoing
- [ ] Monitor logs daily
- [ ] Review database backups
- [ ] Monitor email delivery rates
- [ ] Track system performance
- [ ] Update documentation as needed
- [ ] Plan feature enhancements

---

## Troubleshooting Guide

### Common Issues

**Database Migration Failed**
```bash
# Check migration status
npx prisma migrate status

# Reset to clean state (development only!)
npx prisma migrate reset
```

**Email Not Sending**
- Check SMTP credentials in .env
- Verify email service is configured
- Check email logs for errors
- Test with: `npm run test:email`

**Users Can't Login**
- Verify JWT_SECRET is set
- Check password hashing is working
- Verify database schema includes password column
- Check auth middleware is applied

**404 on Admin Pages**
- Verify routes are created
- Check file paths match URL structure
- Verify app router configuration
- Check for typos in page filenames

**Authorization Errors**
- Verify user role is set correctly
- Check auth middleware functions
- Verify token is being sent in headers
- Check permission logic

---

## Environment Variables Checklist

Required for production:
```
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host/db
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## Performance Targets

- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] Email delivery < 5 seconds
- [ ] 99.9% uptime
- [ ] Zero data loss (backups)

---

## Support & Documentation

- [ ] README.md updated
- [ ] API documentation completed
- [ ] Admin guide written
- [ ] Contractor guide written
- [ ] Troubleshooting guide published
- [ ] Video tutorials recorded (optional)

---

**Last Updated:** 2026-08-11  
**Version:** 1.0  
**Status:** Ready for Production
