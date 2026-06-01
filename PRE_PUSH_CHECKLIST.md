# ✅ Pre-Push Checklist for GitHub

## 🚨 CRITICAL SECURITY CHECKS

Before pushing to GitHub, complete ALL items in this checklist:

---

## 🔐 Secrets & Credentials

- [ ] **No `.env` file in repository**
  ```bash
  git status | grep .env
  # Should return nothing
  ```

- [ ] **No hardcoded API keys in code**
  ```bash
  grep -r "pk_live\|sk_live\|pk_test\|sk_test" src/
  # Should return nothing or only in .env.example
  ```

- [ ] **No M-Pesa credentials in code**
  ```bash
  grep -r "consumer_key\|consumer_secret\|passkey" src/
  # Should return nothing or only in .env.example
  ```

- [ ] **No database credentials**
  ```bash
  grep -r "password\|PASSWORD" src/ | grep -v ".example"
  # Should return nothing
  ```

- [ ] **Verified .gitignore is working**
  ```bash
  git check-ignore .env
  # Should output: .env
  ```

---

## 📝 Documentation

- [ ] **README.md is complete**
  - Installation instructions
  - Configuration guide
  - Deployment steps
  - Contact information

- [ ] **COMPLIANCE.md reviewed**
  - Regulatory requirements listed
  - Disclaimers included
  - License information correct

- [ ] **SECURITY.md updated**
  - Security features documented
  - Known issues listed (if any)
  - Security contact provided

- [ ] **.env.example is up to date**
  - All required variables listed
  - No actual secrets included
  - Clear comments for each variable

---

## 🧹 Code Quality

- [ ] **No console.log in production code**
  ```bash
  grep -r "console.log" src/ | grep -v "auditLog"
  # Review and remove unnecessary logs
  ```

- [ ] **No commented-out code**
  - Remove old/unused code
  - Clean up TODO comments

- [ ] **TypeScript compiles without errors**
  ```bash
  npm run build
  # Should complete successfully
  ```

- [ ] **No sensitive comments**
  ```bash
  grep -ri "password\|secret\|key\|token" src/ | grep "//"
  # Review any matches
  ```

---

## 🧪 Testing

- [ ] **Application builds successfully**
  ```bash
  npm run build
  ```

- [ ] **Development server runs**
  ```bash
  npm run dev
  # Test in browser
  ```

- [ ] **All payment flows tested**
  - M-Pesa STK Push flow
  - Paystack payment flow
  - Error handling

- [ ] **Security features working**
  - Input validation
  - Rate limiting
  - Audit logging

---

## 📦 Dependencies

- [ ] **No vulnerabilities in dependencies**
  ```bash
  npm audit
  # Fix any high/critical vulnerabilities
  ```

- [ ] **Dependencies up to date**
  ```bash
  npm outdated
  # Update if necessary
  ```

- [ ] **No unused dependencies**
  ```bash
  npm prune
  ```

---

## 🔍 Git History

- [ ] **No secrets in commit history**
  ```bash
  git log -p | grep -i "key\|secret\|password"
  # Should return nothing sensitive
  ```

- [ ] **Commit messages are clear**
  - Descriptive commit messages
  - No sensitive information in messages

- [ ] **No large files committed**
  ```bash
  git ls-files | xargs ls -lh | sort -k5 -hr | head -10
  # Check for unexpectedly large files
  ```

---

## 🌐 Configuration

- [ ] **Production URLs updated**
  - Callback URLs point to production domain
  - API endpoints configured correctly

- [ ] **Environment set correctly**
  ```typescript
  // In code, check:
  VITE_APP_ENV !== 'development'
  ```

- [ ] **Security headers configured**
  - CSP headers in place
  - HTTPS enforcement enabled

---

## 📋 Legal & Compliance

- [ ] **LICENSE file included**
  - Correct license type
  - Year and copyright holder updated

- [ ] **Disclaimers present**
  - Not official Safaricom service
  - Demonstration purpose stated
  - Regulatory compliance notice

- [ ] **Privacy policy prepared** (if applicable)
  - Data collection disclosed
  - User rights explained
  - Contact information provided

---

## 🚀 Deployment Preparation

- [ ] **Deployment platform chosen**
  - Vercel / Netlify / Custom server

- [ ] **Environment variables documented**
  - List of required variables
  - Instructions for setting them up

- [ ] **Monitoring set up** (recommended)
  - Error tracking (Sentry)
  - Analytics (Google Analytics)
  - Uptime monitoring

---

## 🔒 Final Security Scan

Run these commands before pushing:

```bash
# 1. Check for secrets
git diff --cached | grep -i "key\|secret\|password\|token"

# 2. Verify .env is ignored
git status | grep .env

# 3. Check file permissions
find . -type f -name "*.env*" -ls

# 4. Scan for sensitive patterns
grep -r "pk_live\|sk_live" . --exclude-dir=node_modules --exclude-dir=.git

# 5. Verify build works
npm run build
```

---

## ✅ Ready to Push

If ALL items are checked, you're ready to push:

```bash
# Add files
git add .

# Commit with clear message
git commit -m "feat: Add payment integration with security features"

# Push to GitHub
git push origin main
```

---

## 🚨 If You Find Issues

### **Found Secrets in Code?**
1. Remove them immediately
2. Move to environment variables
3. Update .env.example
4. Test thoroughly

### **Found Secrets in Git History?**
1. **DO NOT PUSH**
2. Clean git history (see SECRETS_MANAGEMENT.md)
3. Rotate compromised credentials
4. Re-verify before pushing

### **Build Fails?**
1. Fix TypeScript errors
2. Resolve dependency issues
3. Test locally
4. Try again

---

## 📞 Need Help?

- **Security Issues**: Review SECRETS_MANAGEMENT.md
- **Compliance Questions**: Review COMPLIANCE.md
- **Technical Issues**: Check README.md
- **Payment Integration**: Review PAYMENT_INTEGRATION.md

---

## 🎯 Post-Push Actions

After successfully pushing:

- [ ] **Verify GitHub Actions** (if configured)
  - Check build status
  - Review test results

- [ ] **Check GitHub Security Alerts**
  - Review any detected secrets
  - Fix immediately if found

- [ ] **Update Project Board** (if using)
  - Move tasks to done
  - Update documentation

- [ ] **Notify Team**
  - Announce new features
  - Share deployment notes

---

**Remember: It's better to be safe than sorry. Take your time with this checklist!**

**Last Updated**: June 2, 2026