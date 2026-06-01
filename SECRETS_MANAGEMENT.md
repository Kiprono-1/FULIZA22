# 🔐 Secrets Management Guide

## ⚠️ CRITICAL: Protecting Your Secrets

**NEVER commit secrets to GitHub!** This guide helps you manage sensitive credentials securely.

---

## 🚨 What Are Secrets?

Secrets are sensitive credentials that must be protected:

### **Payment Provider Credentials**
- ❌ Paystack API keys (public and secret)
- ❌ M-Pesa Consumer Key and Secret
- ❌ M-Pesa Passkey
- ❌ Business shortcodes

### **Encryption & Security**
- ❌ Encryption keys
- ❌ JWT secrets
- ❌ Session secrets
- ❌ API tokens

### **Database & Services**
- ❌ Database connection strings
- ❌ Redis URLs
- ❌ SMTP passwords
- ❌ SMS API keys

### **Certificates & Keys**
- ❌ SSL/TLS certificates
- ❌ Private keys (.pem, .key files)
- ❌ SSH keys

---

## ✅ How to Protect Secrets

### 1. **Use Environment Variables**

**Never hardcode secrets in your code!**

❌ **WRONG:**
```typescript
const PAYSTACK_KEY = 'pk_live_abc123xyz789'; // NEVER DO THIS!
```

✅ **CORRECT:**
```typescript
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
```

### 2. **Use .env Files (Local Development)**

**Create `.env` file** (already in .gitignore):
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
MPESA_CONSUMER_KEY=your_consumer_key_here
```

**Copy from template:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. **Verify .gitignore**

Ensure `.gitignore` includes:
```
.env
.env.local
.env.*.local
**/config/secrets.ts
**/*secret*.ts
*.pem
*.key
```

### 4. **Check Before Committing**

**Always verify before pushing:**
```bash
# Check what will be committed
git status

# Search for potential secrets
git diff | grep -i "key\|secret\|password\|token"

# Use git-secrets tool (recommended)
git secrets --scan
```

---

## 🛡️ Production Secrets Management

### **Option 1: Environment Variables (Recommended)**

**Vercel:**
```bash
# Add via Vercel dashboard
Settings → Environment Variables
```

**Netlify:**
```bash
# Add via Netlify dashboard
Site settings → Build & deploy → Environment
```

**Custom Server:**
```bash
# Use systemd environment files
/etc/systemd/system/fuliza.service.d/override.conf
```

### **Option 2: Secrets Management Services**

**AWS Secrets Manager**
```typescript
import { SecretsManager } from 'aws-sdk';

const getSecret = async (secretName: string) => {
  const client = new SecretsManager({ region: 'us-east-1' });
  const data = await client.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
};
```

**HashiCorp Vault**
```typescript
import vault from 'node-vault';

const client = vault({ endpoint: 'http://vault:8200' });
const secret = await client.read('secret/data/paystack');
```

**Azure Key Vault**
```typescript
import { SecretClient } from '@azure/keyvault-secrets';

const client = new SecretClient(vaultUrl, credential);
const secret = await client.getSecret('paystack-key');
```

### **Option 3: Encrypted Configuration Files**

**Using SOPS (Secrets OPerationS):**
```bash
# Encrypt secrets file
sops -e secrets.yaml > secrets.enc.yaml

# Decrypt at runtime
sops -d secrets.enc.yaml
```

---

## 🔍 Detecting Leaked Secrets

### **1. GitHub Secret Scanning**

GitHub automatically scans for known secret patterns. If detected:
1. You'll receive an alert
2. **Immediately rotate the compromised secret**
3. Revoke the old key
4. Update all systems with new key

### **2. Use git-secrets Tool**

**Install:**
```bash
# macOS
brew install git-secrets

# Linux
git clone https://github.com/awslabs/git-secrets
cd git-secrets && make install
```

**Configure:**
```bash
# Initialize in your repo
git secrets --install

# Add patterns to detect
git secrets --register-aws
git secrets --add 'pk_[a-z]+_[A-Za-z0-9]+'  # Paystack
git secrets --add 'sk_[a-z]+_[A-Za-z0-9]+'  # Secret keys
```

### **3. Use TruffleHog**

**Scan repository history:**
```bash
# Install
pip install trufflehog

# Scan repo
trufflehog --regex --entropy=True .
```

### **4. Use GitGuardian**

**Install pre-commit hook:**
```bash
# Install
pip install ggshield

# Set up
ggshield install -m local
```

---

## 🚑 What to Do If Secrets Are Leaked

### **Immediate Actions (Within 1 Hour)**

1. **Revoke Compromised Credentials**
   - Paystack: Dashboard → Settings → API Keys → Revoke
   - M-Pesa: Contact Safaricom support immediately
   - Database: Change passwords immediately

2. **Generate New Credentials**
   - Create new API keys
   - Update all systems with new keys
   - Test thoroughly

3. **Remove from Git History**
   ```bash
   # Use BFG Repo-Cleaner
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

4. **Notify Stakeholders**
   - Inform your team
   - Notify payment providers
   - Document the incident

### **Follow-up Actions (Within 24 Hours)**

1. **Security Audit**
   - Review all access logs
   - Check for unauthorized transactions
   - Assess potential damage

2. **Implement Additional Controls**
   - Add secret scanning tools
   - Implement pre-commit hooks
   - Update security policies

3. **Documentation**
   - Document the incident
   - Update procedures
   - Train team members

---

## 📋 Secrets Checklist

### **Before First Commit**
- [ ] Created `.env` file from `.env.example`
- [ ] Added `.env` to `.gitignore`
- [ ] Verified `.gitignore` is working
- [ ] Removed any hardcoded secrets from code
- [ ] Tested with environment variables

### **Before Each Commit**
- [ ] Run `git status` to check files
- [ ] Search for secret patterns in changes
- [ ] Verify no `.env` file in staging
- [ ] Run secret scanning tool (if installed)

### **Before Pushing to GitHub**
- [ ] Double-check commit history
- [ ] Verify no secrets in any commit
- [ ] Test application with env variables
- [ ] Review PR for any exposed secrets

### **Production Deployment**
- [ ] Secrets stored in secure service
- [ ] Production keys different from dev
- [ ] Access controls configured
- [ ] Audit logging enabled
- [ ] Backup of secrets stored securely

---

## 🔧 Tools & Resources

### **Secret Scanning Tools**
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Find secrets in git history
- [GitGuardian](https://www.gitguardian.com/) - Real-time secret detection
- [Gitleaks](https://github.com/zricethezav/gitleaks) - SAST tool for secrets

### **Secrets Management Services**
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)
- [Google Secret Manager](https://cloud.google.com/secret-manager)

### **Environment Variable Management**
- [dotenv](https://github.com/motdotla/dotenv) - Load env variables
- [direnv](https://direnv.net/) - Per-directory environment
- [envchain](https://github.com/sorah/envchain) - Secure env storage

---

## 📚 Best Practices

### **1. Principle of Least Privilege**
- Grant minimum necessary access
- Use separate keys for different environments
- Rotate keys regularly

### **2. Key Rotation**
- Rotate secrets every 90 days
- Automate rotation where possible
- Document rotation procedures

### **3. Audit & Monitoring**
- Log all secret access
- Monitor for unusual patterns
- Set up alerts for suspicious activity

### **4. Team Education**
- Train team on secret management
- Regular security awareness sessions
- Document procedures clearly

### **5. Backup & Recovery**
- Securely backup secrets
- Test recovery procedures
- Document backup locations

---

## ⚠️ Common Mistakes to Avoid

1. ❌ Committing `.env` file
2. ❌ Hardcoding secrets in code
3. ❌ Using production keys in development
4. ❌ Sharing secrets via email/chat
5. ❌ Storing secrets in code comments
6. ❌ Using weak encryption for secrets
7. ❌ Not rotating compromised keys
8. ❌ Logging secrets in application logs
9. ❌ Storing secrets in client-side code
10. ❌ Not having a secrets rotation plan

---

## 🆘 Emergency Contacts

### **If Secrets Are Compromised:**

**Paystack Support**
- Email: support@paystack.com
- Phone: +234 1 888 3888

**Safaricom M-Pesa**
- Email: apisupport@safaricom.co.ke
- Phone: +254 722 000 000

**GitHub Security**
- Report: https://github.com/security

---

**Remember: Prevention is better than cure. Always protect your secrets!**

**Last Updated**: June 2, 2026